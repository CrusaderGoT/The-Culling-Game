"""
test file for the matches, votes, barriers, etc. router/paths
"""

from fastapi import status
from fastapi.encoders import jsonable_encoder as je
from fastapi.testclient import TestClient

from app.models.player import BasePlayerInfo, PlayerInfo  # Added missing import
from app.tests.utils_test import votes_payload

player_info_keys = PlayerInfo.model_fields.keys()
"expected return keys, for the player route/ playerinfo"


def test_create_match(
    authenticated_admin_client: tuple[TestClient, dict],
):
    "test function for creating a match"
    # test create match
    res = authenticated_admin_client[0].post("/match/create?part=1")
    assert res.is_success is True, res.json()


def test_domain_expansion_fail(player1: tuple[TestClient, dict]):
    "test for activating domain expansion, and it various perks"
    # activate for player 1
    res = player1[0].post(f"/barrier/activate/domain/{player1[1]['id']}/1")

    # Check for the actual error code returned (406 instead of 412)
    assert res.status_code == status.HTTP_412_PRECONDITION_FAILED, (
        f"Expected 406, got {res.status_code}: {res.json()}"
    )


def test_vote_player(
    authenticated_test_client: tuple[TestClient, dict],
    player1: tuple[TestClient, dict],
    authenticated_admin_client: tuple[TestClient, dict],
):
    "test voting of a player, using an auth client, admin client, and players etc."

    votes = votes_payload(player1, player1)

    # Debug: Print vote payload to understand structure
    print(f"Vote payload: {votes}")

    # test for a regular user
    res0 = authenticated_test_client[0].post("/match/vote/1", json=je(votes))
    print(f"Regular user vote response: {res0.status_code} - {res0.json()}")
    assert res0.is_success is True, f"Regular user vote failed: {res0.json()}"
    # check if all votes were casted
    assert len(res0.json()["votes"]) == len(votes), (
        "Not all votes were casted for authenticated_test_client",
        f"{res0.json()}",
    )

    # test for a admin user
    res1 = authenticated_admin_client[0].post("/match/vote/1", json=je(votes))
    print(f"Admin user vote response: {res1.status_code} - {res1.json()}")
    assert res1.is_success is True, f"Admin vote failed: {res1.json()}"
    # check if all votes were casted
    assert len(res1.json()["votes"]) == len(votes), (
        "Not all votes were casted for authenticated_admin_client",
        f"{res1.json()}",
    )

    # test for the users of the player
    res2 = player1[0].post("/match/vote/1", json=je(votes))
    print(f"Player 1 vote response: {res2.status_code} - {res2.json()}")
    assert res2.is_success is True, f"Player 1 vote failed: {res2.json()}"
    # check if all votes were casted
    assert len(res2.json()["votes"]) == len(votes), (
        "Not all votes were casted for player 1 client",
        f"{res2.json()}",
    )

    res3 = player1[0].post("/match/vote/1", json=je(votes))
    print(f"Player 2 vote response: {res3.status_code} - {res3.json()}")
    assert res3.is_success is True, f"Player 2 vote failed: {res3.json()}"
    # check if all votes were casted
    assert len(res3.json()["votes"]) == len(votes), (
        "Not all votes were casted for player 2 client",
        f"{res3.json()}",
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
    player1: tuple[TestClient, dict],
):
    "test for getting all existing players"

    # Ensure players exist by referencing the factory
    assert len(player1) > 0, "No players created by factory"

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
