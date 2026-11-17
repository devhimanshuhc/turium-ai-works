from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging, logger
from app.core.middleware import request_context_middleware
from app.db.session import engine
from app.routers import chats, health, ingest, items, knowledge_bases, query
from config import config

configure_logging(config.LOG_LEVEL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("app starting")
    yield
    await engine.dispose()
    logger.info("app stopped")


app = FastAPI(
    title="Knowledge Inbox API",
    description="Save notes and URLs, then ask questions answered by a RAG pipeline.",
    version="0.1.0",
    lifespan=lifespan,
)

app.middleware("http")(request_context_middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)
register_exception_handlers(app)

app.include_router(health.router)
app.include_router(knowledge_bases.router)
app.include_router(ingest.router)
app.include_router(items.router)
app.include_router(chats.router)
app.include_router(query.router)
