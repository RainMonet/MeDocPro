import os
from dotenv import load_dotenv

# Load environment variables from a .env file
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    """Set Flask configuration variables from .env file."""

    # General Config
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-me'
    FLASK_APP = os.environ.get('FLASK_APP') or 'app.py'
    FLASK_ENV = os.environ.get('FLASK_ENV') or 'development'
    DEBUG = os.environ.get('DEBUG', 'True').lower() in ['true', '1', 'yes']

    # Database - Default to SQLite if DATABASE_URL not set
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if not DATABASE_URL:
        DATABASE_URL = 'sqlite:///' + os.path.join(basedir, 'instance', 'medocpro.db')
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Redis - Optional
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'dev-jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour (increased from 15 minutes)
    JWT_REFRESH_TOKEN_EXPIRES = 604800  # 7 days
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://localhost:5174').split(',')
    
    # AI Configuration (llama.cpp) - DISABLED, using Ollama instead
    LLAMA_SERVER_URL = os.environ.get('LLAMA_SERVER_URL')
    LLAMA_MODEL_PATH = os.environ.get('LLAMA_MODEL_PATH', '/mnt/c/Users/admin/Desktop/MeDocPro/models/mistral-7b-instruct-v0.3.Q4_K_M.gguf')
    LLAMA_THREADS = int(os.environ.get('LLAMA_THREADS', '4'))
    LLAMA_CONTEXT_SIZE = int(os.environ.get('LLAMA_CONTEXT_SIZE', '4096'))
    
    # Legacy Ollama support (for backward compatibility during migration)
    OLLAMA_BASE_URL = os.environ.get('OLLAMA_URL', 'http://localhost:11434')
    OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'mistral:latest')
    
    # Security
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None
    
    # Development Mode Configuration
    DEVELOPMENT_MODE = os.environ.get('DEVELOPMENT_MODE', 'true').lower() == 'true'
    DEVELOPMENT_ADMIN_PRIVILEGES = True  # Force admin privileges for all users in development
    
    # Google Drive Integration Configuration
    GOOGLE_CREDENTIALS_PATH = os.environ.get('GOOGLE_CREDENTIALS_PATH', 'credentials.json')
    GOOGLE_TOKEN_PATH = os.environ.get('GOOGLE_TOKEN_PATH', 'token.json')