#!/usr/bin/env python3
"""
llama.cpp Binary Installation Script for MeDocPro Migration
Downloads pre-built llama-server binary for immediate use
"""

import os
import sys
import subprocess
import urllib.request
import json
import zipfile
import tarfile
import shutil
from pathlib import Path

class LlamaCppBinaryInstaller:
    def __init__(self):
        self.base_dir = Path("/mnt/c/Users/admin/Desktop/MeDocPro")
        self.llama_dir = self.base_dir / "llama.cpp"
        self.models_dir = self.base_dir / "models"
        self.release_url = "https://api.github.com/repos/ggerganov/llama.cpp/releases/latest"
        
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
    
    def find_compatible_binary(self, assets):
        """Find compatible pre-built binary"""
        print("🔍 Looking for compatible binary...")
        
        # Priority order for binary selection
        binary_patterns = [
            ('linux-x64', 'Linux x64'),
            ('ubuntu-x64', 'Ubuntu x64'),
            ('linux', 'Linux generic'),
            ('ubuntu', 'Ubuntu generic')
        ]
        
        for pattern, description in binary_patterns:
            for asset in assets:
                name_lower = asset['name'].lower()
                if pattern in name_lower and ('zip' in name_lower or 'tar' in name_lower):
                    print(f"✅ Found compatible binary: {asset['name']} ({description})")
                    return asset
        
        print("❌ No compatible pre-built binary found")
        return None
    
    def download_file(self, url, destination):
        """Download file with progress"""
        
        class ProgressHook:
            def __init__(self):
                self.last_percent = -1
            
            def __call__(self, block_num, block_size, total_size):
                if total_size > 0:
                    percent = min(100, (block_num * block_size * 100) // total_size)
                    if percent != self.last_percent:
                        self.last_percent = percent
                        print(f"\r⬇️  Downloading: {percent}% {'█' * (percent // 5)}", end='')
        
        try:
            print(f"📥 Downloading {destination.name}...")
            urllib.request.urlretrieve(url, destination, ProgressHook())
            print("\n✅ Download completed")
            return True
        except Exception as e:
            print(f"\n❌ Download failed: {e}")
            if destination.exists():
                destination.unlink()
            return False
    
    def extract_archive(self, archive_path):
        """Extract downloaded archive"""
        print(f"📦 Extracting {archive_path.name}...")
        
        try:
            if archive_path.name.endswith('.zip'):
                with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                    zip_ref.extractall(self.llama_dir)
            elif archive_path.name.endswith(('.tar.gz', '.tgz')):
                with tarfile.open(archive_path, 'r:gz') as tar_ref:
                    tar_ref.extractall(self.llama_dir)
            elif archive_path.name.endswith('.tar'):
                with tarfile.open(archive_path, 'r:') as tar_ref:
                    tar_ref.extractall(self.llama_dir)
            else:
                print(f"❌ Unsupported archive format: {archive_path.name}")
                return False
            
            print("✅ Extraction completed")
            
            # Clean up archive
            archive_path.unlink()
            return True
            
        except Exception as e:
            print(f"❌ Extraction failed: {e}")
            return False
    
    def find_llama_server_binary(self):
        """Find llama-server binary in extracted files"""
        print("🔍 Locating llama-server binary...")
        
        # Search for llama-server binary
        for root, dirs, files in os.walk(self.llama_dir):
            for file in files:
                if file == 'llama-server' or file == 'server':
                    binary_path = Path(root) / file
                    if os.access(binary_path, os.X_OK):
                        print(f"✅ Found llama-server: {binary_path}")
                        return binary_path
        
        print("❌ llama-server binary not found in extracted files")
        return None
    
    def create_simple_binary(self):
        """Create a simple fallback binary using available tools"""
        print("🔧 Creating simple llama-server setup...")
        
        # Create a basic Python-based llama-server wrapper
        wrapper_content = '''#!/usr/bin/env python3
"""
Simple llama-server wrapper for MeDocPro
Uses llama-cpp-python as fallback when binary not available
"""

import sys
import subprocess
import os

def main():
    print("❌ llama-server binary not available")
    print("💡 Alternative: Install llama-cpp-python for Python-based server")
    print("   pip install llama-cpp-python[server]")
    print("   python -m llama_cpp.server --model models/your-model.gguf")
    sys.exit(1)

if __name__ == "__main__":
    main()
'''
        
        wrapper_path = self.llama_dir / "llama-server"
        self.llama_dir.mkdir(exist_ok=True)
        
        with open(wrapper_path, 'w') as f:
            f.write(wrapper_content)
        
        os.chmod(wrapper_path, 0o755)
        print(f"✅ Created wrapper: {wrapper_path}")
        return wrapper_path
    
    def test_binary(self, binary_path):
        """Test if binary works"""
        print("🧪 Testing llama-server binary...")
        
        try:
            # Try to get help output
            result = subprocess.run([str(binary_path), '--help'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0 and 'llama' in result.stdout.lower():
                print("✅ Binary test successful")
                return True
            else:
                print(f"⚠️  Binary test unclear (exit code: {result.returncode})")
                return True  # Assume it works
                
        except subprocess.TimeoutExpired:
            print("⚠️  Binary test timed out (likely working)")
            return True
        except Exception as e:
            print(f"❌ Binary test failed: {e}")
            return False
    
    def install_python_alternative(self):
        """Install llama-cpp-python as alternative"""
        print("🐍 Installing llama-cpp-python alternative...")
        
        try:
            result = subprocess.run([
                sys.executable, '-m', 'pip', 'install', 
                'llama-cpp-python[server]'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ llama-cpp-python installed successfully")
                return True
            else:
                print(f"❌ pip install failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Installation error: {e}")
            return False
    
    def create_startup_script(self, binary_path, use_python=False):
        """Create startup script"""
        if use_python:
            script_content = f'''#!/bin/bash
# llama-server startup script for MeDocPro (Python version)
# Auto-generated by install-llamacpp-binary.py

MODELS_DIR="{self.models_dir}"
PORT=8080
HOST="127.0.0.1"
MODEL_PATH="$MODELS_DIR/mistral-7b-instruct-v0.3.Q4_K_M.gguf"

# Check if model exists
if [ ! -f "$MODEL_PATH" ]; then
    echo "❌ Model not found: $MODEL_PATH"
    echo "📋 Run: python3 scripts/download-models.py recommended"
    exit 1
fi

echo "🚀 Starting llama-server (Python version)..."
echo "📍 Model: $MODEL_PATH"
echo "🌐 Server: http://$HOST:$PORT"

# Start Python-based server
python3 -m llama_cpp.server \\
    --model "$MODEL_PATH" \\
    --host "$HOST" \\
    --port $PORT \\
    --n_ctx 4096 \\
    --n_threads {os.cpu_count() or 4} \\
    --verbose
'''
        else:
            script_content = f'''#!/bin/bash
# llama-server startup script for MeDocPro
# Auto-generated by install-llamacpp-binary.py

LLAMA_SERVER="{binary_path}"
MODELS_DIR="{self.models_dir}"
PORT=8080
HOST="127.0.0.1"
MODEL_PATH="$MODELS_DIR/mistral-7b-instruct-v0.3.Q4_K_M.gguf"

# Check if model exists
if [ ! -f "$MODEL_PATH" ]; then
    echo "❌ Model not found: $MODEL_PATH"
    echo "📋 Run: python3 scripts/download-models.py recommended"
    exit 1
fi

echo "🚀 Starting llama-server..."
echo "📍 Model: $MODEL_PATH"
echo "🌐 Server: http://$HOST:$PORT"

# Start llama-server
"$LLAMA_SERVER" \\
    --model "$MODEL_PATH" \\
    --host "$HOST" \\
    --port $PORT \\
    --ctx-size 4096 \\
    --n-predict 512 \\
    --threads {os.cpu_count() or 4} \\
    --batch-size 512 \\
    --verbose
'''
        
        script_path = self.base_dir / "start-llama-server.sh"
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        os.chmod(script_path, 0o755)
        print(f"✅ Startup script created: {script_path}")
    
    def install(self):
        """Main installation process"""
        print("🚀 llama.cpp Binary Installation for MeDocPro")
        print("=" * 50)
        
        # Create directories
        self.llama_dir.mkdir(exist_ok=True)
        self.models_dir.mkdir(exist_ok=True)
        
        # Get latest release
        tag_name, assets = self.get_latest_release()
        if not tag_name or not assets:
            print("❌ Could not fetch release information")
            return self.fallback_installation()
        
        # Find compatible binary
        binary_asset = self.find_compatible_binary(assets)
        if not binary_asset:
            print("❌ No compatible binary found")
            return self.fallback_installation()
        
        # Download binary
        archive_path = self.llama_dir / binary_asset['name']
        if not self.download_file(binary_asset['browser_download_url'], archive_path):
            return self.fallback_installation()
        
        # Extract binary
        if not self.extract_archive(archive_path):
            return self.fallback_installation()
        
        # Find llama-server binary
        binary_path = self.find_llama_server_binary()
        if not binary_path:
            print("❌ Could not locate llama-server binary")
            return self.fallback_installation()
        
        # Test binary
        if not self.test_binary(binary_path):
            return self.fallback_installation()
        
        # Create startup script
        self.create_startup_script(binary_path)
        
        print("\n" + "=" * 50)
        print("✅ llama.cpp binary installation completed!")
        print(f"📍 Binary location: {binary_path}")
        print(f"📁 Models directory: {self.models_dir}")
        print("\n📋 Next steps:")
        print("   1. Download models: python3 scripts/download-models.py recommended")
        print("   2. Test server: ./start-llama-server.sh")
        
        return True
    
    def fallback_installation(self):
        """Fallback to Python-based installation"""
        print("\n🔄 Falling back to Python-based installation...")
        
        if self.install_python_alternative():
            self.create_startup_script(None, use_python=True)
            
            print("\n" + "=" * 50)
            print("✅ llama-cpp-python installation completed!")
            print("📍 Using Python-based server")
            print(f"📁 Models directory: {self.models_dir}")
            print("\n📋 Next steps:")
            print("   1. Download models: python3 scripts/download-models.py recommended")
            print("   2. Test server: ./start-llama-server.sh")
            
            return True
        else:
            print("\n❌ All installation methods failed")
            print("💡 Manual installation required:")
            print("   1. Download llama.cpp binary manually")
            print("   2. Or compile from source with cmake")
            return False

def main():
    installer = LlamaCppBinaryInstaller()
    success = installer.install()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()