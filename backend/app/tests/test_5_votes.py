"""
test file for votes
"""

from random import choice, randint

from fastapi.encoders import jsonable_encoder as je
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.vote import CastVote
from app.tests.utils_test import (
    ATPTest,
    assert_valid_vote,
    create_match_via_session,
)


def test_vote_by_authorized_client(authorized_client: TestClient, session: Session):
    part = 1
    match = create_match_via_session(session, part)

    # assertions to qualify for vote
    assert match.id, "Match via session must have an ID."

    # vote for a player
    player = choice(match.players)
    assert player.id, "Player from Match via session must have an ID."

    ct_app_id = choice([app.id for app in player.cursed_technique.applications])
    assert ct_app_id, (
        "Cursed Technique Application from Player in Match via session must have an ID."
    )

    votes = [
        CastVote(player_id=player.id, ct_app_id=ct_app_id)
    ]  # votes should be a list

    response = authorized_client.post(f"match/vote/{match.id}", json=je(votes))
    response_data = response.json()
    assert response.is_success, ("Vote by Authorized client failed", response_data)

    assert_valid_vote(response.json(), votes[0], authorized_client)


def test_vote_by_non_auth_client(client: TestClient, session: Session):
    part = 1
    match = create_match_via_session(session, part)

    # assertions to qualify for vote
    assert match.id, "Match via session must have an ID."

    # vote for a player
    player = choice(match.players)
    assert player.id, "Player from Match via session must have an ID."

    ct_app_id = choice([app.id for app in player.cursed_technique.applications])
    assert ct_app_id, (
        "Cursed Technique Application from Player in Match via session must have an ID."
    )

    votes = [
        CastVote(player_id=player.id, ct_app_id=ct_app_id)
    ]  # votes should be a list

    response = client.post(f"match/vote/{match.id}", json=je(votes))
    response_data = response.json()
    assert response.is_client_error, ("Non authorized cient cannot vote", response_data)


def test_vote_by_admin_client(admin_client: TestClient, session: Session):
    part = 1
    match = create_match_via_session(session, part)

    # assertions to qualify for vote
    assert match.id, "Match via session must have an ID."

    # vote for a player
    player = choice(match.players)
    assert player.id, "Player from Match via session must have an ID."

    ct_app_id = choice([app.id for app in player.cursed_technique.applications])
    assert ct_app_id, (
        "Cursed Technique Application from Player in Match via session must have an ID."
    )

    votes = [
        CastVote(player_id=player.id, ct_app_id=ct_app_id)
    ]  # votes should be a list

    response = admin_client.post(f"match/vote/{match.id}", json=je(votes))
    response_data = response.json()
    assert response.is_success, ("Vote by admin client failed", response_data)

    # validate response
    assert_valid_vote(response.json(), votes[0], admin_client)


def test_vote_max_votes(authorized_client: TestClient, session: Session):
    part = 1
    match = create_match_via_session(session, part)

    # assertions to qualify for vote
    assert match.id, "Match via session must have an ID."

    max = randint(6, 10)

    # loop vote to max
    for i in range(max):
        # vote for a player
        player = choice(match.players)
        assert player.id, "Player from Match via session must have an ID."

        # make votes
        ct_app_ids = [app.id for app in player.cursed_technique.applications]

        if i + 1 > len(ct_app_ids):
            # randomly select a ct app id, to avoid IndexError: list index out of range
            ct_app_id = choice(ct_app_ids)
        else:
            ct_app_id = ct_app_ids[i]

        assert ct_app_id, (
            "Cursed Technique Application from Player in Match via session must have an ID."
        )

        votes = [
            CastVote(player_id=player.id, ct_app_id=ct_app_id)
        ]  # votes should be a list

        response = authorized_client.post(f"match/vote/{match.id}", json=je(votes))
        response_data = response.json()

        atp = ATPTest()

        if i + 1 > atp.vote_limit:  # should raise a client error
            assert response.is_client_error, (
                "Exceeded vote limit should fail.",
                response_data,
            )
        else:
            assert response.is_success, ("Vote by admin client failed", response_data)

            # validate response
            assert_valid_vote(response_data, votes[0], authorized_client)


def test_vote_no_valid_votes(admin_client: TestClient, session: Session):
    part = 1
    match = create_match_via_session(session, part)

    # assertions to qualify for vote
    assert match.id, "Match via session must have an ID."

    # vote for a non valid player
    player = randint(1, 100)

    ct_app_id = randint(1, 100)

    votes = [CastVote(player_id=player, ct_app_id=ct_app_id)]  # votes should be a list

    response = admin_client.post(f"match/vote/{match.id}", json=je(votes))
    response_data = response.json()
    assert response.is_client_error, ("No valid votes, should failed", response_data)
