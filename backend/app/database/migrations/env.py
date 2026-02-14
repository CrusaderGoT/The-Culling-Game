import json
import os

# for preventing empty revision
# for typing purposes
from collections.abc import Iterable
from logging.config import fileConfig
from pathlib import Path

# for making registry processors
from typing import Callable

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
from sqlalchemy.dialects.postgresql import ENUM
from sqlmodel import SQLModel, text

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

# Type alias for directive processors
DirectiveProcessor = Callable[
    [
        MigrationContext,
        str | Iterable[str | None] | Iterable[str],
        list[MigrationScript],
    ],
    None,
]

# Registry of all processors
DIRECTIVE_PROCESSORS: list[DirectiveProcessor] = []


def register_processor(func: DirectiveProcessor) -> DirectiveProcessor:
    """Decorator to register a directive processor"""
    DIRECTIVE_PROCESSORS.append(func)
    return func


@register_processor
def generate_table_json(
    context: MigrationContext,
    revision: str | Iterable[str | None] | Iterable[str],
    directives: list[MigrationScript],
):
    # write table names to json file, useful for getting the names of database tables
    with open(fp, "w") as fl:
        names_dict = dict(
            [(d, d) for d in target_metadata.tables.keys() if "link" not in d]
        )
        json.dump(names_dict, fl)


@register_processor
def detect_enum_changes(
    context: MigrationContext,
    revision: str | Iterable[str | None] | Iterable[str],
    directives: list[MigrationScript],
) -> None:
    """
    Detects changes to PostgreSQL ENUM types and warns the user.
    Does not prevent migration generation, but alerts developer to create manual migration.
    """
    assert config.cmd_opts is not None
    if not getattr(config.cmd_opts, "autogenerate", False):
        return

    connection = context.connection

    # Get all enums from SQLAlchemy models
    model_enums = {}
    for table in target_metadata.sorted_tables:
        for column in table.columns:
            if isinstance(column.type, ENUM):
                enum_name = column.type.name
                if enum_name:
                    model_enums[enum_name] = {
                        "values": set(column.type.enums),
                        "tables": model_enums.get(enum_name, {}).get("tables", [])
                        + [(table.name, column.name)],
                    }

    # Get all enums from database
    db_enums = {}
    if connection:
        try:
            result = connection.execute(
                text("""
                SELECT t.typname as enum_name, e.enumlabel as enum_value
                FROM pg_type t 
                JOIN pg_enum e ON t.oid = e.enumtypid  
                WHERE t.typtype = 'e'
                ORDER BY t.typname, e.enumsortorder
            """)
            )

            for row in result:
                enum_name = row[0]
                enum_value = row[1]
                if enum_name not in db_enums:
                    db_enums[enum_name] = set()
                db_enums[enum_name].add(enum_value)
        except Exception as e:
            # DB migth not be PostgreSQL
            print("An Error Ocuured Durring detect_enum_changes -> ", e)
            return
    else:
        # Database does not exist yet
        print("No databse connection during detect_enum_changes")
        return

    # Compare and warn about differences
    has_changes = False
    for enum_name in model_enums:
        model_values = model_enums[enum_name]["values"]
        db_values = db_enums.get(enum_name, set())

        added = model_values - db_values
        removed = db_values - model_values

        if added or removed:
            if not has_changes:
                print("\n" + "=" * 80)
                print("⚠️  ENUM TYPE CHANGES DETECTED")
                print("=" * 80)
                has_changes = True

            print(f"\n📝 Enum: {enum_name}")
            print(
                f"   Used in: {', '.join([f'{t}.{c}' for t, c in model_enums[enum_name]['tables']])}"
            )

            if added:
                print(f"   ✅ Added values: {', '.join(sorted(added))}")
            if removed:
                print(f"   ❌ Removed values: {', '.join(sorted(removed))}")

            if removed:
                print("\n   ⚠️  MANUAL MIGRATION REQUIRED!")
                print(f'   Run: alembic revision -m "update {enum_name} enum"')
                print("   Then use the helper function to migrate data.")

    if has_changes:
        print("\n" + "=" * 80)
        print("See documentation on enum migrations for helper functions.")
        print("=" * 80 + "\n")


# keep this below other register precessors, in order to run last
@register_processor
def prevent_empty_migrations(
    context: MigrationContext,
    revision: str | Iterable[str | None] | Iterable[str],
    directives: list[MigrationScript],
) -> None:
    """Prevents alembic from generating empty migrations"""
    assert config.cmd_opts is not None
    if getattr(config.cmd_opts, "autogenerate", False):
        script = directives[0]
        assert script.upgrade_ops is not None
        if script.upgrade_ops.is_empty():
            directives[:] = []


def process_revision_directives(
    context: MigrationContext,
    revision: str | Iterable[str | None] | Iterable[str],
    directives: list[MigrationScript],
):
    """
    Main entry point - runs all registered processors.
    Processors are executed in registration order.
    """
    for processor in DIRECTIVE_PROCESSORS:
        processor(context, revision, directives)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """

    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        process_revision_directives=process_revision_directives,
        compare_type=True,  # Important for detecting type changes
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """

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
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
