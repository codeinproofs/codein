"""Server-Sent Events endpoint streaming pipeline progress for a single app."""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models import App, AppFile
from app.services.redis_events import subscribe_events

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/apps", tags=["files"])


def _sse(data: dict) -> str:
    """Format a dict as a single Server-Sent Event frame."""
    return f"data: {json.dumps(data, default=str)}\n\n"


@router.get("/{app_id}/files/stream")
async def stream_app_files(
    app_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    """Stream `file`, `status`, `done`, and `error` JSON events for an app.

    First replays any files already persisted (so a client connecting after
    generation started still sees everything), then subscribes to the app's
    Redis channel for live updates. If the app has already reached a
    terminal `shipped` state, a synthetic `status`/`done` pair is emitted
    immediately and the stream closes -- there is nothing left to watch live.
    """
    app = await session.get(App, app_id)
    if app is None:
        raise HTTPException(status_code=404, detail="App not found")

    statement = select(AppFile).where(AppFile.app_id == app_id).order_by(AppFile.generated_at.asc())
    result = await session.execute(statement)
    existing_files = result.scalars().all()

    async def event_generator() -> AsyncGenerator[str, None]:
        for file in existing_files:
            yield _sse(
                {
                    "type": "file",
                    "path": file.path,
                    "content": file.content,
                    "generated_at": file.generated_at.isoformat(),
                }
            )

        if app.status.value == "shipped":
            yield _sse({"type": "status", "status": app.status.value, "detail": app.status_detail})
            yield _sse(
                {
                    "type": "done",
                    "app_id": str(app.id),
                    "status": app.status.value,
                    "vercel_deployment_url": app.vercel_deployment_url,
                    "pumpfun_signature": app.pumpfun_signature,
                    "pumpfun_mint": app.pumpfun_mint,
                    "file_count": len(existing_files),
                }
            )
            return

        try:
            async for event in subscribe_events(app_id):
                if await request.is_disconnected():
                    logger.info("SSE client disconnected from app %s stream", app_id)
                    break
                yield _sse(event)
                if event.get("type") in ("done", "error"):
                    break
        except asyncio.CancelledError:
            # Normal on client disconnect; let it propagate so the generator
            # (and underlying redis subscription) is cleaned up properly.
            raise
        except Exception:  # noqa: BLE001
            logger.exception("Error while streaming events for app %s", app_id)
            yield _sse({"type": "error", "app_id": str(app_id), "message": "Internal streaming error"})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
