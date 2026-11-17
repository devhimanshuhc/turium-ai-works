import uuid
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models import Chunk, Item, ParentChunk
from app.schemas.items import ChunkResponse, SectionResponse


async def list_item_sections(
    session: AsyncSession, item_id: uuid.UUID
) -> list[SectionResponse]:
    """The item's parent sections, each with the child chunks we search over."""
    if await session.get(Item, item_id) is None:
        raise NotFoundError("Item not found")

    parents = await session.scalars(
        select(ParentChunk)
        .where(ParentChunk.item_id == item_id)
        .order_by(ParentChunk.position)
    )
    children = await session.execute(
        select(
            Chunk.id,
            Chunk.parent_chunk_id,
            Chunk.position,
            Chunk.context,
            Chunk.content,
        )
        .where(Chunk.item_id == item_id)
        .order_by(Chunk.position)
    )

    chunks_by_parent: dict[uuid.UUID, list[ChunkResponse]] = defaultdict(list)
    for chunk_id, parent_id, position, context, content in children:
        chunks_by_parent[parent_id].append(
            ChunkResponse(
                id=chunk_id, position=position, context=context, content=content
            )
        )

    return [
        SectionResponse(
            id=parent.id,
            position=parent.position,
            content=parent.content,
            chunks=chunks_by_parent[parent.id],
        )
        for parent in parents
    ]
