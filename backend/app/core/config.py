"""Application configuration."""

import os
from pathlib import Path

from dotenv import load_dotenv

# backend/app/.env — не зависит от cwd при запуске uvicorn
_APP_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_APP_ROOT / ".env")


def get_env(key: str, default: str | None = None) -> str | None:
    """Get environment variable."""
    return os.getenv(key, default)


# OpenAI
OPENAI_API_KEY = get_env("OPENAI_API_KEY")

# Azure Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = get_env("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
AZURE_DOCUMENT_INTELLIGENCE_KEY = get_env("AZURE_DOCUMENT_INTELLIGENCE_KEY")
