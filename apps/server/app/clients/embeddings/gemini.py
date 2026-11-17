import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.clients.embeddings.base import EMBEDDING_DIMENSIONS
from app.clients.errors import EmbeddingError
from app.clients.retry import with_retries

BATCH_SIZE = 32
VERTEX_PREDICT_URL = (
    "https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:predict"
)
RETRYABLE_STATUS_CODES = {429, 500, 503}


class GeminiStudioEmbedder:
    """Google AI Studio keys: the SDK's embed_content endpoint."""

    def __init__(self, client: genai.Client, model: str):
        self._client = client
        self.model = model

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for start in range(0, len(texts), BATCH_SIZE):
            vectors += await self._embed(
                texts[start : start + BATCH_SIZE], "RETRIEVAL_DOCUMENT"
            )
        return vectors

    async def embed_query(self, text: str) -> list[float]:
        return (await self._embed([text], "RETRIEVAL_QUERY"))[0]

    async def _embed(self, texts: list[str], task_type: str) -> list[list[float]]:
        settings = types.EmbedContentConfig(
            output_dimensionality=EMBEDDING_DIMENSIONS, task_type=task_type
        )

        async def call() -> types.EmbedContentResponse:
            return await self._client.aio.models.embed_content(
                model=self.model, contents=texts, config=settings
            )

        try:
            response = await with_retries(
                call,
                lambda exc: isinstance(exc, genai_errors.APIError)
                and exc.code in RETRYABLE_STATUS_CODES,
                f"gemini-embed:{self.model}",
            )
        except genai_errors.APIError as exc:
            raise EmbeddingError(f"Gemini embedding failed ({exc.code})") from exc
        return [list(embedding.values or []) for embedding in response.embeddings or []]


class GeminiVertexEmbedder:
    """Vertex AI express keys: the SDK's embed path rejects API keys, so call
    the publisher model's :predict endpoint directly."""

    def __init__(self, http: httpx.AsyncClient, api_key: str, model: str):
        self._http = http
        self._api_key = api_key
        self.model = model

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for start in range(0, len(texts), BATCH_SIZE):
            vectors += await self._embed(
                texts[start : start + BATCH_SIZE], "RETRIEVAL_DOCUMENT"
            )
        return vectors

    async def embed_query(self, text: str) -> list[float]:
        return (await self._embed([text], "RETRIEVAL_QUERY"))[0]

    async def _embed(self, texts: list[str], task_type: str) -> list[list[float]]:
        payload = {
            "instances": [{"content": text, "task_type": task_type} for text in texts],
            "parameters": {"outputDimensionality": EMBEDDING_DIMENSIONS},
        }

        async def call() -> httpx.Response:
            response = await self._http.post(
                VERTEX_PREDICT_URL.format(model=self.model),
                json=payload,
                headers={"x-goog-api-key": self._api_key},
            )
            response.raise_for_status()
            return response

        try:
            response = await with_retries(
                call,
                lambda exc: isinstance(exc, httpx.HTTPStatusError)
                and exc.response.status_code in RETRYABLE_STATUS_CODES,
                f"vertex-embed:{self.model}",
            )
        except httpx.HTTPError as exc:
            raise EmbeddingError(f"Vertex embedding failed: {exc}") from exc
        return [
            prediction["embeddings"]["values"]
            for prediction in response.json()["predictions"]
        ]
