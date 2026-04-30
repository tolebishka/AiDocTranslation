"""Document generation API routes.

Two phases:

1. ``GET /generate-document/templates`` — list templates discovered on disk.
   Optional ``country`` query (ISO-3 code or country name from OCR) filters
   templates whose manifest matches.
2. ``POST /generate-document/`` — render a template using the canonical
   extraction returned by ``/process-document/`` plus user-edited primary
   translations. The renderer translates fresh into any *other* language(s)
   declared by the template manifest.
3. ``GET /generate-document/download/{document_id}`` — stream the rendered
   ``.docx`` to the user.
"""

import logging
import os
import time

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from backend.core.logging_config import safe_log
from backend.schemas.document import (
    GenerateDocumentRequest,
    GenerateDocumentResponse,
    TemplateInfo,
)
from backend.services.template_service import (
    build_context,
    cleanup_generated,
    filter_templates_for_country,
    get_generated_path,
    get_template,
    render_template,
)

router = APIRouter(prefix="/generate-document", tags=["Generation"])
logger = logging.getLogger(__name__)


@router.get("/templates", response_model=list[TemplateInfo])
async def list_available_templates(
    country: str | None = Query(default=None, description="ISO-3 code or country name"),
):
    """Return templates available for rendering, optionally country-filtered."""
    templates = filter_templates_for_country(country)
    return [TemplateInfo(**t.to_public_dict()) for t in templates]


@router.post("/", response_model=GenerateDocumentResponse)
async def generate_document(request: GenerateDocumentRequest):
    """Render the chosen template into a downloadable .docx file."""
    t0 = time.perf_counter()

    template = get_template(request.template_id)

    cleanup_generated()

    context = build_context(
        template=template,
        extraction=request.extraction,
        primary_language=request.primary_language,
        primary_overrides=request.primary_overrides,
    )

    rendered = render_template(template, context)

    duration_ms = (time.perf_counter() - t0) * 1000
    safe_log(
        logger,
        logging.INFO,
        f"Document generated template_id={template.id}",
        endpoint="/generate-document/",
        duration_ms=duration_ms,
        status="ok",
    )

    return GenerateDocumentResponse(
        document_id=rendered["document_id"],
        template_id=template.id,
        download_url=f"/generate-document/download/{rendered['document_id']}",
        filename=rendered["stored_as"],
    )


@router.get("/download/{document_id}")
async def download_document(document_id: str):
    """Stream the rendered .docx to the client."""
    path = get_generated_path(document_id)
    if not path or not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Generated document not found")

    filename = os.path.basename(path)
    return FileResponse(
        path=path,
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        filename=filename,
    )
