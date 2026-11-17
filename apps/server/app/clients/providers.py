from functools import cache

import httpx
from google import genai
from openai import AsyncOpenAI

from app.clients.embeddings.base import Embedder
from app.clients.embeddings.gemini import GeminiStudioEmbedder, GeminiVertexEmbedder
from app.clients.embeddings.openai_embeddings import OpenAIEmbedder
from app.clients.llm.base import LLMClient
from app.clients.llm.gemini import GeminiLLM
from app.clients.llm.openai_llm import OpenAILLM
from app.core.errors import ServiceUnavailableError
from config import config

PROVIDER_TIMEOUT_SECONDS = 60.0


def _require_provider() -> str:
    if config.OPENAI_API_KEY:
        return "openai"
    if config.GEMINI_API_KEY:
        return "gemini"
    raise ServiceUnavailableError(
        "No AI provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY "
        "in apps/server/.env"
    )


@cache
def _gemini_client() -> genai.Client:
    return genai.Client(
        vertexai=config.GEMINI_ENDPOINT == "vertex", api_key=config.GEMINI_API_KEY
    )


@cache
def _openai_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=config.OPENAI_API_KEY, timeout=PROVIDER_TIMEOUT_SECONDS)


@cache
def get_llm() -> LLMClient:
    if _require_provider() == "openai":
        return OpenAILLM(
            _openai_client(), config.OPENAI_ANSWER_MODEL, config.OPENAI_FAST_MODEL
        )
    return GeminiLLM(
        _gemini_client(), config.GEMINI_ANSWER_MODEL, config.GEMINI_FAST_MODEL
    )


@cache
def get_embedder() -> Embedder:
    if _require_provider() == "openai":
        return OpenAIEmbedder(_openai_client(), config.OPENAI_EMBEDDING_MODEL)
    if config.GEMINI_ENDPOINT == "vertex":
        return GeminiVertexEmbedder(
            httpx.AsyncClient(timeout=PROVIDER_TIMEOUT_SECONDS),
            config.GEMINI_API_KEY,
            config.GEMINI_EMBEDDING_MODEL,
        )
    return GeminiStudioEmbedder(_gemini_client(), config.GEMINI_EMBEDDING_MODEL)
