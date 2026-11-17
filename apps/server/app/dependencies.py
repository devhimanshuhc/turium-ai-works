from functools import cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.providers import get_embedder, get_llm
from app.clients.web_fetcher import create_web_fetcher
from app.db.session import SessionFactory, get_session
from app.services.ingestion.contextualizer import Contextualizer
from app.services.ingestion.pipeline import IngestionPipeline
from app.services.rag.orchestrator import RagOrchestrator

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@cache
def get_ingestion_pipeline() -> IngestionPipeline:
    return IngestionPipeline(
        SessionFactory, create_web_fetcher(), Contextualizer(get_llm()), get_embedder()
    )


IngestionPipelineDep = Annotated[IngestionPipeline, Depends(get_ingestion_pipeline)]


@cache
def get_rag_orchestrator() -> RagOrchestrator:
    return RagOrchestrator(SessionFactory, get_llm(), get_embedder())


RagOrchestratorDep = Annotated[RagOrchestrator, Depends(get_rag_orchestrator)]
