# ── Python Evaluation Service Dockerfile ──
FROM python:3.11-slim AS base

# Install system dependencies (Tesseract OCR, Poppler for PDF processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

EXPOSE 8000

ENV PORT=8000
ENV HOST=0.0.0.0
ENV LOG_LEVEL=INFO

CMD ["python", "main.py"]
