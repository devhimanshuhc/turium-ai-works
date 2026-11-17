from dataclasses import dataclass, field
from statistics import mean, median

FAITHFULNESS_SCORES = {"grounded": 1.0, "partially_grounded": 0.5, "ungrounded": 0.0}
CORRECT_THRESHOLD = 4


@dataclass
class CaseResult:
    case_id: str
    question: str
    answerable: bool
    answer: str
    refused: bool
    retrieved_titles: list[str]
    expected_titles: list[str]
    verdict: str
    latency_ms: int
    correctness: int | None = None
    correctness_reasoning: str = ""
    error: str | None = None
    notes: list[str] = field(default_factory=list)

    @property
    def first_relevant_rank(self) -> int | None:
        for rank, title in enumerate(self.retrieved_titles, start=1):
            if title in self.expected_titles:
                return rank
        return None

    @property
    def recall(self) -> float:
        found = set(self.expected_titles) & set(self.retrieved_titles)
        return len(found) / len(self.expected_titles)

    @property
    def passed(self) -> bool:
        if self.error:
            return False
        if not self.answerable:
            return self.refused
        return (self.correctness or 0) >= CORRECT_THRESHOLD


def summarize(results: list[CaseResult]) -> dict[str, float]:
    answerable = [result for result in results if result.answerable]
    unanswerable = [result for result in results if not result.answerable]
    ranks = [result.first_relevant_rank for result in answerable]
    judged = [result for result in answerable if result.correctness is not None]
    faithful = [
        FAITHFULNESS_SCORES[result.verdict]
        for result in answerable
        if result.verdict in FAITHFULNESS_SCORES
    ]
    return {
        "cases": len(results),
        "pass_rate": mean(result.passed for result in results),
        "retrieval_hit_rate": mean(rank is not None for rank in ranks),
        "retrieval_recall": mean(result.recall for result in answerable),
        "retrieval_mrr": mean(1 / rank if rank else 0.0 for rank in ranks),
        "answer_correct_rate": mean(
            (result.correctness or 0) >= CORRECT_THRESHOLD for result in judged
        ),
        "answer_correctness_mean": mean(result.correctness or 0 for result in judged),
        "faithfulness": mean(faithful) if faithful else 0.0,
        "refusal_accuracy": mean(result.refused for result in unanswerable),
        "false_refusal_rate": mean(result.refused for result in answerable),
        "latency_p50_ms": median(result.latency_ms for result in results),
        "latency_max_ms": max(result.latency_ms for result in results),
    }
