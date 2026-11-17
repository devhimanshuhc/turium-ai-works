---

## title: API reference
description: The HTTP endpoints exposed by the FastAPI backend.
order: 1

# API reference

Base URL `http://localhost:8000`. Try any endpoint in Swagger at `/docs`.

## Errors

Every error body looks like `{"detail": "<message>"}`. Every response has an
`X-Request-ID` header, and the same id is on every log line for that request,
so you can trace a failure from the browser to the logs.

| Status | When |
| --- | --- |
| 400 | The input can't be used, e.g. an unsupported file or one with no text |
| 404 | Knowledge base, item or chat not found |
| 409 | Knowledge base name already taken |
| 422 | Request body failed validation (field-level details included) |
| 502 | A call out failed: fetching a URL, embeddings or the model |
| 503 | Database is down, or no AI key is configured |

## Endpoints

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/health` | API and database check |
| `POST` | `/knowledge-bases` | Create a knowledge base |
| `GET` | `/knowledge-bases` | List them, with item counts |
| `GET` | `/knowledge-bases/{id}` | Get one |
| `DELETE` | `/knowledge-bases/{id}` | Delete it and everything in it |
| `POST` | `/ingest` | Save a note or a link |
| `POST` | `/ingest/file` | Upload a PDF, DOCX, TXT or Markdown file |
| `GET` | `/items` | List saved items, newest first (`?knowledge_base_id=` to filter) |
| `GET` | `/items/{id}/sections` | See how an item was split into sections and chunks |
| `DELETE` | `/items/{id}` | Delete an item and its chunks |
| `POST` | `/chats` | Start a chat |
| `GET` | `/chats` | List chats, most recent first |
| `GET` | `/chats/{id}` | Get one |
| `GET` | `/chats/{id}/messages` | Chat history, with citations and answer checks |
| `POST` | `/query` | Ask a question; the answer streams back |

## Saving content

`POST /ingest` takes one of:

```json
{ "source_type": "note", "knowledge_base_id": "…", "title": "optional", "content": "text" }
{ "source_type": "url",  "knowledge_base_id": "…", "url": "https://example.com/post" }
```

It returns `202` with the item in `pending`. Fetching, chunking and
embedding happen in the background. Poll `GET /items` until the status is
`ready`, or `failed` with an `error` message.

```json
{
  "id": "…", "knowledge_base_id": "…", "source_type": "url",
  "status": "pending", "title": null, "url": "https://example.com/post",
  "error": null, "content_preview": "", "created_at": "…", "updated_at": "…"
}
```

`POST /ingest/file` takes form fields `knowledge_base_id` and `file` (up to
10 MB). Text is extracted right away, so a bad file fails immediately with
`400`.

## Seeing what was indexed

`GET /items/{id}/sections` returns the item's sections in order. Each section
lists the small chunks that are actually searched, with the one-line context
written for each.

```json
[{ "id": "…", "position": 0, "content": "section text",
   "chunks": [{ "id": "…", "position": 0, "context": "one-line context", "content": "chunk text" }] }]
```

## Deleting

Both delete endpoints return `204`, or `404` if it's already gone. Chunks and
vectors go with them. Chats that used a deleted knowledge base keep their
history but stop searching it. Deleting an item while it's still processing is
safe; the background job notices and stops.

## Chats

```json
{ "title": "optional", "knowledge_base_ids": ["…"] }
```

The knowledge bases are fixed for the life of the chat. The list can be empty:

| `mode` | Created with | Answers come from |
| --- | --- | --- |
| `knowledge_base` | 1 to 10 knowledge bases | Search, with citations and an answer check |
| `general` | none | The model's own knowledge, labelled, no citations |

If every knowledge base in a chat is deleted later, the chat answers "not
found" rather than switching to general knowledge. The title starts as
"New chat" and becomes the first question.

## Asking a question

```json
{ "chat_id": "…", "question": "When are production deploys frozen?" }
```

A missing chat (`404`) or bad body (`422`) is rejected before streaming starts.
After that, the response is a `text/event-stream` of `data: <json>` lines:

| Event | Carries |
| --- | --- |
| `status` | The current step: `planning`, `searching` (with the rewritten `query`), `answering`, `verifying` |
| `sources` | `count` of sections found |
| `token` | `text`, the next piece of the answer |
| `done` | `message`, the saved answer (below) |
| `error` | `detail`, then the stream ends |

```json
{
  "id": "…", "role": "assistant",
  "content": "Production deploys are frozen on Fridays after 14:00 IST [1].",
  "citations": [
    { "number": 1, "item_id": "…", "parent_chunk_id": "…",
      "title": "Project Falcon onboarding guide", "url": null,
      "source_type": "note", "snippet": "the chunk that matched",
      "content": "the full section the model read",
      "score": 0.0328, "cited": true }
  ],
  "grounding": {
    "verdict": "grounded", "unsupported_claims": [],
    "explanation": "Every claim is supported by source 1.",
    "invalid_citations": []
  },
  "created_at": "…"
}
```

`grounding.verdict` is one of:

| Verdict | Meaning |
| --- | --- |
| `grounded` | Every claim is backed by a source |
| `partially_grounded` | Some claims aren't; they're listed in `unsupported_claims` |
| `ungrounded` | The answer isn't backed by the sources |
| `no_answer` | Nothing relevant was found |
| `unverified` | The check itself failed |
| `general_knowledge` | A general chat, so there's nothing to check against |

Related: [Overview](/docs) · [Design decisions](/docs/reference/design-decisions)
