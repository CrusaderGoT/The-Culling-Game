from typing import Literal

from fastapi import HTTPException, status
from sqlmodel import Session, and_, not_, select

from app.models.base import MatchPlayerLink
from app.models.match import Match
from app.models.player import (
    CTApp,
    CursedTechnique,
    EditCT,
    EditCTApp,
    EditPlayer,
    Player,
)
from app.models.user import User
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
        .join(Match, MatchPlayerLink.match_id == Match.id)
        .where(Match.part == part)
    ).subquery()

    part_matches_select = select(part_matches_subquery.c.player_id)

    alive_players_with_users_subquery = (
        select(Player.id)
        .join(User)  # colony players must have a user
        .where(Player.alive)  # only living players
    ).subquery()

    viable_players_select = select(alive_players_with_users_subquery.c.id)

    # Query to get players (that have a user) in the specified colony who haven't fought in the part
    players_not_in_part_query = select(Player).where(
        and_(Player.colony_id == colony_id, not_(Player.id.in_(part_matches_select)), Player.id.in_(viable_players_select))
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
                    status.HTTP_400_BAD_REQUEST, "player action points error occured."
                )
        return updated_points
    else:
        msg = f"not enough points; need {points_to_action}, have {player_points}"
        raise HTTPException(status.HTTP_428_PRECONDITION_REQUIRED, detail=msg)


def edit_player_helper(
    *,
    playerdb: Player,
    player: EditPlayer | None,
    cursed_technique: EditCT | None,
    applications: list[EditCTApp] | None,
    session: session,
):
    """
    Helper for editing a Player.\n
    Takes the Player data to edit, and the Player to edit.
    And makes neccessary checks(e.g none values).\n
    returns a Player with updated info, **NOT YET COMMITTED TO A SESSION**.
    ## Add to a session and commit to save changes.
    """
    if player is not None:
        edit_player_data = player.model_dump(
            exclude_unset=True,
            exclude_defaults=True,
            exclude_none=True,
            warnings="error",
        )
        playerdb.sqlmodel_update(edit_player_data)
    if cursed_technique is not None:
        edit_ct_data = cursed_technique.model_dump(
            exclude_unset=True,
            exclude_defaults=True,
            exclude_none=True,
            warnings="error",
        )
        playerdb.cursed_technique.sqlmodel_update(edit_ct_data)
    if applications is not None:
        # get the list of ct apps to edit from db
        # modify to use the same format used in voting, for quicker loops
        app_numbers = [app.number for app in applications]
        ctapps = session.exec(
            select(CTApp)
            .join(CursedTechnique)
            .where(CTApp.ct_id == playerdb.cursed_technique.id)
            .where(CTApp.number.in_(app_numbers))  # type: ignore
        ).all()
        for ct_app in ctapps:
            for edit_ct_app in applications:
                if edit_ct_app.number == ct_app.number:
                    ct_app_data = edit_ct_app.model_dump(
                        exclude_unset=True,
                        exclude_defaults=True,
                        exclude_none=True,
                        warnings="error",
                    )
                    ct_app.sqlmodel_update(ct_app_data)
    return playerdb
