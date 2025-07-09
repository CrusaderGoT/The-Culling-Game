from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from app.models.base import BaseVote, BaseVoteInfo

if TYPE_CHECKING:
    from app.models.match import Match
    from app.models.player import CTApp, Player
    from app.models.user import User


# the vote model
class CastVote(BaseVote):
    "model for collecting data to cast a vote"

    pass


class ClientVoteInfo(SQLModel):
    """
    Represents information about a client's vote in a match.

    Attributes:
        message (str): A message associated with the client's vote.
        votes (list[BaseVoteInfo]): A list of vote information objects related to the client.
    """

    message: str
    extra_info: list[str] | None
    votes: list[BaseVoteInfo]


class Vote(BaseVote, table=True):
    """
    Represents a vote as stored in the database.
    Attributes:
        id (int | None): Primary key for the vote.
        user_id (int | None): Foreign key referencing the user who cast the vote. Set to NULL on user deletion.
        match_id (int | None): Foreign key referencing the match in which the vote was cast. Cascades on match deletion.
        user (User): The user casting the vote.
        match (Match): The match in which the vote takes place.
        player (Player): The player being voted for.
        player_id: int = Field(foreign_key="player.id", ondelete="RESTRICT")
        ct_app_id: int = Field(foreign_key="ctapp.id", ondelete="RESTRICT")
        ct_app (CTApp): The cursed application being voted for.
        point (float): The point value that the vote carries.
        has_been_added (bool): Indicates whether the vote's point has been added to the player's total.
    """

    "a vote as stored in a database"

    id: int | None = Field(default=None, primary_key=True)

    user_id: int | None = Field(
        default=None, foreign_key="user.id", ondelete="SET NULL", index=True
    )
    match_id: int = Field(foreign_key="match.id", ondelete="CASCADE", index=True)
    user: "User" = Relationship(back_populates="votes")  # the user casting their votes

    match: "Match" = Relationship(
        back_populates="votes"
    )  # the match the vote takes place

    player: "Player" = Relationship(
        back_populates="votes"
    )  # the player being voted for

    ct_app: "CTApp" = Relationship(
        back_populates="votes"
    )  # the cursed pplication being voted for

    point: float = Field(description="the point a vote carries")

    has_been_added: bool = Field(
        default=False,
        description="whether or not the vote point has been added to a player's point",
    )
