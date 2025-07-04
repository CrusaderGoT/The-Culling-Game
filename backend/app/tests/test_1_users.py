"""
test file for the users routers/paths
"""

from fastapi.encoders import jsonable_encoder as je
from fastapi.testclient import TestClient
from sqlmodel import Session

from ..models.user import Country, CreateUser, EditUser, User, UserInfo
from .utils_test import (
    compare_fields,
    generate_random_email,
    generate_random_string,
    get_client_user,
    hashed_password,
    user_payload,
)

user_info_keys = set(UserInfo.model_fields.keys())  # expected keys
"expected return keys, for the user route/ userinfo"


def test_create_user(client: TestClient):
    "test for the creation of a user"
    username = generate_random_string()
    email = generate_random_email()
    create_user_payload = CreateUser(
        username=username,
        email=email,
        country=Country("NG"),
        password="Crusader45@",
        confirm_password="Crusader45@",
    )
    response = client.post("/signup", json=je(create_user_payload))

    # check status is created
    assert response.is_success is True

    # check returned keys are the expected keys
    res_keys = response.json().keys()  # response keys
    assert res_keys == user_info_keys

    # check database calculated fields was made
    assert response.json()["id"] is not None
    assert response.json()["created"] is not None

    # check userpayload values match the response user
    payload_data = create_user_payload.model_dump()
    response_data = response.json()

    compare_fields(payload_data, response_data)


def test_current_user(authorized_client: TestClient):
    "test get the current user"
    response = authorized_client.get("/users/me")

    # check status is successful
    assert response.is_success is True

    # check returned keys are the expected keys
    res_keys = response.json().keys()  # response keys
    assert res_keys == user_info_keys

    # check database calculated fields was made
    assert response.json()["id"] is not None
    assert response.json()["created"] is not None


def test_a_user(authorized_client: TestClient, session: Session):
    "test for getting a specific user"
    # create user
    payload = user_payload()
    update = {"password": hashed_password(payload.password)}
    user = User.model_validate(payload, update=update)
    session.add(user)
    session.commit()
    session.refresh(user)

    response = authorized_client.get(f"/users/{user.id}")

    # check status is successful
    assert response.is_success is True

    # check returned keys are the expected keys
    assert response.json().keys() == user_info_keys  # response keys
    # check fields match up
    compare_fields(user.model_dump(), response.json())


def test_edit_user(authorized_client: TestClient):
    "test for edit user"
    # get client user
    user = get_client_user(authorized_client)

    new_username = generate_random_string()
    new_email = generate_random_email()

    edit_user_payload = EditUser(
        username=new_username, email=new_email, country=Country("JP")
    )

    response = authorized_client.patch(
        f"/users/edit/{user.id}", json=je(edit_user_payload)
    )

    # check status is successful
    assert response.is_success is True

    # compare
    compare_fields(edit_user_payload.model_dump(), response.json())


def test_delete_user(authorized_client: TestClient):
    "test delete user"

    # get client user
    user = get_client_user(authorized_client)

    response = authorized_client.delete(f"/users/delete/{user.id}")

    # check status is successful
    assert response.is_success is True

    # check if user no longer exists in database
    deleted_response = authorized_client.get(f"users/{user.id}")

    # check status, should be unsuccessful
    assert deleted_response.is_client_error is True
