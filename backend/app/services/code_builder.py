"""Builds App/AppFile database records from AI output and streams progress.

Responsibilities:
- Ticker normalization (`$XXXX`, 3-8 alphanumeric chars) with DB-backed
  collision resolution (numeric suffix).
- Creating the initial `App` row.
- Persisting AI-generated files as `AppFile` rows, one at a time, publishing
  a Redis `file` event after each save so SSE subscribers see files stream in.
- Updating app status/status_detail and publishing `status` events.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Iterable, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import App, AppFile, AppStatus
from app.services.ai_generator import AppMetadata, GeneratedFile
from app.services.redis_events import publish_event

logger = logging.getLogger(__name__)

TICKER_MIN = 3
TICKER_MAX = 8


def normalize_ticker_core(raw: str) -> str:
    """Strip non-alphanumeric chars, uppercase, and clamp to 3-8 chars.

    Does not include the leading `$`. Pads short input with trailing "X"
    characters to reach the minimum length.
    """
    core = re.sub(r"[^A-Za-z0-9]", "", raw or "").upper()
    if not core:
        core = "APP"
    if len(core) < TICKER_MIN:
        core = (core + "XXXXXXXX")[:TICKER_MIN]
    return core[:TICKER_MAX]


async def _ticker_exists(session: AsyncSession, ticker: str) -> bool:
    statement = select(App).where(App.ticker == ticker)
    result = await session.execute(statement)
    return result.scalar_one_or_none() is not None


async def ensure_unique_ticker(session: AsyncSession, raw: str) -> str:
    """Normalize `raw` into a `$XXXX` ticker, resolving collisions in the DB.

    On collision, a numeric suffix (2, 3, 4, ...) is appended to the core,
    trimming the core as needed to respect the 3-8 character limit.
    """
    core = normalize_ticker_core(raw)
    candidate = f"${core}"
    if not await _ticker_exists(session, candidate):
        return candidate

    suffix = 2
    while True:
        suffix_str = str(suffix)
        max_core_len = max(TICKER_MIN, TICKER_MAX - len(suffix_str))
        trimmed_core = core[:max_core_len]
        candidate_core = f"{trimmed_core}{suffix_str}"
        if len(candidate_core) > TICKER_MAX:
            candidate_core = candidate_core[:TICKER_MAX]
        candidate = f"${candidate_core}"
        if not await _ticker_exists(session, candidate):
            return candidate
        suffix += 1


async def create_app_record(
    session: AsyncSession,
    *,
    idea: str,
    template: str | None,
    owner_wallet: str | None,
    metadata: AppMetadata,
) -> App:
    """Create and persist the initial App row (status=building)."""
    ticker = await ensure_unique_ticker(session, metadata.ticker)
    app = App(
        name=metadata.name,
        ticker=ticker,
        description=metadata.description,
        idea=idea,
        template=template or "react-tailwind",
        owner_wallet=owner_wallet,
        status=AppStatus.BUILDING,
        status_detail="Queued for generation",
    )
    session.add(app)
    await session.commit()
    await session.refresh(app)
    return app


async def persist_file(session: AsyncSession, app: App, generated_file: GeneratedFile) -> AppFile:
    """Persist a single generated file and publish a `file` SSE event."""
    record = AppFile(app_id=app.id, path=generated_file.path, content=generated_file.content)
    session.add(record)
    await session.commit()
    await session.refresh(record)
    await publish_event(
        app.id,
        "file",
        {"path": record.path, "content": record.content, "generated_at": record.generated_at.isoformat()},
    )
    return record


async def persist_files(session: AsyncSession, app: App, files: Iterable[GeneratedFile]) -> List[AppFile]:
    """Persist multiple generated files sequentially, streaming each as saved."""
    saved: List[AppFile] = []
    for generated_file in files:
        saved.append(await persist_file(session, app, generated_file))
    return saved


async def update_app_status(
    session: AsyncSession,
    app: App,
    status: AppStatus,
    detail: str,
) -> App:
    """Update an app's status/status_detail, persist, and publish a `status` event."""
    app.status = status
    app.status_detail = detail
    app.updated_at = datetime.now(timezone.utc)
    session.add(app)
    await session.commit()
    await session.refresh(app)
    await publish_event(app.id, "status", {"status": app.status.value, "detail": detail})
    return app


async def finalize_app(
    session: AsyncSession,
    app: App,
    *,
    icon_url: str | None = None,
    pumpfun_signature: str | None = None,
    pumpfun_mint: str | None = None,
    vercel_deployment_url: str | None = None,
) -> App:
    """Apply final deployment/launch metadata to an app and persist it."""
    if icon_url is not None:
        app.icon_url = icon_url
    if pumpfun_signature is not None:
        app.pumpfun_signature = pumpfun_signature
    if pumpfun_mint is not None:
        app.pumpfun_mint = pumpfun_mint
    if vercel_deployment_url is not None:
        app.vercel_deployment_url = vercel_deployment_url
    app.updated_at = datetime.now(timezone.utc)
    session.add(app)
    await session.commit()
    await session.refresh(app)
    return app
