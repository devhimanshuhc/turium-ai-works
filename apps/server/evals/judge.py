from pydantic import BaseModel, Field

from app.clients.llm.base import LLMClient

CORRECTNESS_SYSTEM_PROMPT = """You grade answers from a question-answering system \
against a reference answer written by a human.

Score 1-5:
5 = fully correct and complete; matches every fact in the reference.
4 = correct; misses a minor detail or adds harmless extra detail.
3 = partly correct; misses an important fact.
2 = mostly wrong or contradicts the reference on an important point.
1 = wrong, irrelevant, or a refusal.

Citation markers like [1] are expected; ignore them. Judge facts, not style."""


class CorrectnessJudgement(BaseModel):
    score: int = Field(ge=1, le=5)
    reasoning: str


async def judge_correctness(
    llm: LLMClient, question: str, reference: str, answer: str
) -> CorrectnessJudgement:
    return await llm.generate_json(
        system=CORRECTNESS_SYSTEM_PROMPT,
        prompt=(
            f"Question: {question}\n\n<reference>\n{reference}\n</reference>\n\n"
            f"<answer>\n{answer}\n</answer>"
        ),
        schema=CorrectnessJudgement,
        tier="answer",
    )
