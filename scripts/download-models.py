#!/usr/bin/env python3
"""
GGUF Model Download Script for MeDocPro llama.cpp Migration
Downloads compatible models for llama-server
"""

import os
import sys
import urllib.request
import hashlib
from pathlib import Path
import json

class ModelDownloader:
    def __init__(self):
        self.base_dir = Path("/mnt/c/Users/admin/Desktop/MeDocPro")
        self.models_dir = self.base_dir / "models"
        self.models_dir.mkdir(exist_ok=True)
        
        # Model definitions - optimized for clinical text enhancement
        self.available_models = {
            "mistral-7b-instruct": {
                "name": "Mistral 7B Instruct v0.3 Q4_K_M",
                "filename": "mistral-7b-instruct-v0.3.Q4_K_M.gguf",
                "url": "https://huggingface.co/bartowski/Mistral-7B-Instruct-v0.3-GGUF/resolve/main/Mistral-7B-Instruct-v0.3-Q4_K_M.gguf",
                "size_gb": 4.4,
                "description": "High-quality instruction-following model, good for clinical text enhancement",
                "recommended": True
            },
            "llama3-8b-instruct": {
                "name": "Llama 3.1 8B Instruct Q4_K_M", 
                "filename": "llama-3.1-8b-instruct.Q4_K_M.gguf",
                "url": "https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf",
                "size_gb": 4.9,
                "description": "Latest Llama model with excellent instruction following",
                "recommended": True
            },
            "phi3-mini": {
                "name": "Phi-3 Mini 4K Instruct Q4_K_M",
                "filename": "phi-3-mini-4k-instruct.Q4_K_M.gguf", 
                "url": "https://huggingface.co/bartowski/Phi-3-mini-4k-instruct-GGUF/resolve/main/Phi-3-mini-4k-instruct-Q4_K_M.gguf",
                "size_gb": 2.4,
                "description": "Lightweight model, faster inference, good for quick enhancements",
                "recommended": False
            },
            "openchat-3.5": {
                "name": "OpenChat 3.5 0106 Q4_K_M",
                "filename": "openchat-3.5-0106.Q4_K_M.gguf",
                "url": "https://huggingface.co/TheBloke/openchat-3.5-0106-GGUF/resolve/main/openchat-3.5-0106.Q4_K_M.gguf",
                "size_gb": 4.1,
                "description": "Optimized for conversation and text improvement tasks",
                "recommended": False
            }
        }
    
    def check_disk_space(self, required_gb):
        """Check if enough disk space is available"""
        try:
            statvfs = os.statvfs(self.models_dir)
            free_gb = (statvfs.f_frsize * statvfs.f_bavail) / (1024**3)
            
            print(f"💾 Available disk space: {free_gb:.1f} GB")
            print(f"📊 Required space: {required_gb:.1f} GB")
            
            if free_gb < required_gb + 1:  # +1 GB buffer
                print(f"❌ Insufficient disk space. Need {required_gb + 1:.1f} GB")
                return False
            
            return True
        except Exception as e:
            print(f"⚠️  Could not check disk space: {e}")
            return True  # Proceed anyway
    
    def download_with_progress(self, url, destination):
        """Download file with progress bar"""
        
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
                destination.unlink()  # Remove partial file
            return False
    
    def verify_model_file(self, model_path):
        """Basic verification that model file is valid"""
        if not model_path.exists():
            return False
        
        # Check minimum file size (should be > 100MB for any reasonable model)
        file_size = model_path.stat().st_size
        if file_size < 100 * 1024 * 1024:  # 100MB
            print(f"⚠️  Warning: {model_path.name} seems too small ({file_size / 1024**2:.1f} MB)")
            return False
        
        # Check GGUF magic number
        try:
            with open(model_path, 'rb') as f:
                magic = f.read(4)
                if magic != b'GGUF':
                    print(f"❌ {model_path.name} is not a valid GGUF file")
                    return False
        except Exception as e:
            print(f"❌ Could not verify {model_path.name}: {e}")
            return False
        
        print(f"✅ {model_path.name} verified ({file_size / 1024**3:.1f} GB)")
        return True
    
    def list_available_models(self):
        """Display available models"""
        print("📚 Available Models:")
        print("=" * 60)
        
        for key, model in self.available_models.items():
            status = "⭐ RECOMMENDED" if model['recommended'] else "  Optional"
            print(f"\n{status} {model['name']}")
            print(f"   Key: {key}")
            print(f"   Size: {model['size_gb']} GB")
            print(f"   Description: {model['description']}")
            
            # Check if already downloaded
            model_path = self.models_dir / model['filename']
            if model_path.exists():
                if self.verify_model_file(model_path):
                    print(f"   Status: ✅ Already downloaded")
                else:
                    print(f"   Status: ❌ Downloaded but invalid")
            else:
                print(f"   Status: ⬇️  Not downloaded")
    
    def download_model(self, model_key):
        """Download a specific model"""
        if model_key not in self.available_models:
            print(f"❌ Unknown model: {model_key}")
            return False
        
        model = self.available_models[model_key]
        model_path = self.models_dir / model['filename']
        
        # Check if already exists and valid
        if model_path.exists():
            if self.verify_model_file(model_path):
                print(f"✅ {model['name']} already downloaded and verified")
                return True
            else:
                print(f"🗑️  Removing invalid existing file...")
                model_path.unlink()
        
        # Check disk space
        if not self.check_disk_space(model['size_gb']):
            return False
        
        # Download
        print(f"📥 Downloading {model['name']}...")
        print(f"    Size: {model['size_gb']} GB")
        print(f"    Destination: {model_path}")
        
        if self.download_with_progress(model['url'], model_path):
            return self.verify_model_file(model_path)
        
        return False
    
    def download_recommended_models(self):
        """Download all recommended models"""
        print("📥 Downloading recommended models...")
        
        recommended = [key for key, model in self.available_models.items() 
                      if model['recommended']]
        
        total_size = sum(self.available_models[key]['size_gb'] for key in recommended)
        
        if not self.check_disk_space(total_size):
            return False
        
        success_count = 0
        for model_key in recommended:
            if self.download_model(model_key):
                success_count += 1
            else:
                print(f"❌ Failed to download {model_key}")
        
        print(f"\n📊 Successfully downloaded {success_count}/{len(recommended)} recommended models")
        return success_count > 0
    
    def update_config_file(self):
        """Update MeDocPro configuration with model paths"""
        config_path = self.base_dir / ".env"
        
        # Find default model (prefer mistral)
        default_model = None
        for key in ['mistral-7b-instruct', 'llama3-8b-instruct']:
            if key in self.available_models:
                model_path = self.models_dir / self.available_models[key]['filename']
                if model_path.exists():
                    default_model = str(model_path)
                    break
        
        if default_model:
            print(f"⚙️  Updating configuration...")
            
            # Read existing config
            config_lines = []
            if config_path.exists():
                with open(config_path, 'r') as f:
                    config_lines = f.readlines()
            
            # Update or add llama.cpp settings
            updated_lines = []
            llama_settings_added = False
            
            for line in config_lines:
                # Skip old Ollama settings
                if line.startswith('OLLAMA_'):
                    continue
                # Update existing llama settings
                elif line.startswith('LLAMA_SERVER_URL='):
                    updated_lines.append('LLAMA_SERVER_URL=http://localhost:8080\n')
                    llama_settings_added = True
                elif line.startswith('LLAMA_MODEL_PATH='):
                    updated_lines.append(f'LLAMA_MODEL_PATH={default_model}\n')
                else:
                    updated_lines.append(line)
            
            # Add new settings if not present
            if not llama_settings_added:
                updated_lines.append('\n# llama.cpp Configuration\n')
                updated_lines.append('LLAMA_SERVER_URL=http://localhost:8080\n')
                updated_lines.append(f'LLAMA_MODEL_PATH={default_model}\n')
                updated_lines.append('LLAMA_THREADS=4\n')
                updated_lines.append('LLAMA_CONTEXT_SIZE=4096\n')
            
            # Write updated config
            with open(config_path, 'w') as f:
                f.writelines(updated_lines)
            
            print(f"✅ Configuration updated: {config_path}")
            print(f"🎯 Default model: {default_model}")
        else:
            print("⚠️  No valid models found, skipping configuration update")
    
    def show_status(self):
        """Show current model status"""
        print("📊 Model Status:")
        print("=" * 50)
        
        downloaded_count = 0
        total_size = 0
        
        for key, model in self.available_models.items():
            model_path = self.models_dir / model['filename']
            if model_path.exists() and self.verify_model_file(model_path):
                status = "✅ Ready"
                downloaded_count += 1
                total_size += model['size_gb']
            else:
                status = "❌ Missing"
            
            print(f"{status} {model['name']} ({model['size_gb']} GB)")
        
        print(f"\n📈 Downloaded: {downloaded_count}/{len(self.available_models)} models")
        print(f"💾 Total size: {total_size:.1f} GB")
        
        if downloaded_count > 0:
            print(f"📁 Models directory: {self.models_dir}")

def main():
    if len(sys.argv) < 2:
        print("📚 GGUF Model Downloader for MeDocPro")
        print("=" * 40)
        print("Usage:")
        print("  python3 download-models.py list              # List available models")
        print("  python3 download-models.py recommended       # Download recommended models")
        print("  python3 download-models.py <model-key>       # Download specific model")
        print("  python3 download-models.py status            # Show model status")
        print("  python3 download-models.py update-config     # Update configuration")
        sys.exit(1)
    
    downloader = ModelDownloader()
    command = sys.argv[1]
    
    if command == "list":
        downloader.list_available_models()
    elif command == "recommended":
        if downloader.download_recommended_models():
            downloader.update_config_file()
            print("\n🎉 Recommended models ready for use!")
        else:
            print("\n❌ Failed to download some models")
            sys.exit(1)
    elif command == "status":
        downloader.show_status()
    elif command == "update-config":
        downloader.update_config_file()
    elif command in downloader.available_models:
        if downloader.download_model(command):
            downloader.update_config_file()
            print(f"\n✅ {command} ready for use!")
        else:
            print(f"\n❌ Failed to download {command}")
            sys.exit(1)
    else:
        print(f"❌ Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()