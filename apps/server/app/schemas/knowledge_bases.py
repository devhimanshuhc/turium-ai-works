import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints

KnowledgeBaseName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)
]
Description = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]


class KnowledgeBaseCreate(BaseModel):
    name: KnowledgeBaseName
    description: Description | None = None


class KnowledgeBaseResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    item_count: int
    created_at: datetime
