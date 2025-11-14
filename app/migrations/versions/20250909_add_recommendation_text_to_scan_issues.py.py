# app/migrations/versions/20250909_add_recommendation_text_to_scan_issues.py
"""add recommendation_text to scan_issues and drop recommendations table

Revision ID: add_recommendation_text_20250909
Revises: xxxx_previous_revision
Create Date: 2025-09-09 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# replace this with the revision ID of your current head
revision = "add_recommendation_text_20250909"
down_revision = "e1060dbde801"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add column
    op.add_column("scan_issues", sa.Column("recommendation_text", sa.Text(), nullable=True))

    # If you previously had a separate recommendations table, drop it (safe guard)
    # Use raw SQL to avoid errors if the table doesn't exist
    op.execute("DROP TABLE IF EXISTS recommendations CASCADE")


def downgrade() -> None:
    # recreate minimal recommendations table (if you need it on downgrade)
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS recommendations (
            id SERIAL PRIMARY KEY,
            issue_id INTEGER,
            text TEXT
        )
        """
    )
    op.drop_column("scan_issues", "recommendation_text")
