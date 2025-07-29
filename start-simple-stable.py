#!/usr/bin/env python3
"""
Simple Stable Backend for MeDocPro
Uses production Waitress server with minimal monitoring
"""

import os
import sys
import time
import subprocess
import logging
import signal

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('simple-stable.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SimpleStableBackend:
    def __init__(self):
        self.process = None
        self.running = False
        
    def start_backend(self):
        """Start the production backend"""
        try:
            logger.info("Starting Simple Stable Backend for MeDocPro...")
            
            current_dir = os.getcwd()
            
            # Use venv Python if available
            python_exe = sys.executable
            if os.name == 'nt':  # Windows
                venv_python = os.path.join(current_dir, 'venv-windows', 'Scripts', 'python.exe')
                if os.path.exists(venv_python):
                    python_exe = venv_python
            
            # Start production backend (Waitress WSGI server)
            cmd = [python_exe, 'start-production-backend.py']
            
            self.process = subprocess.Popen(
                cmd,
                cwd=current_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True
            )
            
            logger.info(f"Backend started with PID: {self.process.pid}")
            logger.info("Using Waitress WSGI production server")
            logger.info("Server should be available at: http://localhost:5000")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to start backend: {e}")
            return False
    
    def stop_backend(self):
        """Stop the backend"""
        if self.process:
            logger.info("Stopping backend...")
            try:
                self.process.terminate()
                self.process.wait(timeout=10)
                logger.info("Backend stopped")
            except subprocess.TimeoutExpired:
                logger.warning("Forcing backend stop...")
                self.process.kill()
                self.process.wait()
            except Exception as e:
                logger.error(f"Error stopping backend: {e}")
            
            self.process = None
    
    def wait_for_backend(self):
        """Wait for backend to finish (or crash)"""
        if not self.process:
            return
        
        logger.info("Backend is running. Press Ctrl+C to stop.")
        
        try:
            # Wait for process to finish
            returncode = self.process.wait()
            
            if returncode == 0:
                logger.info("Backend exited normally")
            else:
                logger.error(f"Backend exited with code: {returncode}")
                
                # Print last few lines of output for debugging
                if self.process.stdout:
                    try:
                        output = self.process.stdout.read()
                        if output:
                            logger.error("Backend output:")
                            for line in output.strip().split('\n')[-10:]:  # Last 10 lines
                                logger.error(f"  {line}")
                    except:
                        pass
                        
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
    
    def run(self):
        """Run the simple stable backend"""
        # Handle signals
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        try:
            if self.start_backend():
                self.running = True
                self.wait_for_backend()
            else:
                logger.error("Failed to start backend")
                return False
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        finally:
            self.stop_backend()
        
        return True
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down...")
        self.running = False
        if self.process:
            self.process.terminate()

def main():
    backend = SimpleStableBackend()
    try:
        backend.run()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())