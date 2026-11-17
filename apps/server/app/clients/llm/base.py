from collections.abc import AsyncIterator
from typing import Literal, Protocol

from pydantic import BaseModel

ModelTier = Literal["fast", "answer"]


class LLMClient(Protocol):
    provider: str

    async def generate_json[T: BaseModel](
        self, *, system: str, prompt: str, schema: type[T], tier: ModelTier = "fast"
    ) -> T: ...

    def stream_text(
        self, *, system: str, prompt: str, tier: ModelTier = "answer"
    ) -> AsyncIterator[str]: ...
