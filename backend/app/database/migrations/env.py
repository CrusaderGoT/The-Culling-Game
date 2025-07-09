import json
import os

# for preventing empty revision
# for typing purposes
from collections.abc import Iterable
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from alembic.environment import MigrationContext

# this typing-only import requires alembic  1.12.1 or above
from alembic.operations import MigrationScript
from app.api.setting import settings

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# import all models that have table=True
from app.models.admin import *
from app.models.barrier import *
from app.models.colony import *
from app.models.match import *
from app.models.player import *
from app.models.user import *
from app.models.vote import *
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel

# Get the base directory of the current script or project
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from the .env file
load_dotenv()

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Retrieve DATABASE_URL from environment variables
database_url = settings.database_url

if not database_url:
    raise ValueError("DATABASE_URL environment variable is not set.")

# Replace the sqlalchemy.url in the alembic.ini file dynamically
config.set_main_option("sqlalchemy.url", database_url)


# target_metadata = mymodel.Base.metadata
target_metadata = SQLModel.metadata
# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

# my table json file path
fp = os.path.join(BASE_DIR, "table_names.json")


def process_revision_directives(
    context: MigrationContext,
    revision: str | Iterable[str | None] | Iterable[str],
    directives: list[MigrationScript],
):
    "thi function prevents alembic generating empty migrations"
    assert config.cmd_opts is not None
    if getattr(config.cmd_opts, "autogenerate", False):
        script = directives[0]
        assert script.upgrade_ops is not None
        if script.upgrade_ops.is_empty():
            directives[:] = []


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    # write table names to json file, useful for getting the names of database tables
    with open(fp, "w") as fl:
        names_dict = dict(
            [(d, d) for d in target_metadata.tables.keys() if "link" not in d]
        )
        json.dump(names_dict, fl)

    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        process_revision_directives=process_revision_directives,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # write table names to json file, useful for getting the names of database tables
    with open(fp, "w") as fl:
        names_dict = dict(
            [(d, d) for d in target_metadata.tables.keys() if "link" not in d]
        )
        json.dump(names_dict, fl)

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            process_revision_directives=process_revision_directives,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
