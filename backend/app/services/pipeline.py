"""Orchestrates the full app-creation flow as a detached background task.

Flow: parse idea -> GPT metadata -> create App row (fast response) -> [in
background] DALL-E icon -> codegen + persist/stream files -> Pump.fun launch
-> Vercel deploy -> mark shipped. Every stage publishes a Redis event so SSE
clients watching `/apps/{id}/files/stream` see live progress.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Set

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.models import App, AppCreateRequest, AppStatus
from app.services.ai_generator import AppMetadata, get_ai_generator
from app.services.code_builder import (
    create_app_record,
    finalize_app,
    persist_files,
    update_app_status,
)
from app.services.pumpfun_client import get_pumpfun_client
from app.services.redis_events import publish_event
from app.services.vercel_deployer import get_vercel_deployer

logger = logging.getLogger(__name__)

# Strong references to in-flight background tasks so they aren't
# garbage-collected mid-execution (a well-known asyncio footgun with
# fire-and-forget `asyncio.create_task` calls).
_background_tasks: Set[asyncio.Task] = set()


async def initiate_app_creation(session: AsyncSession, payload: AppCreateRequest) -> App:
    """Create the initial `building` App row and schedule the rest of the pipeline.

    Returns immediately so `POST /apps/create` can respond fast. Icon
    generation, code generation, token launch, and deployment all continue
    in a detached background asyncio task (see `run_pipeline`).
    """
    ai = get_ai_generator()
    # Prefer values the user confirmed in the preview step; fill gaps via AI.
    generated = await ai.generate_metadata(payload.idea, payload.template)
    metadata = AppMetadata(
        name=(payload.name or generated.name).strip(),
        ticker=(payload.ticker or generated.ticker).strip(),
        description=(payload.description or generated.description).strip(),
        icon_prompt=generated.icon_prompt,
    )

    app = await create_app_record(
        session,
        idea=payload.idea,
        template=payload.template,
        owner_wallet=payload.owner_wallet,
        metadata=metadata,
    )

    # Attach a unique tech mark immediately so Explorer never shows letter blobs
    # while the background pipeline is still running.
    early_icon = await ai.generate_icon(metadata)
    if early_icon:
        app = await finalize_app(session, app, icon_url=early_icon)

    task = asyncio.create_task(run_pipeline(app.id, payload.idea, app.template))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)

    return app


async def run_pipeline(app_id: uuid.UUID, idea: str, template: str) -> None:
    """Run the remainder of the generation/launch/deploy pipeline for an app.

    Opens its own DB session since it executes detached from any HTTP
    request. Failures are caught, reflected in the app's status, and
    published as an `error` SSE event -- this coroutine never raises, since
    nothing awaits it directly.
    """
    async with async_session_factory() as session:
        app = await session.get(App, app_id)
        if app is None:
            logger.error("Pipeline could not find app %s; aborting", app_id)
            return

        try:
            ai = get_ai_generator()
            metadata = AppMetadata(
                name=app.name,
                ticker=app.ticker.lstrip("$"),
                description=app.description,
                icon_prompt=(
                    f"Minimal flat-style app icon for '{app.name}', "
                    f"inspired by {template}: {idea[:100]}"
                ),
            )

            # 1. Icon generation
            app = await update_app_status(session, app, AppStatus.BUILDING, "Generating app icon")
            icon_url = await ai.generate_icon(metadata)
            app = await finalize_app(session, app, icon_url=icon_url)

            # 2. Code generation (persist_files streams a `file` event per file)
            app = await update_app_status(session, app, AppStatus.BUILDING, "Generating source code")
            files = await ai.generate_code(idea, metadata, template)
            saved_files = await persist_files(session, app, files)

            # 3. Pump.fun token launch
            app = await update_app_status(session, app, AppStatus.REVIEWING, "Launching token on Pump.fun")
            pumpfun = get_pumpfun_client()
            launch_result = await pumpfun.launch(app.name, app.ticker, app.description, app.icon_url)
            app = await finalize_app(
                session,
                app,
                pumpfun_signature=launch_result.signature,
                pumpfun_mint=launch_result.mint,
            )

            # 4. Vercel deployment
            app = await update_app_status(session, app, AppStatus.REVIEWING, "Deploying to Vercel")
            vercel = get_vercel_deployer()
            deploy_result = await vercel.deploy(app.id, app.name, files)
            app = await finalize_app(session, app, vercel_deployment_url=deploy_result.url)

            # 5. Done
            app = await update_app_status(session, app, AppStatus.SHIPPED, "Live")
            await publish_event(
                app.id,
                "done",
                {
                    "app_id": str(app.id),
                    "status": app.status.value,
                    "vercel_deployment_url": app.vercel_deployment_url,
                    "pumpfun_signature": app.pumpfun_signature,
                    "pumpfun_mint": app.pumpfun_mint,
                    "file_count": len(saved_files),
                },
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Pipeline failed for app %s", app_id)
            try:
                await update_app_status(session, app, AppStatus.REVIEWING, f"Error: {exc}")
            except Exception:  # noqa: BLE001
                logger.exception("Failed to persist error status for app %s", app_id)
            await publish_event(app_id, "error", {"app_id": str(app_id), "message": str(exc)})
