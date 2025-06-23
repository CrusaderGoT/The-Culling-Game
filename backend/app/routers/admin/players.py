from typing import Annotated

from app.auth.dependencies import admin_user
from app.models.base import BasePermission, ModelName
from app.models.player import (
    EditCT,
    EditCTApp,
    EditPlayer,
    PlayerInfo,
)
from app.utils.admin import (
    ADMIN_UNAUTHORIZED_EXCEPTION,
    check_if_admin_has_crud_permission,
)
from app.utils.config import PlayerException
from app.utils.dependencies import session
from app.utils.player import (
    _delete_player_helper,
    _edit_player_helper,
    get_alive_player,
)
from fastapi import APIRouter, Body, HTTPException, Path, status

# Create your API routes here
router = APIRouter()


@router.patch(
    "/edit-player/{player_id}",
    response_model=PlayerInfo,
    status_code=status.HTTP_200_OK,
    response_description="Edited Player",
    summary="Admin editing a player details.",
)
def admin_edit_player(
    *,
    player_id: Annotated[int, Path(description="the player id")],
    session: session,
    player: Annotated[EditPlayer | None, Body()] = None,
    cursed_technique: Annotated[EditCT | None, Body()] = None,
    applications: Annotated[list[EditCTApp] | None, Body(max_length=5)] = None,
    admin: admin_user,
):
    "admin api for editing a plauyer"

    # check if admin has permission for action
    permission = check_if_admin_has_crud_permission(
        session=session,
        admin=admin,
        model_name=ModelName.player,
        permission_level=BasePermission.PermissionLevel.UPDATE,
    )

    if not permission:
        raise ADMIN_UNAUTHORIZED_EXCEPTION(admin)

    # check if player exists
    playerdb = get_alive_player(session=session, player_id=player_id)

    if not playerdb:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail=f"player with ID {player_id} not found"
        )

    if not playerdb.alive:
        err_msg = f"Player '{playerdb.name}' with ID '{playerdb.id}' has died. Revive them first."
        raise PlayerException(player=playerdb, detail=err_msg)

    if not playerdb.alive:
        err_msg = f"Player '{playerdb.name}' with ID '{playerdb.id}' has died. Revive them first."
        raise PlayerException(player=playerdb, detail=err_msg)

    # pass: edit player details
    edited_player = _edit_player_helper(
        playerdb=playerdb,
        player=player,
        cursed_technique=cursed_technique,
        applications=applications,
        session=session,
    )

    # add edited_player to session, and commit to update infos
    session.add(edited_player)
    session.commit()
    session.refresh(edited_player)
    return playerdb


@router.delete(
    "/delete-player/{player_id}",
    response_model=PlayerInfo,
    status_code=status.HTTP_200_OK,
    response_description="A deleted player",
    summary="Admin deletion of a player",
)
def admin_delete_player(
    player_id: Annotated[int, Path(description="the player id")],
    session: session,
    admin: admin_user,
):
    "API for admin deletion of a player"

    # check if admin has permission for action
    permission = check_if_admin_has_crud_permission(
        session=session,
        admin=admin,
        model_name=ModelName.player,
        permission_level=BasePermission.PermissionLevel.UPDATE,
    )

    if not permission:
        raise ADMIN_UNAUTHORIZED_EXCEPTION(admin)

    # delete player
    player = get_alive_player(session=session, player_id=player_id)

    if not player:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail=f"player with ID {player_id} not found"
        )

    deleted_player = _delete_player_helper(
        player=player, player_user=player.user, session=session
    )

    return deleted_player
