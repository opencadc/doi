# ADES Validator API - Production Dockerfile
# Multi-stage build for smaller, secure image

FROM python:3.11-slim AS builder

WORKDIR /app

# Copy dependency files first (for better caching)
COPY pyproject.toml ./
COPY ades/ ./ades/
COPY app/ ./app/

# Install dependencies to user location
RUN pip install --no-cache-dir --user .

# =============================================================================
# Production Image
# =============================================================================
FROM python:3.11-slim

WORKDIR /app

# Create non-root user for security
RUN groupadd -r -g 1001 validator && \
    useradd -r -u 1001 -g validator validator

# Copy installed packages from builder
COPY --from=builder /root/.local /home/validator/.local

# Copy application code
COPY --chown=validator:validator ades/ ./ades/
COPY --chown=validator:validator app/ ./app/

# Set Python path
ENV PATH=/home/validator/.local/bin:$PATH
ENV PYTHONPATH=/app

# Switch to non-root user
USER validator

EXPOSE 8000

# Health check using Python (avoids need for wget/curl)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health-check')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
