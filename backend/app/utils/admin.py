from fastapi import HTTPException, status
from sqlmodel import select

from app.auth.dependencies import admin_user
from app.models.admin import AdminUser, Permission, PermissionRequest
from app.models.table import ModelName
from app.utils.config import AdminException
from app.utils.dependencies import session


def superuser_allow_permissions(permissions: list[PermissionRequest], session: session):
    """
    Abstract helper for granting permissions as a **Superuser**.\n
    ### ⚠ No Check For Authorization Is Done In This Function.
    ### ⚠ Make Sure You Have Already Confirmed The User Is A Superuser Before Use.
    This function returns a list of permission.\n
    **It instatiates Any Missing Valid Permission Also**.\n
    Add to session and commit to save.
    """
    # Initialize an empty list to hold the new permissions for the user
    new_permissions: list[Permission] = []

    # Superusers can assign any permissions without restrictions
    for permission in permissions:
        for level in permission.levels:
            # Try to find an existing permission in the database
            try:
                stmt = select(Permission).where(
                    Permission.model == permission.model, Permission.level == level
                )
                perm = session.exec(stmt).one()
            except Exception:  # If the permission does not exist, create a new one
                perm = _make_permission_to_create(permission.model, level=level)

            new_permissions.append(perm)

    return new_permissions


def admin_allow_permissions(
    admin: AdminUser, permissions: list[PermissionRequest], session: session
):
    """
    Abstract helper for granting permissions as an **Admin**.\n
    ## ⚠ No Check For Authorization Is Done In This Function
    ## ⚠ Make Sure You Have Already Confirmed The User Is An Admin Before Use.
    This function returns a list of valid permission only.\n
    **The Permissions returned are filtered based on the admin permissions**.\n
    Add to session and commit to save.
    """
    # Initialize an empty list to hold the new permissions for the user
    new_permissions: list[Permission] = []

    # Filter permissions that the current admin can assign to others
    for permission in permissions:
        for level in permission.levels:
            # Check if the current admin has the permission to assign this specific permission level
            stmt = (
                select(Permission)
                .where(Permission.admins.any(id=admin.id))
                .where(Permission.model == permission.model)
                .where(Permission.level == level)
            )

            # Add only the permissions that the current admin is authorized to assign
            perm = session.exec(stmt).first()

            if perm and perm.id not in [p.id for p in new_permissions]:
                new_permissions.append(perm)

    return new_permissions


def check_admin_permission(
    session: session,
    admin: AdminUser,
    model_name: ModelName,
    permission_level: Permission.PermissionLevel,
) -> bool:
    """
    Checks if an admin user has the required permission level for a specific model.
    If the permission does not exist in the system and the admin is a superuser,
    the permission is created and assigned to the superuser.
    Args:
        session (session): The database session used for querying and committing changes.
        admin (AdminUser): The admin user whose permissions are being checked.
        model_name (ModelName): The name of the model for which the permission is required.
        permission_level (Permission.PermissionLevel): The required permission level.
    Returns:
        bool: True if the admin has the required permission, False otherwise.
    Raises:
        HTTPException: If the permission does not exist and the admin is not a superuser.
    """

    exist = check_permission_exist(session, model_name, permission_level)

    if not exist and not admin.is_superuser:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail=(
                f"You do not have the permission for this action. "
                f"Permission {permission_level.name} "
                f"for {model_name.capitalize()} does not exist in the system, "
                f"Contact a Superuser to create it."
            ),
        )
    elif not exist and admin.is_superuser:
        # create permission
        new_perm = _make_permission_to_create(model=model_name, level=permission_level)

        # add perm to superuser
        admin.permissions.extend([new_perm])

        # make commits
        session.add(new_perm)
        session.add(admin)
        session.commit()
        # return true for super user
        return True

    else:
        # Check if admin has the permission
        permission = session.exec(
            select(Permission)
            .where(Permission.admins.any(id=admin.id))
            .where(Permission.model == model_name)
            .where(Permission.level == permission_level)
        ).first()

        return bool(permission)


def check_permission_exist(
    session: session,
    model_name: str,
    permission_level: Permission.PermissionLevel,
):
    "checks if a permission exists, else raises HTTPException"
    # Check if permission exists in system
    permission_exist = session.exec(
        select(Permission)
        .where(Permission.model == model_name)
        .where(Permission.level == permission_level)
    ).first()

    return permission_exist


def ADMIN_UNAUTHORIZED_EXCEPTION(admin: admin_user):
    return AdminException(
        admin=admin,
        code=status.HTTP_401_UNAUTHORIZED,
        detail=f"You '{admin.user.username}' do not have the permission for this action",
    )


def _make_permission_to_create(model: ModelName, level: Permission.PermissionLevel):
    "helper function for construct a Permission. IT IS NOT COMMITED"

    name = f"can_perform_{level.name}_{level.value}_operations_on_{model.name}"
    perm = Permission(model=model, level=level, name=name)

    return perm
