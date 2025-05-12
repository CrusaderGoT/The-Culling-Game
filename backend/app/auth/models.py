from datetime import datetime
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


class TokenData(SQLModel):
    "response model for decoded token"

    sub: str
    refresh_token_key: UUID | None = None  # optional for tokens
    exp: datetime
    iat: datetime
    scopes: list[str] = []
