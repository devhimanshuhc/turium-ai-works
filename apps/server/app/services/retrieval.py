"""Hybrid retrieval: pgvector similarity + Postgres full-text, fused with RRF.

Vectors catch paraphrases ("who is on call" ~ "on-call rotation"); full-text
catches exact tokens embeddings blur (error codes, names, env vars like
STRIPE_TEST_KEY). Reciprocal Rank Fusion merges the two rankings without
having to calibrate cosine distances against ts_rank scores. Matches are found
on small child chunks, then lifted to their parent chunk for the LLM.
"""

import re
import uuid
from dataclasses import dataclass

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.embeddings.base import Embedder
from app.models import Chunk, Item, ParentChunk, SourceType

CANDIDATES_PER_METHOD = 30
RRF_K = 60
MAX_PARENTS = 5
MAX_QUERY_TERMS = 24


@dataclass(frozen=True)
class RetrievedSource:
    parent_chunk_id: uuid.UUID
    item_id: uuid.UUID
    title: str
    url: str | None
    source_type: SourceType
    content: str
    snippet: str
    score: float


@dataclass
class _ChunkHit:
    parent_chunk_id: uuid.UUID
    content: str
    score: float = 0.0


def build_keyword_query(question: str) -> str:
    """OR the question's words so partial matches still rank (AND is too strict)."""
    words = dict.fromkeys(re.findall(r"[a-z0-9_]{2,}", question.lower()))
    return " | ".join(list(words)[:MAX_QUERY_TERMS])


async def _vector_hits(
    session: AsyncSession,
    query_vector: list[float],
    knowledge_base_ids: list[uuid.UUID],
    embedding_model: str,
):
    # Keep scanning the HNSW graph until enough rows survive the KB filter.
    await session.execute(text("SET LOCAL hnsw.iterative_scan = 'relaxed_order'"))
    distance = Chunk.embedding.cosine_distance(query_vector)
    return (
        await session.execute(
            select(Chunk.id, Chunk.parent_chunk_id, Chunk.content)
            .where(
                Chunk.knowledge_base_id.in_(knowledge_base_ids),
                Chunk.embedding_model == embedding_model,
            )
            .order_by(distance)
            .limit(CANDIDATES_PER_METHOD)
        )
    ).all()


async def _keyword_hits(
    session: AsyncSession, question: str, knowledge_base_ids: list[uuid.UUID]
):
    keyword_query = build_keyword_query(question)
    if not keyword_query:
        return []
    ts_query = func.to_tsquery("english", keyword_query)
    rank = func.ts_rank_cd(Chunk.search_vector, ts_query)
    return (
        await session.execute(
            select(Chunk.id, Chunk.parent_chunk_id, Chunk.content)
            .where(
                Chunk.knowledge_base_id.in_(knowledge_base_ids),
                Chunk.search_vector.bool_op("@@")(ts_query),
            )
            .order_by(rank.desc())
            .limit(CANDIDATES_PER_METHOD)
        )
    ).all()


def reciprocal_rank_fusion(*rankings) -> dict[uuid.UUID, _ChunkHit]:
    hits: dict[uuid.UUID, _ChunkHit] = {}
    for ranking in rankings:
        for rank, (chunk_id, parent_chunk_id, content) in enumerate(ranking, start=1):
            hit = hits.setdefault(chunk_id, _ChunkHit(parent_chunk_id, content))
            hit.score += 1 / (RRF_K + rank)
    return hits


def _best_child_per_parent(hits: dict[uuid.UUID, _ChunkHit]) -> list[_ChunkHit]:
    best: dict[uuid.UUID, _ChunkHit] = {}
    for hit in hits.values():
        current = best.get(hit.parent_chunk_id)
        if current is None or hit.score > current.score:
            best[hit.parent_chunk_id] = hit
    return sorted(best.values(), key=lambda hit: hit.score, reverse=True)[:MAX_PARENTS]


async def hybrid_search(
    session: AsyncSession,
    embedder: Embedder,
    question: str,
    knowledge_base_ids: list[uuid.UUID],
) -> list[RetrievedSource]:
    query_vector = await embedder.embed_query(question)
    hits = reciprocal_rank_fusion(
        await _vector_hits(session, query_vector, knowledge_base_ids, embedder.model),
        await _keyword_hits(session, question, knowledge_base_ids),
    )
    top_children = _best_child_per_parent(hits)
    if not top_children:
        return []
    rows = await session.execute(
        select(ParentChunk, Item)
        .join(Item, Item.id == ParentChunk.item_id)
        .where(ParentChunk.id.in_([hit.parent_chunk_id for hit in top_children]))
    )
    parents = {parent.id: (parent, item) for parent, item in rows.all()}
    return [
        RetrievedSource(
            parent_chunk_id=hit.parent_chunk_id,
            item_id=parents[hit.parent_chunk_id][1].id,
            title=parents[hit.parent_chunk_id][1].title or "Untitled",
            url=parents[hit.parent_chunk_id][1].url,
            source_type=parents[hit.parent_chunk_id][1].source_type,
            content=parents[hit.parent_chunk_id][0].content,
            snippet=hit.content,
            score=round(hit.score, 4),
        )
        for hit in top_children
        if hit.parent_chunk_id in parents
    ]
