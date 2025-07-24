#!/usr/bin/env python3
"""
MeDocPro Process Manager
Simple utility to manage development processes and avoid port conflicts
"""

import os
import sys
import subprocess
import signal
import time
import requests
from pathlib import Path

class ProcessManager:
    def __init__(self):
        self.processes = {}
        self.project_root = Path(__file__).parent

    def kill_processes_on_port(self, port):
        """Kill any processes running on the specified port"""
        try:
            if os.name == 'nt':  # Windows
                subprocess.run(['netstat', '-ano'], capture_output=True, check=True)
                # Windows-specific port killing logic could go here
                pass
            else:  # Unix/Linux
                result = subprocess.run(['lsof', '-ti', f':{port}'], 
                                      capture_output=True, text=True)
                if result.stdout.strip():
                    pids = result.stdout.strip().split('\n')
                    for pid in pids:
                        try:
                            os.kill(int(pid), signal.SIGTERM)
                            print(f"✅ Killed process {pid} on port {port}")
                        except ProcessLookupError:
                            pass
        except Exception as e:
            print(f"⚠️  Could not kill processes on port {port}: {e}")

    def is_port_available(self, port):
        """Check if a port is available"""
        try:
            response = requests.get(f'http://localhost:{port}/health', timeout=2)
            return False  # Port is occupied
        except requests.exceptions.RequestException:
            return True   # Port is available

    def start_backend(self, development=True):
        """Start the backend server"""
        print("🔧 Starting backend server...")
        
        # Kill existing processes on port 5000
        self.kill_processes_on_port(5000)
        time.sleep(1)
        
        # Choose the appropriate start script
        script = 'dev-start.py' if development else 'prod-start.py'
        script_path = self.project_root / script
        
        if not script_path.exists():
            print(f"❌ {script} not found!")
            return False
            
        # Start the backend
        try:
            if os.name == 'nt':  # Windows
                venv_python = self.project_root / 'venv-windows' / 'Scripts' / 'python.exe'
            else:  # Unix/Linux
                venv_python = self.project_root / 'venv' / 'bin' / 'python'
                
            if not venv_python.exists():
                print("❌ Virtual environment not found! Run setup first.")
                return False
                
            proc = subprocess.Popen([str(venv_python), str(script_path)])
            self.processes['backend'] = proc
            
            # Wait for backend to start
            for i in range(10):
                if not self.is_port_available(5000):
                    print("✅ Backend started successfully")
                    return True
                time.sleep(1)
                
            print("⚠️  Backend may not have started properly")
            return False
            
        except Exception as e:
            print(f"❌ Error starting backend: {e}")
            return False

    def start_frontend(self):
        """Start the frontend development server"""
        print("🌐 Starting frontend server...")
        
        frontend_dir = self.project_root / 'medocpro-dashboard'
        if not frontend_dir.exists():
            print("❌ Frontend directory not found!")
            return False
            
        try:
            proc = subprocess.Popen(['npm', 'run', 'dev'], cwd=frontend_dir)
            self.processes['frontend'] = proc
            print("✅ Frontend server started")
            return True
        except Exception as e:
            print(f"❌ Error starting frontend: {e}")
            return False

    def start_all(self, development=True):
        """Start both backend and frontend"""
        print("=" * 50)
        print("🚀 MeDocPro Process Manager")
        print("=" * 50)
        
        # Start backend first
        if not self.start_backend(development):
            print("❌ Failed to start backend")
            return False
            
        time.sleep(2)  # Give backend time to fully start
        
        # Start frontend
        if not self.start_frontend():
            print("❌ Failed to start frontend")
            return False
            
        print("=" * 50)
        print("✅ All services started successfully!")
        print("🔗 Frontend:  http://localhost:5173")
        print("🔗 Backend:   http://localhost:5000")
        print("👤 Login:     demo@medocpro.com / demo123")
        print("=" * 50)
        
        return True

    def stop_all(self):
        """Stop all managed processes"""
        print("🛑 Stopping all processes...")
        for name, proc in self.processes.items():
            try:
                proc.terminate()
                proc.wait(timeout=5)
                print(f"✅ Stopped {name}")
            except subprocess.TimeoutExpired:
                proc.kill()
                print(f"🔪 Force killed {name}")
            except Exception as e:
                print(f"⚠️  Error stopping {name}: {e}")
        
        self.processes.clear()

def main():
    """Main entry point"""
    manager = ProcessManager()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'dev':
            manager.start_all(development=True)
        elif command == 'prod':
            manager.start_all(development=False)
        elif command == 'stop':
            manager.stop_all()
        else:
            print("Usage: python process-manager.py [dev|prod|stop]")
    else:
        # Default to development
        manager.start_all(development=True)
    
    # Wait for user to stop
    try:
        if manager.processes:
            print("\nPress Ctrl+C to stop all services...")
            while True:
                time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping services...")
        manager.stop_all()

if __name__ == '__main__':
    main()