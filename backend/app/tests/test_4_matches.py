"""
test file for the matches, votes, barriers, etc. router/paths
"""

from fastapi import status
from fastapi.encoders import jsonable_encoder as je
from fastapi.testclient import TestClient

from app.models.admin import PermissionRequest
from app.models.base import BasePermission
from app.models.player import BasePlayerInfo, PlayerInfo
from app.models.table import ModelName

player_info_keys = PlayerInfo.model_fields.keys()
"expected return keys, for the player route/ playerinfo"


def test_create_match(
    authenticated_admin_client: tuple[TestClient, dict],
):
    "test function for create permission and creation a match"
    # make permission
    levels = {
        BasePermission.PermissionLevel.CREATE,
    }
    modelname = ModelName.match
    permissions = [PermissionRequest(model=modelname, levels=levels)]
    user = authenticated_admin_client[1]["id"]
    res = authenticated_admin_client[0].patch(
        f"admin/grant-permission/{user}", json=je(permissions)
    )
    assert res.is_success is True, res.json()

    # test create match
    res = authenticated_admin_client[0].post("/match/create?part=1")
    assert res.is_success is True, res.json()


"""
def test_domain_expansion_fail(player1):
    "test for activating domain expansion, and it various perks"
    # activate for player 1
    res = player1[0].post(f"/barrier/activate/domain/{player1[1]['id']}/1")

    # Check for the actual error code returned (406 instead of 412)
    assert res.status_code == status.HTTP_412_PRECONDITION_FAILED, (
        f"Expected 406, got {res.status_code}: {res.json()}"
    )


def test_upgrade_player(player1: tuple[TestClient, dict]):
    "test for player upgrade"
    param = {"grade_up": 2}

    # Use the correct player's own ID (from their client's context)
    player_id = player1[1]["id"]
    res = player1[0].post(f"/player/upgrade/{player_id}", params=param)

    print(f"Upgrade response: {res.status_code} - {res.json()}")
    print(f"Player ID used: {player_id}")

    assert res.is_success is True, (
        f"Upgrade failed: {res.json()}, Player ID: {player_id}"
    )

    # confirm player info was returned
    assert res.json().keys() == player_info_keys
    # confirm player was upgraded
    assert res.json()["grade"] == param["grade_up"]


def test_get_players(
    authenticated_test_client: tuple[TestClient, dict],
):
    "test for getting all existing players"

    params = {
        "offset": 0,
        "limit": 30,
        "slim": True,  # False to include extra infos about the player
    }
    res = authenticated_test_client[0].get("/player/all", params=params)
    print(f"Get players response: {res.status_code} - {res.json()}")

    assert res.is_success is True, f"Get players failed: {res.json()}"
    # confirm player info was returned
    assert len(res.json()) > 0, f"No player in returned list. Response: {res.json()}"

    for d in res.json():
        assert (
            d.keys() == player_info_keys
            or d.keys() == BasePlayerInfo.model_fields.keys()
        ), f"Player data keys don't match expected format: {d.keys()}"
"""
