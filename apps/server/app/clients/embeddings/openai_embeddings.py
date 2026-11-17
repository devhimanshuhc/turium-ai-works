import openai
from openai import AsyncOpenAI

from app.clients.embeddings.base import EMBEDDING_DIMENSIONS
from app.clients.errors import EmbeddingError

BATCH_SIZE = 64


class OpenAIEmbedder:
    def __init__(self, client: AsyncOpenAI, model: str):
        self._client = client
        self.model = model

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for start in range(0, len(texts), BATCH_SIZE):
            vectors += await self._embed(texts[start : start + BATCH_SIZE])
        return vectors

    async def embed_query(self, text: str) -> list[float]:
        return (await self._embed([text]))[0]

    async def _embed(self, texts: list[str]) -> list[list[float]]:
        try:
            response = await self._client.embeddings.create(
                model=self.model, input=texts, dimensions=EMBEDDING_DIMENSIONS
            )
        except openai.OpenAIError as exc:
            raise EmbeddingError(
                f"OpenAI embedding failed: {type(exc).__name__}"
            ) from exc
        return [item.embedding for item in response.data]
