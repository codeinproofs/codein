"""Standalone Pump.fun launch endpoint (also invoked internally by the pipeline)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import App, PumpfunLaunchRequest, PumpfunLaunchResponse
from app.services.code_builder import finalize_app
from app.services.pumpfun_client import get_pumpfun_client
from app.services.redis_events import publish_event

router = APIRouter(prefix="/pumpfun", tags=["pumpfun"])


@router.post("/launch", response_model=PumpfunLaunchResponse)
async def launch_token(
    payload: PumpfunLaunchRequest,
    session: AsyncSession = Depends(get_session),
) -> PumpfunLaunchResponse:
    """Launch (or simulate launching) a token for an existing app.

    Uses the real Pump.fun adapter when `LAUNCH_WALLET` and
    `PUMPFUN_MINT_KEYPAIR` are configured, otherwise falls back to the mock
    adapter which returns a deterministic `mock_sig_*` signature.
    """
    app = await session.get(App, payload.app_id)
    if app is None:
        raise HTTPException(status_code=404, detail="App not found")

    client = get_pumpfun_client()
    result = await client.launch(
        payload.name or app.name,
        payload.ticker or app.ticker,
        payload.description or app.description,
        payload.icon_url or app.icon_url,
    )

    await finalize_app(
        session,
        app,
        pumpfun_signature=result.signature,
        pumpfun_mint=result.mint,
    )
    await publish_event(
        app.id,
        "status",
        {"status": app.status.value, "detail": f"Pump.fun launch complete ({result.signature})"},
    )

    return PumpfunLaunchResponse(signature=result.signature, mint=result.mint, mock=result.mock)
