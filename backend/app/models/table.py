# Auto Generate Table Names Enum

from enum import StrEnum


class ModelName(StrEnum):
    """class for the enum of database table names."""

    COLONY = "colony"
    USER = "user"
    BARRIERTECH = "barriertech"
    BARRIERRECORD = "barrierrecord"
    VOTE = "vote"
    PLAYER = "player"
    CURSEDTECHNIQUE = "cursedtechnique"
    CTAPP = "ctapp"
    MATCH = "match"
    ADMINUSER = "adminuser"
    PERMISSION = "permission"
