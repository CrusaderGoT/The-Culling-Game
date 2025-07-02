import random
import string
from datetime import timedelta
from random import sample
from secrets import choice

from fastapi.encoders import jsonable_encoder as je
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel

from app.api.main import app
from app.models.player import CreateCT, CreateCTApp, CreatePlayer
from app.models.user import Country, CreateUser
from app.models.vote import CastVote
from app.utils.dependencies import _atp_def, get_session


# UTILS
def gen_rand_username():
    first_char = random.choice(string.ascii_letters)
    allowed_chars = string.ascii_letters + string.digits + "_-"
    rest = "".join(random.choices(allowed_chars, k=random.randint(4, 19)))
    username = first_char + rest
    # Ensure length between 3 and 20
    return username[:20]


def gen_rand_email():
    alphas = [*"a b c d e f g h i j k l m n o p q r s t u v w x y z _".split(" ")]
    email = "".join(sample(alphas, k=8)) + "@example.com"
    return email


def player_payload():
    c_player_payload = CreatePlayer(
        name=gen_rand_username(),
        gender=CreatePlayer.Gender("male"),
        age=25,
        role="programmer",
    )
    c_ct = CreateCT(
        name="git push",
        definition="A powerful technique that allows the user to instantly synchronize their progress with the collective knowledge base, ensuring that all changes are safely stored and retrievable by allies. This technique is especially effective when used on Fridays, granting additional reliability and trust among team members.",
    )
    c_ct_apps = [
        CreateCTApp(
            name="first",
            application="This is the first application, which is at least 50 characters long and provides a detailed example for testing purposes.",
        ),
        CreateCTApp(
            name="second",
            application="This is the second application, also more than 50 characters long, ensuring the test data meets the required length constraints.",
        ),
        CreateCTApp(
            name="third",
            application="Here is the third application, and it too exceeds 50 characters, offering enough content for robust validation in tests.",
        ),
        CreateCTApp(
            name="fourth",
            application="Fourth application example, definitely longer than 50 characters, designed to thoroughly test the application's requirements.",
        ),
        CreateCTApp(
            name="fifth",
            application="Fifth application, making sure it is at least 50 characters long, so all test cases are properly covered and validated.",
        ),
    ]
    player_dict = {
        "player": c_player_payload,
        "cursed_technique": c_ct,
        "applications": c_ct_apps,
    }

    return player_dict


def user_payload():
    pyld = CreateUser(
        username=gen_rand_username(),
        email=gen_rand_email(),
        country=Country("NG"),
        password=user_password(),
        confirm_password=user_password(),
    )

    return pyld


def user_password():
    return "Password45@"


def votes_payload(player1, player2):
    "votes for use in test"
    votes_payload = [
        CastVote(
            player_id=player1[1]["id"],  # player 1 ID
            ct_app_id=choice(
                [app["id"] for app in player1[1]["cursed_technique"]["applications"]]
            ),  # random select from player 1 ct apps
        ),
        CastVote(
            player_id=player2[1]["id"],  # player 2 ID
            ct_app_id=choice(
                [app["id"] for app in player2[1]["cursed_technique"]["applications"]]
            ),  # random select from player 2 ct apps
        ),
    ]
    return votes_payload


def create_test_player(authenticated_test_client: tuple[TestClient, dict]):
    "creates a test player, and returns the Reponse object"
    user = authenticated_test_client[1]
    created_res = authenticated_test_client[0].post(
        f"/player/create/{user['id']}", json=je(player_payload())
    )
    # check status is created
    assert created_res.status_code == 201
    return created_res


def create_test_user(test_client: TestClient):
    """creates a brand new test user. returns the user info\n
    should typically be used in a function
    that uses the test_client pytest fixture as an arg."""
    create_user_payload = user_payload()
    new_user_res = test_client.post("/signup", json=je(create_user_payload))
    # check status is created
    assert new_user_res.status_code == 201
    return new_user_res


# DEPENDENCIES


class ATPTest(SQLModel):
    "class for duration, limit, point, etc. of techniques, match, etc. `for tests`"

    match_duration: timedelta = timedelta(seconds=30)
    domain_duration: timedelta = timedelta(seconds=5)
    simple_domain_duration: timedelta = timedelta(seconds=5)

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

    delay_begin_match: timedelta = timedelta(seconds=60)
    bt_min_grade: int = 3
    limit_reverse_cursed_technique: int = 5
    reverse_cursed_technique_point: float = 0.5


def override_dependencies(session: Session):
    """Central function for overriding dependencies."""

    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override

    app.dependency_overrides[_atp_def] = ATPTest


def login_test_user(
    client: TestClient, username: str, password: str = user_password()
) -> str:
    """Helper to log in a test user and return their token."""
    response = client.post("/login", data={"username": username, "password": password})
    assert response.is_success is True
    return response.json().get("access_token")


def setup_authenticated_client(client: TestClient, token: str):
    """Set up a client with the given token."""
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
