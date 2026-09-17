"""
Application settings loaded from environment variables via Pydantic Settings.
Reads from .env file for DATABASE_URL, JWT_SECRET, and other configuration.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://localhost:5432/gym_attendance"

    # ── JWT / Auth ────────────────────────────────────────────
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ── QR Pass ───────────────────────────────────────────────
    QR_TOKEN_EXPIRE_SECONDS: int = 30  # Rotating QR validity window

    # ── CORS ──────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # ── App Meta ──────────────────────────────────────────────
    APP_NAME: str = "Gym Attendance System"
    DEBUG: bool = False

    DATABASE_URL_POOLED: str | None = None

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton – parsed once per process."""
    return Settings()
