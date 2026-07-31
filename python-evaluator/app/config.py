import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT  = int(os.getenv('PORT', 8000))
    HOST  = os.getenv('HOST', '0.0.0.0')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

    # ── Ollama ──────────────────────────────────────────────────────────────
    OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')

    # Per-subject model overrides (env vars take priority over defaults)
    MODEL_CODING   = os.getenv('MODEL_CODING',   'qwen2.5-coder:1.5b-base')
    MODEL_MATH     = os.getenv('MODEL_MATH',     'deepseek-r1:14b')
    MODEL_ENGLISH  = os.getenv('MODEL_ENGLISH',  'qwen3.5:latest')
    MODEL_SCIENCE  = os.getenv('MODEL_SCIENCE',  'qwen3.5:latest')
    MODEL_GENERAL  = os.getenv('MODEL_GENERAL',  'qwen3.5:latest')

    # ── Evaluation ─────────────────────────────────────────────────────────
    EVALUATION_TIMEOUT = int(os.getenv('EVALUATION_TIMEOUT', 90))
    BATCH_SIZE         = int(os.getenv('BATCH_SIZE', 10))

    # ── OCR ────────────────────────────────────────────────────────────────
    TESSERACT_CMD = os.getenv(
        'TESSERACT_CMD',
        r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    )

config = Config()
