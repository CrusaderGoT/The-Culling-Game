from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.auth.credentials import decode_access_token
from app.models.admin import Admin
from app.models.user import User
from app.utils.config import UserException
from app.utils.dependencies import session
from app.utils.user import get_user

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
"""A dependency of the OAuth2PasswordBearer class."""


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], session: session):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token=token)
    usernamedb = payload.data["sub"]
    if usernamedb is None:
        raise credentials_exception

    user = get_user(session, usernamedb)
    if user is None:
        raise credentials_exception
    return user


active_user = Annotated[User, Depends(get_current_user)]
"""returns the logged in user.\n
An alias dependency of the `get_current_user` function."""


def get_verified_user(current_user: active_user):
    if current_user.is_verified:  # if current_user is not verified, redirect them.
        return current_user

    raise UserException(
        current_user, status.HTTP_417_EXPECTATION_FAILED, "This User is not verified."
    )


verified_active_user = Annotated[User, Depends(get_verified_user)]
"""returns a *verified* logged in user.\n
An alias dependency of the `get_verified_user` function."""


def get_admin_user(
    current_user: verified_active_user,
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="You are not an Admin.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if current_user.admin is None:
        raise credentials_exception
    return current_user.admin


admin_user = Annotated[Admin, Depends(get_admin_user)]
"""returns an admin user.\n
An alias dependency of the `get_admin_user` function."""
