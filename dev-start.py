#!/usr/bin/env python3
"""
MeDocPro Development Server
- Hot reloading enabled
- Debug mode on
- Flask development server
- CORS configured for local development
"""

import os
import sys
from app import create_app
from config import Config

class DevelopmentConfig(Config):
    """Development-specific configuration"""
    DEBUG = True
    FLASK_ENV = 'development'
    CORS_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173']

def main():
    """Start development server"""
    print("=" * 50)
    print("🔧 MeDocPro Development Server")
    print("=" * 50)
    print("✅ Hot reloading: ENABLED")
    print("✅ Debug mode: ON") 
    print("✅ CORS: Local development")
    print("✅ Database: Real data preserved")
    print("=" * 50)
    
    # Create Flask app with development config
    app = create_app(DevelopmentConfig)
    
    # Start development server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=True,
        threaded=True
    )

if __name__ == '__main__':
    main()