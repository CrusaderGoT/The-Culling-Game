from fastapi import HTTPException, status
from sqlmodel import select

from app.auth.dependencies import admin_user
from app.models.admin import AdminUser, Permission, PermissionRequest
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
                name = f"can_perform_{level.name}_{level.value}_operations_on_{permission.model.name}"
                perm = Permission(model=permission.model, level=level, name=name)

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
    model_name: str,
    permission_level: Permission.PermissionLevel,
) -> bool:
    """
    Check if an admin has the specified permission level for a model.

    Args:
        session: Database session
        admin: The admin user to check
        model_name: Name of the model to check permissions for
        permission_level: Required permission level

    Returns:
        bool: True if admin has permission, False otherwise

    Raises:
        HTTPException: If the permission does not exist in the system
    """
    check_perm_exist_or_exc(session, model_name, permission_level)

    # Check if admin has the permission
    permission = session.exec(
        select(Permission)
        .where(Permission.admins.any(id=admin.id))
        .where(Permission.model == model_name)
        .where(Permission.level == permission_level)
    ).first()

    return bool(permission)


def check_perm_exist_or_exc(
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

    if not permission_exist:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail=(
                f"Permission {permission_level.name} "
                f"for {model_name.capitalize()} does not exist in the system"
            ),
        )


def ADMIN_UNAUTHORIZED_EXCEPTION(admin: admin_user):
    return AdminException(
        admin=admin,
        code=status.HTTP_401_UNAUTHORIZED,
        detail=f"You '{admin.user.username}' do not have the permission for this action",
    )
