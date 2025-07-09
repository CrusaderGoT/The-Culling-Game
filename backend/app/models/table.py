# Auto Generate Table Names Enum

from enum import StrEnum


class ModelName(StrEnum):
    """class for the enum of database table names."""

    colony = "colony"
    user = "user"
    barriertech = "barriertech"
    barrierrecord = "barrierrecord"
    vote = "vote"
    player = "player"
    cursedtechnique = "cursedtechnique"
    ctapp = "ctapp"
    match = "match"
    admin = "admin"
    permission = "permission"
