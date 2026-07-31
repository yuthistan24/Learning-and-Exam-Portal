FROM python:3.11-bookworm

WORKDIR /app

# Offline-only LLM defaults (no external APIs / HF downloads)
ENV TRANSFORMERS_OFFLINE=true \
    HF_HUB_OFFLINE=1 \
    HF_HOME=/app/models \
    MODEL_CACHE_DIR=/app/models \
    LLM_PROVIDER=ollama \
    LLM_API_KEY=""

# Increase robustness of package installation
# Switched to non-slim base to include gcc/g++ and reduce download requirements
RUN echo 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/80-retries && \
    printf "Types: deb\nURIs: http://ftp.us.debian.org/debian\nSuites: bookworm bookworm-updates\nComponents: main\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\n\nTypes: deb\nURIs: http://security.debian.org/debian-security\nSuites: bookworm-security\nComponents: main\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg" > /etc/apt/sources.list.d/debian.sources

# Install missing system dependencies (JDK and Tesseract)
RUN apt-get update && \
    apt-get install -y --no-install-recommends --fix-missing \
    default-jdk tesseract-ocr tesseract-ocr-eng && \
    rm -rf /var/lib/apt/lists/*

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
