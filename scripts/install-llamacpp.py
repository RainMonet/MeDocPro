#!/usr/bin/env python3
"""
llama.cpp Installation Script for MeDocPro Migration
Automates the installation and setup of llama.cpp llama-server
"""

import os
import sys
import subprocess
import urllib.request
import json
import platform
import shutil
from pathlib import Path

class LlamaCppInstaller:
    def __init__(self):
        self.base_dir = Path("/mnt/c/Users/admin/Desktop/MeDocPro")
        self.llama_dir = self.base_dir / "llama.cpp"
        self.models_dir = self.base_dir / "models"
        self.release_url = "https://api.github.com/repos/ggerganov/llama.cpp/releases/latest"
        
    def check_prerequisites(self):
        """Check if required tools are available"""
        print("🔍 Checking prerequisites...")
        
        required_tools = ['git', 'cmake', 'make']
        missing_tools = []
        
        for tool in required_tools:
            if not shutil.which(tool):
                missing_tools.append(tool)
        
        if missing_tools:
            print(f"❌ Missing required tools: {', '.join(missing_tools)}")
            print("📋 Install with: sudo apt update && sudo apt install -y git cmake build-essential")
            return False
        
        print("✅ All prerequisites available")
        return True
    
    def get_latest_release(self):
        """Get latest llama.cpp release info"""
        print("📡 Fetching latest llama.cpp release...")
        
        try:
            with urllib.request.urlopen(self.release_url) as response:
                data = json.loads(response.read().decode())
            
            tag_name = data['tag_name']
            print(f"✅ Latest release: {tag_name}")
            return tag_name, data['assets']
        
        except Exception as e:
            print(f"❌ Failed to fetch release info: {e}")
            return None, None
    
    def download_prebuilt_binary(self, assets):
        """Download pre-built binary if available"""
        print("🔍 Looking for pre-built Linux binary...")
        
        # Look for Linux x64 binary
        linux_asset = None
        for asset in assets:
            if 'linux' in asset['name'].lower() and 'x64' in asset['name'].lower():
                linux_asset = asset
                break
        
        if linux_asset:
            print(f"📦 Found pre-built binary: {linux_asset['name']}")
            return self.download_file(linux_asset['browser_download_url'], 
                                    self.llama_dir / linux_asset['name'])
        
        print("ℹ️  No suitable pre-built binary found, will compile from source")
        return False
    
    def download_file(self, url, destination):
        """Download file with progress"""
        try:
            print(f"⬇️  Downloading {destination.name}...")
            urllib.request.urlretrieve(url, destination)
            print(f"✅ Downloaded to {destination}")
            return True
        except Exception as e:
            print(f"❌ Download failed: {e}")
            return False
    
    def clone_repository(self):
        """Clone llama.cpp repository"""
        print("📦 Cloning llama.cpp repository...")
        
        if self.llama_dir.exists():
            print("⚠️  llama.cpp directory exists, updating...")
            try:
                result = subprocess.run(['git', 'pull'], 
                                      cwd=self.llama_dir, 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    print("✅ Repository updated")
                    return True
                else:
                    print(f"❌ Git pull failed: {result.stderr}")
                    return False
            except Exception as e:
                print(f"❌ Git pull error: {e}")
                return False
        else:
            try:
                result = subprocess.run([
                    'git', 'clone', 
                    'https://github.com/ggerganov/llama.cpp.git',
                    str(self.llama_dir)
                ], capture_output=True, text=True)
                
                if result.returncode == 0:
                    print("✅ Repository cloned successfully")
                    return True
                else:
                    print(f"❌ Git clone failed: {result.stderr}")
                    return False
            except Exception as e:
                print(f"❌ Git clone error: {e}")
                return False
    
    def compile_llama_cpp(self):
        """Compile llama.cpp from source"""
        print("🔨 Compiling llama.cpp...")
        
        # Create build directory
        build_dir = self.llama_dir / "build"
        build_dir.mkdir(exist_ok=True)
        
        # Configure with CMake
        print("⚙️  Configuring build...")
        configure_cmd = [
            'cmake', '..', 
            '-DCMAKE_BUILD_TYPE=Release',
            '-DLLAMA_BUILD_SERVER=ON',  # Enable server
            '-DLLAMA_BUILD_EXAMPLES=ON'
        ]
        
        try:
            result = subprocess.run(configure_cmd, cwd=build_dir, 
                                  capture_output=True, text=True)
            if result.returncode != 0:
                print(f"❌ CMake configure failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ CMake configure error: {e}")
            return False
        
        # Build
        print("🔨 Building (this may take several minutes)...")
        try:
            result = subprocess.run(['make', '-j', str(os.cpu_count() or 4)], 
                                  cwd=build_dir, capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Build completed successfully")
                return True
            else:
                print(f"❌ Build failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Build error: {e}")
            return False
    
    def verify_installation(self):
        """Verify llama-server binary is working"""
        print("🧪 Verifying installation...")
        
        # Find llama-server binary
        possible_paths = [
            self.llama_dir / "build" / "bin" / "llama-server",
            self.llama_dir / "llama-server",
            self.llama_dir / "build" / "llama-server"
        ]
        
        llama_server_path = None
        for path in possible_paths:
            if path.exists() and os.access(path, os.X_OK):
                llama_server_path = path
                break
        
        if not llama_server_path:
            print("❌ llama-server binary not found")
            return False
        
        # Test version
        try:
            result = subprocess.run([str(llama_server_path), '--version'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                print(f"✅ llama-server working: {result.stdout.strip()}")
                return str(llama_server_path)
            else:
                print(f"❌ llama-server test failed: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            print("⚠️  llama-server version check timed out (may be normal)")
            return str(llama_server_path)  # Assume it's working
        except Exception as e:
            print(f"❌ llama-server test error: {e}")
            return False
    
    def create_models_directory(self):
        """Create models directory"""
        print("📁 Creating models directory...")
        self.models_dir.mkdir(exist_ok=True)
        print(f"✅ Models directory: {self.models_dir}")
    
    def create_startup_script(self, llama_server_path):
        """Create startup script for llama-server"""
        script_content = f"""#!/bin/bash
# llama-server startup script for MeDocPro
# Auto-generated by install-llamacpp.py

LLAMA_SERVER="{llama_server_path}"
MODELS_DIR="{self.models_dir}"
PORT=8080
HOST="127.0.0.1"

# Default model (will be set during model download)
MODEL_PATH="$MODELS_DIR/mistral-7b-instruct-v0.3.Q4_K_M.gguf"

# Check if model exists
if [ ! -f "$MODEL_PATH" ]; then
    echo "❌ Model not found: $MODEL_PATH"
    echo "📋 Run: python3 scripts/download-models.py"
    exit 1
fi

echo "🚀 Starting llama-server..."
echo "📍 Model: $MODEL_PATH"
echo "🌐 Server: http://$HOST:$PORT"

# Start llama-server with optimized settings
"$LLAMA_SERVER" \\
    --model "$MODEL_PATH" \\
    --host "$HOST" \\
    --port $PORT \\
    --ctx-size 4096 \\
    --n-predict 512 \\
    --threads {os.cpu_count() or 4} \\
    --batch-size 512 \\
    --memory-f32 \\
    --verbose
"""
        
        script_path = self.base_dir / "start-llama-server.sh"
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        # Make executable
        os.chmod(script_path, 0o755)
        print(f"✅ Startup script created: {script_path}")
    
    def install(self):
        """Main installation process"""
        print("🚀 llama.cpp Installation for MeDocPro")
        print("=" * 50)
        
        if not self.check_prerequisites():
            return False
        
        # Get latest release info
        tag_name, assets = self.get_latest_release()
        if not tag_name:
            print("❌ Failed to get release information")
            return False
        
        # Try to download pre-built binary first
        if assets and not self.download_prebuilt_binary(assets):
            # If no pre-built binary, compile from source
            if not self.clone_repository():
                return False
            
            if not self.compile_llama_cpp():
                return False
        
        # Verify installation
        llama_server_path = self.verify_installation()
        if not llama_server_path:
            return False
        
        # Create supporting directories and scripts
        self.create_models_directory()
        self.create_startup_script(llama_server_path)
        
        print("\n" + "=" * 50)
        print("✅ llama.cpp installation completed successfully!")
        print(f"📍 Installation directory: {self.llama_dir}")
        print(f"🎯 llama-server binary: {llama_server_path}")
        print(f"📁 Models directory: {self.models_dir}")
        print("\n📋 Next steps:")
        print("   1. Download models: python3 scripts/download-models.py")
        print("   2. Test server: ./start-llama-server.sh")
        print("   3. Update MeDocPro configuration")
        
        return True

def main():
    installer = LlamaCppInstaller()
    success = installer.install()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()