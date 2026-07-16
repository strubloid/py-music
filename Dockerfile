# Build stage for the code-split Living City frontend.
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# Production stage with the Flask API and static frontend only.
FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --disable-pip-version-check -r requirements.txt

RUN useradd --create-home --shell /bin/bash app && \
    mkdir -p /app/data && \
    chown app:app /app /app/data
COPY --chown=app:app backend/ ./backend/
COPY --chown=app:app main.py ./
COPY --chown=app:app --from=frontend-build /app/frontend/dist ./frontend/dist
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint
RUN chmod 0755 /usr/local/bin/docker-entrypoint

ENV FLASK_APP=backend.project.api.app:app
ENV PYTHONUNBUFFERED=1
ENV PORT=5000
ENV PYMUSIC_DATA_DIR=/app/data

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5000/api/health', timeout=3)" || exit 1

# One worker preserves SQLite safety; threads provide concurrent request capacity.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint"]
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--threads", "4", "--timeout", "120", "--forwarded-allow-ips", "*", "--access-logfile", "-", "backend.project.api.app:app"]
