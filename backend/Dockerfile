# Use a lightweight python image
FROM python:3.12-slim as builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml .
COPY uv.lock .

# Install dependencies into a virtual environment
RUN uv venv && uv sync --no-dev

# Final stage
FROM python:3.12-slim

WORKDIR /app

# Copy the virtual environment and the app
COPY --from=builder /app/.venv /app/.venv
COPY app/ /app/app/

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Start the application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
