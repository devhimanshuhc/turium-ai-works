import httpx
from sqlalchemy import delete, func, select

from app.db.session import SessionFactory
from app.dependencies import get_ingestion_pipeline
from app.main import app
from app.models import Chunk, Item, ParentChunk
from app.services.ingestion.contextualizer import Contextualizer
from app.services.ingestion.pipeline import IngestionPipeline
from tests.fakes import FakeEmbedder
from tests.helpers import ask, create_chat, create_knowledge_base, ingest_note

MISSING_ID = "00000000-0000-0000-0000-000000000000"


async def _count(model) -> int:
    async with SessionFactory() as session:
        return await session.scalar(select(func.count()).select_from(model))


async def test_deleting_an_item_removes_only_its_chunks(api: httpx.AsyncClient):
    knowledge_base_id = await create_knowledge_base(api)
    doomed = await ingest_note(api, knowledge_base_id, "Deploys freeze on Fridays.")
    await ingest_note(api, knowledge_base_id, "Leave is 24 days a year.")

    response = await api.delete(f"/items/{doomed['id']}")

    assert response.status_code == 204
    remaining = (await api.get("/items")).json()
    assert [item["content_preview"] for item in remaining] == [
        "Leave is 24 days a year."
    ]
    assert await _count(ParentChunk) == 1
    assert await _count(Chunk) == 1


async def test_deleted_items_no_longer_appear_in_answers(api: httpx.AsyncClient):
    knowledge_base_id = await create_knowledge_base(api)
    item = await ingest_note(api, knowledge_base_id, "Deploys freeze on Fridays.")
    chat = await create_chat(api, [knowledge_base_id])
    await api.delete(f"/items/{item['id']}")

    events = await ask(api, chat["id"], "When do deploys freeze?")

    assert events[-1]["message"]["grounding"]["verdict"] == "no_answer"


async def test_deleting_a_knowledge_base_cascades_but_keeps_chats(
    api: httpx.AsyncClient,
):
    knowledge_base_id = await create_knowledge_base(api)
    await ingest_note(api, knowledge_base_id, "Deploys freeze on Fridays.")
    chat = await create_chat(api, [knowledge_base_id])

    response = await api.delete(f"/knowledge-bases/{knowledge_base_id}")

    assert response.status_code == 204
    assert (await api.get("/knowledge-bases")).json() == []
    assert await _count(Item) == 0
    assert await _count(Chunk) == 0
    surviving_chat = (await api.get(f"/chats/{chat['id']}")).json()
    assert surviving_chat["knowledge_bases"] == []
    assert surviving_chat["mode"] == "knowledge_base"
    events = await ask(api, chat["id"], "When do deploys freeze?")
    assert events[-1]["message"]["grounding"]["verdict"] == "no_answer"


async def test_deleting_missing_resources_is_404(api: httpx.AsyncClient):
    missing_item = await api.delete(f"/items/{MISSING_ID}")
    missing_knowledge_base = await api.delete(f"/knowledge-bases/{MISSING_ID}")

    assert (missing_item.status_code, missing_knowledge_base.status_code) == (404, 404)
    assert missing_item.json() == {"detail": "Item not found"}


class DeletingEmbedder(FakeEmbedder):
    """Deletes the item mid-pipeline, like a user deleting it while it indexes."""

    def __init__(self, item_ids: list[str]):
        self.item_ids = item_ids

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        async with SessionFactory() as session:
            await session.execute(delete(Item).where(Item.id == self.item_ids[0]))
            await session.commit()
        return await super().embed_documents(texts)


async def test_deleting_an_item_while_it_indexes_is_not_a_crash(
    api: httpx.AsyncClient, llm, fetcher, caplog
):
    knowledge_base_id = await create_knowledge_base(api)
    item_ids: list[str] = []
    pipeline = IngestionPipeline(
        SessionFactory, fetcher, Contextualizer(llm), DeletingEmbedder(item_ids)
    )
    app.dependency_overrides[get_ingestion_pipeline] = lambda: pipeline
    original_process = pipeline.process

    async def remember_then_process(item_id):
        item_ids.append(item_id)
        await original_process(item_id)

    pipeline.process = remember_then_process  # type: ignore[method-assign]

    await ingest_note(api, knowledge_base_id, "Deploys freeze on Fridays.")

    assert await _count(Item) == 0
    assert await _count(Chunk) == 0
    assert "ingestion crashed" not in caplog.text
    assert "item deleted while processing" in caplog.text
