from typing import Annotated
from uuid import uuid4, uuid5

from fastapi import Body, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.openapi.docs import (
    get_swagger_ui_html,
    get_swagger_ui_oauth2_redirect_html,
)
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import or_, select

from app.api.setting import app, settings, sio
from app.auth.credentials import (
    PasswordAuth,
    authenticate_user,
    create_access_token,
    create_refresh_token,
    decode_access_token,
)
from app.auth.models import Token, TokenData
from app.models.user import CreateUser, User, UserInfo
from app.routers import barriers, colonies, matches, players, users
from app.routers.admin import admins
from app.utils.config import Tag
from app.utils.dependencies import session
from app.utils.user import get_user, update_user_refresh_key, usernamedb

# ROUTERS
app.include_router(users.router)
app.include_router(players.router)
app.include_router(matches.router)
app.include_router(barriers.router)
app.include_router(colonies.router)
app.include_router(admins.superuser_router)
app.include_router(admins.router)


# LOGIN
@app.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    tags=[Tag.auth],
    summary="creates a login token",
    response_description="A Token",
)
async def create_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: session
):
    user = authenticate_user(
        usernamedb(form_data.username), form_data.password, session
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.usernamedb})

    key = jsonable_encoder(uuid5(uuid4(), user.usernamedb))  # refresh token key
    refresh_token = create_refresh_token(
        user=user, refresh_expires_in=settings.refresh_token_expire, key=key
    )

    # update user refresh key
    await update_user_refresh_key(user, key, session)

    token = Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="Bearer",
        expires_in=settings.access_token_expire,
        refresh_expires_in=settings.refresh_token_expire,
    )
    return token


# REFRESH TOKEN
@app.post(
    "/refresh-token",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    tags=[Tag.auth],
    summary="refreshes/updates a token",
    response_description="An Updated Token",
)
async def refresh_token(
    session: session,
    refresh_token: Annotated[str, Body(embed=True)],
):
    # 1. Verify incoming refresh token
    payload = decode_access_token(token=refresh_token)
    user = get_user(session, payload.sub)
    key = payload.refresh_token_key
    if not key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No Refresh Token Key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. confirm key is valid
    if user.refresh_token_key != key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Refresh Token Key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Issue new tokens
    access_token = create_access_token(data={"sub": user.usernamedb})

    new_key = jsonable_encoder(uuid5(uuid4(), user.usernamedb))  # refresh token key
    new_refresh_token = create_refresh_token(
        user=user, refresh_expires_in=settings.refresh_token_expire, key=new_key
    )

    # 4. update user refresh key
    await update_user_refresh_key(user, new_key, session)

    token = Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="Bearer",
        expires_in=settings.access_token_expire,
        refresh_expires_in=settings.refresh_token_expire,
    )
    return token


# VERIFY TOKEN
@app.post(
    "/verify-token",
    response_model=TokenData,
    status_code=status.HTTP_200_OK,
    tags=[Tag.auth],
    summary="verifies a token",
    response_description="A Verified Token",
)
def verify_token(token: Annotated[str, Body(embed=True)]):
    """
    Verifies the JWT in `token` and returns its decoded payload:
    - `sub`: the subject (usually user ID)
    - `exp`: expiration timestamp
    - `iat`: issued-at timestamp
    - `scopes`: optional list of permission scopes
    """

    payload = decode_access_token(token=token)
    data = TokenData.model_validate(payload)
    return data


# REGISTER
@app.post(
    "/signup",
    response_model=UserInfo,
    status_code=status.HTTP_201_CREATED,
    tags=[Tag.user],
    summary="Create a new User",
    response_description="New User",
)
def create_user(
    session: session,
    user: Annotated[CreateUser, Body(description="The details for creating a User")],
):
    # convert user username to lowercase; for easier variable use
    l_username = usernamedb(user.username)
    # check if username or email already in use
    already_username_email = session.exec(
        select(User).where(or_(User.usernamedb == l_username, User.email == user.email))
    ).first()
    if already_username_email:  # a user with email or username exist
        # check which in username or email being used and inform client
        if already_username_email.usernamedb == l_username:
            err_msg = f"'{user.username}' is already in use."
            raise HTTPException(status.HTTP_409_CONFLICT, detail=err_msg)
        elif already_username_email.email == user.email:
            err_msg = f"'{user.email}' is already in use."
            raise HTTPException(status.HTTP_409_CONFLICT, detail=err_msg)
        else:
            err_msg = "user with username or email already exist."
            raise HTTPException(status.HTTP_409_CONFLICT, detail=err_msg)
    else:  # user not already in DATABASE
        # check if user password matches
        if user.password == user.confirm_password:
            pw_auth = PasswordAuth()
            hashed_pw = pw_auth.hash_password(user.password)
            update = {
                "password": hashed_pw,  # store hashed password
                "usernamedb": l_username,  # store the usernamedb in lowercase
            }
            new_user_db = User.model_validate(user, update=update)
            session.add(new_user_db)
            session.commit()
            session.refresh(new_user_db)
            return new_user_db
        else:
            err_msg = "passwords do not match"
            raise HTTPException(status.HTTP_412_PRECONDITION_FAILED, detail=err_msg)


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,  # type: ignore
        title=f"{app.title} - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css",
        swagger_favicon_url="/static/images/Kogane.png",
    )


@app.get(app.swagger_ui_oauth2_redirect_url, include_in_schema=False)  # type: ignore
async def swagger_ui_redirect():
    return get_swagger_ui_oauth2_redirect_html()


@app.get("/", response_class=HTMLResponse)
async def chat_html():
    with open("./app/api/index.html", "r") as fl:
        return fl.read()


# Event: when a client connects
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    await sio.emit("message", {"msg": f"Welcome {sid}!"}, to=sid)


# Event: when a client disconnects
@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    await sio.emit("message", {"msg": f"{sid} left!"})


# Event: on receiving a chat message
@sio.event
async def message(sid, data):
    msg = data.get("msg")
    print(f"Message from {sid}: {msg}")
    # Broadcast to all clients
    await sio.emit("message", {"msg": msg})
