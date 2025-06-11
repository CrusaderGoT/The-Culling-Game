# util functions for mainly used for a match

import time
from collections import Counter
from datetime import datetime, timezone
from random import choice, sample
from typing import Sequence

from fastapi import HTTPException, status
from sqlmodel import Session, and_, exists, select

from app.models.base import MatchPlayerLink
from app.models.colony import Colony
from app.models.match import Match
from app.models.player import Player
from app.models.user import User
from app.utils.dependencies import atp, session
from app.utils.player import (
    get_alive_player,
)


def get_match(session: session, match_id: int) -> Match | None:
    "function for getting a match via its ID."
    match = session.exec(select(Match).where(Match.id == match_id)).first()
    return match


def ongoing_match(match: Match):
    "checks if a match is still ongoing, returns false if match is over, otherwise true"
    time_now = datetime.now(timezone.utc)
    end_time = match.end
    # Ensure end_time is timezone-aware (UTC); if not, make it so
    if end_time.tzinfo is None or end_time.tzinfo.utcoffset(end_time) is None:
        end_time = end_time.replace(tzinfo=timezone.utc)
    ongoing = time_now < end_time
    return ongoing


def get_last_created_match(session: session):
    "Get the last created Match, according to begin date. None if no Match exists"
    last_match = session.exec(
        select(Match).order_by(Match.begin.desc()).limit(1)  # type: ignore
    ).first()
    return last_match


def get_players_not_in_part(colony_id: int, part: int, session: Session):
    """
    Fetch players (that have users and are alive)
    from a specified colony who haven't fought in a match for the given part.
    """
    # Single query using LEFT JOIN and filtering
    query = (
        select(Player)
        .join(User)  # Inner join - players must have users
        .outerjoin(
            MatchPlayerLink,
            and_(
                MatchPlayerLink.player_id == Player.id,
                MatchPlayerLink.match_id.in_(
                    select(Match.id).where(Match.part == part)
                ),
            ),
        )
        .where(
            and_(
                Player.colony_id == colony_id,
                Player.alive == True,  # noqa: E712
                MatchPlayerLink.player_id
                == None,  # Haven't fought in this part  # noqa: E711
            )
        )
    )

    return session.exec(query).all()


def create_new_match(session: session, part: int, atp: atp):
    "creates a new match"
    # fetch colonies that has atleast one player that hasn't fought in the specified part query
    result = colonies_with_players_available_for_part(session, part)
    if (
        result and (colony_id := choice(result)) is not None
    ):  # list is not empty and contains int (randomly chosen)
        # Fetch players from the selected colony who have not fought in the specified part.
        players_not_in_part = get_players_not_in_part(colony_id, part, session)
        if not players_not_in_part:
            # No player available who hasn’t fought in this part
            # Decide on business logic: probably you want to pair any two players?
            # Or skip this colony and pick another? Or raise a 404/412?
            err_msg = (
                f"No players in Colony {colony_id} who haven't fought in part {part}. "
                "Cannot form a match from this colony."
            )
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail=err_msg)

        # Randomly select 2 players from the colony for the match
        players = random_players_for_match(
            session, players_not_in_part, colony_id, part
        )
        # create match
        # Ensure begin and end are timezone-aware (UTC)
        now_utc = datetime.now(timezone.utc)
        begin = now_utc + atp.delay_begin_match  # match begins in timedelta
        end = begin + atp.match_duration  # match ends in timedelta

        # Explicitly set tzinfo to UTC in case atp.delay_begin_match or atp.match_duration are naive
        if begin.tzinfo is None or begin.tzinfo.utcoffset(begin) is None:
            begin = begin.replace(tzinfo=timezone.utc)
        if end.tzinfo is None or end.tzinfo.utcoffset(end) is None:
            end = end.replace(tzinfo=timezone.utc)
        new_match = Match(
            begin=begin, end=end, part=part, colony_id=colony_id, players=players
        )
        return new_match
    else:
        last_match = get_last_created_match(session)
        if not last_match:
            raise HTTPException(404, "no match ever")

        detail = (
            f"No colony with players who haven't fought in part {part}. "
            f"Begin part {last_match.part + 1}. Or no player exist yet..."
        )
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=detail)


def random_players_for_match(
    session: session, players_not_in_part: Sequence[Player], colony_id: int, part: int
) -> list[Player]:
    """Randomly select 2 players from the colony who haven't fought in the part.
    If only one is available, pair with another alive player (even if they fought).
    Raise HTTPException if the colony has fewer than 2 total players.
    """
    # 0 available who haven't fought
    if not players_not_in_part:
        # Business decision: maybe pick two players anyway? Or skip this colony?
        # Here we choose to error, since we expected at least one by earlier query.
        err_msg = (
            f"No players in Colony {colony_id} who haven't fought in part {part}. "
            "Cannot form a match from this colony."
        )
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=err_msg)

    # Exactly one available who hasn't fought
    if len(players_not_in_part) == 1:
        single = players_not_in_part[0]
        # Fetch any other alive player in colony, excluding this one
        all_players_query = select(Player).where(
            Player.colony_id == colony_id,
            Player.alive == True,  # noqa: E712
            Player.id != single.id,  # noqa: E712
        )
        all_players = session.exec(all_players_query).all()
        if not all_players:
            err_msg = (
                f"Only one alive player in Colony {colony_id}. "
                "Cannot make match. Add a player to the colony and try again."
            )
            raise HTTPException(status.HTTP_412_PRECONDITION_FAILED, detail=err_msg)
        partner = choice(all_players)
        return [single, partner]

    # Two or more available who haven't fought: pick two distinct
    # Now len(players_not_in_part) >= 2
    return sample(players_not_in_part, 2)


def colonies_with_players_available_for_part(session: session, part: int):
    """
    Return colony IDs where there exists at least one Player who:
    - belongs to the colony
    - is alive
    - has a User
    - has not fought in this part
    """
    # subquery for players who fought in this part
    subq_fought = (
        select(MatchPlayerLink.player_id)
        .join(Match, MatchPlayerLink.match_id == Match.id)
        .where(Match.part == part)
    )
    # Use EXISTS on Player with same filters as get_players_not_in_part
    stmt = select(Colony.id).where(
        exists(
            select(Player.id)
            .join(User)
            .outerjoin(
                MatchPlayerLink,
                and_(
                    MatchPlayerLink.player_id == Player.id,
                    MatchPlayerLink.match_id.in_(
                        select(Match.id).where(Match.part == part)
                    ),
                ),
            )
            .where(
                and_(
                    Player.colony_id == Colony.id,
                    Player.alive == True,  # noqa: E712
                    # Haven’t fought in part: no MatchPlayerLink for this part
                    ~Player.id.in_(subq_fought),
                )
            )
        )
    )
    return session.exec(stmt).all()


def schedule_assign_match_winner(*, match_id: int, session: session, atp: atp):
    "for assigning the winner of a match, after it ends"
    match = get_match(session=session, match_id=match_id)
    if match is None:  # match doesn't exit
        return
    # check if match is ongoing
    active = ongoing_match(match)
    while active:
        # pause the loop for 1/2 the time remaining
        now = datetime.now(timezone.utc)  # the current time
        half_time_remaining = (match.end - now).total_seconds() // 2
        if (
            half_time_remaining < 0
        ):  # to avoid negative float being supplied to time.sleep
            active = False
            continue  # last begin loop
        time.sleep(half_time_remaining)
        continue  # run loop again after sleep

    else:  # runs after the match is ended
        winner = get_match_winner(match, session)
        if not winner:
            return
        else:
            # Assign winner extra points and update the match record
            match.winner = winner
            winner.points += atp.winner_point
            session.add(match)
            session.commit()


def get_match_winner(match: Match, session: session):
    """
    return the player that won the match, else return None
    """

    if match.votes:
        cnt = Counter()  # initialize counter dict
        # aggregate players vote points
        for vote in match.votes:
            cnt[vote.player_id] += vote.point  # type: ignore ; counter is meant for int but doesn't discrimate float

        # get the player with most votes
        most_votes = cnt.most_common(1)[0]  # (player_id: int, vote_points: float)

        # get the player with least votes
        n = 1  # n least common
        least_votes = cnt.most_common(1)[: -n - 1 : -1][
            0
        ]  # (player_id: int, vote_points: float)

        if most_votes[1] == least_votes[1]:
            return None
        else:
            winner = get_alive_player(session, player_id=most_votes[0])
            # calculate if loser player dies here
            return winner
    else:
        return None
