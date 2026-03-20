import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.getenv('PORT', 8000))
    HOST = os.getenv('HOST', '0.0.0.0')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    MODEL_CACHE_DIR = os.getenv('MODEL_CACHE_DIR', './models')
    TRANSFORMERS_OFFLINE = os.getenv('TRANSFORMERS_OFFLINE', 'False').lower() == 'true'
    
    LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'openai')
    LLM_API_KEY = os.getenv('LLM_API_KEY', '')
    LLM_MODEL = os.getenv('LLM_MODEL', 'gpt-3.5-turbo')
    
    EVALUATION_TIMEOUT = int(os.getenv('EVALUATION_TIMEOUT', 30))
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', 10))

config = Config()
