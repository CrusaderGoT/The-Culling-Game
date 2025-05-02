from typing import Annotated

from app.auth.dependencies import active_user, oauth2_scheme
from app.models.user import EditUser, User, UserInfo
from app.utils.config import Tag, UserException
from app.utils.dependencies import session
from app.utils.user import edit_user_helper, get_user, id_name_email
from fastapi import APIRouter, Body, Depends, HTTPException, status

# USERS

router = APIRouter(
    prefix="/users", dependencies=[Depends(oauth2_scheme)], tags=[Tag.user]
)


@router.get(
    "/me",
    response_model=UserInfo,
    response_description="A User",
    summary="Get the logged in user",
    status_code=status.HTTP_200_OK,
)
def current_user(current_user: active_user) -> User:
    return current_user


@router.get(
    "/{user}",
    response_model=UserInfo,
    response_description="A User",
    summary="Get a user.",
    status_code=status.HTTP_200_OK,
)
def a_user(session: session, user: id_name_email) -> User:
    userdb = get_user(session, user)
    if userdb:
        return userdb
    else:
        err_msg = f"User '{user}' not found."
        raise HTTPException(status.HTTP_404_NOT_FOUND, err_msg)


@router.patch(
    "/edit/{user}",
    response_model=UserInfo,
    response_description="Edited User",
    summary="Edit a user.",
    status_code=status.HTTP_200_OK,
)
def edit_user(
    session: session,
    user: id_name_email,
    edit_user: Annotated[EditUser, Body()],
    current_user: active_user,
) -> User:
    userdb = get_user(session, user)
    if userdb:
        # check if logged in user matches user to edit
        if userdb.id != current_user.id:
            err_msg = "User can only edit themself"
            raise UserException(current_user, status.HTTP_401_UNAUTHORIZED, err_msg)
        else:
            edited_user = edit_user_helper(edit_user, userdb, session)
            session.add(edited_user)
            session.commit()
            session.refresh(edited_user)
            return edited_user
    else:
        err_msg = f"User '{user}' not found."
        raise HTTPException(status.HTTP_404_NOT_FOUND, err_msg)


@router.delete(
    "/delete/{user}",
    response_model=UserInfo,
    response_description="Deleted User",
    summary="Delete a user.",
    status_code=status.HTTP_200_OK,
    description="Deleting a user will _set null_ on the *player* if any.",
)
def delete_user(
    session: session, user: id_name_email, current_user: active_user
) -> User:
    userdb = get_user(session, user)
    if userdb:
        # check that the user to be deleted is the logged in user
        if userdb.id != current_user.id:
            err_msg = "User can only delete themself"
            raise UserException(current_user, status.HTTP_401_UNAUTHORIZED, err_msg)
        else:  # logged in user matches user to be deleted
            # add user to delete session
            session.delete(userdb)
            session.commit()
            return userdb
    else:
        err_msg = f"User '{user}' not found."
        raise HTTPException(status.HTTP_404_NOT_FOUND, err_msg)
