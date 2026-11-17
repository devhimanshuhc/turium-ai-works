from pydantic import BaseModel

from app.clients.errors import LLMError
from app.clients.llm.base import LLMClient
from app.core.logging import logger
from app.models import Message
from app.services.rag.prompts import PLANNER_SYSTEM_PROMPT, format_history


class StandaloneQuestion(BaseModel):
    question: str


async def plan_search_query(
    llm: LLMClient, question: str, history: list[Message]
) -> str:
    """Turn a follow-up like "and who owns it?" into a searchable question."""
    if not history:
        return question
    try:
        result = await llm.generate_json(
            system=PLANNER_SYSTEM_PROMPT,
            prompt=f"{format_history(history)}\n\nLatest message: {question}",
            schema=StandaloneQuestion,
        )
    except LLMError as exc:
        logger.warning(
            "planner failed, using raw question", extra={"error": exc.detail}
        )
        return question
    return result.question.strip() or question
