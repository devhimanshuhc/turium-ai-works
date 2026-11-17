import uuid

from fastapi import APIRouter, status

from app.dependencies import SessionDep
from app.schemas.knowledge_bases import KnowledgeBaseCreate, KnowledgeBaseResponse
from app.services import knowledge_bases as service

router = APIRouter(prefix="/knowledge-bases", tags=["knowledge bases"])


@router.post(
    "", response_model=KnowledgeBaseResponse, status_code=status.HTTP_201_CREATED
)
async def create_knowledge_base(body: KnowledgeBaseCreate, session: SessionDep):
    return await service.create_knowledge_base(session, body)


@router.get("", response_model=list[KnowledgeBaseResponse])
async def list_knowledge_bases(session: SessionDep):
    return await service.list_knowledge_bases(session)


@router.get("/{knowledge_base_id}", response_model=KnowledgeBaseResponse)
async def get_knowledge_base(knowledge_base_id: uuid.UUID, session: SessionDep):
    return await service.get_knowledge_base(session, knowledge_base_id)


@router.delete("/{knowledge_base_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_knowledge_base(knowledge_base_id: uuid.UUID, session: SessionDep):
    """Deletes the knowledge base with all its items and chunks."""
    await service.delete_knowledge_base(session, knowledge_base_id)
