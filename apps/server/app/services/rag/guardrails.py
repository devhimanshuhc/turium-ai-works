"""Output guardrails: deterministic citation checks, then an LLM-as-judge
groundedness check of the final answer against the retrieved sources."""

import re
from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel

from app.clients.errors import LLMError
from app.clients.llm.base import LLMClient
from app.core.logging import logger
from app.schemas.chats import Grounding
from app.services.rag.prompts import JUDGE_SYSTEM_PROMPT, NO_ANSWER, format_sources
from app.services.retrieval import RetrievedSource

CITATION_PATTERN = re.compile(r"\[(\d+)\]")


@dataclass(frozen=True)
class CitationCheck:
    answer: str
    cited_numbers: set[int]
    invalid_numbers: list[int]


class JudgeVerdict(BaseModel):
    verdict: Literal["grounded", "partially_grounded", "ungrounded"]
    unsupported_claims: list[str]
    explanation: str


def is_no_answer(answer: str) -> bool:
    return answer.strip().rstrip(".") == NO_ANSWER.rstrip(".")


def check_citations(answer: str, source_count: int) -> CitationCheck:
    """Drop citation markers that point at sources that do not exist."""
    numbers = [int(match) for match in CITATION_PATTERN.findall(answer)]
    invalid = sorted({number for number in numbers if not 1 <= number <= source_count})
    cleaned = CITATION_PATTERN.sub(
        lambda match: match.group(0) if int(match.group(1)) not in invalid else "",
        answer,
    )
    return CitationCheck(
        answer=cleaned,
        cited_numbers={number for number in numbers if number not in invalid},
        invalid_numbers=invalid,
    )


async def judge_groundedness(
    llm: LLMClient, question: str, answer: str, sources: list[RetrievedSource]
) -> Grounding:
    try:
        result = await llm.generate_json(
            system=JUDGE_SYSTEM_PROMPT,
            prompt=(
                f"{format_sources(sources)}\n\nQuestion: {question}\n\n"
                f"<answer>\n{answer}\n</answer>"
            ),
            schema=JudgeVerdict,
        )
    except LLMError as exc:
        logger.warning("groundedness judge failed", extra={"error": exc.detail})
        return Grounding(verdict="unverified", explanation="Verification unavailable.")
    return Grounding(
        verdict=result.verdict,
        unsupported_claims=result.unsupported_claims,
        explanation=result.explanation,
    )
