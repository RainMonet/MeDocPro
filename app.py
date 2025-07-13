#!/usr/bin/env python3
"""
MDoc - HIPAA-compliant medical documentation system
Main Flask application entry point
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging for better error tracking
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('flask-backend.log'),
        logging.StreamHandler()
    ]
)

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import create_app

# Create the Flask application
app = create_app()

if __name__ == '__main__':
    logger = logging.getLogger(__name__)
    
    try:
        # Development server configuration
        debug_mode = os.getenv('DEBUG', 'False').lower() == 'true'
        host = os.getenv('HOST', '0.0.0.0')
        port = int(os.getenv('PORT', 5000))
        
        logger.info(f"Starting MeDocPro on {host}:{port} (debug={debug_mode})")
        logger.info("Backend features: PostgreSQL persistence, JWT auth, AI integration")
        
        app.run(
            host=host,
            port=port,
            debug=debug_mode,
            threaded=True,
            use_reloader=False  # Disable reloader for stability
        )
        
    except Exception as e:
        logger.error(f"Failed to start MeDocPro backend: {e}")
        sys.exit(1)