"""Async SQLAlchemy engine + session management (SQLModel-based).

Supports both real Postgres (`postgresql+asyncpg://...`) and SQLite
(`sqlite+aiosqlite:///...`, including `:memory:`) so the test-suite and local
dev can run without a real database server.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel

from app.core.config import settings


def _build_engine_kwargs(database_url: str) -> dict[str, Any]:
    """Return engine kwargs appropriate for the given database URL."""
    kwargs: dict[str, Any] = {"echo": False, "future": True}

    if database_url.startswith("sqlite"):
        # In-memory sqlite needs a StaticPool so all connections share the
        # same in-memory database (otherwise each connection sees an empty
        # DB). Also required: check_same_thread=False for async usage.
        kwargs["connect_args"] = {"check_same_thread": False}
        if ":memory:" in database_url:
            kwargs["poolclass"] = StaticPool
    return kwargs


engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    **_build_engine_kwargs(settings.DATABASE_URL),
)

async_session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Create all tables that don't exist yet.

    This is used for local/dev/test convenience. In production, prefer
    Alembic migrations (see `backend/alembic/`).
    """
    # Import models so their table metadata is registered on SQLModel.metadata
    # before create_all is called.
    from app import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def close_db() -> None:
    """Dispose of the engine's connection pool (call on app shutdown)."""
    await engine.dispose()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an AsyncSession per-request."""
    async with async_session_factory() as session:
        yield session
