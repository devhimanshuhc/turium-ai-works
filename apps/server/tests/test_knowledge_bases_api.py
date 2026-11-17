import httpx

from tests.helpers import create_knowledge_base, ingest_note


async def test_create_and_list_knowledge_bases_with_item_counts(api: httpx.AsyncClient):
    handbook = await create_knowledge_base(api, "Handbook")
    await create_knowledge_base(api, "Research")
    await ingest_note(api, handbook, "Leave policy: 24 days a year.")

    response = await api.get("/knowledge-bases")

    assert response.status_code == 200
    assert [(kb["name"], kb["item_count"]) for kb in response.json()] == [
        ("Handbook", 1),
        ("Research", 0),
    ]


async def test_duplicate_names_are_rejected(api: httpx.AsyncClient):
    await create_knowledge_base(api, "Handbook")

    response = await api.post("/knowledge-bases", json={"name": "  Handbook "})

    assert response.status_code == 409
    assert response.json() == {
        "detail": "A knowledge base named 'Handbook' already exists"
    }


async def test_blank_name_is_a_validation_error(api: httpx.AsyncClient):
    response = await api.post("/knowledge-bases", json={"name": "   "})

    assert response.status_code == 422


async def test_unknown_knowledge_base_is_404(api: httpx.AsyncClient):
    response = await api.get("/knowledge-bases/00000000-0000-0000-0000-000000000000")

    assert response.status_code == 404
