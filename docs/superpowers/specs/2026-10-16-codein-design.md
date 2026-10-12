# CodeIn Design Spec

**Date:** 2026-10-16  
**Status:** Approved (build approach A)

## Decisions

- **Delivery:** Full monorepo scaffold; real integrations with mock fallbacks when env keys missing
- **UI structure:** TZ layout — Sidebar (Home | Launches | Settings), card grid (not mockup table/explorer)
- **Auth:** Solana wallet connect only; `owner_wallet` on apps; no JWT v1
- **UI language:** English
- **Launch model:** Hybrid — platform `LAUNCH_WALLET` auto-launches; mock without keys; wallet = identity
- **Architecture:** Adapter pattern for OpenAI, Pump.fun, Vercel

## Architecture

```
frontend (Vite/React) ──REST/SSE──► backend (FastAPI)
                                       ├── PostgreSQL (apps, app_files)
                                       └── Redis pub/sub (SSE events)
```

Pipeline: parse command → create app → GPT metadata → DALL-E icon → Pump launch → codegen + SSE stream → Vercel deploy → status shipped.

## Data model

See `apps` / `app_files` tables in implementation. Status enum: `building | reviewing | shipped`. Ticker unique `$XXXX` with collision suffix.

## API

- `GET /`, `GET /health`
- `POST /apps/create`, `GET /apps`, `GET /apps/{id}`
- `GET /apps/{id}/files/stream` (SSE)
- `POST /pumpfun/launch`

## Error / mock / test

Unified error JSON. Mock adapters for AI/Pump/Vercel. Unit tests: ticker uniqueness, AI mock pipeline, command parser.
