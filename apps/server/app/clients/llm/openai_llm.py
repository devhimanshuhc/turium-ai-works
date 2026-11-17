from collections.abc import AsyncIterator

import openai
from openai import AsyncOpenAI
from pydantic import BaseModel

from app.clients.errors import LLMError
from app.clients.llm.base import ModelTier
from app.clients.retry import with_retries


def _is_retryable(exc: Exception) -> bool:
    return isinstance(
        exc,
        openai.RateLimitError | openai.APIConnectionError | openai.InternalServerError,
    )


class OpenAILLM:
    provider = "openai"

    def __init__(self, client: AsyncOpenAI, answer_model: str, fast_model: str):
        self._client = client
        self._models: dict[ModelTier, str] = {
            "answer": answer_model,
            "fast": fast_model,
        }

    async def generate_json[T: BaseModel](
        self, *, system: str, prompt: str, schema: type[T], tier: ModelTier = "fast"
    ) -> T:
        model = self._models[tier]

        async def call():
            return await self._client.responses.parse(
                model=model, instructions=system, input=prompt, text_format=schema
            )

        try:
            response = await with_retries(call, _is_retryable, f"openai:{model}")
        except openai.OpenAIError as exc:
            raise LLMError(f"OpenAI request failed: {type(exc).__name__}") from exc
        if not isinstance(response.output_parsed, schema):
            raise LLMError("OpenAI returned a response that did not match the schema")
        return response.output_parsed

    async def stream_text(
        self, *, system: str, prompt: str, tier: ModelTier = "answer"
    ) -> AsyncIterator[str]:
        model = self._models[tier]
        try:
            async with self._client.responses.stream(
                model=model, instructions=system, input=prompt
            ) as stream:
                async for event in stream:
                    if event.type == "response.output_text.delta":
                        yield event.delta
        except openai.OpenAIError as exc:
            raise LLMError(f"OpenAI stream failed: {type(exc).__name__}") from exc
