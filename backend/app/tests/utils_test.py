"""
utils for test. DO NOT USE FIXTURE NAMES HERE!!!
"""

import random
import string
from datetime import date, datetime, timedelta
from random import choice, sample
from typing import Any

from fastapi.encoders import jsonable_encoder as je
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.api.main import app
from app.auth.credentials import PasswordAuth as pw
from app.models.admin import Admin, Permission, PermissionInfo, PermissionRequest
from app.models.base import ActionTimePoint, BasePermission, ModelName
from app.models.player import (
    CreateCT,
    CreateCTApp,
    CreatePlayer,
    Player,
    PlayerInfo,
)
from app.models.user import Country, CreateUser, User, UserInfo
from app.models.vote import Vote
from app.utils.admin import _make_permission_to_create
from app.utils.dependencies import _atp_def, get_or_create_colony, get_session
from app.utils.match import create_new_match
from app.utils.player import create_player_helper

# PAYLOADS


def generate_random_string(length: int = 10) -> str:
    """
    Generate random string of specified length using letters, digits and special chars.
    First character is always a letter.
    Args:
        length: Length of string to generate (default 10)
    Returns:
        Random string of specified length
    """
    first_char = random.choice(string.ascii_letters)
    allowed_chars = string.ascii_letters + string.digits
    rest = "".join(random.choices(allowed_chars, k=length - 1))
    return first_char + rest


def break_string(word: str, count: int = 50, sep: str | None = None):
    if sep is None:
        sep = word[0]

    return " ".join(word.split(sep=sep)[:count])


def generate_random_email():
    alphas = [*"a b c d e f g h i j k l m n o p q r s t u v w x y z _".split(" ")]
    email = "".join(sample(alphas, k=8)) + "@example.com"
    return email


def player_payload():
    c_player_payload = CreatePlayer(
        name=generate_random_string(),
        gender=choice(list(CreatePlayer.Gender)),
        age=random.randint(18, 102),
        role=generate_random_string(),
    )
    c_ct = CreateCT(
        name=generate_random_string(),
        definition=break_string(generate_random_string(200)),
    )
    c_ct_apps = [
        CreateCTApp(
            name=generate_random_string(),
            application=break_string(generate_random_string(200)),
        ),
        CreateCTApp(
            name=generate_random_string(),
            application=break_string(generate_random_string(200)),
        ),
        CreateCTApp(
            name=generate_random_string(),
            application=break_string(generate_random_string(200)),
        ),
        CreateCTApp(
            name=generate_random_string(),
            application=break_string(generate_random_string(200)),
        ),
        CreateCTApp(
            name=generate_random_string(),
            application=break_string(generate_random_string(200)),
        ),
    ]
    player_dict = {
        "player": c_player_payload,
        "cursed_technique": c_ct,
        "applications": c_ct_apps,
    }

    return player_dict


def user_payload():
    pw = user_password()
    pyld = CreateUser(
        username=generate_random_string(),
        email=generate_random_email(),
        country=choice(list(Country)),
        password=pw,
        confirm_password=pw,
    )

    return pyld


def user_password():
    return "Pw5@" + generate_random_string(8)


def hashed_password(password: str):
    return pw().hash_password(password)


# DEPENDENCIES


class ATPTest(ActionTimePoint):
    "class for duration, limit, point, etc. of techniques, match, etc. `for tests`"

    match_duration: timedelta = timedelta(seconds=5)
    domain_duration: timedelta = timedelta(seconds=1)
    simple_domain_duration: timedelta = timedelta(seconds=1)

    vote_limit: int = 5

    limit_binding_vow: int = 5
    limit_domain_expansion: int = 5
    limit_simple_domain: int = 5

    cost_binding_vow: float = 0
    cost_domain_expansion: float = 0
    cost_simple_domain: float = 0

    vote_point: float = 0.2
    domain_expansion_point: float = 4.0
    simple_domain_point: float = 2.0

    winner_point: float = 5.0

    delay_begin_match: timedelta = timedelta(seconds=0)
    bt_min_grade: int = 3
    limit_reverse_cursed_technique: int = 5
    reverse_cursed_technique_point: float = 0.5


def override_dependencies(ss: Session):
    """Central function for overriding dependencies."""

    def get_session_override():
        return ss

    app.dependency_overrides[get_session] = get_session_override

    app.dependency_overrides[_atp_def] = ATPTest


def login_test_user(
    cl: TestClient, username: str, password: str = user_password()
) -> str:
    """Helper to log in a test user and return their token."""
    response = cl.post("/login", data={"username": username, "password": password})
    assert response.is_success is True
    return response.json().get("access_token")


def setup_authenticated_client(cl: TestClient, token: str):
    """Set up a client with the given token."""
    cl.headers.update({"Authorization": f"Bearer {token}"})
    return cl


def match_part():
    return 1


# New Utils


def compare_fields(expected: dict, actual: dict, keys: set | None = None):
    """
    Helper function to compare fields between two dictionaries.
    :param expected: The expected dictionary.
    :param actual: The actual dictionary.
    :param keys: Optional set of keys to compare. If None, compares common keys.
    """
    keys_to_compare = keys or set(expected.keys()) & set(actual.keys())
    for k in keys_to_compare:
        if isinstance(expected[k], Country):
            assert Country(actual[k]) == expected[k]
        elif isinstance(expected[k], datetime):
            assert datetime.fromisoformat(actual[k]) == expected[k]
        elif isinstance(expected[k], date):
            assert date.fromisoformat(actual[k]) == expected[k]
        else:
            assert actual[k] == expected[k], (
                f"Mismatch for key '{k}': {str(actual[k])} != {expected[k]}"
            )


def get_client_user(cli: TestClient):
    "return the user info of an authorized client"
    response = cli.get("/users/me")

    # check status is successful
    assert response.is_success is True

    user_info = UserInfo.model_validate(response.json())

    return user_info


def create_client_player(cli: TestClient, payload: dict):
    "create and return a client player"
    # get user
    user = get_client_user(cli)

    response = cli.post(f"/player/create/{user.id}", json=je(payload))

    # check status is created and success
    assert response.status_code == 201
    assert response.is_success is True

    return PlayerInfo.model_validate(response.json())


def compare_players(player_info: PlayerInfo | dict | Player, payload: dict):
    """
    Compare player information with a payload dictionary.
    This function compares a PlayerInfo object or dictionary containing player data
    against an expected payload dictionary. It validates basic player information,
    cursed technique details, and technique applications.
    Parameters:
    ----------
    player_info : Union[PlayerInfo, dict]
        The player information to validate, either as a PlayerInfo object or dictionary
        (from create_client_player or a response or create_session_player)
    payload : dict
        The expected payload dictionary to compare against from player_payload
    Raises:
    -------
    AssertionError
        If any field comparison fails to match between player_info and payload
    Notes:
    -----
    The function checks the following fields:
    - Basic player info (name, age, role, gender)
    - Cursed technique info (name, definition)
    - Cursed technique applications
    """

    if isinstance(player_info, PlayerInfo):
        player_dict = player_info.model_dump()

    elif isinstance(player_info, Player):
        player_dict = player_info.model_dump()

    else:
        player_dict = player_info

    # compare player basic info
    assert je(payload)["player"]["name"] == player_dict["name"]
    assert je(payload)["player"]["age"] == player_dict["age"]
    assert je(payload)["player"]["role"] == player_dict["role"]
    assert je(payload)["player"]["gender"] == player_dict["gender"]

    # compare player cursed technique info
    assert (
        je(payload)["cursed_technique"]["name"]
        == player_dict["cursed_technique"]["name"]
    )
    assert (
        je(payload)["cursed_technique"]["definition"]
        == player_dict["cursed_technique"]["definition"]
    )

    # compare player cursed technique applications info
    for actual, expect in zip(
        player_dict["cursed_technique"]["applications"], je(payload)["applications"]
    ):
        compare_fields(expect, actual)


def permission_payload(models: dict[ModelName, set[BasePermission.PermissionLevel]]):
    payload: list[PermissionRequest] = []

    for model, levels in models.items():
        payload.append(
            PermissionRequest(model=model, levels=levels),
        )

    return payload


def create_user_via_session(ses: Session):
    """
    adds a User to the session.
    ### Note: User password is hashed in the database,
    ### but the object is returned with its plain text password, for convinence.
    ### update with rehased password, if it will be commited again.
    """
    # make user via session
    payload = user_payload()
    update = {"password": hashed_password(payload.password)}
    user = User.model_validate(payload, update=update)

    ses.add(user)
    ses.commit()
    ses.refresh(user)

    plaintext_pw_update = {"password": payload.password}

    user = User.model_validate(user, update=plaintext_pw_update)

    return user


def grant_admin_client_permission_via_session(
    ses: Session, admin_cli: TestClient, permission: Permission
):
    # add perm to session
    ses.add(permission)

    # get admin client admin table
    admin_user = get_client_user(admin_cli)

    admin = ses.exec(select(Admin).where(Admin.user_id == admin_user.id)).first()
    assert admin is not None, "Admin client AdminUser does not exist"

    admin.permissions.append(permission)
    ses.add(admin)

    ses.commit()


def grant_admin_permission_via_session(
    ses: Session, admin: Admin, permission: Permission
):
    # add perm to session
    ses.add(permission)

    admin.permissions.append(permission)
    ses.add(admin)

    ses.commit()


def create_admin_via_session(ses: Session, user: User, is_superuser: bool = False):
    # make admin superuser
    assert user.id, "User has no ID."

    admin = Admin(user_id=user.id, is_superuser=is_superuser)
    ses.add(admin)

    # commit
    ses.commit()
    ses.refresh(admin)

    # Verify the authenticated user matches the superuser response
    assert user.id == admin.user.id, (
        f"User and Admin client, User ID mismatch: {user.id} != {admin.user.id}"
    )

    return admin


def assert_permissions_in_payload(response_data: Any, payload: list[PermissionRequest]):
    """
    Asserts that given permissions in payload exist in the response data.

    This function validates that the permissions specified in the payload match with the
    permissions in the response data by comparing their model and level attributes.

    Args:
        response_data (Any): The response data containing permissions information
        payload (list[PermissionRequest]): List of permission requests to validate

    Returns:
        None

    Raises:
        AssertionError: If the permissions in payload are not found in response data
    """

    assert permissions_in_payload(response_data, payload), (
        "Permission(s) from payload does not exist in admin permissions"
    )


def permissions_in_payload(response_data: Any, payload: list[PermissionRequest]):
    perm_payload_to_perms = map_perm_request_to_permissions(payload)
    admin_permissions = [PermissionInfo.model_validate(p) for p in response_data]
    perm_payload_in_perms = next(
        (
            perm_load
            for perm_load in perm_payload_to_perms
            for admin_perm in admin_permissions
            if perm_load.model == admin_perm.model
            and perm_load.level == admin_perm.level
        ),
        None,
    )
    return perm_payload_in_perms


def map_perm_request_to_permissions(perm_request: list[PermissionRequest]):
    perm_list: list[Permission] = []

    for perm_r in perm_request:
        for level in perm_r.levels:
            perm = _make_permission_to_create(
                perm_r.model,
                level,
            )
            perm_list.append(perm)

    return perm_list


def create_player_via_session(ses: Session):
    "adds a Player to session"
    # create the user first
    user = create_user_via_session(ses)
    # rehash password, because it will

    # make player
    payload = player_payload()

    # get colony
    colony = get_or_create_colony(ses)

    new_player = create_player_helper(colony=colony, user=user, session=ses, **payload)

    return new_player


def create_match_via_session(ses: Session, part: int):
    "create a match via session"
    # create players first
    multiple_players_via_session(ses, 2)

    atp = ATPTest()

    match = create_new_match(ses, part, atp=atp)

    return match


def multiple_players_via_session(ses: Session, num: int = 2):
    players: list[Player] = list()

    for _ in range(num):
        player = create_player_via_session(ses)
        players.append(player)

    assert players, "No players were created."
    assert len(players) == num, "Players created, do not match number specified"

    return players


def cast_vote_via_session(
    ses: Session,
    match_id: int,
    vote_point: float,
    player_id: int,
    ct_app_id: int,
    anon_user: bool | int = False,
):
    "cast a vote via session"
    # process and get the user id
    if anon_user is True:
        user_id = create_user_via_session(ses).id
    elif anon_user is False:
        user_id = None
    elif isinstance(anon_user, int):
        user_id = anon_user
    else:
        user_id = None

    # Create and add the vote
    vote = Vote(
        player_id=player_id,
        ct_app_id=ct_app_id,
        match_id=match_id,
        point=vote_point,
        has_been_added=True,
        user_id=user_id,
    )

    ses.add(vote)
    ses.commit()
    ses.refresh(vote)

    return vote
