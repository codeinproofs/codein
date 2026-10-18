"""App CRUD/listing endpoints: create, list (search/filter/sort/paginate), get."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.core.config import settings
from app.models import (
    App,
    AppCreateRequest,
    AppCreateResponse,
    AppListResponse,
    AppPreviewRequest,
    AppPreviewResponse,
    AppRead,
    AppStatus,
)
from app.services.ai_generator import get_ai_generator
from app.services.brand_dna import tech_icon_data_uri
from app.services.code_builder import normalize_ticker_core
from app.services.pipeline import initiate_app_creation

router = APIRouter(prefix="/apps", tags=["apps"])


@router.post("/preview", response_model=AppPreviewResponse)
async def preview_app(payload: AppPreviewRequest) -> AppPreviewResponse:
    """Dry-run: generate name/ticker/description without minting or writing to DB.

    The frontend shows this to the user for an explicit confirm before
    `POST /apps/create` actually launches the coin and starts the build.
    """
    ai = get_ai_generator()
    template = payload.template or "react-tailwind"
    metadata = await ai.generate_metadata(payload.idea, template)
    icon_url = await ai.generate_icon(metadata)
    ticker_core = normalize_ticker_core(metadata.ticker)
    return AppPreviewResponse(
        idea=payload.idea,
        template=template,
        name=metadata.name,
        ticker=f"${ticker_core}",
        description=metadata.description,
        icon_prompt=metadata.icon_prompt,
        icon_url=icon_url,
        mock=settings.openai_mock_enabled,
        will_launch_coin=True,
        will_generate_code=True,
        will_deploy=True,
    )


@router.post("/create", response_model=AppCreateResponse, status_code=201)
async def create_app(
    payload: AppCreateRequest,
    session: AsyncSession = Depends(get_session),
) -> AppCreateResponse:
    """Kick off app creation after the user confirmed the preview.

    Persists the initial `building` app row and schedules icon/codegen/
    pump.fun launch/vercel deploy as a background task.
    """
    app = await initiate_app_creation(session, payload)
    return AppCreateResponse(
        id=app.id,
        name=app.name,
        ticker=app.ticker,
        status=app.status,
        status_detail=app.status_detail,
    )


@router.get("", response_model=AppListResponse)
@router.get("/", response_model=AppListResponse, include_in_schema=False)
async def list_apps(
    q: Optional[str] = Query(default=None, description="Search app name, ticker, or idea"),
    status: Optional[AppStatus] = Query(default=None, description="Filter by status"),
    sort: str = Query(default="created_at", pattern="^(created_at|ticker)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> AppListResponse:
    """List apps with search, status filter, sorting, and pagination."""
    statement = select(App)
    count_statement = select(func.count()).select_from(App)

    if q:
        like = f"%{q.strip()}%"
        search_clause = or_(App.name.ilike(like), App.ticker.ilike(like), App.idea.ilike(like))
        statement = statement.where(search_clause)
        count_statement = count_statement.where(search_clause)

    if status is not None:
        statement = statement.where(App.status == status)
        count_statement = count_statement.where(App.status == status)

    if sort == "ticker":
        statement = statement.order_by(App.ticker.asc())
    else:
        statement = statement.order_by(App.created_at.desc())

    statement = statement.offset((page - 1) * page_size).limit(page_size)

    total_result = await session.execute(count_statement)
    total = total_result.scalar_one()

    result = await session.execute(statement)
    apps = list(result.scalars().all())

    # Backfill missing launch icons so old rows don't render purple letter stubs.
    dirty = False
    for app in apps:
        if not app.icon_url:
            app.icon_url = tech_icon_data_uri(name=app.name, ticker=app.ticker.lstrip("$"))
            session.add(app)
            dirty = True
    if dirty:
        await session.commit()
        for app in apps:
            await session.refresh(app)

    return AppListResponse(
        items=[AppRead.model_validate(app) for app in apps],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{app_id}", response_model=AppRead)
async def get_app(app_id: uuid.UUID, session: AsyncSession = Depends(get_session)) -> AppRead:
    """Fetch a single app by id."""
    app = await session.get(App, app_id)
    if app is None:
        raise HTTPException(status_code=404, detail="App not found")
    if not app.icon_url:
        app.icon_url = tech_icon_data_uri(name=app.name, ticker=app.ticker.lstrip("$"))
        session.add(app)
        await session.commit()
        await session.refresh(app)
    return AppRead.model_validate(app)
