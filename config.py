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
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')
    
    # AI Configuration
    OLLAMA_BASE_URL = os.environ.get('OLLAMA_URL', 'http://localhost:11434')
    OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'llama2')
    
    # Security
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None