# Dockerfile.backend — used by Render.com for the Python/FastAPI service only.
# This is a lightweight image with no frontend build step.

FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Install dependencies first (cached layer)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . ./

# Ensure the app module is on the Python path
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose the port Render will route traffic to
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"

# Start the FastAPI app
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
