import type {
  GenerateDocumentRequest,
  GenerateDocumentResponse,
  ProcessDocumentResponse,
  TemplateInfo,
  UploadResponse,
} from "../types/api";

/** Dev fallback when VITE_API_BASE_URL is unset. */
const DEV_API_BASE = "http://127.0.0.1:8000";

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  if (fromEnv !== undefined && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, "");
  }
  // Docker / single-host deploy: API and SPA share one origin
  if (import.meta.env.PROD) {
    return "";
  }
  return DEV_API_BASE;
}

function joinUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string; detail?: unknown };
    if (typeof data.message === "string") return data.message;
    const d = data.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg);
    return res.statusText || `HTTP ${res.status}`;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

/**
 * POST /upload/ — multipart, field name `file`
 */
export async function uploadPassportImage(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(joinUrl("/upload/"), {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  const data = (await res.json()) as UploadResponse;
  if (!data.file_id) {
    throw new Error("Upload succeeded but no file_id returned");
  }
  return data;
}

/**
 * POST /process-document/
 */
export async function processDocument(
  fileId: string,
  targetLanguage: string
): Promise<ProcessDocumentResponse> {
  const res = await fetch(joinUrl("/process-document/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_id: fileId,
      target_language: targetLanguage,
    }),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return res.json() as Promise<ProcessDocumentResponse>;
}

/**
 * GET /generate-document/templates — discover .docx templates.
 * Pass an ISO-3 country code (or the issuing country name from OCR) to
 * narrow the list to templates that match.
 */
export async function listTemplates(country?: string | null): Promise<TemplateInfo[]> {
  const url = country && country.trim()
    ? `/generate-document/templates?country=${encodeURIComponent(country.trim())}`
    : "/generate-document/templates";

  const res = await fetch(joinUrl(url), { method: "GET" });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json() as Promise<TemplateInfo[]>;
}

/**
 * POST /generate-document/ — render a template against the canonical
 * extraction + primary-language overrides. Returns a download_url that the
 * client can use to fetch the rendered .docx.
 */
export async function generateDocument(
  payload: GenerateDocumentRequest
): Promise<GenerateDocumentResponse> {
  const res = await fetch(joinUrl("/generate-document/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json() as Promise<GenerateDocumentResponse>;
}

/** Absolute URL for an issued ``download_url`` so <a download> works on dev. */
export function buildDownloadUrl(downloadUrl: string): string {
  if (/^https?:/i.test(downloadUrl)) return downloadUrl;
  return joinUrl(downloadUrl);
}
