from collections.abc import AsyncIterator

import pytest
from google.genai import errors as genai_errors

from app.clients import retry
from app.clients.errors import LLMError
from app.clients.llm.gemini import GeminiLLM


class Chunk:
    def __init__(self, text: str):
        self.text = text


def _api_error(code: int) -> genai_errors.APIError:
    return genai_errors.APIError(code, {"error": {"message": "busy", "status": "x"}})


class FakeModels:
    """Each call to generate_content_stream pops the next scripted outcome."""

    def __init__(self, outcomes: list[list[str] | int]):
        self.outcomes = outcomes
        self.models_called: list[str] = []

    async def generate_content_stream(self, *, model: str, contents, config):
        self.models_called.append(model)
        outcome = self.outcomes.pop(0)

        async def stream() -> AsyncIterator[Chunk]:
            if isinstance(outcome, int):
                raise _api_error(outcome)
            for text in outcome:
                yield Chunk(text)

        return stream()


def _llm(outcomes) -> tuple[GeminiLLM, FakeModels]:
    models = FakeModels(outcomes)
    client = type("Client", (), {"aio": type("Aio", (), {"models": models})()})()
    return GeminiLLM(client, "pro", "flash"), models  # type: ignore[arg-type]


@pytest.fixture(autouse=True)
def no_backoff(monkeypatch):
    monkeypatch.setattr(retry, "RETRY_DELAYS_SECONDS", (0, 0))
    monkeypatch.setattr("app.clients.llm.gemini.RETRY_DELAYS_SECONDS", (0, 0))


async def _collect(llm: GeminiLLM) -> str:
    return "".join([token async for token in llm.stream_text(system="s", prompt="p")])


async def test_rate_limit_on_first_read_is_retried():
    llm, models = _llm([429, ["Hello", " world"]])

    assert await _collect(llm) == "Hello world"
    assert models.models_called == ["pro", "pro"]


async def test_falls_back_to_fast_model_when_answer_model_stays_busy():
    llm, models = _llm([503, 503, 503, ["from flash"]])

    assert await _collect(llm) == "from flash"
    assert models.models_called == ["pro", "pro", "pro", "flash"]


async def test_non_retryable_errors_fail_immediately():
    llm, models = _llm([400])

    with pytest.raises(LLMError, match="400"):
        await _collect(llm)
    assert models.models_called == ["pro"]


async def test_gives_up_with_a_clear_message_when_everything_is_busy():
    llm, _ = _llm([429] * 6)

    with pytest.raises(LLMError, match="busy or rate limited"):
        await _collect(llm)
