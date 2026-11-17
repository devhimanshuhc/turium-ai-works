from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(session: Annotated[AsyncSession, Depends(get_session)]):
    await session.execute(text("SELECT 1"))
    return {"status": "healthy"}
