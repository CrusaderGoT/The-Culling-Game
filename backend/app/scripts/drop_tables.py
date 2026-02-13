#!/usr/bin/env python3
import os
import sys
from sqlalchemy import create_engine, text
from sqlmodel import SQLModel


def drop_all_tables():
    """Drop all tables in the database"""
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    print("🔌 Connecting to database...")
    engine = create_engine(database_url, echo=False)

    try:
        print("⚠️  Dropping all tables...")
        SQLModel.metadata.drop_all(engine)
        print("✅ All tables dropped successfully")

        # Also drop alembic_version if it exists
        with engine.begin() as conn:
            conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))
            # Drop all enum types
            conn.execute(text("DROP TYPE IF EXISTS ... CASCADE"))

        print("✅ Alembic version table dropped")
        print("✅ Enum types dropped")

    except Exception as e:
        print(f"❌ Error dropping tables: {e}")
        sys.exit(1)
    finally:
        engine.dispose()


if __name__ == "__main__":
    drop_all_tables()
