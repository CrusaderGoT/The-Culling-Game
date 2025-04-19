"""module for configurations of
1. path operation decorators args; e.g tags.
2. custom exceptions.
3. Common logic"""

from enum import Enum

from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.api.settings import app
from app.models.admin import AdminInfo, AdminUser
from app.models.user import User, UserInfo

# configurations goes here

# 1. EXCEPTIONS


class UserException(Exception):
    """user custom exception; will convert the User to UserInfo"""

    def __init__(
        self,
        user: User,
        code: int = status.HTTP_400_BAD_REQUEST,
        detail: str | dict = {"detail": "An Error Occured with this User"},
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
    """custom player exception"""

    def __init__(
        self,
        admin: AdminUser,
        code: int = status.HTTP_400_BAD_REQUEST,
        detail: str | dict = {"detail": "An Error Occured with this Admin"},
        headers: dict[str, str] | None = None,
    ) -> None:
        self.user = AdminInfo.model_validate(admin)
        self.detail = detail
        self.code = code
        self.headers = headers


@app.exception_handler(AdminException)
async def admin_exception_handler(request: Request, exc: UserException):
    return JSONResponse(status_code=exc.code, content=exc.detail)


# 2. TAGS for openapi, used to group path operators
class Tag(str, Enum):
    "tags for path operation decorators"

    user = "users"
    player = "players"
    auth = "auth"
    match = "matches"
    admin = "admin"
    colony = "colonies"
    barrier = "barriers"
