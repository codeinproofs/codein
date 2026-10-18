"""SQLModel database tables and Pydantic request/response schemas."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field as PydanticField
from sqlalchemy import Column
from sqlalchemy import Enum as SAEnum
from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AppStatus(str, enum.Enum):
    """Lifecycle status of a generated app."""

    BUILDING = "building"
    REVIEWING = "reviewing"
    SHIPPED = "shipped"


# ---------------------------------------------------------------------------
# Database tables
# ---------------------------------------------------------------------------


class App(SQLModel, table=True):
    """A generated/launched app (one per idea/ticker)."""

    __tablename__ = "apps"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    name: str = Field(nullable=False, index=True)
    ticker: str = Field(nullable=False, unique=True, index=True)
    description: str = Field(default="", nullable=False)
    idea: str = Field(nullable=False)
    template: str = Field(default="react-tailwind", nullable=False)

    status: AppStatus = Field(
        default=AppStatus.BUILDING,
        sa_column=Column(
            SAEnum(AppStatus, name="app_status", native_enum=False, length=20),
            nullable=False,
            default=AppStatus.BUILDING,
        ),
    )
    status_detail: str = Field(default="Queued", nullable=False)

    icon_url: Optional[str] = Field(default=None, nullable=True)
    owner_wallet: Optional[str] = Field(default=None, nullable=True, index=True)

    pumpfun_signature: Optional[str] = Field(default=None, nullable=True)
    pumpfun_mint: Optional[str] = Field(default=None, nullable=True)
    vercel_deployment_url: Optional[str] = Field(default=None, nullable=True)

    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class AppFile(SQLModel, table=True):
    """A single generated source file belonging to an App."""

    __tablename__ = "app_files"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    app_id: uuid.UUID = Field(foreign_key="apps.id", nullable=False, index=True)
    path: str = Field(nullable=False)
    content: str = Field(default="", nullable=False)
    generated_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


# ---------------------------------------------------------------------------
# Pydantic request / response schemas
# ---------------------------------------------------------------------------


class AppCreateRequest(BaseModel):
    """Body for POST /apps/create."""

    idea: str = PydanticField(..., min_length=1, max_length=2000)
    template: Optional[str] = PydanticField(default="react-tailwind")
    owner_wallet: Optional[str] = PydanticField(default=None)
    # Optional overrides from the confirm/preview step (what the user approved).
    name: Optional[str] = PydanticField(default=None, min_length=1, max_length=100)
    ticker: Optional[str] = PydanticField(default=None, min_length=3, max_length=9)
    description: Optional[str] = PydanticField(default=None, max_length=2000)


class AppPreviewRequest(BaseModel):
    """Body for POST /apps/preview — dry-run metadata, no mint / no DB write."""

    idea: str = PydanticField(..., min_length=1, max_length=2000)
    template: Optional[str] = PydanticField(default="react-tailwind")


class AppPreviewResponse(BaseModel):
    """What the user reviews before confirming launch."""

    idea: str
    template: str
    name: str
    ticker: str
    description: str
    icon_prompt: str
    icon_url: Optional[str] = None
    mock: bool
    will_launch_coin: bool = True
    will_generate_code: bool = True
    will_deploy: bool = True


class AppCreateResponse(BaseModel):
    """Response for POST /apps/create: the app was accepted and queued."""

    id: uuid.UUID
    name: str
    ticker: str
    status: AppStatus
    status_detail: str


class AppRead(BaseModel):
    """Full representation of an App, returned by GET /apps and /apps/{id}."""

    id: uuid.UUID
    name: str
    ticker: str
    description: str
    idea: str
    template: str
    status: AppStatus
    status_detail: str
    icon_url: Optional[str] = None
    owner_wallet: Optional[str] = None
    pumpfun_signature: Optional[str] = None
    pumpfun_mint: Optional[str] = None
    vercel_deployment_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AppListResponse(BaseModel):
    """Paginated list response for GET /apps."""

    items: List[AppRead]
    total: int
    page: int
    page_size: int


class AppFileRead(BaseModel):
    """Representation of a single generated file."""

    id: uuid.UUID
    app_id: uuid.UUID
    path: str
    content: str
    generated_at: datetime

    model_config = {"from_attributes": True}


class PumpfunLaunchRequest(BaseModel):
    """Body for POST /pumpfun/launch."""

    app_id: uuid.UUID
    name: str
    ticker: str
    description: Optional[str] = ""
    icon_url: Optional[str] = None


class PumpfunLaunchResponse(BaseModel):
    """Response for POST /pumpfun/launch."""

    signature: str
    mint: str
    mock: bool
