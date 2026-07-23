"""Add missing columns to users and food_donations tables

Revision ID: 001_add_missing_columns
Revises: 
Create Date: 2026-01-25 09:00:00.000000

"""
from alembic import op
import sqlalchemy as sa



revision = '001_add_missing_columns'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    
    op.add_column('users', sa.Column('avatar_url', sa.String(500), nullable=True))
    
    
    op.add_column('food_donations', sa.Column('quantity_unit', sa.String(50), server_default='servings', nullable=False))


def downgrade() -> None:
    
    op.drop_column('food_donations', 'quantity_unit')
    
    
    op.drop_column('users', 'avatar_url')

