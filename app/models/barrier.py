"""the module for barrier classes"""

from ..models.base import BaseBarrierTech

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.match import Match
    from app.models.player import Player

from sqlmodel import Field, Relationship, SQLModel


class BarrierTech(BaseBarrierTech, table=True):
    """
    This is the class for any buffs to a vote.\n
    This includes, `domain expansion, simple domain, binding vow`, etc.\n
    It is called `BarrierTech` cos it sounds cool.
    """

    id: int | None = Field(default=None, primary_key=True)
    # parent rel
    player_id: int | None = Field(
        default=None, foreign_key="player.id", ondelete="CASCADE"
    )
    player: "Player" = Relationship(back_populates="barrier_technique")
    # child rel
    records: list["BarrierRecord"] = Relationship(back_populates="barrier_tech")


class BarrierRecord(SQLModel, table=True):
    "class for accounting for amount of barrier techniques used by a player during a match"

    id: int | None = Field(default=None, primary_key=True)

    domain_counter: int = Field(
        default=0, description="the number of times a domain is activated"
    )
    simple_domain_counter: int = Field(
        default=0, description="the number of times a simple domain is activated"
    )
    binding_vow_counter: int = Field(
        default=0, description="the number of times a binding vow is activated"
    )

    # parent rel
    barrier_tech_id: int | None = Field(
        default=None, foreign_key="barriertech.id", ondelete="CASCADE"
    )
    barrier_tech: "BarrierTech" = Relationship(back_populates="records")

    match_id: int | None = Field(
        default=None, foreign_key="match.id", ondelete="CASCADE"
    )
    match: "Match" = Relationship(back_populates="barrier_records")


class BarrierTechInfo(BaseBarrierTech):
    """
    Represents barrier technique information for client-side.

    Attributes:
        id (int): Unique identifier for the barrier technique.
        domain_expansion: bool = Field(default=False, description="the player's domain expansion")
        binding_vow: bool = Field(default=False, description="the player's binding vow")
        simple_domain: bool = Field(default=False, description="the player's simple domain")
        The times are useful for know when to activate/deactivate the techniques
        de_end_time: datetime | None = Field(default=None, description="the time a player cast their domain")
        bv_end_time: datetime | None = Field(default=None, description="the time a player cast their binding_vow")
        sd_end_time: datetime | None = Field(default=None, description="the time a player cast their simple_domain")
    """

    "barrier technique info for client side"
    id: int
