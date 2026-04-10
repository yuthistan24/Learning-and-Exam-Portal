import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.getenv('PORT', 8000))
    HOST = os.getenv('HOST', '0.0.0.0')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    MODEL_CACHE_DIR = os.getenv('MODEL_CACHE_DIR', './models')
    # Default to offline to avoid accidental downloads of HF models
    TRANSFORMERS_OFFLINE = os.getenv('TRANSFORMERS_OFFLINE', 'True').lower() == 'true'
    
    # Local-only defaults (no external APIs)
    LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'ollama')
    LLM_API_KEY = os.getenv('LLM_API_KEY', '')
    LLM_MODEL = os.getenv('LLM_MODEL', os.getenv('OLLAMA_MODEL', 'local-model'))
    OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://host.docker.internal:11434')
    
    EVALUATION_TIMEOUT = int(os.getenv('EVALUATION_TIMEOUT', 30))
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', 10))

config = Config()
