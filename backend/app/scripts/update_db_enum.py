# In alembic/versions/ or a shared utils file
from sqlmodel import text


def update_db_enum(
    enum_name: str,
    old_value: str,
    new_value: str,
    table_column_pairs: list[tuple[str, str]],
):
    """
    Helper to change an enum value.

    Args:
        enum_name: Name of the enum type (e.g., 'modelname')
        old_value: Current value to change (e.g., 'adminuser')
        new_value: New value (e.g., 'admin')
        table_column_pairs: List of (table_name, column_name) tuples
    """
    from alembic import op

    # Step 1: Update data in all tables
    for table, column in table_column_pairs:
        op.execute(
            text(f"""
            UPDATE {table} 
            SET {column} = '{new_value}' 
            WHERE {column} = '{old_value}'
        """)
        )

    # Step 2: Get current enum values
    result = op.get_bind().execute(
        text(f"""
        SELECT e.enumlabel
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname = '{enum_name}'
        ORDER BY e.enumsortorder
    """)
    )
    current_values = [row[0] for row in result]

    # Step 3: Replace old value with new in the list
    updated_values = [new_value if v == old_value else v for v in current_values]
    values_str = "', '".join(updated_values)

    # Step 4: Create new enum type
    op.execute(
        text(f"""
        CREATE TYPE {enum_name}_new AS ENUM ('{values_str}')
    """)
    )

    # Step 5: Convert all columns
    for table, column in table_column_pairs:
        op.execute(
            text(f"""
            ALTER TABLE {table} 
            ALTER COLUMN {column} TYPE {enum_name}_new 
            USING {column}::text::{enum_name}_new
        """)
        )

    # Step 6: Drop old type and rename
    op.execute(text(f"DROP TYPE {enum_name}"))
    op.execute(text(f"ALTER TYPE {enum_name}_new RENAME TO {enum_name}"))


def add_enum_value(enum_name: str, new_value: str):
    """Add a new value to an enum type"""
    from alembic import op

    op.execute(text(f"ALTER TYPE {enum_name} ADD VALUE '{new_value}'"))
