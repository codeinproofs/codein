"""One-off smoke test exercising the app in-process (no real network/server).

Run with: python scripts/smoke_test.py
"""

from __future__ import annotations

import asyncio
import os
import sys

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("MOCK_MODE", "true")
os.environ.setdefault("REDIS_URL", "redis://localhost:6399/0")  # intentionally unreachable

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx  # noqa: E402

from app.main import app  # noqa: E402


async def main() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        async with app.router.lifespan_context(app):
            r = await client.get("/")
            print("GET / ->", r.status_code, r.json())

            r = await client.get("/health")
            print("GET /health ->", r.status_code, r.json())

            r = await client.post(
                "/apps/create",
                json={"idea": "A tipping app for street musicians", "owner_wallet": "ABC123wallet"},
            )
            print("POST /apps/create ->", r.status_code, r.json())
            app_id = r.json()["id"]

            # Give the background asyncio pipeline task a chance to run to completion.
            for _ in range(20):
                await asyncio.sleep(0.2)
                r = await client.get(f"/apps/{app_id}")
                data = r.json()
                if data["status"] == "shipped":
                    break
            print("GET /apps/{id} ->", r.status_code, data)
            assert data["status"] == "shipped", f"Pipeline did not finish: {data}"
            assert data["ticker"].startswith("$")
            assert data["icon_url"]
            assert data["pumpfun_signature"]
            assert data["pumpfun_mint"]
            assert data["vercel_deployment_url"]

            r = await client.get("/apps", params={"page": 1, "page_size": 5})
            print("GET /apps ->", r.status_code, "total=", r.json()["total"])
            assert r.json()["total"] >= 1

            r = await client.get("/apps", params={"q": "tipping"})
            print("GET /apps?q=tipping ->", r.status_code, "total=", r.json()["total"])
            assert r.json()["total"] >= 1

            r = await client.get("/apps", params={"status": "shipped", "sort": "ticker"})
            print("GET /apps?status=shipped&sort=ticker ->", r.status_code, "total=", r.json()["total"])

            # SSE stream: app already shipped, so this should synthesize a
            # replay of files + a final status/done pair and then close.
            async with client.stream("GET", f"/apps/{app_id}/files/stream") as stream_resp:
                print("GET /apps/{id}/files/stream ->", stream_resp.status_code)
                event_count = 0
                async for line in stream_resp.aiter_lines():
                    if line.startswith("data:"):
                        event_count += 1
                print(f"  streamed {event_count} SSE events")
                assert event_count > 0

            # Second app to test ticker collision suffix + manual pump launch endpoint.
            r = await client.post("/apps/create", json={"idea": "A tipping app for street musicians"})
            app_id_2 = r.json()["id"]
            ticker_2 = r.json()["ticker"]
            print("POST /apps/create (dup idea) -> ticker:", ticker_2)

            r = await client.post(
                "/pumpfun/launch",
                json={
                    "app_id": app_id_2,
                    "name": "Street Tips",
                    "ticker": ticker_2,
                    "description": "test",
                },
            )
            print("POST /pumpfun/launch ->", r.status_code, r.json())
            assert r.json()["mock"] is True
            assert r.json()["signature"].startswith("mock_sig_")

    print("\nALL SMOKE TESTS PASSED")


if __name__ == "__main__":
    asyncio.run(main())
