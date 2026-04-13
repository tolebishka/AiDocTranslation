# Repository audit

Brief, honest review of this project as a student submission (April 2026).

## README quality

**Before:** The root README was only a title line, with no setup or usage guidance.

**After:** The README was expanded to describe the problem, features, install steps, and how to run backend and frontend. This is a major improvement for graders and collaborators.

## Folder structure

**Strengths:** The layout now matches a conventional course requirement: `src/` for application code, `docs/` for notes, `tests/` and `assets/` reserved for future work, and configuration at the repository root. The backend is a proper Python package under `src/backend/` with clear layers (`api`, `core`, `schemas`, `services`).

**Gaps:** `tests/` is still empty except for a placeholder; there is no automated test suite yet. `assets/` is unused. Some documentation in `docs/tech.md` is slightly out of sync with the stack (for example, OCR is implemented with Google Cloud Vision in code, while the doc mentions Azure in places).

## File naming consistency

**Strengths:** Module names use consistent `snake_case`. API routers align with HTTP concerns (`upload`, `extract`, `translate`, etc.).

**Gaps:** A few modules are stubs or empty (`process_service.py`), which is acceptable for a work-in-progress but worth filling or removing when features stabilize.

## Essential files

**Present:** Root `requirements.txt`, `.gitignore`, `LICENSE`, environment template under `src/backend/.env.example`, and frontend `package.json` / lockfile.

**Watch:** External services (OpenAI, Google Vision) need real credentials in `.env` (never committed). Without them, some routes will fail at runtime even though the app starts.

## Score (out of 10)

**7/10**

**Why:** Structure and documentation are now appropriate for a graded GitHub repo, dependencies are declared, and the separation between backend and frontend is clear. The score is not higher because automated tests are missing, some docs are inconsistent with the implementation, and a few services are placeholders. Addressing tests and aligning documentation with the actual OCR/translation stack would move this toward an 8–9.
