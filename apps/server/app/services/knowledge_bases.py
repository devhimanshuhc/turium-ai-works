import uuid

from sqlalchemy import Select, delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.models import Item, KnowledgeBase
from app.schemas.knowledge_bases import KnowledgeBaseCreate, KnowledgeBaseResponse


def _to_response(
    knowledge_base: KnowledgeBase, item_count: int
) -> KnowledgeBaseResponse:
    return KnowledgeBaseResponse(
        id=knowledge_base.id,
        name=knowledge_base.name,
        description=knowledge_base.description,
        item_count=item_count,
        created_at=knowledge_base.created_at,
    )


async def create_knowledge_base(
    session: AsyncSession, data: KnowledgeBaseCreate
) -> KnowledgeBaseResponse:
    knowledge_base = KnowledgeBase(name=data.name, description=data.description)
    session.add(knowledge_base)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise ConflictError(
            f"A knowledge base named '{data.name}' already exists"
        ) from exc
    await session.refresh(knowledge_base)
    return _to_response(knowledge_base, item_count=0)


def _with_item_counts() -> Select[KnowledgeBase, int]:
    return (
        select(KnowledgeBase, func.count(Item.id))
        .outerjoin(Item, Item.knowledge_base_id == KnowledgeBase.id)
        .group_by(KnowledgeBase.id)
    )


async def list_knowledge_bases(session: AsyncSession) -> list[KnowledgeBaseResponse]:
    rows = await session.execute(_with_item_counts().order_by(KnowledgeBase.created_at))
    return [_to_response(knowledge_base, count) for knowledge_base, count in rows.all()]


async def get_knowledge_base(
    session: AsyncSession, knowledge_base_id: uuid.UUID
) -> KnowledgeBaseResponse:
    row = (
        await session.execute(
            _with_item_counts().where(KnowledgeBase.id == knowledge_base_id)
        )
    ).first()
    if row is None:
        raise NotFoundError("Knowledge base not found")
    knowledge_base, item_count = row
    return _to_response(knowledge_base, item_count)


async def ensure_knowledge_bases_exist(
    session: AsyncSession, knowledge_base_ids: list[uuid.UUID]
) -> list[KnowledgeBase]:
    found = (
        await session.scalars(
            select(KnowledgeBase).where(KnowledgeBase.id.in_(knowledge_base_ids))
        )
    ).all()
    if len(found) != len(set(knowledge_base_ids)):
        raise NotFoundError("One or more knowledge bases were not found")
    return list(found)


async def delete_knowledge_base(
    session: AsyncSession, knowledge_base_id: uuid.UUID
) -> None:
    """Items, chunks and chat links are removed by ON DELETE CASCADE.
    Chats keep their history but stop searching this knowledge base."""
    deleted_id = await session.scalar(
        delete(KnowledgeBase)
        .where(KnowledgeBase.id == knowledge_base_id)
        .returning(KnowledgeBase.id)
    )
    if deleted_id is None:
        raise NotFoundError("Knowledge base not found")
    await session.commit()
