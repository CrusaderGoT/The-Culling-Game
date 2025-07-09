"""Configurations for test, i.e, fixtures, dependency overrides, etc."""

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, StaticPool, create_engine

from app.api.main import app
from app.tests.utils_test import (
    create_admin_via_session,
    create_user_via_session,
    override_dependencies,
)

load_dotenv(".env.test")


@pytest.fixture(name="session")
def session_fixture():
    """
    Create a new database session for overriding
    """
    _test_engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(_test_engine)
    with Session(_test_engine) as session:
        yield session
        SQLModel.metadata.drop_all(_test_engine)


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client that uses the test_session"""

    override_dependencies(session)

    cli = TestClient(app)
    yield cli
    app.dependency_overrides.clear()


@pytest.fixture(name="authorized_client")
def authorized_client_fixture(client: TestClient, session: Session):
    user = create_user_via_session(session)

    response = client.post(
        "/login", data={"username": user.username, "password": user.password}
    )
    assert response.is_success is True
    token = response.json().get("access_token")
    client.headers.update({"Authorization": f"Bearer {token}"})
    yield client


@pytest.fixture(name="superuser_client")
def super_client_fixture(client: TestClient, session: Session):
    # make user via session
    user = create_user_via_session(session)

    # make admin superuser
    create_admin_via_session(session, user, is_superuser=True)

    # login in with client
    response = client.post(
        "/login", data={"username": user.username, "password": user.password}
    )

    # confirmations
    assert response.is_success is True

    # get token and update headers
    token = response.json().get("access_token")
    client.headers.update({"Authorization": f"Bearer {token}"})

    yield client


@pytest.fixture(name="admin_client")
def admin_client_fixture(session: Session, client: TestClient):
    user = create_user_via_session(session)

    # make normal admin
    create_admin_via_session(session, user)

    # login in new admin with client
    response = client.post(
        "/login", data={"username": user.username, "password": user.password}
    )

    assert response.is_success is True

    # get token and update headers
    token = response.json().get("access_token")
    client.headers.update({"Authorization": f"Bearer {token}"})

    yield client
