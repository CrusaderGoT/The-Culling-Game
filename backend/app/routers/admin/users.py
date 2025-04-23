"""routes for admin -> users CRUD purposes"""

from typing import Annotated

from app.auth.dependencies import admin_user
from app.models.admin import Permission
from app.models.base import ModelName
from app.models.user import EditUser, UserInfo
from app.routers.admin.admins import router
from app.utils.admin import (
    ADMIN_UNAUTHORIZED_EXCEPTION,
    check_if_admin_has_crud_permission,
)
from app.utils.dependencies import session
from app.utils.user import edit_user_helper, get_user, id_name_email
from fastapi import Body, HTTPException, status


@router.patch(
    "/edit-user/{user}",
    response_model=UserInfo,
    response_description="Edited User",
    summary="Admin Operation to Edit a USer",
    status_code=status.HTTP_200_OK,
)
def admin_edit_user(
    user: id_name_email,
    admin: admin_user,
    edit_user: Annotated[EditUser, Body()],
    session: session,
):
    # check if admin user has appropriate permission
    permission = check_if_admin_has_crud_permission(
        session=session,
        admin=admin,
        model_name=ModelName.user,
        permission_level=Permission.PermissionLevel.UPDATE,
    )

    if not permission:
        raise ADMIN_UNAUTHORIZED_EXCEPTION(admin)

    # get the user to edit
    user_to_edit = get_user(session=session, user_name_id_email=user)

    if not user_to_edit:  # raise http exception if no user
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {id_name_email} not found",
        )

    # update user
    edited_user = edit_user_helper(
        edit_user=edit_user, userdb=user_to_edit, session=session
    )

    # commit to save update
    session.add(edited_user)
    session.commit()
    session.refresh(edited_user)
    return edited_user


@router.delete(
    "/delete-user/{user}",
    response_model=UserInfo,
    response_description="Deleted User",
    summary="Admin Operation to Delete a USer",
    status_code=status.HTTP_200_OK,
)
def admin_delete_user(user: id_name_email, session: session, admin: admin_user):
    # check for permission
    permission = check_if_admin_has_crud_permission(
        session=session,
        admin=admin,
        model_name=ModelName.user,
        permission_level=Permission.PermissionLevel.DELETE,
    )

    if not permission:
        raise ADMIN_UNAUTHORIZED_EXCEPTION(admin)

    user_to_delete = get_user(session, user)

    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {id_name_email} not found",
        )

    # delete user
    session.delete(user_to_delete)
    session.commit()
    return user_to_delete  # user is already deleted
