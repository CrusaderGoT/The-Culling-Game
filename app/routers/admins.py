"""routes for admin purposes/interface"""

import os
from typing import Annotated

from app.auth.dependencies import admin_user, get_admin_user, oauth2_scheme
from app.models.admin import (
    AdminInfo,
    AdminUser,
    Permission,
    PermissionInfo,
    PermissionRequest,
)
from app.models.base import ModelName
from app.models.user import EditUser, UserInfo
from app.utils.admin import admin_grant_permissions, superuser_grant_permissions
from app.utils.config import AdminException, Tag, UserException
from app.utils.dependencies import session
from app.utils.user import edit_user_helper, get_user, id_name_email
from dotenv import load_dotenv
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlmodel import select

load_dotenv()  # load for env used in this modules

# Create your API routes here
router = APIRouter(
    prefix="/admin",
    tags=[Tag.admin],
    dependencies=[Depends(get_admin_user), Depends(oauth2_scheme)],
)
superuser_router = APIRouter(
    prefix="/admin",
    tags=[Tag.admin],
    dependencies=[Depends(oauth2_scheme)],
)


@router.post("/create/{user}", response_model=AdminInfo)
def create_admin(
    user: id_name_email,  # The user to be promoted to admin
    session: session,  # The database session
    p_admin: admin_user,  # The currently logged-in admin user (validated by dependencies)
    permissions: Annotated[
        list[PermissionRequest], Body()
    ],  # List of permissions to assign to the new admin
):
    """Creates an admin user with specified permissions."""

    # Fetch the user from the database
    userdb = get_user(session, user)

    if userdb is None:
        # Raise 404 error if the user does not exist in the database
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            f"User '{user}' you want to make an admin doesn't exist.",
        )

    # Prevent creating admin privileges for oneself again
    if userdb == p_admin.user:
        raise AdminException(
            p_admin,
            status.HTTP_409_CONFLICT,
            "Cannot make yourself an admin again.",
        )

    # Check if the user is already an admin
    if userdb.admin is not None:
        raise AdminException(
            userdb.admin,
            status.HTTP_417_EXPECTATION_FAILED,
            f"{userdb.username} is already an admin. Edit their admin profile instead.",
        )

    # Superuser logic: unrestricted permission assignment
    if p_admin.is_superuser:
        new_permissions = superuser_grant_permissions(
            permissions=permissions, session=session
        )
    # Regular admin logic: restricted permission assignment based on the current admin's permissions
    else:
        new_permissions = admin_grant_permissions(
            admin=p_admin, permissions=permissions, session=session
        )

    if not new_permissions:
        # Raise an error if no valid permissions were found
        err_msg = (
            f"{userdb.username}'s permissions are empty. "
            f"All permissions sent cannot be granted by you '{p_admin.user.username}'."
        )
        raise AdminException(p_admin, status.HTTP_406_NOT_ACCEPTABLE, detail=err_msg)

    # Once all permissions are processed, create the new admin user
    # Create the new admin with the filtered permissions
    new_admin = AdminUser(permissions=new_permissions, user=userdb)
    session.add(new_admin)
    session.commit()
    session.refresh(new_admin)
    return new_admin


@router.post("/new-permission", response_model=list[PermissionInfo])
def new_permission(
    admin: admin_user,
    permissions: Annotated[list[PermissionRequest], Body()],
    session: session,
):
    "for creating new permissions; only doable by a superuser"
    # check if the user is a super user
    if not admin.is_superuser:
        raise AdminException(
            admin,
            status.HTTP_401_UNAUTHORIZED,
            "only super users can create permissions",
        )

    # get or initialized permissions (i.e, both existing and not-existing permissions)
    grant_permissions = superuser_grant_permissions(
        permissions=permissions, session=session
    )

    # 🔑 Avoid duplicate permissions
    # filter out existing pemissions (they will have an ID)
    new_permissions = [p for p in grant_permissions if p.id is None]

    # check atleast one new perm exist
    if not new_permissions:
        raise HTTPException(
            status.HTTP_411_LENGTH_REQUIRED,
            f"no valid permission; length -> {len(new_permissions)}",
        )
    # add new perms to session
    session.add_all(new_permissions)
    session.commit()
    for perm in new_permissions:
        session.refresh(perm)
    return new_permissions


@router.patch("/grant-permisssion/{user}", response_model=AdminInfo)
def grant_permission(
    permissions: Annotated[
        list[PermissionRequest], Body()
    ],  # permissions to be granted (permissions)
    p_admin: admin_user,  # admin user who wants to grant the permissions
    user: id_name_email,  # user -> admin to be granted permissions
    session: session,
):
    # process permissions
    # it is done this way to keep the dot notation of GrantPermission

    # check if user exist and is an admin
    userdb = get_user(session=session, user_name_id_email=user)

    if not userdb:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"User {id_name_email} not found"
        )

    if not userdb.admin:
        raise UserException(
            user=userdb,
            code=status.HTTP_428_PRECONDITION_REQUIRED,
            detail=f"'{userdb.username}' is not an Admin. Make them an Admin first",
        )

    # check if p_admin is a super user
    if p_admin.is_superuser:  # unrestricted edit (mainly on permissions)
        approved_permissions = superuser_grant_permissions(
            permissions=permissions, session=session
        )
        print(approved_permissions, permissions)

    # else p_admin is just an admin (admin_user dependency makes sure they are admin)
    else:
        # restricted edit (mainly on permissions)
        approved_permissions = admin_grant_permissions(
            admin=p_admin, permissions=permissions, session=session
        )

    # check if approved permissions is empty
    if not approved_permissions:
        raise AdminException(
            admin=p_admin,
            code=status.HTTP_411_LENGTH_REQUIRED,
            detail=f"You '{p_admin.user.username}' cannot grant any of the permission(s) requested; length -> {len(approved_permissions)}",
        )

    # assign approved permissions to the user/admin
    userdb.admin.permissions.extend(approved_permissions)
    session.add(userdb)
    session.commit()
    session.refresh(userdb)
    return userdb.admin


@superuser_router.post("/superuser/{user}")
def demo_superuser(
    user: id_name_email, code: Annotated[str, Query(default=...)], session: session
):
    # get the user
    userdb = get_user(session, user)
    CODE = os.getenv("CODE")
    if not userdb:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"user {user} not found")
    if code != CODE:
        raise HTTPException(status.HTTP_405_METHOD_NOT_ALLOWED, "invalid code")
    admin_user = AdminUser(is_superuser=True, user=userdb)
    session.add(admin_user)
    session.commit()
    session.refresh(admin_user)
    return admin_user


# ADMIN CRUD OPERATIONS ON USERS
@router.patch(
    "/edit-user/{user}",
    response_model=UserInfo,
    response_description="Edited User",
    summary="Edit a user.",
    status_code=status.HTTP_200_OK,
)
def admin_edit_user(
    user: id_name_email,
    admin: admin_user,
    edit_user: Annotated[EditUser, Body()],
    session: session,
):
    # check if admin user has appropriate permission
    permission = session.exec(
        select(Permission)
        .join(AdminUser, Permission.admins.any(id=admin.id))
        .where(Permission.admins.any(id=admin.id))
        .where(Permission.model == ModelName.user)
        .where(Permission.level == Permission.PermissionLevel.UPDATE)
    ).first()

    if not permission:
        raise AdminException(
            admin=admin,
            code=status.HTTP_401_UNAUTHORIZED,
            detail=f"You '{admin.user.username}' do not have the permission for this action",
        )

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
