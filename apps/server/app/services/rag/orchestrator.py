"""The answer flow for one question, emitted as a stream of events:

planner (rewrite follow-ups) -> hybrid retrieval -> answerer (streamed)
-> guardrails (citation check + groundedness judge) -> persist
"""

import time
import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.clients.embeddings.base import Embedder
from app.clients.llm.base import LLMClient
from app.core.errors import AppError
from app.core.logging import logger
from app.models import Chat, ChatMode, Message, MessageRole
from app.schemas.chats import Citation, Grounding
from app.services.chats import (
    DEFAULT_CHAT_TITLE,
    title_from_question,
    to_message_response,
)
from app.services.rag.guardrails import (
    check_citations,
    is_no_answer,
    judge_groundedness,
)
from app.services.rag.planner import plan_search_query
from app.services.rag.prompts import (
    ANSWER_SYSTEM_PROMPT,
    GENERAL_SYSTEM_PROMPT,
    NO_ANSWER,
    build_answer_prompt,
    build_general_prompt,
)
from app.services.retrieval import RetrievedSource, hybrid_search

HISTORY_TURNS = 6
Event = dict[str, Any]


@dataclass
class _Draft:
    answer: str = ""
    citations: list[Citation] = field(default_factory=list)
    grounding: Grounding = field(
        default_factory=lambda: Grounding(verdict="unverified")
    )


def _status(stage: str, **details: Any) -> Event:
    return {"type": "status", "stage": stage, **details}


def _citations(sources: list[RetrievedSource], cited: set[int]) -> list[Citation]:
    return [
        Citation(
            number=number,
            item_id=source.item_id,
            parent_chunk_id=source.parent_chunk_id,
            title=source.title,
            url=source.url,
            source_type=source.source_type,
            snippet=source.snippet,
            content=source.content,
            score=source.score,
            cited=number in cited,
        )
        for number, source in enumerate(sources, start=1)
    ]


class RagOrchestrator:
    def __init__(
        self,
        session_factory: async_sessionmaker[AsyncSession],
        llm: LLMClient,
        embedder: Embedder,
    ):
        self._session_factory = session_factory
        self._llm = llm
        self._embedder = embedder

    async def answer(self, chat_id: uuid.UUID, question: str) -> AsyncIterator[Event]:
        started = time.perf_counter()
        try:
            async with self._session_factory() as session:
                async for event in self._run(session, chat_id, question):
                    yield event
        except AppError as exc:
            logger.warning(
                "answer failed", extra={"chat_id": str(chat_id), "error": exc.detail}
            )
            yield {"type": "error", "detail": exc.detail}
        except Exception:
            logger.exception("answer crashed", extra={"chat_id": str(chat_id)})
            yield {"type": "error", "detail": "Something went wrong while answering"}
        logger.info(
            "answer finished",
            extra={
                "chat_id": str(chat_id),
                "duration_ms": round((time.perf_counter() - started) * 1000),
            },
        )

    async def _run(
        self, session: AsyncSession, chat_id: uuid.UUID, question: str
    ) -> AsyncIterator[Event]:
        chat = await session.get(Chat, chat_id)
        assert chat is not None, "router validates the chat exists"
        history = await self._recent_history(session, chat_id)
        await self._save_user_message(session, chat, question, is_first=not history)

        draft = _Draft()
        if chat.mode == ChatMode.GENERAL:
            steps = self._answer_from_general_knowledge(question, history, draft)
        else:
            steps = self._answer_from_knowledge_bases(
                session, chat, question, history, draft
            )
        async for event in steps:
            yield event

        message = await self._save_assistant_message(session, chat, draft)
        logger.info(
            "answer saved",
            extra={
                "chat_id": str(chat_id),
                "mode": chat.mode,
                "sources": len(draft.citations),
                "cited": sum(citation.cited for citation in draft.citations),
                "verdict": draft.grounding.verdict,
            },
        )
        yield {
            "type": "done",
            "message": to_message_response(message).model_dump(mode="json"),
        }

    async def _answer_from_general_knowledge(
        self, question: str, history: list[Message], draft: _Draft
    ) -> AsyncIterator[Event]:
        yield _status("answering")
        async for token in self._llm.stream_text(
            system=GENERAL_SYSTEM_PROMPT, prompt=build_general_prompt(question, history)
        ):
            draft.answer += token
            yield {"type": "token", "text": token}
        draft.grounding = Grounding(verdict="general_knowledge")

    async def _answer_from_knowledge_bases(
        self,
        session: AsyncSession,
        chat: Chat,
        question: str,
        history: list[Message],
        draft: _Draft,
    ) -> AsyncIterator[Event]:
        if history:
            yield _status("planning")
        search_query = await plan_search_query(self._llm, question, history)

        yield _status("searching", query=search_query)
        sources = await hybrid_search(
            session,
            self._embedder,
            search_query,
            [kb.id for kb in chat.knowledge_bases],
        )
        yield {"type": "sources", "count": len(sources)}

        if sources:
            yield _status("answering")
            async for token in self._llm.stream_text(
                system=ANSWER_SYSTEM_PROMPT,
                prompt=build_answer_prompt(question, sources, history),
            ):
                draft.answer += token
                yield {"type": "token", "text": token}
        else:
            draft.answer = NO_ANSWER
            yield {"type": "token", "text": draft.answer}

        yield _status("verifying")
        draft.answer, draft.citations, draft.grounding = await self._apply_guardrails(
            question, draft.answer, sources
        )

    async def _apply_guardrails(
        self, question: str, answer: str, sources: list[RetrievedSource]
    ) -> tuple[str, list[Citation], Grounding]:
        if not sources or is_no_answer(answer):
            return answer, _citations(sources, set()), Grounding(verdict="no_answer")
        check = check_citations(answer, len(sources))
        grounding = await judge_groundedness(self._llm, question, check.answer, sources)
        grounding.invalid_citations = check.invalid_numbers
        return check.answer, _citations(sources, check.cited_numbers), grounding

    @staticmethod
    async def _recent_history(
        session: AsyncSession, chat_id: uuid.UUID
    ) -> list[Message]:
        recent = (
            await session.scalars(
                select(Message)
                .where(Message.chat_id == chat_id)
                .order_by(Message.created_at.desc())
                .limit(HISTORY_TURNS)
            )
        ).all()
        return list(reversed(recent))

    @staticmethod
    async def _save_user_message(
        session: AsyncSession, chat: Chat, question: str, is_first: bool
    ) -> None:
        if is_first and chat.title == DEFAULT_CHAT_TITLE:
            chat.title = title_from_question(question)
        session.add(Message(chat_id=chat.id, role=MessageRole.USER, content=question))
        await session.commit()

    @staticmethod
    async def _save_assistant_message(
        session: AsyncSession, chat: Chat, draft: _Draft
    ) -> Message:
        message = Message(
            chat_id=chat.id,
            role=MessageRole.ASSISTANT,
            content=draft.answer,
            citations=[
                citation.model_dump(mode="json") for citation in draft.citations
            ],
            grounding=draft.grounding.model_dump(mode="json"),
        )
        session.add(message)
        chat.updated_at = func.now()
        await session.commit()
        await session.refresh(message)
        return message
