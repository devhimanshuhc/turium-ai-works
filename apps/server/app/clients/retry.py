import asyncio
from collections.abc import Awaitable, Callable

from app.core.logging import logger

RETRY_DELAYS_SECONDS = (1.0, 3.0)


async def with_retries[T](
    operation: Callable[[], Awaitable[T]],
    is_retryable: Callable[[Exception], bool],
    label: str,
) -> T:
    for attempt, delay in enumerate((*RETRY_DELAYS_SECONDS, None), start=1):
        try:
            return await operation()
        except Exception as exc:
            if delay is None or not is_retryable(exc):
                raise
            logger.warning(
                "retrying provider call",
                extra={"call": label, "attempt": attempt, "error": repr(exc)},
            )
            await asyncio.sleep(delay)
    raise AssertionError("unreachable")
