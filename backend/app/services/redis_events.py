"""Redis pub/sub helpers used to stream pipeline events to SSE clients.

Each app gets its own channel (`app:{app_id}:events`). The code generation
pipeline publishes JSON-encoded events (`file`, `status`, `done`, `error`) to
that channel, and the `/apps/{id}/files/stream` SSE endpoint subscribes to it
and forwards events to the connected client.

All publish/subscribe calls are defensive: if Redis is unreachable (e.g. in a
dev/test environment without a Redis server), failures are logged and
swallowed rather than crashing the pipeline or the API.
"""

from __future__ import annotations

import json
import logging
import uuid
from collections.abc import AsyncGenerator
from typing import Any

import redis.asyncio as redis
from redis.asyncio.client import PubSub

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis_client: redis.Redis | None = None


def channel_name(app_id: str | uuid.UUID) -> str:
    """Return the pub/sub channel name used for a given app's events."""
    return f"app:{app_id}:events"


def get_redis_client() -> redis.Redis:
    """Return a lazily-initialized, process-wide Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=5,
        )
    return _redis_client


async def close_redis_client() -> None:
    """Close the shared Redis client (call on app shutdown)."""
    global _redis_client
    if _redis_client is not None:
        try:
            await _redis_client.aclose()
        except Exception:  # noqa: BLE001
            logger.debug("Error closing redis client", exc_info=True)
        _redis_client = None


async def publish_event(app_id: str | uuid.UUID, event_type: str, data: dict[str, Any]) -> None:
    """Publish a JSON event to the app's channel.

    Event shape: {"type": "file" | "status" | "done" | "error", **data}
    Swallows connection errors so pipeline execution never crashes because of
    a missing/unreachable Redis instance.
    """
    payload = {"type": event_type, **data}
    try:
        client = get_redis_client()
        await client.publish(channel_name(app_id), json.dumps(payload, default=str))
    except Exception:  # noqa: BLE001
        logger.warning("Failed to publish redis event (type=%s, app=%s)", event_type, app_id, exc_info=True)


async def subscribe_events(app_id: str | uuid.UUID) -> AsyncGenerator[dict[str, Any], None]:
    """Yield decoded JSON events published to an app's channel, as they arrive.

    This is an infinite generator intended to be consumed by the SSE endpoint;
    the caller is responsible for stopping iteration (e.g. after a `done` or
    `error` event, or when the client disconnects).
    """
    client = get_redis_client()
    pubsub: PubSub = client.pubsub()
    try:
        await pubsub.subscribe(channel_name(app_id))
        async for message in pubsub.listen():
            if message is None:
                continue
            if message.get("type") != "message":
                continue
            raw = message.get("data")
            if not raw:
                continue
            try:
                yield json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                logger.warning("Dropping malformed redis event payload: %r", raw)
    finally:
        try:
            await pubsub.unsubscribe(channel_name(app_id))
            await pubsub.aclose()
        except Exception:  # noqa: BLE001
            logger.debug("Error tearing down pubsub", exc_info=True)
