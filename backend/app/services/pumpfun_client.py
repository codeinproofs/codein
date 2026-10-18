"""Pump.fun token launch adapter.

`RealPumpfunClient` calls the Pump.fun REST API to mint and launch a token
using the platform's `LAUNCH_WALLET` and `PUMPFUN_MINT_KEYPAIR`.
`MockPumpfunClient` returns deterministic fake signatures/mints so the
pipeline works end-to-end without real Solana credentials.
"""

from __future__ import annotations

import logging
import secrets
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

PUMPFUN_API_BASE = "https://pumpportal.fun/api"


@dataclass(frozen=True)
class LaunchResult:
    """Result of a token launch attempt."""

    signature: str
    mint: str
    mock: bool


class PumpfunClient(ABC):
    """Interface for launching a token on Pump.fun."""

    @abstractmethod
    async def launch(self, name: str, ticker: str, description: str, icon_url: str | None) -> LaunchResult:
        """Launch (mint + bond) a token for the given app metadata."""


class MockPumpfunClient(PumpfunClient):
    """Deterministic, offline Pump.fun adapter used when no launch wallet is configured."""

    async def launch(self, name: str, ticker: str, description: str, icon_url: str | None) -> LaunchResult:
        suffix = secrets.token_hex(8)
        signature = f"mock_sig_{suffix}"
        mint = f"mock_mint_{uuid.uuid4().hex[:32]}"
        logger.info("MockPumpfunClient: simulated launch of %s (%s) -> %s", name, ticker, signature)
        return LaunchResult(signature=signature, mint=mint, mock=True)


class RealPumpfunClient(PumpfunClient):
    """Calls the Pump.fun (PumpPortal) trading API to launch a real token.

    Requires `LAUNCH_WALLET` (the wallet address funding the launch) and
    `PUMPFUN_MINT_KEYPAIR` (base58-encoded keypair used as the token mint
    signer) to be configured.
    """

    def __init__(self) -> None:
        self._launch_wallet = settings.LAUNCH_WALLET
        self._mint_keypair = settings.PUMPFUN_MINT_KEYPAIR

    async def launch(self, name: str, ticker: str, description: str, icon_url: str | None) -> LaunchResult:
        payload = {
            "action": "create",
            "tokenMetadata": {
                "name": name,
                "symbol": ticker.lstrip("$"),
                "description": description,
                "image": icon_url,
            },
            "mint": self._mint_keypair,
            "denominatedInSol": "true",
            "amount": 0,
            "slippage": 10,
            "priorityFee": 0.0005,
            "pool": "pump",
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{PUMPFUN_API_BASE}/trade-local",
                    json=payload,
                    headers={"Authorization": f"Bearer {self._mint_keypair}"} if self._mint_keypair else {},
                )
                response.raise_for_status()
                data = response.json()
                signature = str(data.get("signature") or data.get("txid") or "")
                mint = str(data.get("mint") or "")
                if not signature or not mint:
                    raise ValueError(f"Unexpected pump.fun response shape: {data}")
                return LaunchResult(signature=signature, mint=mint, mock=False)
        except Exception:  # noqa: BLE001
            logger.exception("RealPumpfunClient launch failed, falling back to mock result")
            return await MockPumpfunClient().launch(name, ticker, description, icon_url)


def get_pumpfun_client() -> PumpfunClient:
    """Return the Pump.fun adapter appropriate for the current configuration."""
    if settings.pumpfun_mock_enabled:
        return MockPumpfunClient()
    return RealPumpfunClient()
