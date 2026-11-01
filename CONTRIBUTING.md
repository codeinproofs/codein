# Contributing to CodeIn

Thanks for building with us. We care about **AI**, **React**, **Solana / crypto**, and sharp DX.

## Quick start (mock mode — no keys)

```bash
cp .env.example .env
docker compose up -d postgres redis   # or use sqlite — see README

cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

cd frontend && npm install && npm run dev
```

Open http://localhost:5173 and run:

```text
create new --like discord
```

## Where to help

| Area | Path | Good first issues |
|------|------|-------------------|
| Terminal / launch UX | `frontend/src/components` | polish, a11y, motion |
| Start From DNA / icons | `backend/app/services/brand_dna.py` | new templates |
| Pipeline adapters | `backend/app/services` | pump / vercel / AI |
| SSE reliability | `backend` + `frontend/src/hooks` | reconnect, backlog |
| Design / landing | `frontend/src/pages` | typography, motion |

Label filter: [`good first issue`](https://github.com/codeinproofs/codein/labels/good%20first%20issue)

## PR rules

1. One concern per PR
2. Mock mode must still work
3. Never commit `.env`, keys, or wallet secrets
4. Backend: `pytest` · Frontend: `npm run build`

## Code of conduct

Be direct, kind, and technical. No harassment. No fake engagement / bought stars — we want real builders.
