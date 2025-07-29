#!/usr/bin/env python3
"""
Super Stable Backend Manager for MeDocPro
Enhanced version with better crash prevention and database connection management
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
import json

# Try to import psutil, install if missing
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    print("psutil not found. Installing...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'psutil'])
        import psutil
        HAS_PSUTIL = True
        print("psutil installed successfully!")
    except subprocess.CalledProcessError:
        print("Warning: Could not install psutil. Some features will be limited.")
        HAS_PSUTIL = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('super-stable-backend.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SuperStableBackend:
    def __init__(self):
        self.process = None
        self.running = False
        self.restart_count = 0
        self.max_restarts = 15
        self.health_check_interval = 60  # 1 minute intervals
        self.restart_delay = 3  # Start with short delay
        self.consecutive_failures = 0
        self.last_successful_start = None
        
    def start_backend(self):
        """Start the Flask backend process with enhanced stability"""
        try:
            logger.info("Starting Super Stable Backend...")
            
            current_dir = os.getcwd()
            python_exe = sys.executable
            
            # Use production backend if available
            production_script = os.path.join(current_dir, 'start-production-backend.py')
            if os.path.exists(production_script):
                cmd = [python_exe, 'start-production-backend.py']
                logger.info("Using production Waitress WSGI server")
            else:
                # Enhanced Flask development server with better stability
                cmd = [
                    python_exe, '-c',
                    '''
import os
import sys
import logging
from datetime import datetime

# Enhanced Flask configuration for stability
os.environ["FLASK_ENV"] = "production"
os.environ["FLASK_DEBUG"] = "0"
os.environ["WERKZEUG_RUN_MAIN"] = "true"

# Reduce logging noise
logging.getLogger("werkzeug").setLevel(logging.ERROR)
logging.getLogger("urllib3").setLevel(logging.WARNING)

# Configure database connection pooling
os.environ["SQLALCHEMY_ENGINE_OPTIONS"] = '{"pool_pre_ping": true, "pool_recycle": 300}'

try:
    from app import create_app
    app = create_app()
    
    # Enhanced Flask server configuration
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'pool_timeout': 20,
        'max_overflow': 10
    }
    
    print(f"[{datetime.now()}] MeDocPro backend starting on port 5000...")
    sys.stdout.flush()
    
    app.run(
        host="0.0.0.0", 
        port=5000, 
        debug=False, 
        threaded=True, 
        use_reloader=False,
        use_debugger=False,
        passthrough_errors=False
    )
    
except Exception as e:
    print(f"[{datetime.now()}] ERROR: Failed to start backend: {e}")
    sys.exit(1)
'''
                ]
                logger.info("Using enhanced Flask development server")
            
            # Kill any existing processes on port 5000
            self.kill_existing_processes()
            
            # Start the backend process
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=current_dir,
                env={**os.environ, 'PYTHONUNBUFFERED': '1'}
            )
            
            # Wait for startup with better feedback
            logger.info("Waiting for backend to start...")
            for i in range(10):  # Wait up to 10 seconds
                if self.process.poll() is not None:
                    stdout, stderr = self.process.communicate()
                    logger.error(f"Backend failed to start: {stderr}")
                    return False
                    
                time.sleep(1)
                
                # Check if server is responding
                if self.is_server_responding():
                    logger.info(f"Backend started successfully (PID: {self.process.pid})")
                    self.last_successful_start = datetime.now()
                    self.consecutive_failures = 0
                    return True
            
            logger.error("Backend failed to respond after 10 seconds")
            return False
                
        except Exception as e:
            logger.error(f"Error starting backend: {e}")
            return False
    
    def kill_existing_processes(self):
        """Kill any existing processes using port 5000"""
        if not HAS_PSUTIL:
            logger.warning("psutil not available - cannot kill existing processes")
            return
            
        try:
            for proc in psutil.process_iter(['pid', 'name', 'connections']):
                try:
                    for conn in proc.info['connections'] or []:
                        if conn.laddr.port == 5000:
                            logger.info(f"Killing existing process {proc.pid} using port 5000")
                            proc.kill()
                            proc.wait(timeout=3)
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.TimeoutExpired):
                    pass
        except Exception as e:
            logger.warning(f"Error killing existing processes: {e}")
    
    def stop_backend(self):
        """Stop the Flask backend process"""
        if self.process and self.process.poll() is None:
            logger.info("Stopping backend...")
            
            # Try graceful shutdown first
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
                logger.info("Backend stopped gracefully")
            except subprocess.TimeoutExpired:
                logger.warning("Backend didn't stop gracefully, forcing kill")
                self.process.kill()
                try:
                    self.process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    logger.error("Backend process refused to die")
            
            self.process = None
    
    def is_server_responding(self):
        """Check if server is responding to requests"""
        try:
            response = requests.get('http://localhost:5000/health', timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def is_backend_healthy(self):
        """Enhanced health check"""
        # Check if process is still running
        if self.process is None or self.process.poll() is not None:
            return False
        
        # Check if server is responding
        if not self.is_server_responding():
            return False
            
        # Check CPU usage (if too high, might be stuck) - only if psutil available
        if HAS_PSUTIL:
            try:
                proc = psutil.Process(self.process.pid)
                cpu_percent = proc.cpu_percent(interval=1)
                if cpu_percent > 90:  # High CPU usage might indicate problems
                    logger.warning(f"Backend CPU usage high: {cpu_percent}%")
            except psutil.NoSuchProcess:
                return False
        
        return True
    
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
        """Restart the backend with intelligent backoff"""
        if self.restart_count >= self.max_restarts:
            logger.error(f"Maximum restart attempts ({self.max_restarts}) reached. Stopping.")
            self.running = False
            return
        
        self.restart_count += 1
        self.consecutive_failures += 1
        
        # Intelligent delay based on failure pattern
        if self.consecutive_failures < 3:
            delay = self.restart_delay
        elif self.consecutive_failures < 5:
            delay = self.restart_delay * 2
        else:
            delay = min(self.restart_delay * self.consecutive_failures, 60)
        
        logger.info(f"Restarting backend (attempt {self.restart_count}/{self.max_restarts}) in {delay} seconds...")
        
        self.stop_backend()
        time.sleep(delay)
        
        if self.start_backend():
            logger.info("Backend restarted successfully")
        else:
            logger.error("Failed to restart backend")
    
    def run(self):
        """Main run loop"""
        logger.info("Starting Super Stable Backend Manager for MeDocPro")
        logger.info("Enhanced with intelligent restart logic and better crash prevention")
        
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
        
        logger.info("Super Stable Backend Manager is running. Press Ctrl+C to stop.")
        logger.info("Log file: super-stable-backend.log")
        
        try:
            # Keep main thread alive
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
        
        logger.info("Shutting down Super Stable Backend Manager...")
        self.running = False
        self.stop_backend()
        return 0
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down...")
        self.running = False

def main():
    if not HAS_PSUTIL:
        logger.warning("psutil not available - running with limited process management")
        logger.info("For best performance, install psutil: pip install psutil")
    else:
        logger.info("psutil available - enhanced process management enabled")
    
    backend_manager = SuperStableBackend()
    return backend_manager.run()

if __name__ == '__main__':
    sys.exit(main())