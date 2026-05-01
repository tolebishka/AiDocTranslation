# syntax=docker/dockerfile:1
# --- Frontend (Vite) ---
FROM node:22-alpine AS frontend
WORKDIR /fe
COPY src/frontend/package.json src/frontend/package-lock.json ./
RUN npm ci
COPY src/frontend/ ./
# Empty = same-origin API (FastAPI serves SPA on the same port)
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# --- API + static SPA ---
FROM python:3.12-slim-bookworm
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src \
    ENV=production

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ /app/src/
COPY --from=frontend /fe/dist /app/src/backend/static

RUN mkdir -p /app/src/backend/storage/uploads /app/src/backend/storage/generated

EXPOSE 8000
# Cloud hosts often set PORT
CMD ["sh", "-c", "exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
