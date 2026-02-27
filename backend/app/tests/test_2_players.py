"""
test file for the players routers/paths
"""

from random import choice

from fastapi.encoders import jsonable_encoder as je
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.tests.utils_test import (
    PlayerUpgradeCostTest,
    add_player_points_via_session,
    assert_compare_players,
    compare_fields,
    create_player_via_client,
    create_player_via_session,
    generate_random_string,
    get_client_user,
    player_payload,
)

from ..models.player import BasePlayerInfo, EditCTApp, EditPlayer, PlayerInfo


def test_create_player(authorized_client: TestClient):
    """test function for creating a player."""
    payload = player_payload()
    new_player = create_player_via_client(authorized_client, payload)

    assert_compare_players(new_player, payload)


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

    create_player_via_client(authorized_client, payload)

    # try to do it again
    user = get_client_user(authorized_client)
    response = authorized_client.post(f"/player/create/{user.id}", json=je(payload))

    # check status is error
    assert response.is_client_error, (
        "Client with existing player cannot create another player",
        response.json(),
    )


def test_my_player(authorized_client: TestClient):
    "test for getting the current user's player"

    payload = player_payload()
    player = create_player_via_client(authorized_client, payload)

    res = authorized_client.get("/player/me")
    assert res.is_success is True

    assert_compare_players(player, payload)
    assert_compare_players(res.json(), payload)


def test_a_player(authorized_client: TestClient, session: Session):
    "test for getting a player"
    player = create_player_via_session(session)

    # create client player for crosscheck
    payload = player_payload()
    client_player = create_player_via_client(authorized_client, payload)

    response = authorized_client.get(f"/player/{player.id}")
    assert response.is_success is True

    # validate response
    response_player = PlayerInfo.model_validate(response.json())

    # player belong to session player
    assert response_player.user
    assert response_player.user.id == player.user_id
    assert response_player.id == player.id

    # assert player is not same as client player
    assert response_player != client_player, (
        "Response player should not match Client player."
        "If this is the result you want, modify assertions."
    )


def test_edit_player(authorized_client: TestClient):
    "test for editing a player"
    # create player
    payload = player_payload()
    player = create_player_via_client(authorized_client, payload)

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
    player = create_player_via_client(authorized_client, payload)

    response = authorized_client.delete(f"/player/delete/{player.id}")

    assert response.is_success

    assert_compare_players(response.json(), payload)

    assert response.json() == je(player.model_dump())


def test_delete_player_by_diff_client(authorized_client: TestClient, session: Session):
    """test function for deleting a player."""

    player = create_player_via_session(session)

    response = authorized_client.delete(f"/player/delete/{player.id}")

    assert response.is_client_error, "A user cannot delete a player that isn't theirs"


def test_get_players(authorized_client: TestClient, session: Session):
    "test get all players"

    no_of_players = 2
    slim = choice([True, False])

    for _ in range(no_of_players):
        create_player_via_session(session)

    response = authorized_client.get(f"/player/all?slim={slim}")
    response_data = response.json()

    assert response.is_success is True, (
        f"Failed to get players. Response: {response_data}, Expect Players length: {no_of_players}"
    )

    assert len(response_data) == no_of_players, (
        f"Mismatch of expected Players length: {no_of_players}"
    )

    # validate response data
    if slim and no_of_players > 0:
        BasePlayerInfo.model_validate(response_data[0])
    elif not slim and no_of_players > 0:
        PlayerInfo.model_validate(response_data[0])


def test_upgrade_player(authorized_client: TestClient, session: Session):
    "test for uprading a player"
    # create player
    payload = player_payload()
    player = create_player_via_client(authorized_client, payload)

    # confirm player assertion
    assert_compare_players(player, payload)

    # add enough points
    cost = choice(
        [c for c in PlayerUpgradeCostTest if c is not PlayerUpgradeCostTest.FOUR]
    )
    add_player_points_via_session(player, points=cost, ses=session)

    # upgrade player
    grade_up = BasePlayerInfo.Grade[cost.name]
    grade_up = {"grade_up": grade_up}

    response = authorized_client.post(
        f"/player/upgrade/{player.id}", params=je(grade_up)
    )

    # confirm success
    response_data = response.json()
    assert response.is_success, response_data

    response_player = PlayerInfo.model_validate(response_data)

    assert response_player.id == player.id, (
        "Authorized client player ID, doesn't match the upgraded player ID"
    )

    assert response_player.grade == grade_up["grade_up"], (
        "Grade of response player, doesn't match the expected upgrade"
    )


def test_upgrade_player_no_point(authorized_client: TestClient):
    "test for uprading a player, with insufficient points"
    # create player
    payload = player_payload()
    player = create_player_via_client(authorized_client, payload)

    # confirm player assertion
    assert_compare_players(player, payload)

    # upgrade player
    grade_up = choice(
        [g for g in BasePlayerInfo.Grade if g is not BasePlayerInfo.Grade.FOUR]
    )
    grade_up = {"grade_up": grade_up}

    response = authorized_client.post(
        f"/player/upgrade/{player.id}", params=je(grade_up)
    )

    # confirm success
    response_data = response.json()
    assert response.status_code == 412, (
        "Player without enough points cannot upgrade",
        response_data,
    )


def test_upgrade_player_by_diff_client(authorized_client: TestClient, session: Session):
    "test for uprading a player by a different client, than the one that has the player"
    # create player
    player = create_player_via_session(session)

    # add enough points
    cost = choice(
        [c for c in PlayerUpgradeCostTest if c is not PlayerUpgradeCostTest.FOUR]
    )
    add_player_points_via_session(player, points=cost, ses=session)

    # upgrade player
    grade_up = BasePlayerInfo.Grade[cost.name]
    grade_up = {"grade_up": grade_up}

    response = authorized_client.post(
        f"/player/upgrade/{player.id}", params=je(grade_up)
    )

    # confirm success
    response_data = response.json()
    assert response.is_client_error, response_data
