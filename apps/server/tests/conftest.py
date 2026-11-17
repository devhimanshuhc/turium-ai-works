import os

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/knowledge_inbox_test",
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

import asyncpg  # noqa: E402
import httpx  # noqa: E402
import pytest  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import SessionFactory, engine  # noqa: E402
from app.dependencies import get_ingestion_pipeline, get_rag_orchestrator  # noqa: E402
from app.main import app  # noqa: E402
from app.services.ingestion.contextualizer import Contextualizer  # noqa: E402
from app.services.ingestion.pipeline import IngestionPipeline  # noqa: E402
from app.services.rag.orchestrator import RagOrchestrator  # noqa: E402
from tests.fakes import FakeEmbedder, FakeFetcher, FakeLLM  # noqa: E402


async def _create_test_database() -> None:
    admin_url = (
        TEST_DATABASE_URL.replace("+asyncpg", "").rsplit("/", 1)[0] + "/postgres"
    )
    name = TEST_DATABASE_URL.rsplit("/", 1)[1]
    connection = await asyncpg.connect(admin_url)
    try:
        exists = await connection.fetchval(
            "SELECT 1 FROM pg_database WHERE datname=$1", name
        )
        if not exists:
            await connection.execute(f'CREATE DATABASE "{name}"')
    finally:
        await connection.close()


@pytest.fixture(scope="session", autouse=True)
async def database():
    await _create_test_database()
    async with engine.begin() as connection:
        await connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


@pytest.fixture(autouse=True)
async def clean_tables(database):
    yield
    tables = ", ".join(table.name for table in Base.metadata.sorted_tables)
    async with engine.begin() as connection:
        await connection.execute(text(f"TRUNCATE {tables} CASCADE"))
    app.dependency_overrides.clear()


@pytest.fixture
def llm() -> FakeLLM:
    return FakeLLM()


@pytest.fixture
def fetcher() -> FakeFetcher:
    return FakeFetcher()


@pytest.fixture
async def api(llm: FakeLLM, fetcher: FakeFetcher):
    embedder = FakeEmbedder()
    pipeline = IngestionPipeline(SessionFactory, fetcher, Contextualizer(llm), embedder)  # type: ignore[arg-type]
    orchestrator = RagOrchestrator(SessionFactory, llm, embedder)
    app.dependency_overrides[get_ingestion_pipeline] = lambda: pipeline
    app.dependency_overrides[get_rag_orchestrator] = lambda: orchestrator
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
async def client():
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://test"
    ) as test_client:
        yield test_client
