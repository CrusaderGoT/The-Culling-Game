"""Test database connection with SQLModel"""

import os
import sys

from dotenv import load_dotenv
from sqlmodel import Session, create_engine, text

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or "postgresql://postgres:crusader@localhost:5432/thecullinggamesdb"
)


def test_connection():
    """Test database connection and basic queries"""
    try:
        engine = create_engine(DATABASE_URL, echo=False)

        print("Testing database connection...")

        with Session(engine) as session:
            # Test basic connection
            result = session.execute(text("SELECT current_database();"))
            row = result.fetchone()
            if row is None or row[0] is None:
                print("⚠️ Warning: current_database() returned no result")
                db_name = "<unknown>"
            else:
                db_name = row[0]
            print(f"✅ Connected to database: {db_name}")

            # List all tables
            result = session.execute(
                text("""
                SELECT tablename 
                FROM pg_catalog.pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename;
            """)
            )
            tables = result.fetchall()
            print(f"\n📋 Tables found: {len(tables)}")
            for table in tables:
                print(f"  - {table[0]}")

            # Check for pending migrations
            result = session.execute(
                text("""
                SELECT version_num 
                FROM alembic_version 
                LIMIT 1;
            """)
            )
            version = result.fetchone()
            if version:
                print(f"\n🔄 Current migration: {version[0]}")

        print("\n✅ All tests passed!")
        return True

    except Exception as e:
        print("\n❌ Connection failed!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {e}")
        return False


if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
