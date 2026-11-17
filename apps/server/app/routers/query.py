import json
from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.dependencies import RagOrchestratorDep, SessionDep
from app.schemas.chats import QueryRequest
from app.services.chats import get_chat

router = APIRouter(prefix="/query", tags=["query"])


async def _as_server_sent_events(events: AsyncIterator[dict[str, Any]]):
    async for event in events:
        yield f"data: {json.dumps(event, default=str)}\n\n"


@router.post(
    "",
    response_class=StreamingResponse,
    responses={200: {"content": {"text/event-stream": {}}}},
)
async def query(
    body: QueryRequest, session: SessionDep, orchestrator: RagOrchestratorDep
):
    """Answer a question over the chat's knowledge bases as Server-Sent Events.

    Event types: `status` (planning | searching | answering | verifying),
    `sources`, `token`, `done` (the saved assistant message with citations and
    grounding verdict) and `error`.
    """
    await get_chat(session, body.chat_id)
    return StreamingResponse(
        _as_server_sent_events(orchestrator.answer(body.chat_id, body.question)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
