<p align="center">
  <img src="brand/logos/svg/02-underscore.svg" alt="CodeIn" width="420" />
</p>

<p align="center">
  <strong>Idea → AI code → pump.fun coin → live deploy</strong><br/>
  Terminal-native launchpad. Type a command, confirm the draft, watch the build stream.
</p>

<p align="center">
  <a href="https://github.com/codeinproofs/codein-sdk"><img alt="sdk" src="https://img.shields.io/badge/npm-%40codein%2Fsdk-A799FF?labelColor=0A1628" /></a>
  <a href="https://github.com/codeinproofs/codein-cli"><img alt="cli" src="https://img.shields.io/badge/npm-%40codein%2Fcli-FFFFFF?labelColor=0A1628" /></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-0A1628?labelColor=0A1628&color=A799FF" /></a>
</p>

---

## Demo flow

```bash
create new --like discord
# → PulseCord / $PULSE (or another DNA variant)
# → confirm
# → icon → code → pump.fun → vercel  (SSE live)
```

**Start from** shows original brand marks (Discord, Chrome, …).  
**Launches** get unique tech icons — never the brand logos.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React · TypeScript · Vite · Tailwind · Framer Motion |
| Backend | FastAPI · SQLModel · Redis SSE |
| Chain | Solana · pump.fun |
| AI | OpenAI GPT-4o + DALL·E (mock fallback) |

## Quick start

```bash
cp .env.example .env
docker compose up -d postgres redis

# backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# optional local sqlite: DATABASE_URL=sqlite+aiosqlite:///./codein.db
uvicorn app.main:app --reload --port 8000

# frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173 — no API keys needed (mock adapters).

## Sibling packages (installable)

| Package | Install |
|---------|---------|
| [`@codein/sdk`](https://github.com/codeinproofs/codein-sdk) | `npm i @codein/sdk` |
| [`@codein/cli`](https://github.com/codeinproofs/codein-cli) | `npx @codein/cli --help` |
| [`@codein/adapters`](https://github.com/codeinproofs/codein-adapters) | `npm i @codein/adapters` |

## Tests

```bash
cd backend && source .venv/bin/activate && pytest
cd frontend && npm run build
```

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md). Looking for AI / React / Solana builders — real PRs only.

## License

MIT © CodeIn
