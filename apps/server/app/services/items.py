import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models import Item, SourceType
from app.schemas.items import ItemResponse, NoteIngestRequest, UrlIngestRequest
from app.services.knowledge_bases import ensure_knowledge_bases_exist

PREVIEW_CHARS = 200
TITLE_FROM_CONTENT_CHARS = 80


def to_item_response(item: Item) -> ItemResponse:
    return ItemResponse(
        id=item.id,
        knowledge_base_id=item.knowledge_base_id,
        source_type=item.source_type,
        status=item.status,
        title=item.title,
        url=item.url,
        error=item.error,
        content_preview=item.raw_content[:PREVIEW_CHARS],
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def _title_from_content(content: str) -> str:
    first_line = content.strip().splitlines()[0]
    return first_line[:TITLE_FROM_CONTENT_CHARS]


async def _save(session: AsyncSession, item: Item) -> Item:
    await ensure_knowledge_bases_exist(session, [item.knowledge_base_id])
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item


async def create_note_item(session: AsyncSession, request: NoteIngestRequest) -> Item:
    return await _save(
        session,
        Item(
            knowledge_base_id=request.knowledge_base_id,
            source_type=SourceType.NOTE,
            title=request.title or _title_from_content(request.content),
            raw_content=request.content,
        ),
    )


async def create_url_item(session: AsyncSession, request: UrlIngestRequest) -> Item:
    return await _save(
        session,
        Item(
            knowledge_base_id=request.knowledge_base_id,
            source_type=SourceType.URL,
            url=str(request.url),
        ),
    )


async def create_file_item(
    session: AsyncSession, knowledge_base_id: uuid.UUID, filename: str, text: str
) -> Item:
    return await _save(
        session,
        Item(
            knowledge_base_id=knowledge_base_id,
            source_type=SourceType.FILE,
            title=filename[:300],
            raw_content=text,
        ),
    )


async def list_items(
    session: AsyncSession, knowledge_base_id: uuid.UUID | None
) -> list[Item]:
    query = select(Item).order_by(Item.created_at.desc())
    if knowledge_base_id is not None:
        query = query.where(Item.knowledge_base_id == knowledge_base_id)
    return list((await session.scalars(query)).all())


async def delete_item(session: AsyncSession, item_id: uuid.UUID) -> None:
    """Its parent and child chunks are removed by ON DELETE CASCADE."""
    deleted_id = await session.scalar(
        delete(Item).where(Item.id == item_id).returning(Item.id)
    )
    if deleted_id is None:
        raise NotFoundError("Item not found")
    await session.commit()
