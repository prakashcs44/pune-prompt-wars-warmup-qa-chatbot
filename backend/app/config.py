"""
Lumina AI — Centralized Configuration.
All settings are loaded from environment variables (.env file).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide settings loaded from environment."""

    # We allow extra fields (like GOOGLE_API_KEY) in .env to prevent crashes
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # ── OpenRouter ──────────────────────────────────────────────
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemma-2-9b-it:free"

    # ── Server ──────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # ── CORS ────────────────────────────────────────────────────
    cors_origins: str = "*"  # comma-separated in production

    # ── LTM persistence path (lightweight JSON fallback) ────────
    ltm_storage_path: str = "./data/ltm_store.json"


# Singleton — import this everywhere
settings = Settings()
