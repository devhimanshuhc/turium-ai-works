from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    LOG_LEVEL: str = Field(default="INFO")
    CORS_ORIGINS: list[str] = Field(default=["http://localhost:3000"])
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/knowledge_inbox"
    )

    OPENAI_API_KEY: str = Field(default="")
    OPENAI_ANSWER_MODEL: str = Field(default="gpt-4.1")
    OPENAI_FAST_MODEL: str = Field(default="gpt-4.1-mini")
    OPENAI_EMBEDDING_MODEL: str = Field(default="text-embedding-3-small")

    GEMINI_API_KEY: str = Field(default="")
    GEMINI_ENDPOINT: Literal["studio", "vertex"] = Field(default="studio")
    GEMINI_ANSWER_MODEL: str = Field(default="gemini-3.5-flash")
    GEMINI_FAST_MODEL: str = Field(default="gemini-3.5-flash-lite")
    GEMINI_EMBEDDING_MODEL: str = Field(default="gemini-embedding-001")


config = Settings()
