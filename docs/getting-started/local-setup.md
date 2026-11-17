---
title: Local setup
description: Install dependencies and run the frontend and the FastAPI backend locally.
order: 1
---

# Local setup

You need **Node.js 22+**, **pnpm**, **[uv](https://docs.astral.sh/uv/)**
(it installs Python for you) and **Docker** (for Postgres).

## 1. Install

```bash
pnpm install
uv sync --directory apps/server
```

## 2. Add your keys

```bash
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env
```

Then open `apps/server/.env` and set **one** of these:

- `OPENAI_API_KEY`, or
- `GEMINI_API_KEY`. Also set `GEMINI_ENDPOINT=vertex` if it's a Vertex AI key
  (the default, `studio`, is for AI Studio keys).

If both are set, OpenAI is used. The same key powers answers and embeddings.
Everything else has a working default; see `.env.example` for model overrides.

## 3. Run

```bash
pnpm db:up        # start Postgres in Docker
pnpm db:migrate   # create the tables
pnpm dev          # start the web app and the API
```

| What | Where |
| --- | --- |
| App | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |

`pnpm db:down` stops Postgres. Your data is kept.

## Checks

```bash
pnpm ready                  # lint, format and typecheck everything
pnpm test                   # web and server tests (Postgres must be running)
pnpm --filter server eval   # answer-quality evals, uses your API key
```

Server tests use their own `knowledge_inbox_test` database and a fake AI
provider, so they run offline and cost nothing.

Related: [Overview](/docs) · [API reference](/docs/reference/api)
