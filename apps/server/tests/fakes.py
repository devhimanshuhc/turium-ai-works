import hashlib
import math
import re
from collections.abc import AsyncIterator

from pydantic import BaseModel

from app.clients.embeddings.base import EMBEDDING_DIMENSIONS
from app.clients.errors import LLMError
from app.clients.llm.base import ModelTier
from app.clients.web_fetcher import FetchedPage, UrlFetchError
from app.services.ingestion.contextualizer import ChunkContexts
from app.services.rag.guardrails import JudgeVerdict
from app.services.rag.planner import StandaloneQuestion


class FakeEmbedder:
    """Bag-of-words hashing: texts sharing words get similar vectors."""

    model = "fake-embedding"

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._vector(text) for text in texts]

    async def embed_query(self, text: str) -> list[float]:
        return self._vector(text)

    @staticmethod
    def _vector(text: str) -> list[float]:
        vector = [0.0] * EMBEDDING_DIMENSIONS
        for word in re.findall(r"[a-z0-9]+", text.lower()):
            bucket = (
                int(hashlib.md5(word.encode()).hexdigest(), 16) % EMBEDDING_DIMENSIONS
            )
            vector[bucket] += 1.0
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]


class FakeLLM:
    provider = "fake"

    def __init__(self) -> None:
        self.answer = "Deploys are frozen on Fridays [1]."
        self.verdict = "grounded"
        self.fail_streaming = False
        self.prompts: list[str] = []

    async def generate_json(
        self,
        *,
        system: str,
        prompt: str,
        schema: type[BaseModel],
        tier: ModelTier = "fast",
    ):
        self.prompts.append(prompt)
        if schema is ChunkContexts:
            count = int(re.search(r"Return exactly (\d+) contexts", prompt).group(1))
            return ChunkContexts(contexts=[f"context {n}" for n in range(count)])
        if schema is StandaloneQuestion:
            return StandaloneQuestion(question=prompt.rsplit("Latest message: ", 1)[-1])
        if schema is JudgeVerdict:
            return JudgeVerdict(
                verdict=self.verdict, unsupported_claims=[], explanation="checked"
            )
        raise AssertionError(f"unexpected schema {schema}")

    async def stream_text(
        self, *, system: str, prompt: str, tier: ModelTier = "answer"
    ) -> AsyncIterator[str]:
        self.prompts.append(prompt)
        if self.fail_streaming:
            raise LLMError("Gemini request failed (503)")
        for word in self.answer.split(" "):
            yield word + " "


class FakeFetcher:
    def __init__(self) -> None:
        self.pages: dict[str, FetchedPage] = {}

    async def fetch(self, url: str) -> FetchedPage:
        if url not in self.pages:
            raise UrlFetchError(f"Could not fetch {url}: HTTP 404")
        return self.pages[url]
