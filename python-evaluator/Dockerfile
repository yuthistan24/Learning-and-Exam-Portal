FROM python:3.11-slim

WORKDIR /app

# Offline-only LLM defaults (no external APIs / HF downloads)
ENV TRANSFORMERS_OFFLINE=true \
    HF_HUB_OFFLINE=1 \
    HF_HOME=/app/models \
    MODEL_CACHE_DIR=/app/models \
    LLM_PROVIDER=ollama \
    LLM_API_KEY=""

# Install system dependencies
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('punkt_tab')"

# Copy source code
COPY app ./app
COPY main.py .

# Expose port
EXPOSE 8000

# Start application
CMD ["python", "main.py"]
