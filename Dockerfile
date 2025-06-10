# Multi-stage Dockerfile for MeDocPro Backend
# Optimized for both development and production environments

# =============================================================================
# Base Stage - Common dependencies
# =============================================================================
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libpq-dev \
    postgresql-client \
    pkg-config \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create application user for security
RUN groupadd -r medocpro && useradd -r -g medocpro medocpro

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# =============================================================================
# Development Stage
# =============================================================================
FROM base as development

# Install development dependencies
COPY requirements-dev.txt* ./
RUN if [ -f requirements-dev.txt ]; then pip install --no-cache-dir -r requirements-dev.txt; fi

# Install additional development tools
RUN pip install --no-cache-dir \
    watchdog \
    pytest-watch \
    ipython \
    jupyter

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs backups certs && \
    chown -R medocpro:medocpro /app

# Switch to non-root user
USER medocpro

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Development command with auto-reload
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000", "--reload"]

# =============================================================================
# Production Build Stage
# =============================================================================
FROM base as builder

# Copy application code
COPY . .

# Install application in production mode
# RUN pip install --no-cache-dir -e .

# Remove development files and clean up
RUN find . -type d -name "__pycache__" -delete && \
    find . -type f -name "*.pyc" -delete && \
    rm -rf .git .pytest_cache tests/ docs/ *.md

# =============================================================================
# Production Stage
# =============================================================================
FROM python:3.11-slim as production

# Set production environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_ENV=production \
    DEBIAN_FRONTEND=noninteractive

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create application user
RUN groupadd -r medocpro && useradd -r -g medocpro medocpro

# Set working directory
WORKDIR /app

# Copy Python dependencies from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Copy application code from builder stage
COPY --from=builder --chown=medocpro:medocpro /app .

# Create necessary directories with proper permissions
RUN mkdir -p logs backups certs uploads && \
    chown -R medocpro:medocpro /app && \
    chmod 755 /app && \
    chmod -R 750 logs backups && \
    chmod -R 755 certs

# Security: Remove unnecessary packages and files
RUN apt-get autoremove -y && \
    apt-get autoclean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Switch to non-root user
USER medocpro

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Production command using Gunicorn
CMD ["gunicorn", \
     "--bind", "0.0.0.0:5000", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--worker-connections", "1000", \
     "--timeout", "30", \
     "--keepalive", "5", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "100", \
     "--preload", \
     "--access-logfile", "/app/logs/access.log", \
     "--error-logfile", "/app/logs/error.log", \
     "--log-level", "info", \
     "--capture-output", \
     "--enable-stdio-inheritance", \
     "app:app"]

# =============================================================================
# Testing Stage
# =============================================================================
FROM development as testing

# Copy test configuration
COPY tests/ tests/
COPY pytest.ini .
COPY .coverage* ./

# Run tests during build (optional)
RUN python -m pytest tests/ --cov=. --cov-report=html --cov-report=term

# Test command
CMD ["python", "-m", "pytest", "tests/", "-v", "--cov=.", "--cov-report=term-missing"]