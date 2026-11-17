import httpx
from sqlalchemy import func, select

from app.clients.web_fetcher import FetchedPage
from app.core.errors import ServiceUnavailableError
from app.db.session import SessionFactory
from app.dependencies import get_ingestion_pipeline
from app.main import app
from app.models import Chunk, ParentChunk
from tests.fakes import FakeFetcher
from tests.helpers import create_knowledge_base, get_item, ingest_note


async def _count(model) -> int:
    async with SessionFactory() as session:
        return await session.scalar(select(func.count()).select_from(model))


async def test_note_is_accepted_then_indexed_with_contextual_child_chunks(
    api: httpx.AsyncClient,
):
    knowledge_base_id = await create_knowledge_base(api)

    item = await ingest_note(
        api, knowledge_base_id, "Deploys freeze on Fridays.\n\nMore text."
    )

    assert item["status"] == "pending"
    assert item["source_type"] == "note"
    assert item["title"] == "Deploys freeze on Fridays."
    indexed = await get_item(api, knowledge_base_id, item["id"])
    assert indexed["status"] == "ready"
    assert await _count(ParentChunk) == 1
    async with SessionFactory() as session:
        chunk = (await session.scalars(select(Chunk))).one()
    assert chunk.context == "context 0"
    assert chunk.embedding_model == "fake-embedding"


async def test_url_is_fetched_server_side(api: httpx.AsyncClient, fetcher: FakeFetcher):
    fetcher.pages["https://example.com/post"] = FetchedPage(
        title="Example post", text="Fetched article body."
    )
    knowledge_base_id = await create_knowledge_base(api)

    response = await api.post(
        "/ingest",
        json={
            "source_type": "url",
            "knowledge_base_id": knowledge_base_id,
            "url": "https://example.com/post",
        },
    )

    item = await get_item(api, knowledge_base_id, response.json()["id"])
    assert item["status"] == "ready"
    assert item["title"] == "Example post"
    assert item["content_preview"] == "Fetched article body."


async def test_unreachable_url_marks_the_item_failed_with_a_reason(
    api: httpx.AsyncClient,
):
    knowledge_base_id = await create_knowledge_base(api)

    response = await api.post(
        "/ingest",
        json={
            "source_type": "url",
            "knowledge_base_id": knowledge_base_id,
            "url": "https://example.com/missing",
        },
    )

    item = await get_item(api, knowledge_base_id, response.json()["id"])
    assert item["status"] == "failed"
    assert item["error"] == "Could not fetch https://example.com/missing: HTTP 404"
    assert await _count(Chunk) == 0


async def test_file_upload_is_extracted_and_indexed(api: httpx.AsyncClient):
    knowledge_base_id = await create_knowledge_base(api)

    response = await api.post(
        "/ingest/file",
        data={"knowledge_base_id": knowledge_base_id},
        files={"file": ("leave.md", b"# Leave\n\n24 days per year.", "text/markdown")},
    )

    assert response.status_code == 202
    item = await get_item(api, knowledge_base_id, response.json()["id"])
    assert (item["source_type"], item["title"], item["status"]) == (
        "file",
        "leave.md",
        "ready",
    )


async def test_unsupported_file_is_rejected_before_saving(api: httpx.AsyncClient):
    knowledge_base_id = await create_knowledge_base(api)

    response = await api.post(
        "/ingest/file",
        data={"knowledge_base_id": knowledge_base_id},
        files={"file": ("tool.exe", b"MZ", "application/octet-stream")},
    )

    assert response.status_code == 400
    assert (await api.get("/items")).json() == []


async def test_invalid_payloads_are_422(api: httpx.AsyncClient):
    knowledge_base_id = await create_knowledge_base(api)

    blank_note = await api.post(
        "/ingest",
        json={
            "source_type": "note",
            "knowledge_base_id": knowledge_base_id,
            "content": " ",
        },
    )
    bad_url = await api.post(
        "/ingest",
        json={
            "source_type": "url",
            "knowledge_base_id": knowledge_base_id,
            "url": "not a url",
        },
    )
    unknown_type = await api.post(
        "/ingest", json={"source_type": "video", "knowledge_base_id": knowledge_base_id}
    )

    assert [blank_note.status_code, bad_url.status_code, unknown_type.status_code] == [
        422,
        422,
        422,
    ]


async def test_unknown_knowledge_base_is_404(api: httpx.AsyncClient):
    response = await api.post(
        "/ingest",
        json={
            "source_type": "note",
            "knowledge_base_id": "00000000-0000-0000-0000-000000000000",
            "content": "hello",
        },
    )

    assert response.status_code == 404


async def test_missing_ai_provider_is_503(api: httpx.AsyncClient):
    knowledge_base_id = await create_knowledge_base(api)

    def no_provider():
        raise ServiceUnavailableError("No AI provider configured.")

    app.dependency_overrides[get_ingestion_pipeline] = no_provider

    response = await api.post(
        "/ingest",
        json={
            "source_type": "note",
            "knowledge_base_id": knowledge_base_id,
            "content": "x",
        },
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "No AI provider configured."}
