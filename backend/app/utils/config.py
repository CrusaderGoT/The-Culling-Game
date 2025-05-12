"""module for configurations of
1. path operation decorators args; e.g tags.
2. custom exceptions.
3. Common logic"""

from enum import Enum
from typing import Any
from uuid import UUID

from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic_settings import BaseSettings

from app.api.settings import app
from app.models.admin import AdminInfo, AdminUser
from app.models.player import Player, PlayerInfo
from app.models.user import User, UserInfo

# configurations goes here

# 1. EXCEPTIONS


class UserException(Exception):
    """user custom exception; will convert the User to UserInfo"""

    def __init__(
        self,
        user: User,
        code: int = status.HTTP_400_BAD_REQUEST,
        detail: Any = "An Error Occured with this User",
        headers: dict[str, str] | None = None,
    ) -> None:
        self.user = UserInfo.model_validate(user)
        self.detail = detail
        self.code = code
        self.headers = headers


@app.exception_handler(UserException)
async def user_exception_handler(request: Request, exc: UserException):
    return JSONResponse(status_code=exc.code, content=exc.detail)


class AdminException(Exception):
    """custom admin exception"""

    def __init__(
        self,
        admin: AdminUser,
        code: int = status.HTTP_400_BAD_REQUEST,
        detail: Any = "An Error Occured with this Admin",
        headers: dict[str, str] | None = None,
    ) -> None:
        self.admin = AdminInfo.model_validate(admin)
        self.detail = detail
        self.code = code
        self.headers = headers


@app.exception_handler(AdminException)
async def admin_exception_handler(request: Request, exc: AdminException):
    return JSONResponse(status_code=exc.code, content=exc.detail)


class PlayerException(Exception):
    """custom player exception"""

    def __init__(
        self,
        player: Player,
        code: int = status.HTTP_400_BAD_REQUEST,
        detail: Any = "An Error Occured with this Player",
        headers: dict[str, str] | None = None,
    ) -> None:
        self.player = PlayerInfo.model_validate(player)
        self.detail = detail
        self.code = code
        self.headers = headers


@app.exception_handler(PlayerException)
async def player_exception_handler(request: Request, exc: PlayerException):
    return JSONResponse(status_code=exc.code, content=exc.detail)


# 2. TAGS for openapi, used to group path operators
class Tag(str, Enum):
    "tags for path operation decorators"

    user = "users"
    player = "players"
    auth = "auth"
    match = "matches"
    admin = "admins"
    colony = "colonies"
    barrier = "barriers"


class Settings(BaseSettings):
    "class for env or default settings."

    database_url: str = "postgresql://postgres:crusader@localhost/CullingGamesDB"
    secret_key: str = "7f820bef39dd81f92e9935b30f029a74af7b7d1c5d8c85c855d6b22d093d485c"
    algorithm: str = "HS256"
    code: UUID = UUID("a24cd617-5d2e-4317-970d-162f315d0397")
    debug: bool = False
    access_token_expire: int = 900_000
    "in milliseconds"
    refresh_token_expire: int = 604_800_000
    "in milliseconds"


settings = Settings()
