"""Application configuration using pydantic-settings.

Loads settings from environment variables and .env file.
Uses lru_cache for singleton pattern to avoid re-reading env on every access.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Attributes:
        gemini_api_key: Google Gemini API key for AI features.
        environment: Runtime environment (development, staging, production).
        use_ai: Whether to enable AI-powered insights.
        rate_limit_storage_uri: URI for rate limit storage backend.
        pocketbase_url: URL of the PocketBase instance.
        app_version: Semantic version of the application.
        frontend_urls: Comma-separated list of allowed frontend URLs.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    gemini_api_key: str = ""
    environment: str = "development"
    use_ai: bool = True
    rate_limit_storage_uri: str = "memory://"
    pocketbase_url: str = "http://localhost:8090"
    app_version: str = "1.0.0"
    frontend_urls: str = "http://localhost:5173,http://localhost:3000"

    def get_allowed_origins(self) -> list[str]:
        return [url.strip() for url in self.frontend_urls.split(",") if url.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton Settings instance.

    Returns:
        Settings: The application settings.
    """
    return Settings()
