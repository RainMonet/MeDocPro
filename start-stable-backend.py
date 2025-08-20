#!/usr/bin/env python3
"""
Stable Backend Manager for MeDocPro
Provides auto-restart, health monitoring, and crash recovery
"""

import os
import sys
import time
import signal
import subprocess
import threading
import logging
from datetime import datetime
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend-manager.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class StableBackend:
    def __init__(self):
        self.process = None
        self.running = False
        self.restart_count = 0
        self.max_restarts = 10
        self.health_check_interval = 120  # seconds - much less aggressive
        self.restart_delay = 5  # seconds
        
    def start_backend(self):
        """Start the Flask backend process"""
        try:
            logger.info("Starting Flask backend...")
            
            # Use current working directory instead of hardcoded path
            current_dir = os.getcwd()
            logger.info(f"Working directory: {current_dir}")
            
            # Determine the correct Python executable
            python_exe = sys.executable
            if os.name == 'nt':  # Windows
                # Try to use the venv python if available
                venv_python = os.path.join(current_dir, 'venv-windows', 'Scripts', 'python.exe')
                if os.path.exists(venv_python):
                    python_exe = venv_python
                    logger.info(f"Using venv Python: {python_exe}")
            
            # Check if production backend is available (Waitress)
            production_script = os.path.join(current_dir, 'start-production-backend.py')
            use_production = os.path.exists(production_script)
            
            if use_production:
                # Use production backend with Waitress
                cmd = [python_exe, 'start-production-backend.py']
                logger.info("Using production Waitress WSGI server")
            else:
                # Fall back to optimized Flask development server
                cmd = [
                    python_exe, '-c',
                    '''
import os
os.environ["FLASK_ENV"] = "production"
os.environ["FLASK_DEBUG"] = "0"
import logging
logging.getLogger("werkzeug").setLevel(logging.WARNING)
from app import create_app
app = create_app()
app.run(host="0.0.0.0", port=5000, debug=False, threaded=True, use_reloader=False)
'''
                ]
                logger.info("Using optimized Flask development server")
            
            # Start the backend process
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=current_dir  # Explicitly set working directory
            )
            
            # Wait a moment for startup
            time.sleep(3)
            
            # Check if process started successfully
            if self.process.poll() is None:
                logger.info(f"Backend started successfully (PID: {self.process.pid})")
                return True
            else:
                stdout, stderr = self.process.communicate()
                logger.error(f"Backend failed to start: {stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error starting backend: {e}")
            return False
    
    def stop_backend(self):
        """Stop the Flask backend process"""
        if self.process and self.process.poll() is None:
            logger.info("Stopping backend...")
            self.process.terminate()
            
            # Wait for graceful shutdown
            try:
                self.process.wait(timeout=10)
                logger.info("Backend stopped gracefully")
            except subprocess.TimeoutExpired:
                logger.warning("Backend didn't stop gracefully, forcing kill")
                self.process.kill()
                self.process.wait()
            
            self.process = None
    
    def is_backend_healthy(self):
        """Check if backend process is still running (less aggressive than HTTP checks)"""
        # First check if process is still running
        if self.process is None or self.process.poll() is not None:
            return False
        
        # Only do HTTP health check occasionally (every other check)
        if hasattr(self, '_last_http_check'):
            self._last_http_check = not self._last_http_check
        else:
            self._last_http_check = True
        
        if self._last_http_check:
            try:
                response = requests.get('http://localhost:5000/health', timeout=10)
                return response.status_code == 200
            except requests.exceptions.RequestException:
                # Don't immediately fail on HTTP errors, just log them
                logger.warning("Health check HTTP request failed, but process is still running")
                return True  # Process is running, so consider it healthy
        
        return True  # Process is running
    
    def monitor_health(self):
        """Monitor backend health and restart if needed"""
        while self.running:
            time.sleep(self.health_check_interval)
            
            if not self.running:
                break
                
            # Check if process is still running
            if self.process is None or self.process.poll() is not None:
                logger.warning("Backend process died, attempting restart...")
                self.restart_backend()
                continue
            
            # Check if backend is responding
            if not self.is_backend_healthy():
                logger.warning("Backend health check failed, attempting restart...")
                self.restart_backend()
    
    def restart_backend(self):
        """Restart the backend with exponential backoff"""
        if self.restart_count >= self.max_restarts:
            logger.error(f"Maximum restart attempts ({self.max_restarts}) reached. Stopping.")
            self.running = False
            return
        
        self.restart_count += 1
        delay = min(self.restart_delay * self.restart_count, 30)  # Max 30 second delay
        
        logger.info(f"Restarting backend (attempt {self.restart_count}/{self.max_restarts}) in {delay} seconds...")
        
        self.stop_backend()
        time.sleep(delay)
        
        if self.start_backend():
            logger.info("Backend restarted successfully")
            # Reset restart count on successful restart
            if self.is_backend_healthy():
                self.restart_count = max(0, self.restart_count - 1)
        else:
            logger.error("Failed to restart backend")
    
    def run(self):
        """Main run loop"""
        logger.info("Starting Stable Backend Manager for MeDocPro")
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        self.running = True
        
        # Start the backend
        if not self.start_backend():
            logger.error("Failed to start backend initially")
            return 1
        
        # Start health monitoring in a separate thread
        monitor_thread = threading.Thread(target=self.monitor_health, daemon=True)
        monitor_thread.start()
        
        logger.info("Backend manager is running. Press Ctrl+C to stop.")
        
        try:
            # Keep main thread alive
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
        
        logger.info("Shutting down backend manager...")
        self.running = False
        self.stop_backend()
        return 0
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down...")
        self.running = False

def main():
    backend_manager = StableBackend()
    return backend_manager.run()

if __name__ == '__main__':
    sys.exit(main())