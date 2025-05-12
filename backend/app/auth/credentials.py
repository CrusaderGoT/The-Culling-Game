"""this module handles authentication"""

from datetime import UTC, datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import HTTPException, status
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from app.auth.models import TokenData
from app.models.user import User
from app.utils.config import settings
from app.utils.dependencies import session
from app.utils.user import get_user

# write your credential auths here.


class PasswordAuth:
    """
    The Password Authentication class
    """

    def __init__(self, salt_rounds=12):
        """
        Initialize the PasswordAuth class.

        :param salt_rounds: The number of rounds to use for salting (default: 12)
        """
        self.salt_rounds = salt_rounds

    def hash_password(self, password: str) -> str:
        """
        Hash a password string using bcrypt.

        :param password: The plaintext password to hash
        :return: The hashed password
        """
        # Generate a salt
        salt = bcrypt.gensalt(rounds=self.salt_rounds)
        # Hash the password
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    def verify_password(self, password: str, hashed: str) -> bool:
        """
        Verify if a password matches its hash.

        :param password: The plaintext password to verify
        :param hashed: The hashed password to compare against
        :return: True if the password matches the hash, False otherwise
        """
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(
    data: dict,
    expires_delta: timedelta = timedelta(milliseconds=settings.access_token_expire),
):
    """
    creates an access token.
    \n`data: dict`
    \n`expires_delta: timedelta`
    """
    to_encode = data.copy()
    issued_at = datetime.now(UTC)
    expires = datetime.now(timezone.utc) + expires_delta

    to_encode.update({"exp": expires, "iat": issued_at})
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def authenticate_user(username: str, password: str, session: session):
    """Authenticates a user using their username and password.
    \nReturns a User if authenticated, else False"""

    user = get_user(session, username)
    if not user:
        return False
    correct_pw = PasswordAuth().verify_password(password, user.password)
    if not correct_pw:
        return False
    return user


def decode_access_token(token: str) -> TokenData:
    """try to decode an access token.
    return TokenData.
    raise HTTPException if fail.
    """
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        return TokenData.model_validate(payload)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def create_refresh_token(
    user: User, key, refresh_expires_in: int = settings.refresh_token_expire
):
    "create refresh token"
    refresh_token = create_access_token(
        data={"sub": user.usernamedb, "refresh_token_key": key},
        expires_delta=timedelta(milliseconds=refresh_expires_in),
    )
    return refresh_token
