"""Vercel deployment adapter.

`RealVercelDeployer` uploads the generated file set to Vercel using the
Deployments API (v13) and returns the resulting live URL.
`MockVercelDeployer` fabricates a plausible `*.vercel.app` URL so the
pipeline can run end-to-end without a real Vercel account/token.
"""

from __future__ import annotations

import logging
import re
import secrets
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Iterable

import httpx

from app.core.config import settings
from app.services.ai_generator import GeneratedFile

logger = logging.getLogger(__name__)

VERCEL_API_BASE = "https://api.vercel.com"


@dataclass(frozen=True)
class DeployResult:
    """Result of a deployment attempt."""

    url: str
    mock: bool


class VercelDeployer(ABC):
    """Interface for deploying a generated static/React project."""

    @abstractmethod
    async def deploy(self, app_id: uuid.UUID, name: str, files: Iterable[GeneratedFile]) -> DeployResult:
        """Deploy the given files and return the live deployment URL."""


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "codein-app"


class MockVercelDeployer(VercelDeployer):
    """Deterministic, offline deployer used when no Vercel token is configured."""

    async def deploy(self, app_id: uuid.UUID, name: str, files: Iterable[GeneratedFile]) -> DeployResult:
        slug = _slugify(name)
        suffix = secrets.token_hex(4)
        url = f"https://{slug}-{suffix}.vercel.app"
        logger.info("MockVercelDeployer: simulated deploy of app %s -> %s", app_id, url)
        return DeployResult(url=url, mock=True)


class RealVercelDeployer(VercelDeployer):
    """Deploys a project to Vercel via the REST Deployments API."""

    def __init__(self) -> None:
        self._token = settings.VERCEL_TOKEN

    async def deploy(self, app_id: uuid.UUID, name: str, files: Iterable[GeneratedFile]) -> DeployResult:
        project_name = _slugify(name)[:52] or f"codein-{uuid.uuid4().hex[:8]}"
        file_payload = [{"file": f.path, "data": f.content} for f in files]
        payload = {
            "name": project_name,
            "files": file_payload,
            "projectSettings": {"framework": "vite"},
            "target": "production",
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{VERCEL_API_BASE}/v13/deployments",
                    json=payload,
                    headers={"Authorization": f"Bearer {self._token}"},
                )
                response.raise_for_status()
                data = response.json()
                url = data.get("url")
                if not url:
                    raise ValueError(f"Unexpected Vercel response shape: {data}")
                if not url.startswith("http"):
                    url = f"https://{url}"
                return DeployResult(url=url, mock=False)
        except Exception:  # noqa: BLE001
            logger.exception("RealVercelDeployer deploy failed, falling back to mock result")
            return await MockVercelDeployer().deploy(app_id, name, files)


def get_vercel_deployer() -> VercelDeployer:
    """Return the Vercel adapter appropriate for the current configuration."""
    if settings.vercel_mock_enabled:
        return MockVercelDeployer()
    return RealVercelDeployer()
