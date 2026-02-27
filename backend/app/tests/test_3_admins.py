"""
test file for the admin router/paths
"""

from fastapi.encoders import jsonable_encoder as je
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.api.setting import settings
from app.models.base import BasePermission
from app.models.table import ModelName
from app.tests.utils_test import (
    assert_permissions_in_payload,
    compare_fields,
    create_admin_via_session,
    create_user_via_session,
    get_client_user,
    grant_admin_client_permission_via_session,
    grant_admin_permission_via_session,
    map_perm_request_to_permissions,
    permission_payload,
    permissions_in_payload,
)
from app.utils.admin import _make_permission_to_create

from ..models.admin import AdminInfo, Permission, PermissionInfo

perm_keys = PermissionInfo.model_fields.keys()


def test_create_super_user(authorized_client: TestClient):
    "test for creating a super user"

    # get user
    user = get_client_user(authorized_client)

    # get code and make super user
    code = settings.code

    response = authorized_client.post(
        f"admin/superuser/{user.id}", params={"code": str(code)}
    )

    # confirm success
    assert response.is_success, response.json()

    compare_fields(
        user.model_dump(), response.json()["user"], set(response.json()["user"].keys())
    )

    # validate response
    AdminInfo.model_validate(response.json())


def test_create_admin_by_perm_admin_same_perm_payload(
    admin_client: TestClient, session: Session
):
    "test for creating admin, by admin and superuser"
    # give admin the permission
    create_admin_perm = _make_permission_to_create(
        model=ModelName.admin, level=Permission.PermissionLevel.CREATE
    )
    grant_admin_client_permission_via_session(session, admin_client, create_admin_perm)

    # add user to session
    user = create_user_via_session(session)

    # make payload match admin client perms
    payload = permission_payload(
        {
            ModelName.admin: {
                BasePermission.PermissionLevel.CREATE,
            }
        }
    )

    response = admin_client.post(f"admin/create/{user.id}", json=je(payload))

    assert response.is_success, (
        "Admin with create Adminuser perm "
        "should be able make other admins with create Adminuser perm",
        response.json(),
    )

    # validate response
    AdminInfo.model_validate(response.json())


def test_create_admin_by_perm_admin_diff_perm_payload(
    admin_client: TestClient, session: Session
):
    "test for creating admin, by admin and superuser"
    # give admin the permission
    create_admin_perm = _make_permission_to_create(
        model=ModelName.admin, level=Permission.PermissionLevel.CREATE
    )
    grant_admin_client_permission_via_session(session, admin_client, create_admin_perm)

    # add user to session
    user = create_user_via_session(session)

    payload = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
                BasePermission.PermissionLevel.UPDATE,
                BasePermission.PermissionLevel.DELETE,
            }
        }
    )

    response = admin_client.post(f"admin/create/{user.id}", json=je(payload))

    assert response.is_client_error, (
        "Admin with only create AdminUser perm should"
        " not be able to grant perms they themself don't have",
        response.json(),
    )


def test_create_admin_by_no_perm_admin(admin_client: TestClient, session: Session):
    "test for creating admin, by no perm admin"
    # add user to session
    user = create_user_via_session(session)

    payload = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
                BasePermission.PermissionLevel.UPDATE,
                BasePermission.PermissionLevel.DELETE,
            }
        }
    )

    response = admin_client.post(f"admin/create/{user.id}", json=je(payload))

    assert response.is_client_error, (
        "Admin without permission should not be able to make this request"
    )


def test_create_admin_by_superuser(superuser_client: TestClient, session: Session):
    "test for creating admin, by admin and superuser"
    # add user to session
    user = create_user_via_session(session)

    # required perm payload
    payload = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
                BasePermission.PermissionLevel.UPDATE,
                BasePermission.PermissionLevel.DELETE,
            }
        }
    )

    response = superuser_client.post(f"admin/create/{user.id}", json=je(payload))

    assert response.is_success, "Superuser client should be able to make this request"

    # validate response
    AdminInfo.model_validate(response.json())


def test_new_permission_by_superuser(superuser_client: TestClient):
    "function for testing creation of new permissions"
    payload = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
                BasePermission.PermissionLevel.UPDATE,
                BasePermission.PermissionLevel.DELETE,
            }
        }
    )

    response = superuser_client.post("/admin/new-permission", json=je(payload))

    assert response.is_success is True, response.json()

    # Check if correct permissions were added correctly
    assert_permissions_in_payload(response.json(), payload)


def test_new_permission_by_no_perm_admin(admin_client: TestClient):
    payload = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
                BasePermission.PermissionLevel.UPDATE,
                BasePermission.PermissionLevel.DELETE,
            }
        }
    )

    response = admin_client.post("/admin/new-permission", json=je(payload))

    assert response.is_client_error, (
        "Admin without permission to create Permission(s) should not be able to create Permission(s)",
        response.json(),
    )


def test_new_permission_by_create_perm_admin(
    admin_client: TestClient, session: Session
):
    # make perm to create perm for admin
    create_perm_perm = _make_permission_to_create(
        ModelName.permission, level=BasePermission.PermissionLevel.CREATE
    )

    # give admin client the permission
    grant_admin_client_permission_via_session(session, admin_client, create_perm_perm)

    payload = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
                BasePermission.PermissionLevel.UPDATE,
                BasePermission.PermissionLevel.DELETE,
            }
        }
    )

    response = admin_client.post("/admin/new-permission", json=je(payload))

    assert response.is_success, (
        "Admin with permission to create Permission(s) should be able to create Permission(s)",
        response.json(),
    )

    # Check if correct permissions were added correctly
    assert_permissions_in_payload(response.json(), payload)


def test_grant_permission_by_perm_admin_client_diff_perm_payload(
    admin_client: TestClient, session: Session
):
    "function for testing creation of new permissions"
    # give admin perm to update other admins
    update_admin_perm = _make_permission_to_create(
        ModelName.admin,
        BasePermission.PermissionLevel.UPDATE,
    )
    grant_admin_client_permission_via_session(session, admin_client, update_admin_perm)

    diff_perm_payload = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
            }
        }
    )

    # make user
    user = create_user_via_session(session)
    # make user an admin
    admin = create_admin_via_session(session, user)

    response = admin_client.patch(
        f"admin/grant-permission/{admin.id}", json=je(diff_perm_payload)
    )

    assert response.is_client_error, (
        "Admin should not be able to grant perms they themself don't have",
        response.json(),
    )


def test_grant_permission_by_perm_admin_client_some_same_perm_payload(
    admin_client: TestClient, session: Session
):
    "function for testing creation of new permissions"
    # give admin perm to update other admins
    update_admin_perm = _make_permission_to_create(
        ModelName.admin,
        BasePermission.PermissionLevel.UPDATE,
    )
    grant_admin_client_permission_via_session(session, admin_client, update_admin_perm)

    some_same_perm_payload = permission_payload(
        {
            ModelName.admin: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
                BasePermission.PermissionLevel.UPDATE,
                BasePermission.PermissionLevel.DELETE,
            }
        }
    )

    # make user
    user = create_user_via_session(session)
    # make user an admin
    admin = create_admin_via_session(session, user)

    response = admin_client.patch(
        f"admin/grant-permission/{admin.id}", json=je(some_same_perm_payload)
    )

    assert response.is_success, (
        "Admin with some perms as the perm payload should "
        "be able to grant those perms to other admins",
        response.json(),
    )

    # confirm only the perms the admin have were those assign
    # get admin_client perms
    admin_client_user = get_client_user(admin_client)
    assert admin_client_user.admin, "Admin client should have BaseAdminInfo"
    admin_client_perms = admin_client_user.admin.permissions

    # get the response permissions
    response_admin = response.json()  # admin info
    response_admin = AdminInfo.model_validate(
        response_admin
    )  # validate / make type hinting

    # comfirm admin client has that perm
    for granted_perm in response_admin.permissions:
        assert granted_perm in admin_client_perms


def test_grant_permission_by_superuser(superuser_client: TestClient, session: Session):
    "function for testing creation of new permissions"
    # give admin perm to update other admins
    update_admin_perm = _make_permission_to_create(
        ModelName.admin,
        BasePermission.PermissionLevel.UPDATE,
    )
    grant_admin_client_permission_via_session(
        session, superuser_client, update_admin_perm
    )

    perm_payload = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
            }
        }
    )

    # make user
    user = create_user_via_session(session)
    # make user an admin
    admin = create_admin_via_session(session, user)

    response = superuser_client.patch(
        f"admin/grant-permission/{admin.id}", json=je(perm_payload)
    )

    assert response.is_success, (
        "Superuser should be able to grant permissions without restrictions",
        response.json(),
    )

    # confirm permission granted, match that of the request perm
    # get the response permissions
    response_admin = AdminInfo.model_validate(
        response.json()
    )  # validate / make type hinting

    # comfirm admin has all the requested perm
    assert_permissions_in_payload(response_admin.permissions, perm_payload)


def test_grant_permission_by_no_perm_superuser(
    superuser_client: TestClient, session: Session
):
    "function for testing creation of new permissions"

    diff_perm_payload = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
            }
        }
    )

    # make user
    user = create_user_via_session(session)
    # make user an admin
    admin = create_admin_via_session(session, user)

    response = superuser_client.patch(
        f"admin/grant-permission/{admin.id}", json=je(diff_perm_payload)
    )

    assert response.is_success, (
        "Superuser should be able to grant permissions without restrictions. "
        "Even if they themself do not have the permission",
        response.json(),
    )

    # validate response
    response_admin_info = AdminInfo.model_validate(response.json())

    assert_permissions_in_payload(response_admin_info.permissions, diff_perm_payload)


def test_grant_permission_by_no_perm_admin_client(
    admin_client: TestClient, session: Session
):
    "function for testing creation of new permissions"

    diff_perm_payload = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
            }
        }
    )

    # make user
    user = create_user_via_session(session)
    # make user an admin
    admin = create_admin_via_session(session, user)

    response = admin_client.patch(
        f"admin/grant-permission/{admin.id}", json=je(diff_perm_payload)
    )

    assert response.is_client_error, (
        "Admin client with Permission create perm should not be able to grant permissions ",
        response.json(),
    )


def test_grant_permission_by_perm_admin_client_same_perm_payload(
    admin_client: TestClient, session: Session
):
    "function for testing creation of new permissions"

    same_perm_payload = permission_payload(
        {
            ModelName.admin: {
                BasePermission.PermissionLevel.UPDATE,
            }
        }
    )

    # give admin perm to update other admins
    update_admin_perm = map_perm_request_to_permissions(same_perm_payload)
    for perm in update_admin_perm:
        grant_admin_client_permission_via_session(session, admin_client, perm)

    # make user
    user = create_user_via_session(session)
    # make user an admin
    admin = create_admin_via_session(session, user)

    response = admin_client.patch(
        f"admin/grant-permission/{admin.id}", json=je(same_perm_payload)
    )

    assert response.is_success, (
        "Admin with create AdminUser perm should "
        "be able to grant that perm to other admins",
        response.json(),
    )

    # validate response
    response_admin_info = AdminInfo.model_validate(response.json())

    assert_permissions_in_payload(response_admin_info.permissions, same_perm_payload)


def test_get_current_admin(admin_client: TestClient):
    response = admin_client.get("/admin/me")

    assert response.is_success, response.json()

    # validate response
    response_admin = AdminInfo.model_validate(response.json())

    # confirm admin client matched admin fetch
    admin_client_user = get_client_user(admin_client)
    assert admin_client_user.admin

    assert response_admin.user.id == admin_client_user.id, (
        f"Response Admin and Admin Client, User ID mismatch: {response_admin.user.id} != {admin_client_user.id}"
    )


def test_get_current_superuser(superuser_client: TestClient):
    response = superuser_client.get("/admin/me")

    assert response.is_success, response.json()

    # validate response
    response_admin = AdminInfo.model_validate(response.json())

    # confirm admin client matched admin fetch
    superuser_client_user = get_client_user(superuser_client)
    assert superuser_client_user.admin

    assert response_admin.user.id == superuser_client_user.id, (
        f"Response Admin and Admin Client, User ID mismatch: {response_admin.user.id} != {superuser_client_user.id}"
    )


def test_remove_perm_by_superuser(superuser_client: TestClient, session: Session):
    # make admin and give the permissions via session
    user = create_user_via_session(session)
    admin = create_admin_via_session(session, user)
    perm_request = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
            }
        }
    )
    perms_to_grant = map_perm_request_to_permissions(perm_request)

    for perm in perms_to_grant:
        grant_admin_permission_via_session(session, admin, perm)

    response = superuser_client.patch(
        f"admin/remove-permission/{admin.id}", json=je(perm_request)
    )

    assert response.is_success, response.json()

    # confirm permission have been removed
    # validate response
    response_admin = AdminInfo.model_validate(response.json())

    # confirm permissions have been removed
    perm_payload_in_perms = permissions_in_payload(
        response_admin.permissions, perm_request
    )

    assert not perm_payload_in_perms, (
        "Permissions from payload still exist in admin permissions"
    )


def test_remove_perm_by_admin(admin_client: TestClient, session: Session):
    # make another admin and give them permissions via session
    user = create_user_via_session(session)
    admin = create_admin_via_session(session, user)
    perm_request = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
            }
        }
    )
    perms_to_grant = map_perm_request_to_permissions(perm_request)

    for perm in perms_to_grant:
        grant_admin_permission_via_session(session, admin, perm)

    response = admin_client.patch(
        f"admin/remove-permission/{admin.id}", json=je(perm_request)
    )

    assert response.is_client_error, (
        "Non superuser admin cannot remove permsissions from other admins",
        response.json(),
    )


def test_remove_perm_by_unauth_client(client: TestClient, session: Session):
    # make admin and give the permissions via session
    user = create_user_via_session(session)
    admin = create_admin_via_session(session, user)
    perm_request = permission_payload(
        {
            ModelName.match: {
                BasePermission.PermissionLevel.CREATE,
                BasePermission.PermissionLevel.READ,
            }
        }
    )
    perms_to_grant = map_perm_request_to_permissions(perm_request)

    for perm in perms_to_grant:
        grant_admin_permission_via_session(session, admin, perm)

    response = client.patch(
        f"admin/remove-permission/{admin.id}", json=je(perm_request)
    )

    assert response.is_client_error, (
        "Non authenticated client cannot remove permsissions from admins",
        response.json(),
    )
