import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints

from app.models import ChatMode, MessageRole, SourceType

MAX_KNOWLEDGE_BASES_PER_CHAT = 10
MAX_QUESTION_CHARS = 2000

GroundingVerdict = Literal[
    "grounded",
    "partially_grounded",
    "ungrounded",
    "no_answer",
    "unverified",
    "general_knowledge",
]


class ChatCreate(BaseModel):
    title: (
        Annotated[str, StringConstraints(strip_whitespace=True, max_length=200)] | None
    ) = None
    knowledge_base_ids: list[uuid.UUID] = Field(
        default=[], max_length=MAX_KNOWLEDGE_BASES_PER_CHAT
    )


class KnowledgeBaseSummary(BaseModel):
    id: uuid.UUID
    name: str


class ChatResponse(BaseModel):
    id: uuid.UUID
    title: str
    mode: ChatMode
    knowledge_bases: list[KnowledgeBaseSummary]
    created_at: datetime
    updated_at: datetime


class Citation(BaseModel):
    number: int
    item_id: uuid.UUID
    parent_chunk_id: uuid.UUID
    title: str
    url: str | None
    source_type: SourceType
    snippet: str
    # The full parent section the answer was written from; empty on messages
    # saved before it was recorded.
    content: str = ""
    score: float
    cited: bool


class Grounding(BaseModel):
    verdict: GroundingVerdict
    unsupported_claims: list[str] = []
    explanation: str = ""
    invalid_citations: list[int] = []


class MessageResponse(BaseModel):
    id: uuid.UUID
    role: MessageRole
    content: str
    citations: list[Citation] | None
    grounding: Grounding | None
    created_at: datetime


class QueryRequest(BaseModel):
    chat_id: uuid.UUID
    question: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True, min_length=1, max_length=MAX_QUESTION_CHARS
        ),
    ]
