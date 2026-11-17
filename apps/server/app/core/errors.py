from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import InterfaceError, OperationalError

from app.core.logging import logger


class AppError(Exception):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(self, detail: str):
        super().__init__(detail)
        self.detail = detail


class BadRequestError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT


class UpstreamError(AppError):
    status_code = status.HTTP_502_BAD_GATEWAY


class ServiceUnavailableError(AppError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


async def handle_app_error(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, AppError)
    logger.warning(
        "request failed",
        extra={"status": exc.status_code, "error": type(exc).__name__},
    )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


async def handle_database_unavailable(request: Request, exc: Exception) -> JSONResponse:
    logger.error("database unreachable", extra={"error": repr(exc)})
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database is unreachable"},
    )


async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled error", extra={"path": request.url.path})
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, handle_app_error)
    for database_error in (ConnectionError, OperationalError, InterfaceError):
        app.add_exception_handler(database_error, handle_database_unavailable)
    app.add_exception_handler(Exception, handle_unexpected_error)
