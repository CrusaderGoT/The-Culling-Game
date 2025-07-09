"""rename adminuser to admin

Revision ID: 415642db175e
Revises: 0a5a3e3d2d56
Create Date: 2025-07-09 04:22:47.864828

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '415642db175e'
down_revision: Union[str, None] = '0a5a3e3d2d56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### DATA-SAFE APPROACH - PRESERVES ALL DATA ###
    
    # 1. Drop the foreign key constraint that references adminuser
    op.drop_constraint('adminpermissionlink_admin_id_fkey', 'adminpermissionlink', type_='foreignkey')
    
    # 2. Rename the table (this preserves all data)
    op.rename_table('adminuser', 'admin')
    
    # 3. Update the index (drop old, create new with correct name)
    op.drop_index('ix_adminuser_user_id', table_name='admin')
    op.create_index(op.f('ix_admin_user_id'), 'admin', ['user_id'], unique=False)
    
    # 4. Create the new foreign key constraint pointing to admin
    op.create_foreign_key(None, 'adminpermissionlink', 'admin', ['admin_id'], ['id'])


def downgrade() -> None:
    # ### Reverse the process ###
    
    # 1. Drop the foreign key constraint
    op.drop_constraint(None, 'adminpermissionlink', type_='foreignkey')
    
    # 2. Update the index back
    op.drop_index(op.f('ix_admin_user_id'), table_name='admin')
    op.create_index('ix_adminuser_user_id', 'admin', ['user_id'], unique=False)
    
    # 3. Rename the table back
    op.rename_table('admin', 'adminuser')
    
    # 4. Recreate the original foreign key constraint
    op.create_foreign_key('adminpermissionlink_admin_id_fkey', 'adminpermissionlink', 'adminuser', ['admin_id'], ['id'])