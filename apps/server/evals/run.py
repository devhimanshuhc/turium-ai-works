"""Offline evaluation of the full RAG pipeline against a golden dataset.

    pnpm --filter server eval

Ingests evals/corpus into a throwaway knowledge base using the configured
provider, asks every question in dataset.json in a fresh chat, scores
retrieval, correctness (LLM-as-judge vs reference), faithfulness (the app's own
groundedness guardrail) and refusals, writes evals/reports/, then deletes
everything it created.
"""

import asyncio
import json
import time
import uuid
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import delete

from app.clients.providers import get_embedder, get_llm
from app.clients.web_fetcher import create_web_fetcher
from app.core.logging import configure_logging
from app.db.session import SessionFactory, engine
from app.models import Chat, Item, ItemStatus, KnowledgeBase, SourceType
from app.services.ingestion.contextualizer import Contextualizer
from app.services.ingestion.pipeline import IngestionPipeline
from app.services.rag.guardrails import is_no_answer
from app.services.rag.orchestrator import RagOrchestrator
from evals.judge import judge_correctness
from evals.metrics import CaseResult, summarize
from evals.report import write_report

EVALS_DIR = Path(__file__).parent


async def _ingest_corpus(pipeline: IngestionPipeline) -> uuid.UUID:
    async with SessionFactory() as session:
        knowledge_base = KnowledgeBase(name=f"eval-{uuid.uuid4().hex[:8]}")
        items = [
            Item(
                source_type=SourceType.FILE,
                title=path.name,
                raw_content=path.read_text(),
            )
            for path in sorted((EVALS_DIR / "corpus").glob("*.md"))
        ]
        session.add(knowledge_base)
        await session.flush()
        for item in items:
            item.knowledge_base_id = knowledge_base.id
        session.add_all(items)
        await session.commit()
        item_ids = [item.id for item in items]
    await asyncio.gather(*(pipeline.process(item_id) for item_id in item_ids))
    async with SessionFactory() as session:
        for item_id in item_ids:
            item = await session.get(Item, item_id)
            assert item and item.status == ItemStatus.READY, (
                f"ingestion failed: {item and item.error}"
            )
    return knowledge_base.id


async def _ask(
    orchestrator: RagOrchestrator, knowledge_base_id: uuid.UUID, question: str
) -> tuple[dict | None, str | None, int]:
    async with SessionFactory() as session:
        chat = Chat(
            title="eval",
            knowledge_bases=[await session.get(KnowledgeBase, knowledge_base_id)],
        )
        session.add(chat)
        await session.commit()
        chat_id = chat.id
    started = time.perf_counter()
    message, error = None, None
    async for event in orchestrator.answer(chat_id, question):
        if event["type"] == "done":
            message = event["message"]
        elif event["type"] == "error":
            error = event["detail"]
    return message, error, round((time.perf_counter() - started) * 1000)


async def _evaluate_case(
    case: dict, orchestrator, llm, knowledge_base_id
) -> CaseResult:
    message, error, latency_ms = await _ask(
        orchestrator, knowledge_base_id, case["question"]
    )
    answer = message["content"] if message else ""
    result = CaseResult(
        case_id=case["id"],
        question=case["question"],
        answerable=case["reference"] is not None,
        answer=answer,
        refused=is_no_answer(answer),
        retrieved_titles=[
            citation["title"] for citation in (message or {}).get("citations") or []
        ],
        expected_titles=case["sources"],
        verdict=(message or {}).get("grounding", {}).get("verdict", "error"),
        latency_ms=latency_ms,
        error=error,
    )
    if result.answerable and message:
        judgement = await judge_correctness(
            llm, case["question"], case["reference"], answer
        )
        result.correctness, result.correctness_reasoning = (
            judgement.score,
            judgement.reasoning,
        )
    return result


async def _cleanup(knowledge_base_id: uuid.UUID) -> None:
    async with SessionFactory() as session:
        await session.execute(delete(Chat).where(Chat.title == "eval"))
        await session.execute(
            delete(KnowledgeBase).where(KnowledgeBase.id == knowledge_base_id)
        )
        await session.commit()


async def main() -> None:
    configure_logging("WARNING")
    llm, embedder = get_llm(), get_embedder()
    pipeline = IngestionPipeline(
        SessionFactory, create_web_fetcher(), Contextualizer(llm), embedder
    )
    orchestrator = RagOrchestrator(SessionFactory, llm, embedder)
    dataset = json.loads((EVALS_DIR / "dataset.json").read_text())

    print(f"Provider: {llm.provider} | embeddings: {embedder.model}")
    print(f"Ingesting {len(list((EVALS_DIR / 'corpus').glob('*.md')))} documents...")
    knowledge_base_id = await _ingest_corpus(pipeline)
    try:
        results = []
        for case in dataset:
            result = await _evaluate_case(case, orchestrator, llm, knowledge_base_id)
            mark = "PASS" if result.passed else "FAIL"
            print(f"  [{mark}] {result.case_id} ({result.latency_ms} ms)")
            results.append(result)
    finally:
        await _cleanup(knowledge_base_id)
        await engine.dispose()

    summary = summarize(results)
    report_path = write_report(
        EVALS_DIR / "reports",
        datetime.now(UTC),
        llm.provider,
        embedder.model,
        summary,
        results,
    )
    print("\n" + "\n".join(f"{key:>24}: {value:.3g}" for key, value in summary.items()))
    print(f"\nReport: {report_path}")


if __name__ == "__main__":
    asyncio.run(main())
