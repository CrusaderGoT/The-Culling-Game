# alembic/versions/xxxx_convert_admin_to_uuid.py
"""convert admin user to uuid

Revision ID: 26a15bd3cfe4
Revises: c707681be11c
Create Date: 2025-07-04 06:15:46.400107

"""

from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "26a15bd3cfe4"
down_revision: Union[str, None] = "c707681be11c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Drop existing tables and recreate with UUID
    op.drop_table("adminpermissionlink")
    op.drop_table("adminuser")

    # Recreate adminuser table with UUID
    op.create_table(
        "adminuser",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("is_superuser", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_adminuser_user_id", "adminuser", ["user_id"])

    # Recreate link table with UUID foreign key
    op.create_table(
        "adminpermissionlink",
        sa.Column("admin_id", sa.UUID(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["admin_id"], ["adminuser.id"]),
        sa.ForeignKeyConstraint(["permission_id"], ["permission.id"]),
        sa.PrimaryKeyConstraint("admin_id", "permission_id"),
    )


def downgrade():
    # Recreate with integer IDs
    op.drop_table("adminpermissionlink")
    op.drop_table("adminuser")

    # Recreate original tables
    op.create_table(
        "adminuser",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("is_superuser", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_adminuser_user_id", "adminuser", ["user_id"])

    op.create_table(
        "adminpermissionlink",
        sa.Column("admin_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["admin_id"], ["adminuser.id"]),
        sa.ForeignKeyConstraint(["permission_id"], ["permission.id"]),
        sa.PrimaryKeyConstraint("admin_id", "permission_id"),
    )
