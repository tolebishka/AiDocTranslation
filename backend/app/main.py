"""AiDocTranslation FastAPI backend."""

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI

from api.upload import router as upload_router
from api.extract import router as extract_router
from api.translate import router as translate_router
from api.generate import router as generate_router

app = FastAPI(
    title="AiDocTranslation",
    description="Document translation and generation API",
    version="0.1.0",
)

app.include_router(upload_router)
app.include_router(extract_router)
app.include_router(translate_router)
app.include_router(generate_router)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "service": "AiDocTranslation",
        "version": "0.1.0",
    }