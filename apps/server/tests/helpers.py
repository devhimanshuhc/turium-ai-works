import json

import httpx


async def create_knowledge_base(api: httpx.AsyncClient, name: str = "Handbook") -> str:
    response = await api.post("/knowledge-bases", json={"name": name})
    assert response.status_code == 201, response.text
    return response.json()["id"]


async def ingest_note(
    api: httpx.AsyncClient, knowledge_base_id: str, content: str
) -> dict:
    response = await api.post(
        "/ingest",
        json={
            "source_type": "note",
            "knowledge_base_id": knowledge_base_id,
            "content": content,
        },
    )
    assert response.status_code == 202, response.text
    return response.json()


async def get_item(
    api: httpx.AsyncClient, knowledge_base_id: str, item_id: str
) -> dict:
    items = (
        await api.get("/items", params={"knowledge_base_id": knowledge_base_id})
    ).json()
    return next(item for item in items if item["id"] == item_id)


async def create_chat(api: httpx.AsyncClient, knowledge_base_ids: list[str]) -> dict:
    response = await api.post("/chats", json={"knowledge_base_ids": knowledge_base_ids})
    assert response.status_code == 201, response.text
    return response.json()


async def ask(api: httpx.AsyncClient, chat_id: str, question: str) -> list[dict]:
    response = await api.post("/query", json={"chat_id": chat_id, "question": question})
    assert response.status_code == 200, response.text
    assert response.headers["content-type"].startswith("text/event-stream")
    return [
        json.loads(line.removeprefix("data: "))
        for line in response.text.splitlines()
        if line.startswith("data: ")
    ]
