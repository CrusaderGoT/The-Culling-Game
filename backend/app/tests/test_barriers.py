"""
test file for the barriers router/paths
"""

from fastapi.testclient import TestClient

from app.models.player import PlayerInfo


def test_domain_expansion(match_players: list[tuple[TestClient, dict]]):
    "test for activating domain expansion, and it various perks"
    # activate for player 1
    player1 = match_players[1][1]

    print(player1["matches"], "grade")
    res0 = match_players[0][0].post(
        f"/barrier/activate/domain/{player1['id']}/1"
    )
    print(res0.json())
    assert res0.is_success is True

    if player1["grade"] > PlayerInfo.Grade.ONE:
        assert res0.is_success is True, (
            f"Falsely Activated Domain for Player 1: {res0.json()}"
        )
    elif player1["grade"] <= PlayerInfo.Grade.ONE:
        assert res0.is_success is True, (
            f"Couldn't Activate Domain for Player 1: {res0.json()}"
        )
