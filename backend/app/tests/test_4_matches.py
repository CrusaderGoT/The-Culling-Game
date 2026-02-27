"""
test file for the matches, votes, barriers, etc. router/paths
"""

import time
from random import choice, random

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.base import BasePermission
from app.models.match import MatchInfo
from app.models.player import PlayerInfo
from app.models.table import ModelName
from app.tests.utils_test import (
    ATPTest,
    cast_vote_via_session,
    create_match_via_session,
    grant_admin_client_permission_via_session,
    multiple_players_via_session,
)
from app.utils.admin import _make_permission_to_create

player_info_keys = PlayerInfo.model_fields.keys()
"expected return keys, for the player route/ playerinfo"


def test_create_match_by_superuser(superuser_client: TestClient, session: Session):
    "test function for a superuser creation a match"

    # create players for the match
    players = multiple_players_via_session(session, 2)

    # test create match
    part = 1
    response = superuser_client.post(f"/match/create?part={part}")
    assert response.is_success is True, response.json()

    response_info = MatchInfo.model_validate(response.json())

    assert response_info.part == part

    assert len(response_info.players) == len(players)


def test_create_match_by_admin(admin_client: TestClient, session: Session):
    "test function for admin creation a match"
    # grant permission for match creation to admin
    perm = _make_permission_to_create(
        model=ModelName.match, level=BasePermission.PermissionLevel.CREATE
    )

    grant_admin_client_permission_via_session(session, admin_client, perm)

    # create players for the match
    players = multiple_players_via_session(session, 2)

    # test create match
    part = 1
    response = admin_client.post(f"/match/create?part={part}")
    assert response.is_success is True, response.json()

    response_info = MatchInfo.model_validate(response.json())

    assert response_info.part == part

    assert len(response_info.players) == len(players)


def test_get_matches(authorized_client: TestClient, session: Session):
    # create some matches
    part = 1
    create_match_via_session(session, part)

    response = authorized_client.get("match/all")
    response_data = response.json()

    assert response.is_success, ("Fetchig all matches failed", response_data)

    assert response.is_success, response_data

    # confirm match info was return
    for res in response_data:
        MatchInfo.model_validate(res)


def test_latest_match(authorized_client: TestClient, session: Session):
    # create match
    part = 1
    match = create_match_via_session(session, part)

    response = authorized_client.get("match/latest")
    response_data = response.json()

    assert response.is_success, response_data

    # confirm match info was return
    response_match = MatchInfo.model_validate(response_data)

    assert match.id == response_match.id


def test_delete_match_by_non_admin(authorized_client: TestClient, session: Session):
    part = 1
    match = create_match_via_session(session, part)

    response = authorized_client.delete(f"match/delete/{match.id}")
    response_data = response.json()

    assert response.is_client_error, response_data


def test_delete_match_by_admin(admin_client: TestClient, session: Session):
    perm = _make_permission_to_create(
        model=ModelName.match, level=BasePermission.PermissionLevel.DELETE
    )

    grant_admin_client_permission_via_session(session, admin_client, perm)

    part = 1
    match = create_match_via_session(session, part)

    response = admin_client.delete(f"match/delete/{match.id}")
    response_data = response.json()

    assert response.is_success, response_data

    # confirm match info was return
    response_match = MatchInfo.model_validate(response_data)

    assert match.id == response_match.id


def test_delete_match_by_admin_no_perm(admin_client: TestClient, session: Session):
    part = 1
    match = create_match_via_session(session, part)

    response = admin_client.delete(f"match/delete/{match.id}")
    response_data = response.json()

    assert response.is_client_error, response_data


def test_assign_match_winner_draw(authorized_client: TestClient, session: Session):
    part = 1
    match = create_match_via_session(session, part)

    # wait for match to end
    atp = ATPTest()
    time.sleep((atp.match_duration + atp.delay_begin_match).seconds)

    response = authorized_client.post(f"match/winner/{match.id}")
    response_data = response.json()

    assert response.is_success, response_data

    # confirm match info was return
    response_match = MatchInfo.model_validate(response_data)

    assert match.id == response_match.id

    # confirm draw
    assert match.draw, "Match should be a Draw."
    assert not match.winner, "A draw match cannot have a winner"


def test_assign_match_winner_winner(authorized_client: TestClient, session: Session):
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

    vote_point = random()

    vote = cast_vote_via_session(
        session,
        match_id=match.id,
        vote_point=vote_point,
        player_id=player.id,
        ct_app_id=ct_app_id,
    )

    # wait for match to end
    atp = ATPTest()
    time.sleep((atp.match_duration + atp.delay_begin_match).seconds)

    response = authorized_client.post(f"match/winner/{match.id}")
    response_data = response.json()

    assert response.is_success, response_data

    # confirm match info was return
    response_match = MatchInfo.model_validate(response_data)

    assert match.id == response_match.id

    # confirm winner
    assert not match.draw, "Match should not be a Draw."
    assert match.winner, "Match should have a Winner"
    assert match.winner.id == vote.player_id, "Winner must match player voted for"
