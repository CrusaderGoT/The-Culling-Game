from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.auth.credentials import decode_access_token
from app.models.user import User
from app.utils.dependencies import session
from app.utils.user import get_user

from ..models.admin import AdminUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
"""A dependency of the OAuth2PasswordBearer class."""


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], session: session):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token=token)
    usernamedb = payload.sub
    if usernamedb is None:
        raise credentials_exception

    user = get_user(session, usernamedb)
    if user is None:
        raise credentials_exception
    return user


active_user = Annotated[User, Depends(get_current_user)]
"""returns the logged in user.\n
An alias dependency of the `get_current_user` function."""


def get_admin_user(token: Annotated[str, Depends(oauth2_scheme)], session: session):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials, you are not an admin.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token=token)
    usernamedb = payload.sub
    if usernamedb is None:
        raise credentials_exception

    user = get_user(session, usernamedb)
    if user is None:
        raise credentials_exception
    if user.admin is None:
        raise credentials_exception
    return user.admin


admin_user = Annotated[AdminUser, Depends(get_admin_user)]
"""returns an admin user.\n
An alias dependency of the `get_admin_user` function."""
