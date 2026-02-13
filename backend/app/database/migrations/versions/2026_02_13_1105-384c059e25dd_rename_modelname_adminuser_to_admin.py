"""rename modelname adminuser to admin

Revision ID: 384c059e25dd
Revises: 78aa0b379dc9
Create Date: 2026-02-13 11:05:20.268547

"""

from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "384c059e25dd"
down_revision: Union[str, None] = "78aa0b379dc9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Step 1: Create new enum type with BOTH 'admin' AND 'adminuser'
    op.execute("""
        CREATE TYPE modelname_new AS ENUM (
            'admin',
            'adminuser',
            'colony',
            'user',
            'barriertech',
            'barrierrecord',
            'player',
            'cursedtechnique',
            'ctapp',
            'match',
            'vote',
            'permission'
        )
    """)

    # Step 2: Convert column to use the new enum type
    op.execute("""
        ALTER TABLE permission 
        ALTER COLUMN model TYPE modelname_new 
        USING model::text::modelname_new
    """)

    # Step 3: Drop the old enum type
    op.execute("DROP TYPE modelname")

    # Step 4: Rename new type to original name
    op.execute("ALTER TYPE modelname_new RENAME TO modelname")

    # Step 5: NOW update the data (after 'admin' exists in the enum)
    op.execute("""
        UPDATE permission 
        SET model = 'admin' 
        WHERE model = 'adminuser'
    """)

    # Step 6: Create final enum type without 'adminuser'
    op.execute("""
        CREATE TYPE modelname_new AS ENUM (
            'admin',
            'colony',
            'user',
            'barriertech',
            'barrierrecord',
            'player',
            'cursedtechnique',
            'ctapp',
            'match',
            'vote',
            'permission'
        )
    """)

    # Step 7: Convert column to final enum type
    op.execute("""
        ALTER TABLE permission 
        ALTER COLUMN model TYPE modelname_new 
        USING model::text::modelname_new
    """)

    # Step 8: Drop the temporary type
    op.execute("DROP TYPE modelname")

    # Step 9: Rename to original name
    op.execute("ALTER TYPE modelname_new RENAME TO modelname")


def downgrade():
    # Reverse: Change 'admin' back to 'adminuser'

    # Step 1: Create new enum with both values
    op.execute("""
        CREATE TYPE modelname_new AS ENUM (
            'admin',
            'adminuser',
            'colony',
            'user',
            'barriertech',
            'barrierrecord',
            'player',
            'cursedtechnique',
            'ctapp',
            'match',
            'vote',
            'permission'
        )
    """)

    # Step 2: Convert column
    op.execute("""
        ALTER TABLE permission 
        ALTER COLUMN model TYPE modelname_new 
        USING model::text::modelname_new
    """)

    # Step 3: Drop old type
    op.execute("DROP TYPE modelname")

    # Step 4: Rename
    op.execute("ALTER TYPE modelname_new RENAME TO modelname")

    # Step 5: Update data back
    op.execute