"""Add multi-user support fields to User model

Revision ID: 001_add_user_multi_user_fields
Revises: 
Create Date: 2025-07-19 18:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_add_user_multi_user_fields'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to user table for multi-user support
    with op.batch_alter_table('user', schema=None) as batch_op:
        # Add account_id for grouping users under the same account
        batch_op.add_column(sa.Column('account_id', sa.Integer(), nullable=True))
        
        # Add created_by to track who created this user
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        
        # Add is_primary to identify the primary user of an account
        batch_op.add_column(sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='0'))
        
        # Create foreign key for created_by relationship
        batch_op.create_foreign_key('fk_user_created_by', 'user', ['created_by'], ['id'])


def downgrade():
    # Remove the multi-user support fields
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_constraint('fk_user_created_by', type_='foreignkey')
        batch_op.drop_column('is_primary')
        batch_op.drop_column('created_by')
        batch_op.drop_column('account_id')