import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models import Chat, ChatMode, Message
from app.schemas.chats import (
    ChatCreate,
    ChatResponse,
    KnowledgeBaseSummary,
    MessageResponse,
)
from app.services.knowledge_bases import ensure_knowledge_bases_exist

DEFAULT_CHAT_TITLE = "New chat"
TITLE_FROM_QUESTION_CHARS = 60


def to_chat_response(chat: Chat) -> ChatResponse:
    return ChatResponse(
        id=chat.id,
        title=chat.title,
        mode=chat.mode,
        knowledge_bases=[
            KnowledgeBaseSummary(id=knowledge_base.id, name=knowledge_base.name)
            for knowledge_base in chat.knowledge_bases
        ],
        created_at=chat.created_at,
        updated_at=chat.updated_at,
    )


def to_message_response(message: Message) -> MessageResponse:
    return MessageResponse.model_validate(message, from_attributes=True)


async def create_chat(session: AsyncSession, data: ChatCreate) -> Chat:
    knowledge_bases = await ensure_knowledge_bases_exist(
        session, data.knowledge_base_ids
    )
    chat = Chat(
        title=data.title or DEFAULT_CHAT_TITLE,
        mode=ChatMode.KNOWLEDGE_BASE if knowledge_bases else ChatMode.GENERAL,
        knowledge_bases=knowledge_bases,
    )
    session.add(chat)
    await session.commit()
    await session.refresh(chat)
    return chat


async def list_chats(session: AsyncSession) -> list[Chat]:
    return list(
        (await session.scalars(select(Chat).order_by(Chat.updated_at.desc()))).all()
    )


async def get_chat(session: AsyncSession, chat_id: uuid.UUID) -> Chat:
    chat = await session.get(Chat, chat_id)
    if chat is None:
        raise NotFoundError("Chat not found")
    return chat


async def list_messages(session: AsyncSession, chat_id: uuid.UUID) -> list[Message]:
    await get_chat(session, chat_id)
    return list(
        (
            await session.scalars(
                select(Message)
                .where(Message.chat_id == chat_id)
                .order_by(Message.created_at)
            )
        ).all()
    )


def title_from_question(question: str) -> str:
    title = question.strip().splitlines()[0]
    if len(title) <= TITLE_FROM_QUESTION_CHARS:
        return title
    return title[:TITLE_FROM_QUESTION_CHARS].rsplit(" ", 1)[0] + "…"
