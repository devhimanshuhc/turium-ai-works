import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile, status

from app.core.errors import BadRequestError
from app.dependencies import IngestionPipelineDep, SessionDep
from app.schemas.items import IngestRequest, ItemResponse, NoteIngestRequest
from app.services.ingestion.extractors import extract_text_from_file
from app.services.items import (
    create_file_item,
    create_note_item,
    create_url_item,
    to_item_response,
)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("", response_model=ItemResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest(
    body: IngestRequest,
    session: SessionDep,
    pipeline: IngestionPipelineDep,
    background_tasks: BackgroundTasks,
):
    """Save a note or URL now; chunking and embedding run in the background."""
    if isinstance(body, NoteIngestRequest):
        item = await create_note_item(session, body)
    else:
        item = await create_url_item(session, body)
    background_tasks.add_task(pipeline.process, item.id)
    return to_item_response(item)


@router.post("/file", response_model=ItemResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_file(
    knowledge_base_id: Annotated[uuid.UUID, Form()],
    file: Annotated[UploadFile, File()],
    session: SessionDep,
    pipeline: IngestionPipelineDep,
    background_tasks: BackgroundTasks,
):
    """Upload a PDF, DOCX, TXT or Markdown file (max 10 MB)."""
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise BadRequestError("Files must be 10 MB or smaller")
    filename = file.filename or "upload"
    text = extract_text_from_file(filename, data)
    item = await create_file_item(session, knowledge_base_id, filename, text)
    background_tasks.add_task(pipeline.process, item.id)
    return to_item_response(item)
