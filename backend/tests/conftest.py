"""Shared pytest fixtures.

Crucially, this module sets test-friendly environment variables *before*
`app.core.config` (and therefore the rest of the `app` package) is imported
anywhere, so the whole test suite runs fully offline: in-memory SQLite
instead of Postgres, and MOCK_MODE forced on so no real OpenAI / Pump.fun /
Vercel credentials are ever required.
"""

from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("MOCK_MODE", "true")
os.environ.setdefault("OPENAI_API_KEY", "")
os.environ.setdefault("DALL_E_3_API_KEY", "")
os.environ.setdefault("PUMPFUN_MINT_KEYPAIR", "")
os.environ.setdefault("LAUNCH_WALLET", "")
os.environ.setdefault("VERCEL_TOKEN", "")

import pytest_asyncio  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from sqlmodel import SQLModel  # noqa: E402


@pytest_asyncio.fixture
async def db_session():
    """Yield an AsyncSession backed by a fresh in-memory SQLite DB per test.

    A dedicated engine/connection pool is created for each test (rather than
    reusing a module-level singleton) to avoid cross-event-loop issues that
    SQLite/aiosqlite connections run into under pytest-asyncio's
    function-scoped event loops.
    """
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Ensure model metadata is registered before create_all.
    from app import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()
