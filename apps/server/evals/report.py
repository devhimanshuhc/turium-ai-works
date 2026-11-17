import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

from evals.metrics import CaseResult

PERCENT_METRICS = {
    "pass_rate",
    "retrieval_hit_rate",
    "retrieval_recall",
    "retrieval_mrr",
    "answer_correct_rate",
    "faithfulness",
    "refusal_accuracy",
    "false_refusal_rate",
}


def _format(key: str, value: float) -> str:
    if key in PERCENT_METRICS:
        return f"{value:.0%}"
    return (
        f"{value:.0f}"
        if key.startswith("latency") or key == "cases"
        else f"{value:.2f}"
    )


def _case_row(result: CaseResult) -> str:
    rank = result.first_relevant_rank if result.answerable else "—"
    correctness = result.correctness if result.correctness is not None else "—"
    status = "✅" if result.passed else "❌"
    return (
        f"| {status} | `{result.case_id}` | {rank or 'miss'} | {correctness} "
        f"| {result.verdict} | {result.latency_ms} |"
    )


def write_report(
    directory: Path,
    run_at: datetime,
    provider: str,
    embedding_model: str,
    summary: dict[str, float],
    results: list[CaseResult],
) -> Path:
    directory.mkdir(exist_ok=True)
    stamp = run_at.strftime("%Y%m%d-%H%M%S")
    lines = [
        f"# Eval report — {run_at:%Y-%m-%d %H:%M} UTC",
        "",
        f"Provider: **{provider}** · Embeddings: **{embedding_model}**",
        "",
        "| Metric | Value |",
        "|---|---|",
        *(f"| {key} | {_format(key, value)} |" for key, value in summary.items()),
        "",
        "| | Case | First relevant rank | Correctness (1-5) | Grounding | Latency ms |",
        "|---|---|---|---|---|---|",
        *(_case_row(result) for result in results),
        "",
        "## Failures",
        "",
    ]
    for result in results:
        if not result.passed:
            lines += [
                f"### `{result.case_id}`",
                f"- Question: {result.question}",
                f"- Answer: {result.answer or result.error}",
                f"- Judge: {result.correctness_reasoning or '—'}",
                "",
            ]
    markdown_path = directory / f"{stamp}.md"
    markdown_path.write_text("\n".join(lines))
    (directory / f"{stamp}.json").write_text(
        json.dumps(
            {"summary": summary, "cases": [asdict(result) for result in results]},
            indent=2,
            default=str,
        )
    )
    return markdown_path
