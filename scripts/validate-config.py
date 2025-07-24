#!/usr/bin/env python3
"""
MeDocPro Configuration Validation Script
Validates environment configuration and dependencies
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from urllib.parse import urlparse
import psycopg2
import redis
import requests
from dotenv import load_dotenv

# Color codes for output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(60)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.END}")

class ConfigValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.load_environment()

    def load_environment(self):
        """Load environment variables from .env file"""
        env_file = Path('.env')
        if env_file.exists():
            load_dotenv(env_file)
            print_success(f"Loaded environment from {env_file}")
        else:
            print_warning("No .env file found, using system environment variables")

    def validate_required_env_vars(self):
        """Validate required environment variables"""
        print_header("Environment Variables")
        
        required_vars = {
            'SECRET_KEY': 'Flask secret key for session security',
            'JWT_SECRET_KEY': 'JWT token signing key',
            'DATABASE_URL': 'Database connection string',
        }
        
        optional_vars = {
            'FLASK_ENV': 'Flask environment (development/production)',
            'DEBUG': 'Debug mode flag',
            'OLLAMA_URL': 'AI service URL',
            'REDIS_URL': 'Redis connection string',
            'CORS_ORIGINS': 'Allowed CORS origins'
        }
        
        # Check required variables
        for var, description in required_vars.items():
            value = os.getenv(var)
            if not value:
                self.errors.append(f"Missing required environment variable: {var}")
                print_error(f"{var}: Not set - {description}")
            else:
                # Mask sensitive values
                if 'SECRET' in var or 'PASSWORD' in var:
                    masked_value = '*' * len(value)
                else:
                    masked_value = value[:50] + '...' if len(value) > 50 else value
                print_success(f"{var}: {masked_value}")
        
        # Check optional variables
        for var, description in optional_vars.items():
            value = os.getenv(var)
            if value:
                print_success(f"{var}: {value}")
            else:
                print_info(f"{var}: Not set (optional) - {description}")

    def validate_database_connection(self):
        """Validate database connectivity"""
        print_header("Database Connection")
        
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            self.errors.append("DATABASE_URL not configured")
            print_error("Cannot validate database - DATABASE_URL not set")
            return
        
        try:
            # Parse database URL
            parsed = urlparse(db_url)
            print_info(f"Database Type: {parsed.scheme}")
            print_info(f"Host: {parsed.hostname}:{parsed.port or 5432}")
            print_info(f"Database: {parsed.path[1:] if parsed.path else 'postgres'}")
            print_info(f"Username: {parsed.username}")
            
            # Test connection
            if parsed.scheme.startswith('postgresql'):
                conn = psycopg2.connect(db_url)
                cursor = conn.cursor()
                cursor.execute('SELECT version();')
                version = cursor.fetchone()[0]
                print_success(f"PostgreSQL connection successful")
                print_info(f"Version: {version}")
                cursor.close()
                conn.close()
            elif parsed.scheme.startswith('sqlite'):
                # SQLite connection test
                import sqlite3
                db_path = db_url.replace('sqlite:///', '')
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute('SELECT sqlite_version();')
                version = cursor.fetchone()[0]
                print_success(f"SQLite connection successful")
                print_info(f"Version: {version}")
                cursor.close()
                conn.close()
            else:
                self.warnings.append(f"Unknown database type: {parsed.scheme}")
                print_warning(f"Unknown database type: {parsed.scheme}")
                
        except Exception as e:
            self.errors.append(f"Database connection failed: {str(e)}")
            print_error(f"Database connection failed: {str(e)}")

    def validate_redis_connection(self):
        """Validate Redis connectivity"""
        print_header("Redis Connection")
        
        redis_url = os.getenv('REDIS_URL')
        if not redis_url:
            print_info("Redis not configured (optional)")
            return
        
        try:
            r = redis.from_url(redis_url)
            r.ping()
            info = r.info()
            print_success("Redis connection successful")
            print_info(f"Version: {info.get('redis_version', 'Unknown')}")
            print_info(f"Memory: {info.get('used_memory_human', 'Unknown')}")
        except Exception as e:
            self.warnings.append(f"Redis connection failed: {str(e)}")
            print_warning(f"Redis connection failed: {str(e)}")

    def validate_ai_service(self):
        """Validate AI service (Ollama) connectivity"""
        print_header("AI Service (Ollama)")
        
        ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
        try:
            response = requests.get(f"{ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                print_success("Ollama connection successful")
                print_info(f"Available models: {len(models)}")
                for model in models[:3]:  # Show first 3 models
                    print_info(f"  - {model.get('name', 'Unknown')}")
                if len(models) > 3:
                    print_info(f"  ... and {len(models) - 3} more")
            else:
                self.warnings.append(f"Ollama returned status {response.status_code}")
                print_warning(f"Ollama returned status {response.status_code}")
        except Exception as e:
            self.warnings.append(f"Ollama connection failed: {str(e)}")
            print_warning(f"AI service not available: {str(e)}")

    def validate_file_structure(self):
        """Validate required files and directories"""
        print_header("File Structure")
        
        required_files = [
            'app/__init__.py',
            'app/models/__init__.py',
            'config.py',
            'manage.py',
            'requirements.txt'
        ]
        
        required_dirs = [
            'app',
            'app/models',
            'app/routes',
            'medocpro-dashboard'
        ]
        
        # Check files
        for file_path in required_files:
            path = Path(file_path)
            if path.exists():
                print_success(f"File exists: {file_path}")
            else:
                self.errors.append(f"Missing required file: {file_path}")
                print_error(f"Missing file: {file_path}")
        
        # Check directories
        for dir_path in required_dirs:
            path = Path(dir_path)
            if path.exists() and path.is_dir():
                print_success(f"Directory exists: {dir_path}")
            else:
                self.errors.append(f"Missing required directory: {dir_path}")
                print_error(f"Missing directory: {dir_path}")

    def validate_dependencies(self):
        """Validate Python dependencies"""
        print_header("Python Dependencies")
        
        try:
            # Check if requirements.txt exists
            req_file = Path('requirements.txt')
            if not req_file.exists():
                self.errors.append("requirements.txt not found")
                print_error("requirements.txt not found")
                return
            
            # Read requirements
            with open(req_file) as f:
                requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]
            
            print_info(f"Found {len(requirements)} requirements in requirements.txt")
            
            # Try to import key dependencies
            key_deps = {
                'flask': 'Flask web framework',
                'sqlalchemy': 'Database ORM',
                'psycopg2': 'PostgreSQL adapter',
                'redis': 'Redis client',
                'requests': 'HTTP client',
                'click': 'CLI framework'
            }
            
            for dep, description in key_deps.items():
                try:
                    __import__(dep)
                    print_success(f"{dep}: Available - {description}")
                except ImportError:
                    self.warnings.append(f"Missing dependency: {dep}")
                    print_warning(f"{dep}: Not available - {description}")
                    
        except Exception as e:
            self.errors.append(f"Error checking dependencies: {str(e)}")
            print_error(f"Error checking dependencies: {str(e)}")

    def validate_ports(self):
        """Validate required ports are available"""
        print_header("Port Availability")
        
        import socket
        
        ports_to_check = {
            5000: 'Flask API',
            5173: 'Vite Frontend',
            5432: 'PostgreSQL',
            6379: 'Redis',
            11434: 'Ollama AI'
        }
        
        for port, service in ports_to_check.items():
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            
            if result == 0:
                print_info(f"Port {port}: In use ({service})")
            else:
                print_success(f"Port {port}: Available ({service})")

    def validate_security_config(self):
        """Validate security configuration"""
        print_header("Security Configuration")
        
        # Check secret keys
        secret_key = os.getenv('SECRET_KEY')
        jwt_secret = os.getenv('JWT_SECRET_KEY')
        
        if secret_key:
            if len(secret_key) < 32:
                self.warnings.append("SECRET_KEY should be at least 32 characters")
                print_warning("SECRET_KEY is too short (should be 32+ characters)")
            elif secret_key in ['dev-secret-key-change-me', 'your-secret-key']:
                self.errors.append("SECRET_KEY uses default/insecure value")
                print_error("SECRET_KEY uses default value - change for production!")
            else:
                print_success("SECRET_KEY length is adequate")
        
        if jwt_secret:
            if len(jwt_secret) < 32:
                self.warnings.append("JWT_SECRET_KEY should be at least 32 characters")
                print_warning("JWT_SECRET_KEY is too short (should be 32+ characters)")
            elif jwt_secret in ['dev-jwt-secret-key', 'your-jwt-secret']:
                self.errors.append("JWT_SECRET_KEY uses default/insecure value")
                print_error("JWT_SECRET_KEY uses default value - change for production!")
            else:
                print_success("JWT_SECRET_KEY length is adequate")
        
        # Check Flask environment
        flask_env = os.getenv('FLASK_ENV', 'production')
        debug = os.getenv('DEBUG', 'False').lower() == 'true'
        
        if flask_env == 'production' and debug:
            self.warnings.append("Debug mode enabled in production")
            print_warning("Debug mode is enabled in production environment")
        elif flask_env == 'development':
            print_info("Development environment - debug mode expected")
        else:
            print_success("Production environment configured properly")

    def run_validation(self):
        """Run all validation checks"""
        print_header("MeDocPro Configuration Validation")
        print_info("Checking system configuration and dependencies...")
        
        # Run all validation checks
        self.validate_required_env_vars()
        self.validate_file_structure()
        self.validate_dependencies()
        self.validate_database_connection()
        self.validate_redis_connection()
        self.validate_ai_service()
        self.validate_ports()
        self.validate_security_config()
        
        # Print summary
        print_header("Validation Summary")
        
        if self.errors:
            print_error(f"Found {len(self.errors)} error(s):")
            for error in self.errors:
                print_error(f"  • {error}")
        else:
            print_success("No critical errors found!")
        
        if self.warnings:
            print_warning(f"Found {len(self.warnings)} warning(s):")
            for warning in self.warnings:
                print_warning(f"  • {warning}")
        else:
            print_success("No warnings found!")
        
        # Overall status
        if self.errors:
            print_error("❌ Configuration validation FAILED")
            return False
        elif self.warnings:
            print_warning("⚠️ Configuration validation PASSED with warnings")
            return True
        else:
            print_success("✅ Configuration validation PASSED")
            return True

def main():
    """Main validation function"""
    validator = ConfigValidator()
    success = validator.run_validation()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()