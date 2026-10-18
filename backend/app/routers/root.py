"""Root/meta endpoints: service identity and health check."""

from __future__ import annotations

import logging

from fastapi import APIRouter

from app.core.config import settings
from app.database import engine
from app.services.redis_events import get_redis_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["meta"])


@router.get("/")
async def read_root() -> dict:
    """Basic service identity payload."""
    return {
        "name": settings.APP_NAME,
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "mock": {
            "openai": settings.openai_mock_enabled,
            "pumpfun": settings.pumpfun_mock_enabled,
            "vercel": settings.vercel_mock_enabled,
        },
    }


@router.get("/health")
async def health_check() -> dict:
    """Health check that best-effort probes the database and Redis.

    Never raises: downstream dependency failures are reflected in the
    response body (`degraded`) rather than as a 500, so this endpoint stays
    usable for liveness/readiness probes even during partial outages.
    """
    db_ok = True
    redis_ok = True

    try:
        async with engine.connect() as conn:
            await conn.exec_driver_sql("SELECT 1")
    except Exception:  # noqa: BLE001
        logger.warning("Health check: database probe failed", exc_info=True)
        db_ok = False

    try:
        client = get_redis_client()
        await client.ping()
    except Exception:  # noqa: BLE001
        logger.warning("Health check: redis probe failed", exc_info=True)
        redis_ok = False

    overall = "healthy" if (db_ok and redis_ok) else "degraded"
    return {
        "status": overall,
        "database": "ok" if db_ok else "unreachable",
        "redis": "ok" if redis_ok else "unreachable",
    }
