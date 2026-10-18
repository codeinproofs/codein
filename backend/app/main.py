"""FastAPI application entrypoint: app factory, CORS, and lifespan."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import close_db, init_db
from app.routers import apps, files, pumpfun, root
from app.services.redis_events import close_redis_client, get_redis_client

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Create DB tables and verify Redis connectivity on startup; clean up on shutdown."""
    logger.info(
        "Starting %s (env=%s, mock: openai=%s pumpfun=%s vercel=%s, db=%s)",
        settings.APP_NAME,
        settings.ENVIRONMENT,
        settings.openai_mock_enabled,
        settings.pumpfun_mock_enabled,
        settings.vercel_mock_enabled,
        settings.DATABASE_URL,
    )

    await init_db()
    logger.info("Database tables ready")

    try:
        redis_client = get_redis_client()
        await redis_client.ping()
        logger.info("Connected to Redis at %s", settings.REDIS_URL)
    except Exception:  # noqa: BLE001
        logger.warning(
            "Could not connect to Redis at %s on startup; SSE events will be "
            "best-effort until it becomes available.",
            settings.REDIS_URL,
            exc_info=True,
        )

    yield

    logger.info("Shutting down %s", settings.APP_NAME)
    await close_redis_client()
    await close_db()


def create_app() -> FastAPI:
    """Application factory."""
    application = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        description="CodeIn: idea -> AI-generated app -> token launch -> live deploy.",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(root.router)
    application.include_router(apps.router)
    application.include_router(files.router)
    application.include_router(pumpfun.router)

    return application


app = create_app()
