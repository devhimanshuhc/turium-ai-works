import asyncio
from collections.abc import AsyncIterator

from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel

from app.clients.errors import LLMError
from app.clients.llm.base import ModelTier
from app.clients.retry import RETRY_DELAYS_SECONDS, with_retries
from app.core.logging import logger

RETRYABLE_STATUS_CODES = {429, 500, 503}


def _is_retryable(exc: Exception) -> bool:
    return isinstance(exc, genai_errors.APIError) and exc.code in RETRYABLE_STATUS_CODES


class GeminiLLM:
    provider = "gemini"

    def __init__(self, client: genai.Client, answer_model: str, fast_model: str):
        self._client = client
        self._models: dict[ModelTier, str] = {
            "answer": answer_model,
            "fast": fast_model,
        }

    async def generate_json[T: BaseModel](
        self, *, system: str, prompt: str, schema: type[T], tier: ModelTier = "fast"
    ) -> T:
        model = self._models[tier]
        settings = types.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0,
        )

        async def call() -> types.GenerateContentResponse:
            return await self._client.aio.models.generate_content(
                model=model, contents=prompt, config=settings
            )

        try:
            response = await with_retries(call, _is_retryable, f"gemini:{model}")
        except genai_errors.APIError as exc:
            raise LLMError(f"Gemini request failed ({exc.code})") from exc
        if not isinstance(response.parsed, schema):
            raise LLMError("Gemini returned a response that did not match the schema")
        return response.parsed

    async def stream_text(
        self, *, system: str, prompt: str, tier: ModelTier = "answer"
    ) -> AsyncIterator[str]:
        settings = types.GenerateContentConfig(
            system_instruction=system, temperature=0.2
        )
        for model in self._stream_models(tier):
            for delay in (*RETRY_DELAYS_SECONDS, None):
                has_output = False
                try:
                    # The SDK sends the request lazily, so errors (429/503) surface
                    # on the first read — retry only while nothing has been yielded.
                    stream = await self._client.aio.models.generate_content_stream(
                        model=model, contents=prompt, config=settings
                    )
                    async for chunk in stream:
                        if chunk.text:
                            has_output = True
                            yield chunk.text
                    return
                except genai_errors.APIError as exc:
                    if has_output or not _is_retryable(exc):
                        raise LLMError(f"Gemini stream failed ({exc.code})") from exc
                    if delay is None:
                        break
                    logger.warning(
                        "retrying gemini stream",
                        extra={"model": model, "status": exc.code, "delay_s": delay},
                    )
                    await asyncio.sleep(delay)
            logger.warning("gemini model unavailable", extra={"model": model})
        raise LLMError("Gemini is busy or rate limited right now. Try again shortly.")

    def _stream_models(self, tier: ModelTier) -> list[str]:
        """The requested model first, then the fast model as a fallback."""
        return list(dict.fromkeys([self._models[tier], self._models["fast"]]))
