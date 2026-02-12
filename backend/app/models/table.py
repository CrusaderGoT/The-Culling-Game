# Auto Generate Table Names Enum

from enum import StrEnum


class ModelName(StrEnum):
	"""class for the enum of database table names."""

	admin = "admin"
	permission = "permission"
	barriertech = "barriertech"
	barrierrecord = "barrierrecord"
	colony = "colony"
	match = "match"
	vote = "vote"
	player = "player"
	cursedtechnique = "cursedtechnique"
	ctapp = "ctapp"
	user = "user"
