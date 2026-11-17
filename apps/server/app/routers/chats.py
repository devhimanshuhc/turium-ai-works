import uuid

from fastapi import APIRouter, status

from app.dependencies import SessionDep
from app.schemas.chats import ChatCreate, ChatResponse, MessageResponse
from app.services import chats as service

router = APIRouter(prefix="/chats", tags=["chats"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(body: ChatCreate, session: SessionDep):
    """Knowledge bases are fixed when the chat is created."""
    return service.to_chat_response(await service.create_chat(session, body))


@router.get("", response_model=list[ChatResponse])
async def list_chats(session: SessionDep):
    return [
        service.to_chat_response(chat) for chat in await service.list_chats(session)
    ]


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(chat_id: uuid.UUID, session: SessionDep):
    return service.to_chat_response(await service.get_chat(session, chat_id))


@router.get("/{chat_id}/messages", response_model=list[MessageResponse])
async def list_messages(chat_id: uuid.UUID, session: SessionDep):
    messages = await service.list_messages(session, chat_id)
    return [service.to_message_response(message) for message in messages]
