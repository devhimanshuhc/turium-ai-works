## Skills

This project has the following agent skills. **Read and follow the relevant skill before starting any task in that area.**

| Skill | Path | Use when |
|---|---|---|
| `frontend` | `.agents/skills/frontend/SKILL.md` | Writing any Next.js frontend code — components, hooks, services, queries, types, validations, utils, constants, contexts |
| `backend` | `.agents/skills/backend/SKILL.md` | Writing any FastAPI backend code — routers, services, schemas, config, ingestion, RAG pipeline |
| `forms` | `.agents/skills/forms/SKILL.md` | Building or modifying any form using react-hook-form + Zod |
| `react-query` | `.agents/skills/react-query/SKILL.md` | Writing data-fetching hooks, mutation hooks, or service layer calls |
| `frontend-testing` | `.agents/skills/frontend-testing/SKILL.md` | Writing or updating frontend Vitest tests and coverage |

---

## Project Context

This repo is a take-home assignment for the **Full Stack Developer** role at **Turium AI**: a minimal **AI Knowledge Inbox**. The brief is `docs/Turium_AI_Interview_Assignment.pdf` — read it before making product decisions.

The app lets a single user:

1. Organise content into knowledge bases: text, links (fetched server-side) and files (PDF, DOCX, TXT, MD).
2. Start chats from the sidebar: tick knowledge bases (locked on the first message), or none for a general-knowledge chat (`chats.mode = general`, answers labelled, no retrieval).
3. Get streamed, cited answers from the RAG pipeline: parent-child + contextual chunking → hybrid search (pgvector + full-text, RRF) → planner/answerer → guardrails (citation check + LLM-as-judge groundedness).

Required API from the brief (kept with these exact names): `POST /ingest`, `GET /items`, `POST /query`.

Scope guardrails from the brief: **no auth** (single user), **no infra theatre** (no Kubernetes, no queues unless justified), SQLite / in-memory / simple vector store (we chose Postgres + pgvector — the reasoning is in `docs/reference/design-decisions.md`). Reviewers grade on tradeoff awareness, debuggability (structured logs, clear errors, correct status codes) and code quality (separation of concerns, no god files, clear naming). Record design tradeoffs in `docs/` as they are made.

---

## Codebase Overview

This is a **pnpm + Turborepo monorepo** with:

- `apps/server` — **FastAPI** backend (Python ≥ 3.12, managed with `uv`). Runs on `http://localhost:8000`. Swagger at `/docs`. Turbo drives it through `apps/server/package.json` (`dev`, `test`, `typecheck` → mypy, `lint:fix` → ruff).
- **Database:** Postgres 17 + pgvector, run with `docker compose` (`pnpm db:up`). SQLAlchemy 2 (async, asyncpg) models in `apps/server/app/models/`; Alembic migrations in `apps/server/migrations/` (`pnpm db:migrate`).
- `apps/web` — Next.js 16 frontend with App Router. `(landing)/` is the marketing page at `/` (GSAP + ScrollTrigger + SplitText, anime.js, Lenis); `(main)/` holds the app (entry point `/chats/new`); `(docs)/` renders the Markdown in `docs/` at `/docs`. The app and the landing page share one palette: ink `#0d0e0c`, paper `#f3f0e8`, lime `#d6f25c` (tokens in `packages/ui/src/styles/globals.css`; dark is the default theme).
- `packages/shared` — `@repo/shared`: TypeScript utilities and types for the frontend packages.
- `packages/ui` — `@repo/ui`: shadcn-derived component library used on the frontend.

**HTTP client:** `ApiClient` in `apps/web/src/lib/api-client.ts`. Never call fetch directly. Pattern: Component → TanStack Query hook → Service → `ApiClient`. `ApiClient` turns FastAPI's `{"detail": ...}` error body into an `Error` message. **One exception:** `POST /query` streams Server-Sent Events, which axios cannot read, so `apps/web/src/lib/query-stream.ts` uses `fetch` for that endpoint only.

**AI provider:** `apps/server/app/clients/providers.py` picks OpenAI or Gemini from the keys in `apps/server/.env`. Services depend on the `LLMClient` / `Embedder` protocols, never on an SDK. Tests use the fakes in `apps/server/tests/fakes.py`; `pnpm --filter server eval` runs the real pipeline against `apps/server/evals/`.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- No unnecessary comments - write self-documenting code.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write goal for invalid inputs, then make them pass"
- "Fix the bug" → "Write a goal that reproduces it, then make it pass"
- "Refactor X" → "Ensure goal pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. YAGNI (You Aren't Gonna Need It)
- Use YAGNI Principle to avoid overcomplication and prefer one-liners

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 5. pnpm Readiness Check After Changes

After any code change, do not stop at `typecheck` only.
Always run `pnpm ready` for the changed work.

If it fails and the issue is caused by your change, fix it before considering the task complete.

---

## 6. Code Quality & Modularity

### No comments unless genuinely necessary

Do not write comments that narrate what the code does. The code should explain itself.

Bad:
```python
# Get the item by ID
item = repository.get_item(item_id)
# Raise 404 if not found
if item is None:
    raise HTTPException(status_code=404, detail="Item not found")
```

Good:
```python
item = repository.get_item(item_id)

if item is None:
    raise HTTPException(status_code=404, detail="Item not found")
```

The only acceptable comments are those explaining **why** something non-obvious is done — not what is done.

### File size limits

No file should grow large enough to be hard to scan. As a rule:

- **Service / controller files:** keep as minimal as possible. If a service is growing, it likely has more than one responsibility — split it.
- **Module / config files:** typically short; if they are growing, something is wrong structurally.
- **Utility files:** group related utilities; split when the file has unrelated concerns.

If a file is approaching the limit, split it before adding more. Do not keep growing a file because it's "easier."

### One responsibility per file

Each file should have a single clear purpose. If you find yourself writing a service that handles orders *and* notifications *and* billing, that is three services.

Signs a file needs splitting:
- The file has unrelated imports
- Functions in the file don't share data or context with each other
- The filename is vague (e.g. `utils.ts`, `helpers.ts`) and keeps growing

### Functions must be small and single-purpose

A function should do one thing. If you need to scroll to understand a function, it is too long.

- Extract named helper functions for any multi-step logic
- Avoid deeply nested conditionals — extract early-return guards or helper functions
- A function with more than ~20 lines is a candidate for splitting

### DRY — Don't Repeat Yourself

Before writing a piece of logic, check if it already exists:

- In `@repo/shared` for utilities usable across apps
- In the current module's service or a sibling utility file
- In `@repo/ui` for UI patterns

If you find yourself writing the same logic twice, extract it. The second time you write something is always the right time to abstract it.

### Readable by a first-time reader

Write code as if the next person reading it has never seen this codebase. That means:

- Name variables and functions precisely — `getUserByEmail` not `getUser`, `isSessionExpired` not `check`
- Avoid abbreviations unless they are universally understood (`id`, `dto`, `url` are fine; `usrSsn`, `chkExp` are not)
- Keep the happy path obvious — handle errors and edge cases first (early return), then the main logic
- Group related code together; don't interleave unrelated logic

### Component splitting (frontend)

A React component that does data fetching, business logic, layout, and rendering is too large. Split by concern:

- **Page component** — composes sections, may call hooks
- **Section component** — a logical region of the page (e.g. `ProfileHeader`, `SessionsList`)
- **UI component** — purely presentational, accepts props, no hooks or side effects

When a component file exceeds ~100 lines, ask whether it can be split into a parent + smaller focused children.

### Presentational component coverage (frontend)

- Name purely presentational React components `*.view.tsx`.
- A `*.view.tsx` component accepts props and renders them. It must not use hooks, query or mutation hooks, router state, auth clients, toasts, or event-driven workflow logic.
- Keep behavioral components as ordinary `.tsx` files; move their data and business logic into hooks or utils when practical.
- Frontend coverage excludes `src/components/**/*.view.tsx`. Do not add broad component exclusions or change the coverage include list to increase the metric.

---

## 7. Package Management

Always use `pnpm` for installing packages. Never use `npm` or `yarn`.

```bash
pnpm add <package>              # add to current workspace app
pnpm add <package> -w           # add to monorepo root
pnpm add <package> --filter @repo/ui  # add to a specific workspace package
pnpm add -D <package>           # dev dependency
```

---

## 8. Backend (FastAPI) — Rules

- **Layering:** `routers/` (HTTP only: parse request, call a service, map errors to status codes) → `services/` (business logic) → storage/clients. Routers never talk to the database, the vector store, or OpenAI directly.
- **Schemas:** request and response bodies are Pydantic models in `app/schemas/`. Validate at the edge (`Field` constraints, `HttpUrl`, enums) so services receive clean input. Always set `response_model`.
- **Config:** every setting and secret lives in `config.py` (`pydantic-settings`, loaded from `apps/server/.env`). Never read `os.environ` elsewhere. Keep `apps/server/.env.example` in sync.
- **Errors:** raise the `AppError` subclasses from `app/core/errors.py` (`BadRequestError` 400, `NotFoundError` 404, `ConflictError` 409, `UpstreamError` 502, `ServiceUnavailableError` 503). Global handlers turn them into `{"detail": ...}`; an unreachable database becomes 503 and anything unexpected becomes a generic 500. Do not catch-and-reraise as `HTTPException`.
- **Logging:** use `logger` from `app/core/logging.py`. Output is one JSON object per line and carries the request's `request_id` automatically; pass context through `extra={...}` (item id, source type, chunk counts, latency). Never `print`. Never log secrets or full document bodies.
- **External calls** (URL fetch, embeddings, LLM) go through a thin client module so they can be mocked in tests. Set timeouts on every outbound HTTP call.
- **Tests:** `pytest` in `apps/server/tests/`. API tests use the `api` fixture (real test Postgres, fake LLM/embedder/fetcher from `tests/fakes.py`). Tests must run offline and never call a real provider.
- **Database changes:** edit the models, then `pnpm --filter server db:revision "<message>"` to autogenerate a migration, review it, and `pnpm db:migrate`. Never edit an applied migration; add a new one.
- **Dependencies:** `uv add <pkg>` (runtime) or `uv add --dev <pkg>` from `apps/server`. Never use `pip install` directly.

---

## 9. Assignment Scope — Rules

- **No auth.** Do not add sign-in, sessions, or user tables. The app is single-user by design.
- **No speculative infra.** Postgres + pgvector is the only infrastructure. No Redis, Celery, or Kubernetes unless a concrete requirement forces it — and document why in `docs/`.
- **Keep it small and explainable.** Every design choice (chunk size/overlap, embedding model, vector store, top-k) should be easy to justify in `docs/reference/design-decisions.md`.

---

## 10. UI/UX Standards

### Think UX before writing UI

Before writing any UI code, ask: what is the user trying to do, and what is the fastest path to that goal? Every extra click, label, or visual element has a cost. Default to less.

### Style principles

- **Minimal** — show only what is needed on screen at any moment. Avoid information overload.
- **Clean** — consistent spacing, clear visual hierarchy, no decorative elements that don't carry meaning.
- **Modern** — use Tailwind utilities; avoid legacy patterns like inline styles or external CSS. Prefer subtle interactions over heavy animations.
- **Readable** — typography should be comfortable. Use `text-muted-foreground` for secondary text; reserve full contrast for primary content.

### Always handle all states

Every async UI must handle loading, empty, and error states explicitly. A component that renders nothing while loading, or silently fails, is incomplete.

- Use `Skeleton` for content that is loading in place
- Use `LoadingScreen` for full-page loads
- Use `AlertMessage` for inline errors or warnings
- Use the `Empty` component (from `@repo/ui/components/empty`) for empty list/data states

### Use existing components before building new ones

Check `@repo/ui/general/` before writing a new component. Available general components:

| Component | Use for |
|---|---|
| `CustomTable` | Any data table — wraps TanStack Table with sorting, pagination, loading, and empty states built in |
| `CustomAlertDialog` | Confirm/cancel dialogs — destructive actions, sign-out prompts, delete confirmations |
| `LoadingButton` | Any button that triggers an async action — shows spinner, disables automatically |
| `LoadingScreen` | Full-page loading state |
| `UserAvatar` | Displaying a user's avatar with initials fallback |
| `AvatarGroup` | Displaying multiple user avatars stacked |
| `PageContainer` | Wrapping page content with consistent max-width and padding |
| `PaginationControls` | Pagination UI for tables (used internally by `CustomTable`) |
| `AlertMessage` | Inline error, warning, info, or success messages |
| `ColorBadge` | Status/role badges with semantic color mapping |
| `AccessDenied` | 403 / permission denied empty state |
| `RequiredStar` | `*` indicator for required form fields |

Import from `@repo/ui/general/<ComponentName>`.

### Forms

- Use `react-hook-form` + Zod for all forms. Never manage form state manually.
- Use `Controller` from `react-hook-form` with `Field`, `FieldLabel`, `FieldDescription`, and `FieldError` from `@repo/ui/components/field`. Do **not** use the old `Form`/`FormField`/`FormItem`/`FormControl`/`FormLabel`/`FormMessage` components — `@repo/ui/components/form` no longer exists.
- Show field-level validation errors inline using `<FieldError errors={[fieldState.error]} />` — never in a toast.
- Always add `data-invalid={fieldState.invalid}` to `<Field>` and `aria-invalid={fieldState.invalid}` to the input control.
- Use `LoadingButton` for submit buttons — never disable the button manually or show a separate spinner.
- Use `RequiredStar` on required field labels.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
