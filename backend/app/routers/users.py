from datetime import UTC, datetime, timedelta
from typing import Annotated

from app.api.setting import BASE_URL, mail_connection_config
from app.auth.dependencies import active_user, oauth2_scheme
from app.models.base import EmailSchema
from app.models.user import EditUser, User, UserInfo
from app.utils.config import Tag, UserException
from app.utils.dependencies import session, whoisxmlapi_checker
from app.utils.user import edit_user_helper, get_user, id_name_email
from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, status
from fastapi_mail import FastMail, MessageSchema, MessageType

from app.auth.credentials import create_access_token

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


@router.post("/verify")
async def verify_user(
    email: EmailSchema, background_tasks: BackgroundTasks, current_user: active_user
):

    single_email = email.email[0]

    # check if email is valid and passes checkers
    valid_email = whoisxmlapi_checker(single_email)

    if not valid_email:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Email address")

    exp = timedelta(minutes=10)
    now = datetime.now(UTC)

    token = create_access_token({"email": single_email}, exp)

    template_body = email.template.update(
        {
            "token": token,
            "email": single_email,
            "company_name": "The Culling Games",
            "verification_link": BASE_URL,
            "expiration_hours": now - exp,
            "current_year": now.year,
        }
    )  # update with token verification

    message = MessageSchema(
        subject="Fastapi-Mail module",
        recipients=email.email,
        template_body=template_body,
        subtype=MessageType.html,
    )

    fm = FastMail(mail_connection_config)

    background_tasks.add_task(
        fm.send_message, message, template_name="verify_email.html"
    )
