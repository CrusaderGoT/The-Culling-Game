"""
test file for the admin router/paths
"""

from fastapi.encoders import jsonable_encoder as je
from fastapi.testclient import TestClient

from ..models.admin import PermissionInfo, PermissionRequest
from ..models.base import BasePermission, ModelName

perm_keys = PermissionInfo.model_fields.keys()


def test_new_permission(authenticated_admin_client: tuple[TestClient, dict]):
    "function for testing creation of new permissions"
    match_levels = {
        BasePermission.PermissionLevel.CREATE,
        BasePermission.PermissionLevel.DELETE,
    }
    match_model = ModelName.match

    admin_levels = {
        BasePermission.PermissionLevel.CREATE,
        BasePermission.PermissionLevel.UPDATE,
    }
    admin_model = ModelName.adminuser

    payload = [
        PermissionRequest(model=match_model, levels=match_levels),
        PermissionRequest(model=admin_model, levels=admin_levels),
    ]
    res = authenticated_admin_client[0].post("/admin/new-permission", json=je(payload))
    print(res.json())
    assert res.is_success is True

    # confirm items in dict are perms'
    for perm in res.json():
        assert perm.keys() == perm_keys


def test_grant_permission(authenticated_admin_client: tuple[TestClient, dict]):
    "function for testing creation of new permissions"
    levels = {
        BasePermission.PermissionLevel.CREATE,
        BasePermission.PermissionLevel.DELETE,
    }
    modelname = ModelName.match
    permissions = [PermissionRequest(model=modelname, levels=levels)]
    user = authenticated_admin_client[1]["id"]
    res = authenticated_admin_client[0].patch(
        f"admin/grant-permission/{user}", json=je(permissions)
    )
    assert res.is_success is True, res.json()


def test_create_match(
    authenticated_admin_client: tuple[TestClient, dict],
    match_players: list[tuple[TestClient, dict]],
):
    "test function for creating a match"
    # test create match
    res = authenticated_admin_client[0].post("/match/create?part=1")
    assert res.is_success is True, res.json()
