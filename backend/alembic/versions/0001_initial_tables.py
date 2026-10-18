"""Initial tables: apps, app_files

Revision ID: 0001_initial_tables
Revises:
Create Date: 2026-10-16 00:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_initial_tables"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "apps",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("ticker", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False, server_default=""),
        sa.Column("idea", sa.String(), nullable=False),
        sa.Column("template", sa.String(), nullable=False, server_default="react-tailwind"),
        sa.Column(
            "status",
            sa.Enum("building", "reviewing", "shipped", name="app_status", native_enum=False, length=20),
            nullable=False,
            server_default="building",
        ),
        sa.Column("status_detail", sa.String(), nullable=False, server_default="Queued"),
        sa.Column("icon_url", sa.String(), nullable=True),
        sa.Column("owner_wallet", sa.String(), nullable=True),
        sa.Column("pumpfun_signature", sa.String(), nullable=True),
        sa.Column("pumpfun_mint", sa.String(), nullable=True),
        sa.Column("vercel_deployment_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("ticker"),
    )
    op.create_index(op.f("ix_apps_id"), "apps", ["id"], unique=False)
    op.create_index(op.f("ix_apps_name"), "apps", ["name"], unique=False)
    op.create_index(op.f("ix_apps_ticker"), "apps", ["ticker"], unique=True)
    op.create_index(op.f("ix_apps_owner_wallet"), "apps", ["owner_wallet"], unique=False)

    op.create_table(
        "app_files",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("app_id", sa.Uuid(), nullable=False),
        sa.Column("path", sa.String(), nullable=False),
        sa.Column("content", sa.String(), nullable=False, server_default=""),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["app_id"], ["apps.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_app_files_id"), "app_files", ["id"], unique=False)
    op.create_index(op.f("ix_app_files_app_id"), "app_files", ["app_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_app_files_app_id"), table_name="app_files")
    op.drop_index(op.f("ix_app_files_id"), table_name="app_files")
    op.drop_table("app_files")

    op.drop_index(op.f("ix_apps_owner_wallet"), table_name="apps")
    op.drop_index(op.f("ix_apps_ticker"), table_name="apps")
    op.drop_index(op.f("ix_apps_name"), table_name="apps")
    op.drop_index(op.f("ix_apps_id"), table_name="apps")
    op.drop_table("apps")
