"""Application configuration.

Settings are loaded from environment variables (and an optional `.env` file)
using pydantic-settings. `MOCK_MODE` is computed automatically: if the
required external API keys are missing, the relevant adapters fall back to
deterministic mock implementations so the app stays fully functional (and
testable) without any real credentials.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- App metadata -----------------------------------------------------
    APP_NAME: str = "CodeIn API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # --- Database -----------------------------------------------------------
    # Defaults to an in-memory sqlite database (via aiosqlite) so the app and
    # test-suite can run without a real Postgres instance. Point this at a
    # real asyncpg-compatible URL in production, e.g.:
    #   postgresql+asyncpg://user:pass@host:5432/dbname
    DATABASE_URL: str = "sqlite+aiosqlite:///./codein.db"

    # --- Redis ----------------------------------------------------------------
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- AI provider keys -----------------------------------------------------
    OPENAI_API_KEY: str | None = None
    DALL_E_3_API_KEY: str | None = None

    # --- Pump.fun -----------------------------------------------------------
    PUMPFUN_MINT_KEYPAIR: str | None = None
    LAUNCH_WALLET: str | None = None

    # --- Vercel ---------------------------------------------------------------
    VERCEL_TOKEN: str | None = None

    # --- CORS -----------------------------------------------------------------
    # Stored as a plain string so dotenv comma-lists don't need JSON encoding.
    # Use the `cors_origins` property for the parsed list.
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # --- Mock mode --------------------------------------------------------------
    # If explicitly set via env, this value wins. Otherwise it is derived
    # per-adapter (see the `*_mock_enabled` properties below), which is the
    # more useful behavior: you might have an OpenAI key but no Vercel token,
    # for instance, and only want Vercel mocked.
    MOCK_MODE: bool | None = None

    @field_validator("MOCK_MODE", mode="before")
    @classmethod
    def _empty_mock_mode(cls, value: object) -> object:
        """Treat blank env values (`MOCK_MODE=`) as unset instead of invalid bool."""
        if value is None:
            return None
        if isinstance(value, str) and value.strip() == "":
            return None
        return value

    @field_validator(
        "OPENAI_API_KEY",
        "DALL_E_3_API_KEY",
        "PUMPFUN_MINT_KEYPAIR",
        "LAUNCH_WALLET",
        "VERCEL_TOKEN",
        mode="before",
    )
    @classmethod
    def _empty_optional_str(cls, value: object) -> object:
        if isinstance(value, str) and value.strip() == "":
            return None
        return value

    @property
    def cors_origins(self) -> List[str]:
        """Parsed CORS origin list from the comma-separated env string."""
        if not self.CORS_ORIGINS.strip():
            return []
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def dalle_api_key(self) -> str | None:
        """DALL-E key, falling back to the general OpenAI key."""
        return self.DALL_E_3_API_KEY or self.OPENAI_API_KEY

    @property
    def openai_mock_enabled(self) -> bool:
        if self.MOCK_MODE is not None:
            return self.MOCK_MODE
        return not bool(self.OPENAI_API_KEY)

    @property
    def pumpfun_mock_enabled(self) -> bool:
        if self.MOCK_MODE is not None:
            return self.MOCK_MODE
        return not bool(self.PUMPFUN_MINT_KEYPAIR and self.LAUNCH_WALLET)

    @property
    def vercel_mock_enabled(self) -> bool:
        if self.MOCK_MODE is not None:
            return self.MOCK_MODE
        return not bool(self.VERCEL_TOKEN)

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (singleton for the process)."""
    return Settings()


settings = get_settings()
