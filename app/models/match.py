# ./api/models/match.py
"""module for defining the `match` `location` and `vote` models that will be used to perform CRUD operation
on the database and will be used as schemas/response/request data in the API schema. All SQLModels"""

from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship

from ..models.barrier import BarrierRecord
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
    winner: "Player" = Relationship(back_populates="wins")
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


""" 

    location_id: int = Field(foreign_key='location.id')
    location: "Location" = Relationship(back_populates="matches")
    

class BaseLocation(SQLModel):
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    image: FilePath | FileUrl
    enviromental_condition: str

class Location(BaseLocation, table=True):
    id: int | None = Field(default=None, primary_key=True)
    colony_id: int = Field(foreign_key='colony.id')
    colony: "Colony" = Relationship(back_populates="locations")
    # typically a location will have just one match
    # the m_2_1 relation is a fallback for situations a location has to be used again
    matches: list["Match"] = Relationship(back_populates="location")



"""
