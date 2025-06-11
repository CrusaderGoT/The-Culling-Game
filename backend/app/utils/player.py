from typing import Literal

from fastapi import HTTPException, status
from sqlmodel import select

from app.models.player import (
    CTApp,
    CursedTechnique,
    EditCT,
    EditCTApp,
    EditPlayer,
    Player,
)
from app.utils.dependencies import session


def get_alive_player(session: session, player_id: int):
    "for getting a player from the database"
    player = session.get(Player, player_id)
    if not player or not player.alive:
        return None
    return player


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
