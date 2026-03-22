"""AiDocTranslation FastAPI backend."""

import logging

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.upload import router as upload_router
from api.extract import router as extract_router
from api.translate import router as translate_router
from api.generate import router as generate_router
from api.process import router as process_router
from core.errors import AppError, error_response, classify_and_log
from services.upload_validator import UploadValidationError

logger = logging.getLogger(__name__)


def _make_error_response(error: str, message: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=error_response(error, message),
    )


app = FastAPI(
    title="AiDocTranslation",
    description="Document translation and generation API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, str):
        message = detail
    elif isinstance(detail, list) and detail and hasattr(detail[0], "get"):
        message = detail[0].get("msg", str(detail[0])) if detail else "Request failed"
    else:
        message = "Request failed"
    return _make_error_response("http_error", message, exc.status_code)


@app.exception_handler(UploadValidationError)
async def upload_validation_handler(_request: Request, exc: UploadValidationError):
    logger.warning("Upload validation failed: %s", exc.message)
    return _make_error_response(exc.error_code, exc.message, 400)


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError):
    logger.warning("App error: %s", exc.message)
    return _make_error_response(exc.error_code, exc.message, exc.status_code)


@app.exception_handler(Exception)
async def generic_exception_handler(_request: Request, exc: Exception):
    error_code, message, status_code = classify_and_log(exc)
    return _make_error_response(error_code, message, status_code)


app.include_router(upload_router)
app.include_router(extract_router)
app.include_router(translate_router)
app.include_router(generate_router)
app.include_router(process_router)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "service": "AiDocTranslation",
        "version": "0.1.0",
    }