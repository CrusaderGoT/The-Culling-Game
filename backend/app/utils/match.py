# util functions for mainly used for a match

import time
from collections import Counter
from datetime import datetime, timezone
from random import choice, sample
from typing import Sequence

from fastapi import HTTPException, status
from sqlmodel import and_, exists, not_, select

from app.models.colony import Colony
from app.models.match import Match
from app.models.player import Player
from app.utils.dependencies import atp, session
from app.utils.player import (
    get_player,
    get_players_not_in_part,
    select_players_fought_in_part,
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


def create_new_match(session: session, part: int, atp: atp):
    "creates a new match"
    # fetch colonies that has atleast one player that hasn't fought in the specified part query
    result = colonies_with_players_available_for_part(session, part)
    if (
        result and (colony_id := choice(result)) is not None
    ):  # list is not empty and contains int (randomly chosen)
        # Fetch players from the selected colony who have not fought in the specified part.
        players_not_in_part = get_players_not_in_part(colony_id, part, session)
        # Randomly select 2 players from the colony for the match
        players = random_players_for_match(session, players_not_in_part, colony_id)
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
        detail = f"No colony with players who haven't fought in part {part}. Begin/Try part {part + 1}. Else no player yet..."
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=detail)


def random_players_for_match(
    session: session, players_not_in_part: Sequence[Player], colony_id: int
):
    """Randomly select 2 players from the colony who haven't fought in the part before.\n
    if only one player is available, pair them with any other player from the colony.\n
    raises HTTPException if only one player in colony"""
    if len(players_not_in_part) == 1:
        # fetch all players in colony, excluding the single player_not in_part
        all_players_query = select(Player).where(
            Player.colony_id == colony_id, Player.id != players_not_in_part[0].id
        )
        all_players = session.exec(all_players_query).all()

        if not all_players:  # means only one player in colony
            err_msg = f"Only one player in Colony {colony_id}, cannot make match. Add a player to the colony and Try again."
            raise HTTPException(status.HTTP_412_PRECONDITION_FAILED, err_msg)
        else:
            player1 = players_not_in_part[0]  # the only player available
            player2 = choice(
                all_players
            )  # Randomly select another player from the same colony
            players = [player1, player2]

    else:  # players available are more than 2
        # Randomly select two unique players from those who haven't fought in the specified part
        players = sample(players_not_in_part, 2)
    return players


def colonies_with_players_available_for_part(session: session, part: int):
    "Main query to get colonies IDs with at least one player who hasn't fought in the specified part"
    subquery_select = select_players_fought_in_part(part=part)
    statement = select(Colony.id).where(
        exists(
            select(Player.id).where(
                and_(
                    Player.colony_id == Colony.id,
                    not_(Player.id.in_(subquery_select)),  # type: ignore
                )
            )
        )
    )
    result = session.exec(statement).all()
    return result


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


def assign_match_winner(match_id: int, session: session, atp: atp):
    match = get_match(session, match_id)
    if match:
        winner = get_match_winner(match, session)
        if not winner:
            print("NO WINNER!!")
        else:
            player = Player.model_validate(winner)
            print(player.model_dump())


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
            winner = get_player(session, player_id=most_votes[0])
            return winner
    else:
        return None
