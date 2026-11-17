import enum

from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UuidPrimaryKeyMixin, string_enum
from app.models.knowledge_base import KnowledgeBase


class ChatMode(enum.StrEnum):
    KNOWLEDGE_BASE = "knowledge_base"
    GENERAL = "general"


chat_knowledge_bases = Table(
    "chat_knowledge_bases",
    Base.metadata,
    Column("chat_id", ForeignKey("chats.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "knowledge_base_id",
        ForeignKey("knowledge_bases.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Chat(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "chats"

    title: Mapped[str] = mapped_column(String(200))
    # Fixed at creation: a chat whose knowledge bases are later deleted must not
    # silently start answering from general knowledge.
    mode: Mapped[ChatMode] = mapped_column(
        string_enum(ChatMode), server_default=ChatMode.KNOWLEDGE_BASE.value
    )
    knowledge_bases: Mapped[list[KnowledgeBase]] = relationship(
        secondary=chat_knowledge_bases, lazy="selectin"
    )
