import enum
import uuid

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UuidPrimaryKeyMixin, string_enum


class SourceType(enum.StrEnum):
    NOTE = "note"
    URL = "url"
    FILE = "file"


class ItemStatus(enum.StrEnum):
    PENDING = "pending"
    READY = "ready"
    FAILED = "failed"


class Item(UuidPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "items"
    __table_args__ = (
        Index("ix_items_knowledge_base_created", "knowledge_base_id", "created_at"),
    )

    knowledge_base_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("knowledge_bases.id", ondelete="CASCADE")
    )
    source_type: Mapped[SourceType] = mapped_column(string_enum(SourceType))
    status: Mapped[ItemStatus] = mapped_column(
        string_enum(ItemStatus), default=ItemStatus.PENDING
    )
    title: Mapped[str | None] = mapped_column(String(300))
    url: Mapped[str | None] = mapped_column(Text)
    raw_content: Mapped[str] = mapped_column(Text, default="")
    error: Mapped[str | None] = mapped_column(Text)
