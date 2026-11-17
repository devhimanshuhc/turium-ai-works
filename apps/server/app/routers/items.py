import uuid

from fastapi import APIRouter, status

from app.dependencies import SessionDep
from app.schemas.items import ItemResponse, SectionResponse
from app.services.item_chunks import list_item_sections
from app.services.items import delete_item, list_items, to_item_response

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=list[ItemResponse])
async def get_items(session: SessionDep, knowledge_base_id: uuid.UUID | None = None):
    """Saved items, newest first. Filter with ?knowledge_base_id=."""
    return [
        to_item_response(item) for item in await list_items(session, knowledge_base_id)
    ]


@router.get("/{item_id}/sections", response_model=list[SectionResponse])
async def get_item_sections(item_id: uuid.UUID, session: SessionDep):
    """The item's indexed sections and the contextualised chunks inside each."""
    return await list_item_sections(session, item_id)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item(item_id: uuid.UUID, session: SessionDep):
    """Deletes the item and its chunks; it stops appearing in answers."""
    await delete_item(session, item_id)
