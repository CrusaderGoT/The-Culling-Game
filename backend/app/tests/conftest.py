"""Configurations for test, i.e, fixtures, dependency overrides, etc."""

import os

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


@pytest.fixture(scope="session", autouse=True)
def test_env():
    """Load environment file"""
    return load_dotenv(".env.test")


@pytest.fixture(scope="session")
def test_engine():
    """Create sqlalchemy/sqlmodel engine. The test engine"""
    _test_engine = create_engine(
        os.getenv("SQLITE_DATABASE_URL", "sqlite:///./test.db"),
        connect_args={"check_same_thread": False},
    )
    return _test_engine


@pytest.fixture(scope="session", autouse=True)
def setup_test_database(test_engine):
    """
    Fixture to create the tables once for all tests and drop them after all tests complete.
    """
    # Create tables before running tests
    SQLModel.metadata.create_all(test_engine)
    yield
    # Drop tables after all tests have run
    SQLModel.metadata.drop_all(test_engine)


@pytest.fixture(scope="session")
def test_session(test_engine):
    """
    Create a new database session for overriding
    """
    with Session(test_engine) as session:
        yield session


@pytest.fixture(scope="session", autouse=True)
def override_app_dependencies(test_session):
    yield override_dependencies(test_session)
    app.dependency_overrides = {}


@pytest.fixture(scope="session")
def test_client():
    """Create a test client that uses the test_session"""
    with TestClient(app) as tst_cli:
        yield tst_cli


@pytest.fixture(scope="function")
def authenticated_test_client(test_client) -> tuple[TestClient, dict]:
    """An authenticated client that their session commits"""
    # Use test client to create a user and then login them in to get access token
    test_user = create_test_user(test_client).json()
    token = login_test_user(test_client, test_user["id"])
    client = setup_authenticated_client(test_client, token)
    return client, test_user


@pytest.fixture(scope="session")
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


# Option 1: Explicit separate fixtures (most common for 2 players)
@pytest.fixture(scope="session")
def player_one(test_client) -> tuple[TestClient, dict]:
    """Create the first player for match tests."""
    test_user = create_test_user(test_client)
    assert test_user.is_success is True
    user_data = test_user.json()
    
    token = login_test_user(test_client, user_data["id"])
    assert token
    
    auth_client = setup_authenticated_client(test_client, token)
    player_res = create_test_player((auth_client, user_data))
    assert player_res.is_success
    
    return auth_client, player_res.json()


@pytest.fixture(scope="session")
def player_two(test_client) -> tuple[TestClient, dict]:
    """Create the second player for match tests."""
    test_user = create_test_user(test_client)
    assert test_user.is_success is True
    user_data = test_user.json()
    
    token = login_test_user(test_client, user_data["id"])
    assert token
    
    auth_client = setup_authenticated_client(test_client, token)
    player_res = create_test_player((auth_client, user_data))
    assert player_res.is_success
    
    return auth_client, player_res.json()


@pytest.fixture(scope="session")
def match_players(player_one, player_two) -> list[tuple[TestClient, dict]]:
    """Combine both players for match tests."""
    return [player_one, player_two]


# Option 2: Parameterized approach (good for different player types)
@pytest.fixture(scope="session", params=["beginner", "expert"])
def player_by_skill(test_client, request) -> tuple[TestClient, dict]:
    """Create players with different skill levels."""
    test_user = create_test_user(test_client)
    assert test_user.is_success is True
    user_data = test_user.json()
    
    token = login_test_user(test_client, user_data["id"])
    assert token
    
    auth_client = setup_authenticated_client(test_client, token)
    
    # Create player with specific skill level
    player_res = create_test_player((auth_client, user_data), skill_level=request.param)
    assert player_res.is_success
    
    return auth_client, player_res.json()


# Option 3: Factory pattern (most flexible)
@pytest.fixture(scope="session")
def player_factory(test_client):
    """Factory to create players on demand."""
    created_players = []
    
    def _create_player(skill_level="beginner", **kwargs):
        test_user = create_test_user(test_client)
        assert test_user.is_success is True
        user_data = test_user.json()
        
        token = login_test_user(test_client, user_data["id"])
        assert token
        
        auth_client = setup_authenticated_client(test_client, token)
        player_res = create_test_player((auth_client, user_data), skill_level=skill_level, **kwargs)
        assert player_res.is_success
        
        player_data = (auth_client, player_res.json())
        created_players.append(player_data)
        return player_data
    
    yield _create_player
    # Cleanup if needed
    

@pytest.fixture(scope="session")
def match_players_factory(player_factory) -> list[tuple[TestClient, dict]]:
    """Create exactly 2 players using the factory."""
    return [
        player_factory(skill_level="beginner"),
        player_factory(skill_level="expert")
    ]