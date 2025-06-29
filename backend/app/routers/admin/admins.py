"""routes for admin -> admins CRUD purposes"""

from typing import Annotated
from uuid import UUID

from app.api.setting import settings
from app.auth.dependencies import admin_user, get_admin_user, oauth2_scheme
from app.models.admin import (
    AdminInfo,
    AdminUser,
    PermissionInfo,
    PermissionRequest,
)
from app.models.base import BasePermission
from app.models.table import ModelName
from app.routers.admin.players import router as player_router
from app.routers.admin.users import router as user_router
from app.utils.admin import (
    ADMIN_UNAUTHORIZED_EXCEPTION,
    admin_allow_permissions,
    check_if_admin_has_crud_permission,
    superuser_allow_permissions,
)
from app.utils.config import AdminException, Tag, UserException
from app.utils.dependencies import session
from app.utils.user import get_user, id_name_email
from dotenv import load_dotenv
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status

load_dotenv()  # load for env used in this modules

# Create your API routes here
router = APIRouter(
    prefix="/admin",
    tags=[Tag.admin],
    dependencies=[Depends(get_admin_user), Depends(oauth2_scheme)],
)
router.include_router(user_router)
router.include_router(player_router)

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

    # check if admin has perm to create admins
    permission = check_if_admin_has_crud_permission(
        session=session,
        admin=p_admin,
        model_name=ModelName.adminuser,
        permission_level=BasePermission.PermissionLevel.CREATE,
    )

    if not permission:
        raise ADMIN_UNAUTHORIZED_EXCEPTION(p_admin)

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
        new_permissions = superuser_allow_permissions(
            permissions=permissions, session=session
        )
    # Regular admin logic: restricted permission assignment based on the current admin's permissions
    else:
        new_permissions = admin_allow_permissions(
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
    grant_permissions = superuser_allow_permissions(
        permissions=permissions, session=session
    )

    # 🔑 Avoid duplicate permissions
    # filter out existing pemissions (they will have an ID)
    new_permissions = [p for p in grant_permissions if p.id is None]

    # check atleast one new perm exist
    if not new_permissions:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"no valid or non-existing permission; length -> {len(new_permissions)}",
        )
    # add new perms to session
    session.add_all(new_permissions)
    session.commit()
    for perm in new_permissions:
        session.refresh(perm)
    return new_permissions


@router.patch("/grant-permission/{user}", response_model=AdminInfo)
def grant_permission(
    permissions: Annotated[
        list[PermissionRequest], Body()
    ],  # permissions to be granted (permissions)
    p_admin: admin_user,  # admin user who wants to grant the permissions
    user: id_name_email,  # user -> admin to be granted permissions
    session: session,
):
    """
    Grants specified permissions to an admin user.
    This function allows an admin user (`p_admin`) to grant a list of permissions to another admin user (`user`).
    It performs several checks to ensure that the granting admin has the necessary privileges,
    the target user exists and is an admin, and that only unique, non-duplicate permissions are granted.\f
    Args:
        permissions (list[PermissionRequest]):
            The list of permissions to be granted to the target admin user.
        p_admin (admin_user):
            The admin user who is attempting to grant the permissions.
        user (id_name_email):
            The identifier (id, name, or email) of the user to whom permissions are to be granted.
        session (session):
            The database session used for querying and committing changes.
    Raises:
        ADMIN_UNAUTHORIZED_EXCEPTION:
            If the granting admin does not have sufficient privileges.
        HTTPException:
            If the target user does not exist.
        UserException:
            If the target user exists but is not an admin.
        AdminException:
            If no permissions can be granted (either due to lack of authority or because the target admin already has all requested permissions).
    Returns:
        Admin:
            The updated admin object for the target user, reflecting the newly granted permissions.
    """
    permission = check_if_admin_has_crud_permission(
        session=session,
        admin=p_admin,
        model_name=ModelName.adminuser,
        permission_level=BasePermission.PermissionLevel.UPDATE,
    )

    if (
        not permission and not p_admin.is_superuser
    ):  # super users can grant without restriction
        raise ADMIN_UNAUTHORIZED_EXCEPTION(p_admin)

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
        approved_permissions = superuser_allow_permissions(
            permissions=permissions, session=session
        )

    # else p_admin is just an admin (admin_user dependency makes sure they are admin)
    else:
        # restricted edit (mainly on permissions)
        approved_permissions = admin_allow_permissions(
            admin=p_admin, permissions=permissions, session=session
        )

    # check if no approved permission(s)
    if not approved_permissions:
        raise AdminException(
            admin=p_admin,
            code=status.HTTP_401_UNAUTHORIZED,
            detail=f"You '{p_admin.user.username}' cannot grant any of the permission(s) requested.",
        )

    # get permissions that the userdb admin doesn't already have.
    # This is to prevent Unique Constraint Errors,
    # and also not have an admin with duplicate permissions.
    unique_permissions = [
        p for p in approved_permissions if p not in userdb.admin.permissions
    ]

    # check if approved unique permissions is empty
    if not unique_permissions:
        raise AdminException(
            admin=p_admin,
            code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Admin '{userdb.username}' already has all of the sent permission(s) or you '{p_admin.user.username}' cannot grant some of the permission.",
        )

    # assign approved permissions to the user/admin
    userdb.admin.permissions.extend(unique_permissions)
    session.add(userdb)
    session.commit()
    session.refresh(userdb)
    return userdb.admin


@router.patch("/remove-permission/{user}", response_model=AdminInfo)
def remove_permission(
    permissions: Annotated[
        list[PermissionRequest], Body()
    ],  # permission(s) to be removed
    p_admin: admin_user,  # admin user who wants to remove the permission(s)
    user: id_name_email,  # user -> admin to removed their permission(s)
    session: session,
):
    """remove permission(s) of an admin. A superuser is required"""

    permission = check_if_admin_has_crud_permission(
        session=session,
        admin=p_admin,
        model_name=ModelName.adminuser,
        permission_level=BasePermission.PermissionLevel.UPDATE,
    )

    if not permission:
        raise ADMIN_UNAUTHORIZED_EXCEPTION(p_admin)

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

    # only superusers can remove a permission
    if not p_admin.is_superuser:
        raise ADMIN_UNAUTHORIZED_EXCEPTION(p_admin)

    # admin is a superuser. get the permission(s) to remove
    permissions_to_remove = superuser_allow_permissions(
        permissions=permissions, session=session
    )

    # make sure perm(s) to remove are perms the admin current have
    # this also makes sure all permissions exist
    actual_perms_to_remove = [
        p for p in permissions_to_remove if p in userdb.admin.permissions
    ]

    # check if the filtered perms is empty
    if not actual_perms_to_remove:
        raise AdminException(
            admin=p_admin,
            code=status.HTTP_404_NOT_FOUND,
            detail="no valid permission(s) to remove.",
        )

    # removed permission
    for perm in actual_perms_to_remove:
        userdb.admin.permissions.remove(perm)
    else:  # runs after above loop
        # commit to session
        session.add(userdb)
        session.commit()
        session.refresh(userdb)
        return userdb.admin


@superuser_router.post(
    "/superuser/{user}",
    response_model=AdminInfo,
)
def demo_superuser(
    user: id_name_email, code: Annotated[UUID, Query()], session: session
):
    # get the user
    userdb = get_user(session, user)
    if not userdb:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"user {user} not found")
    if code != settings.code:
        raise HTTPException(status.HTTP_405_METHOD_NOT_ALLOWED, "invalid code")
    admin_user = AdminUser(is_superuser=True, user=userdb)
    session.add(admin_user)
    session.commit()
    session.refresh(admin_user)
    return admin_user


@router.get(
    "/me",
    response_model=AdminInfo,
    response_description="An Admin",
    summary="Get the logged in admin",
    status_code=status.HTTP_200_OK,
)
def current_admin(admin: admin_user) -> AdminUser:
    return admin
