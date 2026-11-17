from app.core.errors import UpstreamError


class LLMError(UpstreamError):
    pass


class EmbeddingError(UpstreamError):
    pass
