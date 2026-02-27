from datetime import datetime, timedelta, timezone
from typing import Annotated

from app.api.setting import mail_connection_config
from app.auth.credentials import create_access_token, decode_access_token
from app.auth.dependencies import active_user, oauth2_scheme, verified_active_user
from app.models.base import VerifyUserOut
from app.models.user import EditUser, User, UserInfo
from app.utils.config import Tag, UserException
from app.utils.dependencies import session
from app.utils.user import edit_user_helper, get_user, id_name_email
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Body,
    Depends,
    HTTPException,
    Query,
    status,
)
from fastapi.responses import JSONResponse, Response
from fastapi_mail import FastMail, MessageSchema, MessageType

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
    current_user: verified_active_user,
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
    session: session, user: id_name_email, current_user: verified_active_user
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


@router.post(
    "/verify",
    responses={
        200: {"model": VerifyUserOut, "description": "Verification Token Sent"},
        202: {"model": VerifyUserOut, "description": "User Verified Successfully"},
    },
)
async def verify_user(
    background_tasks: BackgroundTasks,
    current_user: active_user,
    session: session,
    token: Annotated[str | None, Query(description="the verification token")] = None,
) -> Response:
    if current_user.is_verified:
        # raise an error
        raise UserException(
            current_user,
            status.HTTP_417_EXPECTATION_FAILED,
            "This user is already verified",
        )

    # if token is available, try and verify the user
    if token:
        decoded_token = decode_access_token(token)
        decode_email = decoded_token.data["email"]
        if decode_email == current_user.email:
            # mark user as verified
            current_user.is_verified = True
            session.add(current_user)
            session.commit()
            session.refresh(current_user)
            return JSONResponse(
                status_code=status.HTTP_202_ACCEPTED,
                content={"message": "User verified successfully."},
            )
        # the decoded token was not meant for this current user
        else:
            raise UserException(
                current_user,
                status.HTTP_400_BAD_REQUEST,
                "Mismatched token to current user.",
            )

    # When no token is sent
    user_email = current_user.email

    # check if email is valid and passes checkers
    """valid_email = await whoisxmlapi_checker(user_email)

    if not valid_email:
        raise UserException(
            current_user,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Email address is not allowed",
        )"""

    # setup token
    exp = timedelta(minutes=10)
    now = datetime.now(timezone.utc)

    verify_token = create_access_token({"email": user_email}, exp)

    template_body = {
        "username": current_user.username,
        "email": user_email,
        "company_name": "The Culling Games",
        "verification_token": verify_token,
        "expiration": (now + exp).ctime(),
        "current_year": now.year,
        "social_reddit": "https://www.reddit.com/r/TheCullingGames/",
        "social_github": "https://github.com/CrusaderGoT/The-Culling-Game",
    }

    message = MessageSchema(
        subject="Verify Your Account",
        recipients=[user_email],
        template_body=template_body,
        subtype=MessageType.html,
    )

    fm = FastMail(mail_connection_config)

    background_tasks.add_task(
        fm.send_message, message, template_name="verify-email.html"
    )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Email sent, check your inbox or spam."},
    )
