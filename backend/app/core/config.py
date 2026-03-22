"""Application configuration."""

import os
from pathlib import Path

from dotenv import load_dotenv

_APP_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_APP_ROOT / ".env")


def get_env(key: str, default: str | None = None) -> str | None:
    """Get environment variable."""
    return os.getenv(key, default)


# Environment: development | production
ENV = get_env("ENV", "development")
IS_PRODUCTION = ENV.lower() == "production"

# CORS: comma-separated origins.
# - Dev: unset => localhost only. Set => localhost + env origins.
# - Prod: must set CORS_ORIGINS (e.g. https://myapp.netlify.app)
_dev_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_cors_from_env = [o.strip() for o in get_env("CORS_ORIGINS", "").split(",") if o.strip()]
if IS_PRODUCTION:
    CORS_ORIGINS = _cors_from_env if _cors_from_env else _dev_origins
else:
    CORS_ORIGINS = list(dict.fromkeys(_dev_origins + _cors_from_env))

# OpenAI
OPENAI_API_KEY = get_env("OPENAI_API_KEY")

# Azure Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = get_env("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
AZURE_DOCUMENT_INTELLIGENCE_KEY = get_env("AZURE_DOCUMENT_INTELLIGENCE_KEY")

# File storage (optional overrides)
UPLOAD_DIR = get_env("UPLOAD_DIR") or str(_APP_ROOT / "storage" / "uploads")
UPLOAD_TTL_SECONDS = int(get_env("UPLOAD_TTL_SECONDS", "600"))
