from typing import Literal

from fastapi import HTTPException, status
from sqlmodel import Session, and_, not_, select

from app.models.base import MatchPlayerLink
from app.models.match import Match
from app.models.player import Player
from app.utils.dependencies import session


def get_player(session: session, player_id: int):
    "for getting a player from the database"
    player = session.get(Player, player_id)
    if player:
        return player
    else:
        return None


def get_players_not_in_part(colony_id: int, part: int, session: Session):
    """
    Fetch players from a specified colony who haven't fought in a match for the given part.
    """
    # Subquery to get player IDs who have fought in the specified part
    part_matches_subquery = (
        select(MatchPlayerLink.player_id)
        .join(Match, MatchPlayerLink.match_id == Match.id)  # type: ignore
        .where(Match.id == part)
    ).subquery()

    part_matches_select = select(part_matches_subquery.c.player_id)

    # Query to get players in the specified colony who haven't fought in the part
    players_not_in_part_query = select(Player).where(
        and_(Player.colony_id == colony_id, not_(Player.id.in_(part_matches_select)))  # type: ignore
    )

    players_not_in_part = session.exec(players_not_in_part_query).all()

    return players_not_in_part


def select_players_fought_in_part(part: int):
    """Subquery to get player IDs who have fought in the specified part\n
    returns a select statement"""
    subquery = (
        select(MatchPlayerLink.player_id)
        .join(Match, MatchPlayerLink.match_id == Match.id)  # type: ignore
        .where(Match.part == part)
    ).subquery(name=f"matches_in_part_{part}")
    # Convert the subquery into a select() construct for use in the IN clause
    subquery_select = select(subquery.c.player_id)
    return subquery_select


def points_required_for_upgrade(grade: Player.Grade):
    "returns the points required for an upgrade"
    points_dict = dict(
        [
            (4, 0.2),
            (3, 0.2),
            (2, 0.4),
            (1, 0.4),
            (0, 0.6),
        ]
    )
    return points_dict[grade.value]


def calculate_points(
    player_points: float, points_to_action: float, on_action: Literal["minus", "plus"]
):
    """
    Calculates the point needed for a player action\n
    raises a `HTTPException 428` if player points are not enough.\n
    returns a 1 decimal place | 2 precision of a float. e.g. 1.2
    """
    # check if player points is enough
    if player_points >= points_to_action:  # player has enough points
        # check which action to perform
        match on_action:
            case "plus":
                updated_points = round(player_points + points_to_action, 1)
            case "minus":
                updated_points = round(player_points - points_to_action, 1)
            case _:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST, "points error occured."
                )
        return updated_points
    else:
        msg = f"not enough points; need {points_to_action}, have {player_points}"
        raise HTTPException(status.HTTP_428_PRECONDITION_REQUIRED, detail=msg)
