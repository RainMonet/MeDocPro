#!/usr/bin/env python3
"""
Windows-specific configuration for MeDocPro llama.cpp integration
Handles path conversion between WSL and native Windows
"""

import os
import platform
from pathlib import Path

class WindowsPathHelper:
    """Helper class for Windows path management"""
    
    @staticmethod
    def get_base_directory():
        """Get the correct base directory for the current environment"""
        
        # Check if we're in WSL
        if 'WSL_DISTRO_NAME' in os.environ or '/mnt/c/' in str(Path.cwd()):
            # WSL environment - use WSL paths
            return Path("/mnt/c/Users/admin/Desktop/MeDocPro")
        else:
            # Native Windows environment
            return Path("C:/Users/admin/Desktop/MeDocPro")
    
    @staticmethod
    def convert_to_windows_path(wsl_path):
        """Convert WSL path to Windows path"""
        if isinstance(wsl_path, str):
            wsl_path = Path(wsl_path)
        
        path_str = str(wsl_path)
        if path_str.startswith('/mnt/c/'):
            # Convert /mnt/c/... to C:\...
            windows_path = path_str.replace('/mnt/c/', 'C:/')
            return Path(windows_path.replace('/', '\\'))
        
        return wsl_path
    
    @staticmethod
    def convert_to_wsl_path(windows_path):
        """Convert Windows path to WSL path"""
        if isinstance(windows_path, str):
            windows_path = Path(windows_path)
        
        path_str = str(windows_path)
        if path_str.startswith('C:'):
            # Convert C:\... to /mnt/c/...
            wsl_path = path_str.replace('C:', '/mnt/c')
            return Path(wsl_path.replace('\\', '/'))
        
        return windows_path
    
    @staticmethod
    def get_executable_extension():
        """Get the correct executable extension for current platform"""
        if platform.system() == "Windows":
            return ".exe"
        return ""
    
    @staticmethod
    def get_llama_server_path():
        """Get the correct llama-server path for current environment"""
        base_dir = WindowsPathHelper.get_base_directory()
        exe_ext = WindowsPathHelper.get_executable_extension()
        
        return base_dir / "llama.cpp" / "build" / "bin" / f"llama-server{exe_ext}"

def update_config_for_windows():
    """Update .env file with Windows-compatible paths"""
    
    base_dir = WindowsPathHelper.get_base_directory()
    models_dir = base_dir / "models"
    
    # Model path (prefer the one that exists)
    model_files = [
        "mistral-7b-instruct-v0.3.Q4_K_M.gguf",
        "phi-3-mini-4k-instruct.Q4_K_M.gguf",
        "llama-3.1-8b-instruct.Q4_K_M.gguf"
    ]
    
    model_path = None
    for model_file in model_files:
        potential_path = models_dir / model_file
        if potential_path.exists():
            model_path = potential_path
            break
    
    if not model_path:
        model_path = models_dir / model_files[0]  # Default to first
    
    # Convert to Windows format if needed
    if platform.system() == "Windows":
        model_path = WindowsPathHelper.convert_to_windows_path(model_path)
    
    config_updates = {
        'LLAMA_SERVER_URL': 'http://localhost:8080',
        'LLAMA_MODEL_PATH': str(model_path),
        'LLAMA_THREADS': '4',
        'LLAMA_CONTEXT_SIZE': '4096'
    }
    
    return config_updates

if __name__ == "__main__":
    print("🖥️ Windows Configuration Helper")
    print("=" * 40)
    
    base_dir = WindowsPathHelper.get_base_directory()
    print(f"📁 Base directory: {base_dir}")
    
    llama_server = WindowsPathHelper.get_llama_server_path()
    print(f"🤖 llama-server path: {llama_server}")
    
    config = update_config_for_windows()
    print("\n⚙️ Configuration:")
    for key, value in config.items():
        print(f"   {key}={value}")
    
    # Check if paths exist
    print(f"\n✅ Base directory exists: {base_dir.exists()}")
    print(f"✅ llama-server exists: {llama_server.exists()}")
    
    models_dir = base_dir / "models"
    if models_dir.exists():
        models = list(models_dir.glob("*.gguf"))
        print(f"📚 Models found: {len(models)}")
        for model in models:
            print(f"   - {model.name}")
    else:
        print("📚 Models directory not found")