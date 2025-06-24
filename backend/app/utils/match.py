# util functions for mainly used for a match

import time
from collections import Counter
from datetime import datetime, timezone
from random import choice, sample
from typing import Sequence

from fastapi import status
from sqlmodel import and_, exists, select

from app.api.setting import broker
from app.models.base import MatchPlayerLink
from app.models.colony import Colony
from app.models.match import Match
from app.models.player import Player
from app.models.user import User
from app.utils.config import MatchCreationException
from app.utils.dependencies import atp, session
from app.utils.player import (
    get_player,
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


def create_new_match(session: session, part: int, atp) -> Match:
    """Creates a new match with optimized player selection logic."""

    # Get eligible colony with available players
    colony_id = _get_eligible_colony(session, part)

    # Get players for the match
    players = _get_match_players(session, colony_id, part)

    # Create and return the match
    return _create_match_instance(colony_id, part, players, atp)


def _get_eligible_colony(session: session, part: int) -> int:
    """Get a random colony that has available players for the given part."""

    # First validate the part number before doing queries
    last_match = get_last_created_match(session)
    _validate_part_number(part, last_match)

    eligible_colonies = _get_colonies_with_available_players(session, part)

    if not eligible_colonies:
        # specific error message based on context
        if last_match:
            next_part = last_match.part + 1
            raise MatchCreationException(
                f"No colony has players available for part {part}. "
                f"Consider starting part {next_part} or add more players."
            )
        else:
            # First match scenario
            raise MatchCreationException(
                "No colonies with available players found. "
                "Please ensure there are colonies with at least 2 alive players who have users."
            )

    return choice(eligible_colonies)


def _validate_part_number(part: int, last_match: Match | None) -> None:
    """Validate that the part number is valid based on the last match."""
    if not last_match:
        return  # No validation needed for first match

    if part < last_match.part:
        raise MatchCreationException(
            f"Invalid match part. Must be equal to or greater than last part ({last_match.part})",
            status.HTTP_406_NOT_ACCEPTABLE,
        )

    if part > last_match.part + 1:
        raise MatchCreationException(
            f"Invalid match part. Next part must be {last_match.part + 1}",
            status.HTTP_406_NOT_ACCEPTABLE,
        )


def _get_colonies_with_available_players(session: session, part: int) -> list[int]:
    """
    Get colony IDs that have at least one eligible player for the given part.

    Optimized to use a single query with EXISTS clause.
    """
    # Subquery for players who have already fought in this part
    fought_players_subq = (
        select(MatchPlayerLink.player_id)
        .join(Match, MatchPlayerLink.match_id == Match.id)
        .where(Match.part == part)
    )

    # Main query: colonies with at least one available player
    stmt = select(Colony.id).where(
        Colony.id.is_not(None),  # Ensure non-null IDs
        exists(
            select(1)  # Use literal 1 instead of Player.id for better performance
            .select_from(Player)
            .join(User, Player.user_id == User.id)  # Explicit join condition
            .where(
                and_(
                    Player.colony_id == Colony.id,
                    Player.alive.is_(True),
                    ~Player.id.in_(fought_players_subq),
                )
            )
        ),
    )

    # Convert to list and filter out any None values (defensive programming)
    result = session.exec(stmt).all()
    return [colony_id for colony_id in result if colony_id is not None]


def _get_match_players(session: session, colony_id: int, part: int) -> list[Player]:
    """Get two players for a match from the specified colony."""
    # First, get players who haven't fought in this part
    available_players = _get_available_players_for_part(session, colony_id, part)

    if len(available_players) >= 2:
        # Optimal case: pick 2 from available players
        return sample(available_players, 2)

    elif len(available_players) == 1:
        # Get a second player from any other alive player in the colony
        return _get_mixed_player_pair(session, colony_id, available_players[0])

    else:
        # No available players - this shouldn't happen if colony selection worked correctly
        raise MatchCreationException(
            f"No available players in colony {colony_id} for part {part}",
            status.HTTP_404_NOT_FOUND,
        )


def _get_available_players_for_part(
    session: session, colony_id: int, part: int
) -> Sequence[Player]:
    """
    Get players from a colony who haven't fought in the specified part.

    Optimized query using LEFT JOIN with NULL check.
    """
    # Subquery for matches in this part
    part_matches_subq = select(Match.id).where(Match.part == part)

    query = (
        select(Player)
        .join(User, Player.user_id == User.id)
        .outerjoin(
            MatchPlayerLink,
            and_(
                MatchPlayerLink.player_id == Player.id,
                MatchPlayerLink.match_id.in_(part_matches_subq),
            ),
        )
        .where(
            and_(
                Player.colony_id == colony_id,
                Player.alive.is_(True),
                MatchPlayerLink.player_id.is_(None),  # Haven't fought in this part
            )
        )
    )

    return session.exec(query).all()


def _get_mixed_player_pair(
    session: session, colony_id: int, primary_player: Player
) -> list[Player]:
    """
    Get a pair where one player hasn't fought in the part and another is any available player.
    """
    # Get any other alive player from the colony
    other_players_query = (
        select(Player)
        .join(User, Player.user_id == User.id)
        .where(
            and_(
                Player.colony_id == colony_id,
                Player.alive.is_(True),
                Player.id != primary_player.id,
            )
        )
    )

    other_players = session.exec(other_players_query).all()

    if not other_players:
        raise MatchCreationException(
            f"Colony {colony_id} has only one alive player. "
            "At least 2 players are required to create a match.",
            status.HTTP_412_PRECONDITION_FAILED,
        )

    partner = choice(other_players)
    return [primary_player, partner]


def _create_match_instance(
    colony_id: int, part: int, players: list[Player], atp
) -> Match:
    """Create a Match instance with proper timezone handling."""
    now_utc = datetime.now(timezone.utc)

    # Calculate match timing
    begin = now_utc + atp.delay_begin_match
    end = begin + atp.match_duration

    # Ensure timezone awareness (defensive programming)
    begin = _ensure_utc_timezone(begin)
    end = _ensure_utc_timezone(end)

    return Match(begin=begin, end=end, part=part, colony_id=colony_id, players=players)


def _ensure_utc_timezone(dt: datetime) -> datetime:
    """Ensure datetime is timezone-aware and in UTC."""
    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


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
        assign_match_winner(match=match, atp=atp, session=session)


@broker.task
def assign_match_winner(match: Match, atp: atp, session: session):
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
            # make draw
            match.draw = True
            session.add(match)
            session.commit()
            session.refresh(match)
            return match
        else:
            winner = get_player(session, player_id=most_votes[0])
            if not winner:
                # most likely won't happen; if seen check for potential bugs
                return "Winner Not Found"
            else:
                # Assign winner extra points and update the match record
                match.winner = winner
                winner.points += atp.winner_point
                match.draw = False  # redundancy for avoiding draw
                session.add(match)
                session.commit()
                session.refresh(match)
                return match
    else:
        # make draw
        match.draw = True
        session.add(match)
        session.commit()
        session.refresh(match)
        return match
