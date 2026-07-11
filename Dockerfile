# Morlen OS - Backend Dockerfile for Alibaba Cloud ECS
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (e.g. for psycopg2)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY agents /app/agents
COPY openserv /app/openserv

# Ensure Python can find the modules
ENV PYTHONPATH=/app

# Default port for local development
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "uvicorn openserv.server:app --host 0.0.0.0 --port ${PORT:-8080}"]
