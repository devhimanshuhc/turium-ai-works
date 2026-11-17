import httpx

from app.core.errors import NotFoundError
from app.main import app


@app.get("/__test__/not-found")
async def raise_not_found():
    raise NotFoundError("Item not found")


@app.get("/__test__/crash")
async def crash():
    raise RuntimeError("boom")


async def test_app_errors_map_to_their_status_and_detail(client: httpx.AsyncClient):
    response = await client.get("/__test__/not-found")

    assert response.status_code == 404
    assert response.json() == {"detail": "Item not found"}


async def test_unexpected_errors_return_generic_500(client: httpx.AsyncClient):
    response = await client.get("/__test__/crash")

    assert response.status_code == 500
    assert response.json() == {"detail": "Internal server error"}
