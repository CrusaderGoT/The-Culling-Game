from fastapi.encoders import jsonable_encoder as je


def test_player1_vote(votes, player1):
    "test voting of a player, using an auth client, admin client, and players etc."

    # Debug: Print vote payload to understand structure
    print(f"Vote payload: {votes}")

    # test for the users of the player
    res = player1[0].post("/match/vote/1", json=je(votes))
    print(f"Player 1 vote response: {res.status_code} - {res.json()}")
    assert res.is_success is True, f"Player 1 vote failed: {res.json()}"
    # check if all votes were casted
    assert len(res.json()["votes"]) == len(votes), (
        "Not all votes were casted for player 1 client",
        f"{res.json()}",
    )
    # check if all votes were made by correct user
    for v in res.json()["votes"]:
        assert v["user_id"] == player1[1]["id"], "incorrect user cast vote"


def test_player2_vote(votes, player2):
    "test voting of a player, using an auth client, admin client, and players etc."

    # Debug: Print vote payload to understand structure
    print(f"Vote payload: {votes}")

    res = player2[0].post("/match/vote/1", json=je(votes))
    print(f"Player 2 vote response: {res.status_code} - {res.json()}")
    assert res.is_success is True, f"Player 2 vote failed: {res.json()}"
    # check if all votes were casted
    assert len(res.json()["votes"]) == len(votes), (
        "Not all votes were casted for player 2 client",
        f"{res.json()}",
    )
    # check if all votes were made by correct user
    for v in res.json()["votes"]:
        assert v["user_id"] == player2[1]["id"], "incorrect user cast vote"


def test_user_vote(votes, authenticated_test_client):
    "test voting of a player, using an auth client, admin client, and players etc."

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
    print(res0.json(), authenticated_test_client[1])
    # check if all votes were made by correct user
    for v in res0.json()["votes"]:
        assert v["user_id"] == authenticated_test_client[1]["id"], (
            "incorrect user cast vote"
        )


def test_admin_vote(votes, authenticated_admin_client):
    "test voting of a player, using an auth client, admin client, and players etc."

    # Debug: Print vote payload to understand structure
    print(f"Vote payload: {votes}")

    # test for a admin user
    res = authenticated_admin_client[0].post("/match/vote/1", json=je(votes))
    print(f"Admin user vote response: {res.status_code} - {res.json()}")
    assert res.is_success is True, f"Admin vote failed: {res.json()}"
    # check if all votes were casted
    assert len(res.json()["votes"]) == len(votes), (
        "Not all votes were casted for authenticated_admin_client",
        f"{res.json()}",
    )
    # check if all votes were made by correct user
    for v in res.json()["votes"]:
        assert v["user_id"] == authenticated_admin_client[1]["id"], (
            "incorrect user cast vote"
        )
