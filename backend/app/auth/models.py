from datetime import datetime
from typing import Any
from uuid import UUID

from sqlmodel import SQLModel


class Token(SQLModel):
    """
    model for encoded access token, resfresh token,
    and acces token expires time
    """

    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    refresh_expires_in: int


class TokenData(SQLModel):
    "response model for decoded token"

    data: dict[str, Any]
    refresh_token_key: UUID | None = None  # optional for login tokens
    exp: datetime
    iat: datetime
    scopes: list[str] = []
