import time
import uuid

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.clients.embeddings.base import Embedder
from app.clients.web_fetcher import WebFetcher
from app.core.errors import AppError, BadRequestError
from app.core.logging import logger
from app.models import Chunk, Item, ItemStatus, ParentChunk, SourceType
from app.services.ingestion.chunking import ParentDraft, chunk_document
from app.services.ingestion.contextualizer import Contextualizer

UNEXPECTED_FAILURE_MESSAGE = "Unexpected error while processing this item"


def _embedding_input(context: str, content: str) -> str:
    return f"{context}\n\n{content}" if context else content


class IngestionPipeline:
    """Turns a pending item into searchable parent and child chunks."""

    def __init__(
        self,
        session_factory: async_sessionmaker[AsyncSession],
        fetcher: WebFetcher,
        contextualizer: Contextualizer,
        embedder: Embedder,
    ):
        self._session_factory = session_factory
        self._fetcher = fetcher
        self._contextualizer = contextualizer
        self._embedder = embedder

    async def process(self, item_id: uuid.UUID) -> None:
        started = time.perf_counter()
        async with self._session_factory() as session:
            item = await session.get(Item, item_id)
            if item is None:
                logger.warning(
                    "item vanished before processing", extra={"item_id": str(item_id)}
                )
                return
            try:
                chunk_count = await self._index(session, item)
            except AppError as exc:
                await self._mark_failed(session, item_id, exc.detail)
                return
            except Exception:
                await session.rollback()
                if await session.get(Item, item_id) is None:
                    logger.info(
                        "item deleted while processing", extra={"item_id": str(item_id)}
                    )
                    return
                logger.exception("ingestion crashed", extra={"item_id": str(item_id)})
                await self._mark_failed(session, item_id, UNEXPECTED_FAILURE_MESSAGE)
                return
        logger.info(
            "item indexed",
            extra={
                "item_id": str(item_id),
                "source_type": item.source_type,
                "chunks": chunk_count,
                "duration_ms": round((time.perf_counter() - started) * 1000),
            },
        )

    async def _index(self, session: AsyncSession, item: Item) -> int:
        if item.source_type == SourceType.URL:
            await self._fetch(item)
        if not item.raw_content.strip():
            raise BadRequestError("There is no text to index")

        parents = chunk_document(item.raw_content)
        contexts = await self._contextualizer.contextualize(
            item.title or "Untitled", item.raw_content, parents
        )
        children = [
            (parent_index, child, context)
            for parent_index, (parent, parent_contexts) in enumerate(
                zip(parents, contexts, strict=True)
            )
            for child, context in zip(parent.children, parent_contexts, strict=True)
        ]
        embeddings = await self._embedder.embed_documents(
            [_embedding_input(context, child) for _, child, context in children]
        )
        await self._store(session, item, parents, children, embeddings)
        item.status = ItemStatus.READY
        item.error = None
        await session.commit()
        return len(children)

    async def _fetch(self, item: Item) -> None:
        assert item.url is not None
        page = await self._fetcher.fetch(item.url)
        item.title = (page.title or item.url)[:300]
        item.raw_content = page.text

    async def _store(
        self,
        session: AsyncSession,
        item: Item,
        parents: list[ParentDraft],
        children: list[tuple[int, str, str]],
        embeddings: list[list[float]],
    ) -> None:
        parent_rows = [
            ParentChunk(
                id=uuid.uuid4(), item_id=item.id, position=index, content=parent.content
            )
            for index, parent in enumerate(parents)
        ]
        session.add_all(parent_rows)
        await session.flush()
        session.add_all(
            Chunk(
                parent_chunk_id=parent_rows[parent_index].id,
                item_id=item.id,
                knowledge_base_id=item.knowledge_base_id,
                position=position,
                content=child,
                context=context,
                embedding=embedding,
                embedding_model=self._embedder.model,
            )
            for position, ((parent_index, child, context), embedding) in enumerate(
                zip(children, embeddings, strict=True)
            )
        )

    @staticmethod
    async def _mark_failed(
        session: AsyncSession, item_id: uuid.UUID, reason: str
    ) -> None:
        await session.rollback()
        item = await session.get(Item, item_id)
        if item is None:
            return
        item.status = ItemStatus.FAILED
        item.error = reason
        await session.commit()
        logger.warning("item failed", extra={"item_id": str(item_id), "reason": reason})
