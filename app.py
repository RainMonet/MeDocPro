#!/usr/bin/env python3
"""
MeDocPro - HIPAA-compliant medical documentation system
Main Flask application entry point
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import create_app

# Create the Flask application
app = create_app()

if __name__ == '__main__':
    # Development server configuration
    debug_mode = os.getenv('DEBUG', 'False').lower() == 'true'
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    
    print(f"Starting MeDocPro on {host}:{port} (debug={debug_mode})")
    
    app.run(
        host=host,
        port=port,
        debug=debug_mode,
        threaded=True
    )