#!/usr/bin/env python3
"""
MeDocPro Backend Application
HIPAA-compliant medical documentation system with AI assistance

Security Features:
- JWT authentication with role-based access control
- AES-256 encryption for PHI data
- Comprehensive audit logging
- Rate limiting and security headers
- PHI scrubbing before AI processing
"""

import os
import logging
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, verify_jwt_in_request, get_jwt_identity, get_jwt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from dotenv import load_dotenv
import redis

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///medocpro.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 15)))
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 7)))

# Redis configuration for rate limiting
redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

# Initialize rate limiter
try:
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        storage_uri=os.getenv('RATELIMIT_STORAGE_URL', redis_url),
        default_limits=["100 per hour"]
    )
except Exception as e:
    print(f"Warning: Could not initialize Redis rate limiter: {e}")
    print("Falling back to in-memory rate limiting")
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=["100 per hour"]
    )

# CORS configuration
CORS(app, origins=os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(','))

# Logging configuration
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Security headers middleware
@app.after_request
def add_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    
    if os.getenv('FLASK_ENV') == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    return response

# Request logging middleware
@app.before_request
def log_request_info():
    """Log all incoming requests for audit purposes"""
    g.start_time = datetime.utcnow()
    
    # Skip logging for health checks and static files
    if request.endpoint in ['health', 'static']:
        return
    
    logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")

@app.after_request
def log_response_info(response):
    """Log response information"""
    if hasattr(g, 'start_time'):
        duration = (datetime.utcnow() - g.start_time).total_seconds()
        logger.info(f"Response: {response.status_code} in {duration:.3f}s")
    
    return response

# JWT token validation
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    """Check if JWT token is revoked (implement token blacklist if needed)"""
    # For now, always return False
    # In production, implement proper token blacklist
    return False

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    """Handle expired tokens"""
    return jsonify({
        'error': 'Token has expired',
        'message': 'Please log in again'
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    """Handle invalid tokens"""
    return jsonify({
        'error': 'Invalid token',
        'message': 'Please provide a valid token'
    }), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    """Handle missing tokens"""
    return jsonify({
        'error': 'Authorization required',
        'message': 'Please provide a valid token'
    }), 401

# Role-based access control decorator
def require_role(*roles):
    """Decorator to require specific roles for endpoint access"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role', 'read_only')
            
            if user_role not in roles:
                return jsonify({
                    'error': 'Insufficient permissions',
                    'message': f'Required role: {" or ".join(roles)}'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Health check endpoint
@app.route('/health', methods=['GET'])
@limiter.exempt
def health():
    """System health check endpoint"""
    try:
        # Basic database connectivity check
        db.session.execute('SELECT 1')
        db_status = 'healthy'
    except Exception as e:
        db_status = f'error: {str(e)}'
        logger.error(f"Database health check failed: {e}")
    
    # Check Redis connectivity
    try:
        redis_client = redis.from_url(redis_url)
        redis_client.ping()
        redis_status = 'healthy'
    except Exception as e:
        redis_status = f'error: {str(e)}'
        logger.warning(f"Redis health check failed: {e}")
    
    health_info = {
        'status': 'healthy' if db_status == 'healthy' else 'degraded',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0',
        'components': {
            'database': db_status,
            'redis': redis_status,
            'ai_service': 'not_configured'  # Will be updated when Ollama is configured
        }
    }
    
    status_code = 200 if health_info['status'] == 'healthy' else 503
    return jsonify(health_info), status_code

# API information endpoint
@app.route('/api', methods=['GET'])
@limiter.limit("10 per minute")
def api_info():
    """API information and documentation"""
    return jsonify({
        'name': 'MeDocPro API',
        'version': '1.0.0',
        'description': 'HIPAA-compliant medical documentation system with AI assistance',
        'documentation': '/api/docs',
        'endpoints': {
            'authentication': '/api/auth',
            'templates': '/api/templates',
            'users': '/api/users',
            'ai_enhancement': '/api/ai',
            'audit': '/api/audit'
        },
        'security': {
            'authentication': 'JWT Bearer Token',
            'encryption': 'AES-256',
            'audit_logging': 'Enabled',
            'rate_limiting': 'Enabled'
        }
    })

# Error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        'error': 'Bad Request',
        'message': 'The request could not be understood'
    }), 400

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'error': 'Unauthorized',
        'message': 'Authentication required'
    }), 401

@app.errorhandler(403)
def forbidden(error):
    return jsonify({
        'error': 'Forbidden',
        'message': 'Insufficient permissions'
    }), 403

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found'
    }), 404

@app.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({
        'error': 'Rate Limit Exceeded',
        'message': 'Too many requests. Please try again later.'
    }), 429

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred'
    }), 500

# Register blueprints (will be created in separate files)
def register_blueprints():
    """Register API blueprints"""
    try:
        from api.auth import auth_bp
        from api.templates import templates_bp
        from api.users import users_bp
        from api.audit import audit_bp
        from api.ai_enhancement import ai_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(templates_bp, url_prefix='/api/templates')
        app.register_blueprint(users_bp, url_prefix='/api/users')
        app.register_blueprint(audit_bp, url_prefix='/api/audit')
        app.register_blueprint(ai_bp, url_prefix='/api/ai')
        
        logger.info("All blueprints registered successfully")
    except ImportError as e:
        logger.warning(f"Could not import all blueprints: {e}")
        logger.info("Some API endpoints may not be available until modules are created")

# Application factory pattern
def create_app(config_name='development'):
    """Create and configure Flask application"""
    
    # Register blueprints
    register_blueprints()
    
    # Initialize database tables
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create database tables: {e}")
    
    logger.info(f"MeDocPro API started in {config_name} mode")
    return app

if __name__ == '__main__':
    # Development server
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    
    if debug_mode:
        logger.info("Starting development server...")
        logger.warning("This is a development server. Do not use in production!")
    
    # Create the application
    app = create_app('development' if debug_mode else 'production')
    
    # Run the application
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=debug_mode,
        ssl_context='adhoc' if os.getenv('USE_SSL', 'false').lower() == 'true' else None
    )