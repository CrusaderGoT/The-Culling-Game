from random import choice

from fastapi.encoders import jsonable_encoder as je
from fastapi.testclient import TestClient

from app.models.vote import CastVote


def test_vote_player(
    authenticated_test_client: tuple[TestClient, dict],
    authenticated_admin_client: tuple[TestClient, dict],
    match_players: list[tuple[TestClient, dict]],
):
    "test voting of a player, using an auth client, admin client, etc."

    def _votes():
        "votes for use in test"
        votes_payload = [
            CastVote(
                player_id=match_players[0][1]["id"],  # player 1 ID
                ct_app_id=choice(
                    [
                        app["id"]
                        for app in match_players[0][1]["cursed_technique"][
                            "applications"
                        ]
                    ]
                ),  # random select from player 1 ct apps
            ),
            CastVote(
                player_id=match_players[1][1]["id"],  # player 2 ID
                ct_app_id=choice(
                    [
                        app["id"]
                        for app in match_players[1][1]["cursed_technique"][
                            "applications"
                        ]
                    ]
                ),  # random select from player 2 ct apps
            ),
        ]
        return votes_payload

    votes = _votes()
    # test for a regular user
    res0 = authenticated_test_client[0].post("/match/vote/1", json=je(votes))
    assert res0.is_success is True
    # check if all votes were casted
    assert len(res0.json()["votes"]) == len(votes), (
        "Not all votes were casted for regular user"
    )

    # test for a admin user
    res1 = authenticated_admin_client[0].post("/match/vote/1", json=je(votes))
    assert res1.is_success is True, res1.json()
    # check if all votes were casted
    assert len(res1.json()["votes"]) == len(votes), (
        "Not all votes were casted for admin user"
    )

    # test for the users of the player
    res2= match_players[0][0].post("/match/vote/1", json=je(votes))
    assert res2.is_success is True, res2.json()
    # check if all votes were casted
    assert len(res2.json()["votes"]) == len(votes), (
        "Not all votes were casted for player 1 user"
    )

    res3 = match_players[1][0].post("/match/vote/1", json=je(votes))
    assert res3.is_success is True, res3.json()
    # check if all votes were casted
    assert len(res3.json()["votes"]) == len(votes), (
        "Not all votes were casted for player 2 user"
    )
