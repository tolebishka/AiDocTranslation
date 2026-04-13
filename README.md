# AiDocTranslation

Web application that uploads identity documents, extracts structured passport data (MRZ and OCR), translates fields with an LLM, and supports document generation workflows.

## Problem statement

Official documents are often scanned or photographed in one language, while recipients need accurate, structured information in another. Manual retyping is slow and error-prone. This project automates extraction, normalization, and translation behind a single API and a small React UI.

## Features

- **Uploads:** Image upload with validation and local storage (configurable directory and TTL).
- **Extraction:** MRZ parsing plus OCR (Google Cloud Vision) to build a canonical passport field model.
- **Translation:** OpenAI structured output to translate extracted fields into a target language.
- **Generation:** API scaffold for translated document generation (extensible with templates).
- **Frontend:** Vite + React workspace for upload, review, and translation.

## Installation

### Prerequisites

- Python 3.10+ recommended
- Node.js 18+ (for the frontend)
- Accounts / keys as needed: OpenAI API, Google Cloud Vision (for OCR)

### Backend

From the repository root:

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp src/backend/.env.example src/backend/.env
# Edit src/backend/.env with your keys and settings
```

### Frontend

```bash
cd src/frontend
npm ci
cp .env.example .env.local
# Set VITE_API_BASE_URL in .env.local if needed (see .env.example)
```

## Usage

### Run the API

From the repository root, with `src` on `PYTHONPATH`:

```bash
source .venv/bin/activate
PYTHONPATH=src uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Health check: open `http://127.0.0.1:8000/` in a browser or use `curl`.

Interactive docs: `http://127.0.0.1:8000/docs`

### Run the web UI

```bash
cd src/frontend
npm run dev
```

Default dev server: `http://localhost:5173` (see `vite.config.ts`).

## Technology stack

| Area | Choice |
|------------|----------------------------------------------|
| API        | FastAPI, Uvicorn, Pydantic                   |
| OCR        | Google Cloud Vision                          |
| LLM        | OpenAI API (structured JSON for translation) |
| Documents  | docxtpl (generation path)                    |
| Frontend   | React, TypeScript, Vite, Tailwind CSS        |

## Project structure

```text
.
├── src/
│   ├── backend/          # FastAPI application (package: backend)
│   │   ├── api/          # HTTP routers
│   │   ├── core/         # Config, logging, errors
│   │   ├── credentials/  # Reserved for local creds (not committed)
│   │   ├── inputs/       # Reserved for input assets
│   │   ├── schemas/      # Pydantic models
│   │   ├── services/     # Business logic
│   │   ├── storage/      # Default upload area (uploads/ created at runtime)
│   │   ├── main.py       # App entrypoint
│   │   └── .env.example
│   └── frontend/         # React SPA
├── docs/                 # Design and tech notes
├── tests/                # Placeholder for automated tests
├── assets/               # Placeholder for static assets
├── requirements.txt
├── README.md
├── AUDIT.md
├── LICENSE
└── .gitignore
```

## License

See [LICENSE](LICENSE) (MIT).
