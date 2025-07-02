"""Configurations for test, i.e, fixtures, dependency overrides, etc."""

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlmodel import Session, SQLModel

from app.api.main import app
from app.api.setting import settings
from app.tests.utils_test import (
    create_test_player,
    create_test_user,
    login_test_user,
    override_dependencies,
    setup_authenticated_client,
)

load_dotenv(".env.test")


@pytest.fixture(scope="session", name="session")
def test_session():
    """
    Create a new database session for overriding
    """
    _test_engine = create_engine(
        "sqlite:///./test.db",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(_test_engine)
    with Session(_test_engine) as session:
        yield session
        SQLModel.metadata.drop_all(_test_engine)


@pytest.fixture(scope="session")
def test_client(session: Session):
    """Create a test client that uses the test_session"""

    override_dependencies(session)

    with TestClient(app) as tst_cli:
        yield tst_cli
        app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def authenticated_test_client(test_client) -> tuple[TestClient, dict]:
    """An authenticated client that their session commits"""
    # Use test client to create a user and then login them in to get access token
    test_user = create_test_user(test_client).json()
    token = login_test_user(test_client, test_user["id"])
    client = setup_authenticated_client(test_client, token)
    return client, test_user


@pytest.fixture(scope="function")
def authenticated_admin_client(test_client) -> tuple[TestClient, dict]:
    """An authenticated admin client, that commits"""
    test_user = create_test_user(test_client).json()
    token = login_test_user(test_client, test_user["id"])
    client = setup_authenticated_client(test_client, token)
    code = settings.code
    super_user_res = test_client.post(
        f"/admin/superuser/{test_user['id']}", params={"code": code}
    )
    assert super_user_res.is_success is True
    return client, test_user


@pytest.fixture(scope="session", autouse=True)
def player1(test_client) -> tuple[TestClient, dict]:
    """Factory to create players on demand."""
    created_players = []

    def _create_player():
        test_user = create_test_user(test_client)
        assert test_user.is_success is True
        user_data = test_user.json()

        token = login_test_user(test_client, user_data["id"])
        assert token

        auth_client = setup_authenticated_client(test_client, token)
        player_res = create_test_player((auth_client, user_data))
        assert player_res.is_success is True

        player_data = (auth_client, player_res.json())
        created_players.append(player_data)
        return player_data

    return _create_player()


@pytest.fixture(scope="session", autouse=True)
def player2(test_client) -> tuple[TestClient, dict]:
    """Factory to create players on demand."""
    created_players = []

    def _create_player():
        test_user = create_test_user(test_client)
        assert test_user.is_success is True
        user_data = test_user.json()

        token = login_test_user(test_client, user_data["id"])
        assert token

        auth_client = setup_authenticated_client(test_client, token)
        player_res = create_test_player((auth_client, user_data))
        assert player_res.is_success is True

        player_data = (auth_client, player_res.json())
        created_players.append(player_data)
        return player_data

    return _create_player()
