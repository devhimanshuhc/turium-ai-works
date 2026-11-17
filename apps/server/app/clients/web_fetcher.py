import asyncio
import ipaddress
import socket
from dataclasses import dataclass
from urllib.parse import urlparse

import httpx
import trafilatura

from app.core.errors import BadRequestError, UpstreamError

FETCH_TIMEOUT_SECONDS = 15.0
MAX_RESPONSE_BYTES = 5 * 1024 * 1024
USER_AGENT = "KnowledgeInboxBot/0.1 (+https://github.com/)"


class UrlFetchError(UpstreamError):
    pass


@dataclass(frozen=True)
class FetchedPage:
    title: str | None
    text: str


async def _ensure_public_host(url: str) -> None:
    """Refuse URLs that resolve to private or loopback addresses (SSRF guard)."""
    host = urlparse(url).hostname
    if not host:
        raise BadRequestError("URL has no host")
    try:
        infos = await asyncio.get_running_loop().getaddrinfo(host, None)
    except socket.gaierror as exc:
        raise UrlFetchError(f"Could not resolve host {host}") from exc
    for info in infos:
        address = ipaddress.ip_address(info[4][0])
        if not address.is_global:
            raise BadRequestError("URLs pointing to private networks are not allowed")


class WebFetcher:
    def __init__(self, http: httpx.AsyncClient):
        self._http = http

    async def fetch(self, url: str) -> FetchedPage:
        try:
            response = await self._http.get(url, headers={"User-Agent": USER_AGENT})
        except httpx.HTTPError as exc:
            raise UrlFetchError(f"Could not fetch {url}: {type(exc).__name__}") from exc
        if response.status_code >= 400:
            raise UrlFetchError(f"Could not fetch {url}: HTTP {response.status_code}")
        if len(response.content) > MAX_RESPONSE_BYTES:
            raise BadRequestError("Page is larger than the 5 MB limit")
        return self._extract(response.text)

    @staticmethod
    def _extract(html: str) -> FetchedPage:
        text = trafilatura.extract(html, include_comments=False, include_tables=True)
        if not text or not text.strip():
            raise BadRequestError("No readable text found on the page")
        metadata = trafilatura.extract_metadata(html)
        return FetchedPage(title=metadata.title if metadata else None, text=text)


async def _guard_request(request: httpx.Request) -> None:
    await _ensure_public_host(str(request.url))


def create_web_fetcher() -> WebFetcher:
    # The hook runs for every hop, so redirects cannot reach private hosts either.
    return WebFetcher(
        httpx.AsyncClient(
            timeout=FETCH_TIMEOUT_SECONDS,
            follow_redirects=True,
            event_hooks={"request": [_guard_request]},
        )
    )
