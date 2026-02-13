#!/usr/bin/env python3
import os
import sys

from sqlalchemy import create_engine, text


def drop_all_tables():
    """Drop all tables in the database"""
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    print("🔌 Connecting to database...")
    engine = create_engine(database_url, echo=False)

    try:
        # Also drop alembic_version if it exists
        with engine.begin() as conn:
            print("⚠️  Dropping all tables...")
            conn.execute(
                text(
                    """
                        DO $$ DECLARE
                            r RECORD;
                        BEGIN
                            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                            END LOOP;
                        END $$;
                    """
                )
            )
            # Drop all enum types
            print("⚠️  Dropping all enum types...")
            conn.execute(
                text(
                    """
                    DO $$ DECLARE
                        r RECORD;
                    BEGIN
                        FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
                        LOOP
                            EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
                        END LOOP;
                    END $$;
                    """
                )
            )

        print("✅ All tables dropped successfully")
        print("✅ Enum types dropped")

    except Exception as e:
        print(f"❌ Error dropping tables: {e}")
        sys.exit(1)
    finally:
        engine.dispose()


if __name__ == "__main__":
    drop_all_tables()
