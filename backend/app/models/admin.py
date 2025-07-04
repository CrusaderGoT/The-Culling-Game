# ./api/models/admins.py
"""module for defining the `admin` models that will be used to perform ***special** CRUD operations on the database. All SQLModels"""

from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from app.models.base import (
    AdminPermissionLink,
    BaseAdminInfo,
    BaseCTAppInfo,
    BasePermission,
    BasePermissionInfo,
    BasePlayerInfo,
    BaseUserInfo,
    BaseVoteInfo,
)

if TYPE_CHECKING:
    from .user import User

import uuid

# write your admin models here


class AdminUser(SQLModel, table=True):
    "an admin user as stored in the database"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    permissions: list["Permission"] = Relationship(
        back_populates="admins", link_model=AdminPermissionLink
    )
    user_id: int | None = Field(
        default=None, foreign_key="user.id", ondelete="CASCADE", index=True
    )
    user: "User" = Relationship(back_populates="admin")
    is_superuser: bool = Field(default=False)


class Permission(BasePermission, table=True):
    "a permision as stored in the database"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(description="Permission name", index=True)
    level: BasePermission.PermissionLevel = Field(
        description="Permission name", index=True
    )
    admins: list[AdminUser] = Relationship(
        back_populates="permissions", link_model=AdminPermissionLink
    )


# Model for client side
class PermissionRequest(BasePermission):
    "Model for collecting A Permission request"

    levels: set[BasePermission.PermissionLevel]


class AdminInfo(BaseAdminInfo):
    "the admin info for client side"

    user: "BaseUserInfo"


class PermissionInfo(BasePermissionInfo):
    id: int


class AdminVoteInfo(BaseVoteInfo):
    """Represents detailed voting information as viewed by an admin.
    Attributes:
        user (BaseUserInfo): The user who cast the vote.
        player (BasePlayerInfo): The player who was voted for.
        ct_app (BaseCTAppInfo): The player's cursed technique application that was voted on.

    a single vote as to be seen by an admin-verbose
    """

    user: "BaseUserInfo" = Field(description="the user that casted their votes")
    player: "BasePlayerInfo" = Field(description="the player voted")
    ct_app: "BaseCTAppInfo" = Field(
        description="the player's cursed technique application voted"
    )
