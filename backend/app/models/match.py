# ./api/models/match.py
"""module for defining the `match` `location` and `vote` models that will be used to perform CRUD operation
on the database and will be used as schemas/response/request data in the API schema. All SQLModels"""

from typing import TYPE_CHECKING, Union

from sqlmodel import Field, Relationship

from ..models.barrier import BarrierRecord, BarrierRecordInfo
from ..models.base import (
    BaseColonyInfo,
    BaseMatch,
    BaseMatchInfo,
    BasePlayerInfo,
    BaseVoteInfo,
    MatchPlayerLink,
)

if TYPE_CHECKING:
    from ..models.colony import Colony
    from ..models.player import Player
    from ..models.vote import Vote


# MATCH
class Match(BaseMatch, table=True):
    "a match as stored in the database"

    id: int | None = Field(default=None, primary_key=True)
    # parent rel
    colony_id: int | None = Field(
        foreign_key="colony.id", index=True, ondelete="RESTRICT"
    )
    colony: "Colony" = Relationship(back_populates="matches")
    winner_id: int | None = Field(
        default=None,
        ondelete="RESTRICT",
        foreign_key="player.id",
        index=True,
        description="The winner of the match (player Id)",
    )
    winner: Union["Player", None] = Relationship(back_populates="wins")
    draw: bool = Field(
        description="whether the match was a draw", index=True, default=False
    )
    # child rels
    # typically will have only two unique players in a match
    players: list["Player"] = Relationship(
        back_populates="matches", link_model=MatchPlayerLink
    )
    votes: list["Vote"] = Relationship(back_populates="match")
    # typically only one per player, if barrier tech is used
    barrier_records: list["BarrierRecord"] = Relationship(back_populates="match")


class MatchInfo(BaseMatchInfo):
    "match info for client side"

    players: list["BasePlayerInfo"]
    colony: "BaseColonyInfo"
    votes: list["BaseVoteInfo"]
    barrier_records: list["BarrierRecordInfo"]
