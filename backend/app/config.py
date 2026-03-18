"""Application configuration."""

import os

from dotenv import load_dotenv

load_dotenv()


def get_env(key: str, default: str | None = None) -> str | None:
    """Get environment variable."""
    return os.getenv(key, default)


# OpenAI
OPENAI_API_KEY = get_env("OPENAI_API_KEY")

# Azure Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = get_env("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
AZURE_DOCUMENT_INTELLIGENCE_KEY = get_env("AZURE_DOCUMENT_INTELLIGENCE_KEY")
