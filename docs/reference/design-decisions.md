---
title: Design decisions
description: Tradeoffs behind chunking, retrieval, the vector store, guardrails, and what would change for production.
order: 2
---

# Design decisions

## The flow

```
save content ─► extract text ─► split into chunks ─► add context ─► embed ─► Postgres
                                                                               │
question ─► rewrite follow-ups ─► hybrid search ◄──────────────────────────────┘
         ─► answer with citations (streamed) ─► check the answer ─► save
```

Saving returns `202` straight away. The rest runs in a FastAPI background task,
and the item's status (`pending`, `ready`, `failed`) shows how it went. That
covers the brief's "async" requirement without adding a queue.

## Chunking

**Parent-child.** Each document is split twice:

| | Size | Job |
| --- | --- | --- |
| Child | up to 400 characters, 80 overlap | Gets embedded and searched |
| Parent | up to 2000 characters | Gets sent to the model |

Small chunks match precisely, because one chunk holds about one idea. But 400
characters is too little to answer from, so each match is swapped for the
larger section around it. The overlap means a fact sitting on a boundary can
still be found from either side.

**Contextual.** A chunk like "It was rolled back at 09:58" means nothing on its
own. When content is saved, a fast model writes one line per chunk saying where
it sits ("From the checkout outage postmortem, describing the fix"). That line
is searched along with the chunk. It costs one cheap call per section, and if
that call fails the item is still indexed, just without context.

**Splits** fall on paragraphs, then lines, then sentences, so chunks rarely cut
a sentence in half. Sizes are in characters, not tokens, so no tokenizer is
needed per provider. At these sizes the difference is small.

## Hybrid search

Two searches run over the chat's knowledge bases only:

- **Vector search** finds the same meaning in different words ("who's on call"
  matches "on-call rotation").
- **Full-text search** finds exact words that embeddings blur, like
  `STRIPE_TEST_KEY`, error codes or names.

The two ranked lists are merged with **Reciprocal Rank Fusion**: each chunk
scores `1 / (60 + rank)` from each list, and the scores are added. That avoids
comparing the two searches' raw scores, which are on unrelated scales. The top
5 parent sections go to the model.

## Vector store: Postgres + pgvector

One Docker container holds both the app data and the vectors.

- **Easy filtering.** A chat only searches its own knowledge bases. With
  vectors next to the data, that's a plain `WHERE` clause, with no second
  system to keep in sync.
- **Fast enough.** An HNSW index keeps vector search quick as data grows.
- **Debuggable.** Everything survives restarts, and `psql` shows what was
  stored.
- **Not chosen:** SQLite + sqlite-vec (no Docker needed, but a weaker path to
  production), and Qdrant or Pinecone (an extra system with no benefit at this
  size).

Vectors are stored at 1536 dimensions, which both providers support
(`text-embedding-3-small` and `gemini-embedding-001`). Each chunk records which
model embedded it, so vectors from different models are never compared.
Switching providers means re-adding content.

## AI provider

One key powers everything: `OPENAI_API_KEY`, or `GEMINI_API_KEY` (AI Studio or
Vertex AI). The code talks to small `LLMClient` and `Embedder` interfaces, never
to an SDK directly, which also makes it easy to test with fakes.

| Job | Gemini | OpenAI |
| --- | --- | --- |
| Answers | `gemini-3.5-flash` | `gpt-4.1` |
| Rewriting, context lines, judging | `gemini-3.5-flash-lite` | `gpt-4.1-mini` |
| Embeddings | `gemini-embedding-001` | `text-embedding-3-small` |

Failed calls (rate limits, server errors) are retried twice. If Gemini's answer
model stays overloaded, it falls back to the faster model, but only before any
text has been sent, so you never see two half-answers joined together.

## Chats with no knowledge base

If no knowledge base is ticked, the chat runs in `general` mode: no search, and
every answer is labelled "general knowledge". The mode is saved on the chat, so
deleting a knowledge base later can't quietly turn a sourced chat into an
unsourced one.

## Keeping answers correct

| Where | What it does |
| --- | --- |
| Input | Size limits on questions, notes and files. Links to private or local addresses are refused, on every redirect too. |
| Search | Nothing found means a fixed "not found" reply, and the model is never called. |
| Prompt | Answer only from the sources, cite every claim, and treat source text as data, not instructions. |
| Citations | Citation numbers that point at no source are removed. |
| Judge | A second model checks each claim against the sources. Its verdict (`grounded`, `partially_grounded`, `ungrounded`) is saved and shown as a badge. |

The judge flags problems instead of blocking the answer. By the time it runs,
the answer has already streamed, and a visible "partly supported" badge that
names the weak claim is more useful than a silent retry.

## What breaks at scale

- **Restarts lose work.** Background tasks die with the server, so an item
  being processed stays `pending`.
- **Big files are slow and costly.** Context lines need one model call per
  section, so a 300-page PDF is about 400 calls.
- **Rate limits** are retried but not queued, so a burst of uploads can use up
  the quota.
- **Answers take about 5 seconds**, because rewriting, search, answering and
  judging run one after another.
- **One database** is fine into the low millions of chunks. Past that, index
  build time and memory become the problem.

## What I'd change for production

1. A real job queue with retries for ingestion, and re-queuing stuck items on
   startup.
2. Sign-in, with each customer's data kept separate.
3. A re-ranking model on top of hybrid search, usually the cheapest next
   quality gain.
4. Evals in CI on a bigger question set, blocking releases when quality drops.
5. Lower cost: cache embeddings, skip context lines for short documents, and
   run the judge on a sample.
6. Tracing per step, cost per request, and alerts when the judge flags too many
   answers.

Related: [Overview](/docs) · [API reference](/docs/reference/api) · [Evaluation](/docs/reference/evaluation)
