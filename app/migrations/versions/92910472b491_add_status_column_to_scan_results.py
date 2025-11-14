"""Add status column to scan_results

Revision ID: 92910472b491
Revises: add_recommendation_text_20250909
Create Date: 2025-09-13 23:51:30.738966

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '92910472b491'
down_revision: Union[str, Sequence[str], None] = 'add_recommendation_text_20250909'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('scan_results', sa.Column('status', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('scan_results', 'status')
