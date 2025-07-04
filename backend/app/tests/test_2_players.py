"""
test file for the players routers/paths
"""

from random import choice

from fastapi.encoders import jsonable_encoder as je
from fastapi.testclient import TestClient

from app.tests.utils_test import (
    compare_fields,
    compare_players,
    create_client_player,
    generate_random_string,
    get_client_user,
    player_payload,
)

from ..models.player import EditCTApp, EditPlayer, PlayerInfo

player_info_keys = PlayerInfo.model_fields.keys()
"expected return keys, for the player route/ playerinfo"


def test_create_player(authorized_client: TestClient):
    """test function for creating a player."""
    payload = player_payload()
    new_player = create_client_player(authorized_client, payload)

    compare_players(new_player, payload)


def test_create_player_by_unauth_client(client: TestClient):
    """test function for creating a player."""
    payload = player_payload()

    user_id = choice(range(10))
    username = generate_random_string()
    user = choice([user_id, username])

    response = client.post(f"/player/create/{user}", json=je(payload))

    # check status is error
    assert response.is_client_error is True, (
        "Unauthenticated client cannot create player",
        response.json(),
    )


def test_create_player_by_client_with_player(authorized_client: TestClient):
    """test function for creating a player."""
    payload = player_payload()

    create_client_player(authorized_client, payload)

    # try to do it again
    user = get_client_user(authorized_client)
    response = authorized_client.post(f"/player/create/{user.id}", json=je(payload))

    # check status is error
    assert response.is_client_error, (
        "Client with existing cannot create another player",
        response.json(),
    )


def test_my_player(authorized_client: TestClient):
    "test for getting the current user's player"

    payload = player_payload()
    player = create_client_player(authorized_client, payload)

    res = authorized_client.get("/player/me")
    assert res.is_success is True

    compare_players(player, payload)
    compare_players(res.json(), payload)


def test_a_player(authorized_client: TestClient, player: PlayerInfo):
    "test for getting a player"

    res = authorized_client.get(f"/player/{player.id}")
    assert res.is_success is True

    assert res.json() == je(player.model_dump())


def test_edit_player(authorized_client: TestClient):
    "test for editing a player"
    # create player
    payload = player_payload()
    player = create_client_player(authorized_client, payload)

    # edit data and payload
    edit_player_data = EditPlayer(name="editedplayer", role="tired program")

    edit_apps = [
        EditCTApp(number=1, name="dismantle"),
        EditCTApp(number=2, name="Cleave"),
        EditCTApp(number=3, name="SLICE"),
        EditCTApp(number=4, name="Dice"),
        EditCTApp(number=5, name="web"),
    ]

    edit_payload = {
        "player": edit_player_data,
        "cursed_technique": None,  # omit, confirm it didn't get removed
        "applications": edit_apps,
    }

    response = authorized_client.patch(
        f"/player/edit/{player.id}", json=je(edit_payload)
    )
    assert response.is_success is True

    # confirm data was edit
    res_data = response.json()
    assert res_data["cursed_technique"] is not None

    # Check if applications were edited correctly
    edited_numbers = [app.number for app in edit_apps]
    for app in res_data["cursed_technique"]["applications"]:
        if app["number"] in edited_numbers:
            # Find matching edit app
            edit_app = next(ea for ea in edit_apps if ea.number == app["number"])
            assert app["name"] == edit_app.name

    compare_fields(
        edit_player_data.model_dump(),
        res_data,
        {"name", "role"},
    )


def test_delete_player(authorized_client: TestClient):
    """test function for deleting a player."""

    payload = player_payload()
    player = create_client_player(authorized_client, payload)

    response = authorized_client.delete(f"/player/delete/{player.id}")

    assert response.is_success

    compare_players(response.json(), payload)

    assert response.json() == je(player.model_dump())


def test_delete_player_by_diff_client(authorized_client: TestClient):
    """test function for deleting a player."""

    payload = player_payload()
    player = create_client_player(authorized_client, payload)

    response = authorized_client.delete(f"/player/delete/{player.id}")

    assert response.is_success

    compare_players(response.json(), payload)

    assert response.json() == je(player.model_dump())


def test_get_players(authorized_client: TestClient, player):
    "test get all players"

    response = authorized_client.get("/player/all?slim=true")

    assert response.is_success is True, (
        f"Failed to get players. Response: {response.json()}, Player: {player}"
    )
