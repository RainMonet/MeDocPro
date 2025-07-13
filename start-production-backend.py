#!/usr/bin/env python3
"""
Production Backend for MeDocPro using Waitress WSGI Server
Provides better stability and performance than Flask dev server
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('production-backend.log'),
        logging.StreamHandler()
    ]
)

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

try:
    from waitress import serve
    from app import create_app
    
    def main():
        logger = logging.getLogger(__name__)
        
        try:
            # Create the Flask application
            app = create_app()
            
            # Production server configuration
            host = os.getenv('HOST', '0.0.0.0')
            port = int(os.getenv('PORT', 5000))
            threads = int(os.getenv('THREADS', 4))
            
            logger.info(f"Starting MeDocPro Production Server on {host}:{port}")
            logger.info(f"Using Waitress WSGI server with {threads} threads")
            logger.info("Backend features: PostgreSQL persistence, JWT auth, AI integration")
            
            # Start the production server
            serve(
                app,
                host=host,
                port=port,
                threads=threads,
                connection_limit=100,
                cleanup_interval=30,
                channel_timeout=120,
                log_untrusted_proxy_headers=True,
                clear_untrusted_proxy_headers=True
            )
            
        except Exception as e:
            logger.error(f"Failed to start production backend: {e}")
            return 1
        
        return 0
    
    if __name__ == '__main__':
        sys.exit(main())
        
except ImportError:
    print("Waitress not installed. Installing...")
    import subprocess
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'waitress'])
        print("Waitress installed successfully. Please run this script again.")
    except subprocess.CalledProcessError:
        print("Failed to install Waitress. Please install manually: pip install waitress")
    sys.exit(1)