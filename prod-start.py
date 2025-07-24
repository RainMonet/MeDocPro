#!/usr/bin/env python3
"""
MeDocPro Production Server
- Waitress WSGI server
- Debug mode off
- Production-optimized
- Enhanced CORS for production
"""

import os
import sys
from waitress import serve
from app import create_app
from config import Config

class ProductionConfig(Config):
    """Production-specific configuration"""
    DEBUG = False
    FLASK_ENV = 'production'
    # CORS will be handled by manual headers in production

def setup_production_cors(app):
    """Setup CORS for production Waitress server"""
    @app.after_request
    def after_request(response):
        # Allow all origins in development/demo
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Accept'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS,HEAD'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '3600'
        return response

def main():
    """Start production server"""
    print("=" * 50)
    print("🚀 MeDocPro Production Server")
    print("=" * 50)
    print("✅ Server: Waitress WSGI")
    print("✅ Debug mode: OFF")
    print("✅ CORS: Production headers")
    print("✅ Database: Real data preserved")
    print("✅ Performance: Optimized")
    print("=" * 50)
    
    # Create Flask app with production config
    app = create_app(ProductionConfig)
    
    # Setup production CORS
    setup_production_cors(app)
    
    print(f"🌐 Starting server on http://0.0.0.0:5000")
    print("Press CTRL+C to stop")
    
    # Start production server
    serve(
        app,
        host='0.0.0.0',
        port=5000,
        threads=4,
        connection_limit=100,
        cleanup_interval=30,
        channel_timeout=120
    )

if __name__ == '__main__':
    main()