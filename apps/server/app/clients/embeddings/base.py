from typing import Protocol

EMBEDDING_DIMENSIONS = 1536


class Embedder(Protocol):
    model: str

    async def embed_documents(self, texts: list[str]) -> list[list[float]]: ...

    async def embed_query(self, text: str) -> list[float]: ...
