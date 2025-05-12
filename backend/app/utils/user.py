from typing import Annotated
from uuid import UUID

from email_validator import EmailNotValidError, validate_email
from fastapi import Path, status
from sqlmodel import select

from app.models.user import EditUser, User
from app.utils.config import UserException
from app.utils.dependencies import session


def usernamedb(username: str):
    "returns the username as stored in the DB -> lowercase"
    return username.lower().strip()


def get_user(session: session, user_name_id_email: str | int):
    """gets a user (using id, username, or email) from the database or returns none if user not found.
    \nuser_name_id_email: `username`, `userid`, or `email`"""
    # try to convert the str to int for id
    try:
        user_id = int(user_name_id_email)
    except ValueError:
        pass
    else:
        user_name_id_email = user_id

    if isinstance(user_name_id_email, str):
        # check if it is an email str
        if is_valid_email(user_name_id_email):
            statement = select(User).where(User.email == user_name_id_email)
            user = session.exec(statement=statement).first()
            return user
        else:  # a username then
            username = usernamedb(user_name_id_email)
            statement = select(User).where(User.usernamedb == username)
            user = session.exec(statement=statement).first()
            return user
    elif isinstance(user_name_id_email, int):
        user = session.get(User, user_name_id_email)
        return user
    else:
        return None


def is_valid_email(email: str) -> bool:
    "checks if a string is a valid email string"
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False


id_name_email = Annotated[
    int | str, Path(description="The user's Id, Username, or Email")
]
"""The user's Id, Username, or Email as a Path parameter.
\nActually accepts any int or str. The name is for convention."""


def edit_user_helper(edit_user: EditUser, userdb: User, session: session) -> User:
    """
    Helper for editing a user.\n
    Takes the user data to edit, and the user to edit.
    And makes neccessary checks(e.g already in-use username).\n
    returns a User with updated info, **NOT YET COMMITTED TO A SESSION**.
    ## Add to a session and commit to save changes.
    ### It raises an appropriate UserExecption in any checks fail
    """
    # get userdata, excluding unset
    user_data_to_edit = edit_user.model_dump(exclude_unset=True)
    # check if username was changed and update usernamedb too
    update_usernamedb = dict()
    if (username := user_data_to_edit.get("username")) is not None:
        update_usernamedb["usernamedb"] = usernamedb(username)
        # check if username already exists and is not their own
        already_used = get_user(session, update_usernamedb["usernamedb"])
        if already_used is not None and already_used.usernamedb != userdb.usernamedb:
            err_msg = f"'{username}' already in use."
            raise UserException(userdb, status.HTTP_406_NOT_ACCEPTABLE, err_msg)
    # check if email was changed, and if it already exist and is not their own
    if (email := user_data_to_edit.get("email")) is not None:
        already_used = get_user(session, email)
        if already_used is not None and already_used.email != userdb.email:
            err_msg = f"'{email}' already in use."
            raise UserException(userdb, status.HTTP_406_NOT_ACCEPTABLE, err_msg)
    # if all conditions have been meet, update the user
    edited_user = userdb.sqlmodel_update(user_data_to_edit, update=update_usernamedb)

    return edited_user


async def update_user_refresh_key(user: User, key, session: session):
    "update user refresh key"
    key = UUID(key)
    user.refresh_token_key = key
    session.add(user)
    session.commit()
