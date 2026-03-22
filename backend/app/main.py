"""AiDocTranslation FastAPI backend."""

import logging
import time

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from api.upload import router as upload_router
from api.extract import router as extract_router
from api.translate import router as translate_router
from api.generate import router as generate_router
from api.process import router as process_router
from core.config import CORS_ORIGINS
from core.errors import AppError, error_response, classify_and_log
from core.logging_config import get_request_id, safe_log, set_request_id
from services.upload_validator import UploadValidationError

logger = logging.getLogger(__name__)


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Set request ID for all requests."""

    async def dispatch(self, request: Request, call_next):
        rid = set_request_id(request.headers.get("X-Request-ID"))
        request.state.request_id = rid
        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response


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

app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
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
async def upload_validation_handler(request: Request, exc: UploadValidationError):
    safe_log(
        logger,
        logging.WARNING,
        "Upload validation failed",
        endpoint=request.url.path,
        error_code=exc.error_code,
        status="rejected",
    )
    return _make_error_response(exc.error_code, exc.message, 400)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    safe_log(
        logger,
        logging.WARNING,
        "App error",
        endpoint=request.url.path,
        error_code=exc.error_code,
        status="rejected",
    )
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