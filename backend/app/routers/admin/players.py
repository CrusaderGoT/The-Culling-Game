from typing import Annotated

from fastapi import Body, HTTPException, status

from backend.app.utils.player import edit_player_helper

from ...auth.dependencies import admin_user
from ...models.base import BasePermission, ModelName
from ...models.player import (
    EditCT,
    EditCTApp,
    EditPlayer,
    PlayerInfo,
)
from ...utils.admin import (
    ADMIN_UNAUTHORIZED_EXCEPTION,
    check_if_admin_has_crud_permission,
)
from ...utils.dependencies import session
from ...utils.player import get_player
from .admins import router


@router.patch(
    "/edit-player",
    response_model=PlayerInfo,
    status_code=status.HTTP_200_OK,
    response_description="Edited Player",
    summary="Admin editing a player details.",
)
def admin_edit_player(
    *,
    player_id: int,
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
        model_name=ModelName.PLAYER, 
        permission_level=BasePermission.PermissionLevel.UPDATE,
    )

    if not permission:
        raise ADMIN_UNAUTHORIZED_EXCEPTION(admin)

    # check if player exists
    playerdb = get_player(session, player_id=player_id)

    if not playerdb:
        raise HTTPException(status.HTTP_404_NOT_FOUND)

    # pass: edit player details
    edited_player = edit_player_helper(
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
    "/delete-player",
    response_model=PlayerInfo,
    status_code=status.HTTP_200_OK,
    response_description="A deleted player",
    summary="Admin deletion of a player",
)
def admin_delete_player(player_id: int, session: session, admin: admin_user):
    "API for admin deletion of a player"

    # check if admin has permission for action
    permission = check_if_admin_has_crud_permission(
        session=session,
        admin=admin,
        model_name=ModelName.PLAYER, 
        permission_level=BasePermission.PermissionLevel.UPDATE,
    )

    if not permission:
        raise ADMIN_UNAUTHORIZED_EXCEPTION(admin)


