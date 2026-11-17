import uuid

import httpx

from tests.helpers import create_knowledge_base, ingest_note


async def test_sections_list_parents_with_their_contextual_chunks(
    api: httpx.AsyncClient,
):
    knowledge_base_id = await create_knowledge_base(api)
    item = await ingest_note(api, knowledge_base_id, "Deploys freeze on Fridays.")

    response = await api.get(f"/items/{item['id']}/sections")

    assert response.status_code == 200
    [section] = response.json()
    assert section["content"] == "Deploys freeze on Fridays."
    [chunk] = section["chunks"]
    assert chunk["context"] == "context 0"
    assert chunk["content"] == "Deploys freeze on Fridays."


async def test_sections_of_unknown_item_is_404(api: httpx.AsyncClient):
    response = await api.get(f"/items/{uuid.uuid4()}/sections")

    assert response.status_code == 404
    assert response.json() == {"detail": "Item not found"}
