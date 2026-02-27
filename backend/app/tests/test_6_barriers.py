"""
test file for barriers
"""

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.barrier import BarrierTechInfo
from app.models.player import Player
from app.tests.utils_test import (
    ATPTest,
    add_player_points_via_session,
    create_match_via_session,
    create_player_via_client,
    create_player_via_session,
    get_client_player,
    upgrade_player_via_session,
)

# initialize ATPTest
atp = ATPTest()


def test_domain_expansion(authorized_client: TestClient, session: Session):
    "test for activation of a domain expansion"
    # create authorized client player
    player = create_player_via_client(authorized_client)

    # create match, no of players is one, in other to use the above player
    match = create_match_via_session(session, part=1, no_of_players=1)

    # add enough points
    player = add_player_points_via_session(player, atp.cost_domain_expansion, session)

    # upgrade player
    player = upgrade_player_via_session(session, player, Player.Grade.ONE)

    # cast domain
    response = authorized_client.post(
        f"/barrier/activate/domain/{player.id}/{match.id}"
    )
    response_data = response.json()

    # confirm success
    assert response.is_success, ("Domain expansion failed to activate", response_data)
    response_barrier = BarrierTechInfo.model_validate(response_data)

    assert response_barrier.domain_expansion, "Domain expansion should be active"


def test_simple_domain(authorized_client: TestClient, session: Session):
    "test for activation of a simple domain"
    # create authorized client player
    player = create_player_via_client(authorized_client)

    # create match, no of players is one, in other to use the above player
    match = create_match_via_session(session, part=1, no_of_players=1)

    # add enough points
    player = add_player_points_via_session(player, atp.cost_simple_domain, session)

    # upgrade player
    player = upgrade_player_via_session(session, player, Player.Grade.TWO)

    response = authorized_client.post(
        f"/barrier/activate/simple/{player.id}/{match.id}"
    )
    response_data = response.json()

    # confirm success
    assert response.is_success, ("Simple domain failed to activate", response_data)
    response_barrier = BarrierTechInfo.model_validate(response_data)

    assert response_barrier.simple_domain, "Simple domain should be active"


def test_binding_vow(authorized_client: TestClient, session: Session):
    "test for activation of a binding vow"
    # create authorized client player
    player = create_player_via_client(authorized_client)

    # create match, no of players is one, in other to use the above player
    match = create_match_via_session(session, part=1, no_of_players=1)

    # add enough points
    player = add_player_points_via_session(player, atp.cost_binding_vow, session)

    # upgrade player
    player = upgrade_player_via_session(session, player, Player.Grade.THREE)

    response = authorized_client.post(
        f"/barrier/activate/binding/{player.id}/{match.id}"
    )
    response_data = response.json()

    # confirm success
    assert response.is_success, ("Binding vow failed to activate", response_data)
    response_barrier = BarrierTechInfo.model_validate(response_data)

    assert response_barrier.binding_vow, "BInding vow should be active"


def test_reversed_cursed_technique(authorized_client: TestClient, session: Session):
    "test for use of RCT"
    # create authorized client player
    player = create_player_via_client(authorized_client)

    # create match, no of players is one, in other to use the above player
    match = create_match_via_session(session, part=1, no_of_players=1)

    # upgrade player
    player = upgrade_player_via_session(session, player, Player.Grade.SPECIAL)

    response = authorized_client.post(f"/barrier/activate/rct/{player.id}/{match.id}")
    response_data = response.json()

    # confirm success
    assert response.is_success, (
        "Reversed cursed technique failed to activate",
        response_data,
    )
    BarrierTechInfo.model_validate(response_data)

    # check if player point increased
    player = get_client_player(authorized_client)
    assert player.points == atp.reverse_cursed_technique_point


def test_domain_expansion_by_diff_client_player(
    authorized_client: TestClient, session: Session
):
    "test for activation of a domain expansion, by another player"
    # create different player
    player = create_player_via_session(session)

    # create match, no of players is one, in other to use the above player
    match = create_match_via_session(session, part=1, no_of_players=1)

    # add enough points
    player = add_player_points_via_session(player, atp.cost_domain_expansion, session)

    # upgrade player
    player = upgrade_player_via_session(session, player, Player.Grade.ONE)

    # cast domain
    response = authorized_client.post(
        f"/barrier/activate/domain/{player.id}/{match.id}"
    )
    response_data = response.json()

    # confirm
    assert response.is_client_error, (
        "Can not activate Domain expansion of another player",
        response_data,
    )
