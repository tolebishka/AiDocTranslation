# AiDocTranslation — frontend

React + Vite + TypeScript + Tailwind MVP for passport upload, OCR pipeline preview, and copy-friendly field table.

## Run

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Start the FastAPI backend on `http://127.0.0.1:8000` (CORS allows the Vite dev origin).

## API base URL

Copy `.env.example` to `.env` and set:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Restart `npm run dev` after changing env vars.

## Build

```bash
npm run build
npm run preview
```
