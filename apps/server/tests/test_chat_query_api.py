import httpx

from tests.fakes import FakeLLM
from tests.helpers import ask, create_chat, create_knowledge_base, ingest_note

FALCON = "Production deploys for Falcon are frozen on Fridays after 14:00 IST."
LEAVE = "Employees receive 24 days of paid leave per year."


def _events_of(events: list[dict], kind: str) -> list[dict]:
    return [event for event in events if event["type"] == kind]


async def test_chat_locks_its_knowledge_bases(api: httpx.AsyncClient):
    handbook = await create_knowledge_base(api, "Handbook")

    chat = await create_chat(api, [handbook])

    assert chat["title"] == "New chat"
    assert [kb["name"] for kb in chat["knowledge_bases"]] == ["Handbook"]


async def test_chat_with_knowledge_bases_is_in_knowledge_base_mode(
    api: httpx.AsyncClient,
):
    handbook = await create_knowledge_base(api)

    chat = await create_chat(api, [handbook])

    assert chat["mode"] == "knowledge_base"


async def test_chat_rejects_unknown_knowledge_bases(api: httpx.AsyncClient):
    response = await api.post(
        "/chats", json={"knowledge_base_ids": ["00000000-0000-0000-0000-000000000000"]}
    )

    assert response.status_code == 404


async def test_chat_without_knowledge_bases_answers_from_general_knowledge(
    api: httpx.AsyncClient, llm: FakeLLM
):
    await ingest_note(api, await create_knowledge_base(api), FALCON)
    llm.answer = "Paris is the capital of France."
    chat = await create_chat(api, [])

    events = await ask(api, chat["id"], "What is the capital of France?")

    assert chat["mode"] == "general"
    assert [event["stage"] for event in _events_of(events, "status")] == ["answering"]
    message = _events_of(events, "done")[0]["message"]
    assert message["content"].strip() == "Paris is the capital of France."
    assert message["grounding"]["verdict"] == "general_knowledge"
    assert message["citations"] == []
    assert not any("<source" in prompt for prompt in llm.prompts)


async def test_query_streams_a_grounded_answer_with_citations(api: httpx.AsyncClient):
    handbook = await create_knowledge_base(api)
    await ingest_note(api, handbook, FALCON)
    await ingest_note(api, handbook, LEAVE)
    chat = await create_chat(api, [handbook])

    events = await ask(api, chat["id"], "When are Falcon deploys frozen?")

    stages = [event["stage"] for event in _events_of(events, "status")]
    assert stages == ["searching", "answering", "verifying"]
    assert "".join(e["text"] for e in _events_of(events, "token")).strip() == (
        "Deploys are frozen on Fridays [1]."
    )
    message = _events_of(events, "done")[0]["message"]
    assert message["grounding"]["verdict"] == "grounded"
    top_source = message["citations"][0]
    assert top_source["cited"] is True
    assert "Falcon" in top_source["snippet"]
    assert top_source["content"] == FALCON


async def test_query_only_searches_the_chats_knowledge_bases(
    api: httpx.AsyncClient, llm: FakeLLM
):
    handbook = await create_knowledge_base(api, "Handbook")
    other = await create_knowledge_base(api, "Other")
    await ingest_note(api, other, FALCON)
    chat = await create_chat(api, [handbook])

    events = await ask(api, chat["id"], "When are Falcon deploys frozen?")

    message = _events_of(events, "done")[0]["message"]
    assert message["content"] == "I couldn't find that in the selected knowledge bases."
    assert message["grounding"]["verdict"] == "no_answer"
    assert message["citations"] == []
    assert not any("Latest message" in prompt for prompt in llm.prompts)


async def test_answers_citing_missing_sources_are_cleaned(
    api: httpx.AsyncClient, llm: FakeLLM
):
    handbook = await create_knowledge_base(api)
    await ingest_note(api, handbook, FALCON)
    chat = await create_chat(api, [handbook])
    llm.answer = "Frozen on Fridays [1][9]."
    llm.verdict = "partially_grounded"

    events = await ask(api, chat["id"], "When are deploys frozen?")

    message = _events_of(events, "done")[0]["message"]
    assert message["content"].strip() == "Frozen on Fridays [1]."
    assert message["grounding"]["invalid_citations"] == [9]
    assert message["grounding"]["verdict"] == "partially_grounded"


async def test_follow_ups_are_rewritten_and_history_is_saved(
    api: httpx.AsyncClient, llm: FakeLLM
):
    handbook = await create_knowledge_base(api)
    await ingest_note(api, handbook, FALCON)
    chat = await create_chat(api, [handbook])

    await ask(api, chat["id"], "When are Falcon deploys frozen?")
    events = await ask(api, chat["id"], "And on which day?")

    assert _events_of(events, "status")[0]["stage"] == "planning"
    messages = (await api.get(f"/chats/{chat['id']}/messages")).json()
    assert [message["role"] for message in messages] == [
        "user",
        "assistant",
        "user",
        "assistant",
    ]
    chats = (await api.get("/chats")).json()
    assert chats[0]["title"] == "When are Falcon deploys frozen?"


async def test_llm_failure_is_reported_as_an_error_event(
    api: httpx.AsyncClient, llm: FakeLLM
):
    handbook = await create_knowledge_base(api)
    await ingest_note(api, handbook, FALCON)
    chat = await create_chat(api, [handbook])
    llm.fail_streaming = True

    events = await ask(api, chat["id"], "When are deploys frozen?")

    assert events[-1] == {"type": "error", "detail": "Gemini request failed (503)"}


async def test_query_validates_input(api: httpx.AsyncClient):
    unknown_chat = await api.post(
        "/query",
        json={"chat_id": "00000000-0000-0000-0000-000000000000", "question": "hi"},
    )
    blank = await api.post(
        "/query",
        json={"chat_id": "00000000-0000-0000-0000-000000000000", "question": "  "},
    )

    assert (unknown_chat.status_code, blank.status_code) == (404, 422)
