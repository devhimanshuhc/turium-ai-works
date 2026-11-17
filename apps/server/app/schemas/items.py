import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field, HttpUrl, StringConstraints

from app.models import ItemStatus, SourceType

MAX_NOTE_CHARS = 100_000


class NoteIngestRequest(BaseModel):
    source_type: Literal["note"]
    knowledge_base_id: uuid.UUID
    title: (
        Annotated[str, StringConstraints(strip_whitespace=True, max_length=300)] | None
    ) = None
    content: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True, min_length=1, max_length=MAX_NOTE_CHARS
        ),
    ]


class UrlIngestRequest(BaseModel):
    source_type: Literal["url"]
    knowledge_base_id: uuid.UUID
    url: HttpUrl


IngestRequest = Annotated[
    NoteIngestRequest | UrlIngestRequest, Field(discriminator="source_type")
]


class ItemResponse(BaseModel):
    id: uuid.UUID
    knowledge_base_id: uuid.UUID
    source_type: SourceType
    status: ItemStatus
    title: str | None
    url: str | None
    error: str | None
    content_preview: str
    created_at: datetime
    updated_at: datetime


class ChunkResponse(BaseModel):
    id: uuid.UUID
    position: int
    context: str
    content: str


class SectionResponse(BaseModel):
    id: uuid.UUID
    position: int
    content: str
    chunks: list[ChunkResponse]
