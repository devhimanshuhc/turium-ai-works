# Knowledge Inbox — Server

FastAPI backend for the AI Knowledge Inbox. Python 3.12, managed with [uv](https://docs.astral.sh/uv/).

```bash
uv sync
cp .env.example .env          # set OPENAI_API_KEY or GEMINI_API_KEY
pnpm db:up && pnpm db:migrate # from the repo root: Postgres + pgvector, schema

pnpm dev        # uvicorn on :8000 (Swagger at /docs)
pnpm test       # pytest — real test Postgres, fake LLM/embedder (offline)
pnpm eval       # RAG evals with the real provider → evals/reports/
pnpm lint:fix   # ruff format + ruff check --fix
pnpm typecheck  # mypy
```

| Path | What lives there |
|---|---|
| `app/routers/` | HTTP only: knowledge bases, ingest, items, chats, query (SSE), health |
| `app/services/ingestion/` | Extract → parent/child chunk → contextualise → embed → store |
| `app/services/retrieval.py` | Hybrid search (pgvector + full-text, RRF) |
| `app/services/rag/` | Planner, prompts, guardrails, streaming orchestrator |
| `app/clients/` | OpenAI / Gemini providers, retry, SSRF-safe web fetcher |
| `app/models/`, `migrations/` | SQLAlchemy models and Alembic migrations |
| `evals/` | Golden dataset, corpus, LLM-as-judge runner |

Design rationale: `docs/reference/design-decisions.md`. Conventions: `.agents/skills/backend/SKILL.md`.
