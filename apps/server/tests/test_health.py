import httpx
import pytest
from sqlalchemy.exc import OperationalError

from app.db.session import get_session
from app.main import app


class FailingSession:
    def __init__(self, error: Exception):
        self.error = error

    async def execute(self, *_args, **_kwargs):
        raise self.error


async def test_health_reports_healthy_when_database_responds(client: httpx.AsyncClient):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.parametrize(
    "error",
    [
        OperationalError("SELECT 1", {}, Exception("server closed the connection")),
        ConnectionRefusedError(61, "Connection refused"),
    ],
)
async def test_health_returns_503_when_database_is_down(
    client: httpx.AsyncClient, error: Exception
):
    app.dependency_overrides[get_session] = lambda: FailingSession(error)

    response = await client.get("/health")

    assert response.status_code == 503
    assert response.json() == {"detail": "Database is unreachable"}


async def test_responses_carry_a_request_id(client: httpx.AsyncClient):
    response = await client.get("/health", headers={"X-Request-ID": "abc123"})

    assert response.headers["X-Request-ID"] == "abc123"
