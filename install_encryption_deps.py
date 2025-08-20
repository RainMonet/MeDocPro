#!/usr/bin/env python3
"""
Install HIPAA encryption dependencies for MeDocPro
Handles different environments (Windows, Linux, virtual environments)
"""

import sys
import subprocess
import platform
import os

def run_command(cmd, shell=False):
    """Run a command and return success status"""
    try:
        result = subprocess.run(cmd, shell=shell, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_dependencies():
    """Check if required modules are available"""
    missing = []
    versions = {}
    
    try:
        import cryptography
        versions['cryptography'] = cryptography.__version__
    except ImportError:
        missing.append('cryptography')
    
    try:
        import psutil
        versions['psutil'] = psutil.__version__
    except ImportError:
        missing.append('psutil')
    
    return len(missing) == 0, missing, versions

def install_with_pip():
    """Install required dependencies using pip"""
    print("📦 Attempting to install required dependencies with pip...")
    
    # List of required packages
    packages = ["cryptography", "psutil"]
    
    commands = [
        [sys.executable, "-m", "pip", "install"] + packages,
        [sys.executable, "-m", "pip", "install"] + packages + ["--break-system-packages"],
        ["pip", "install"] + packages,
        ["pip3", "install"] + packages
    ]
    
    for cmd in commands:
        print(f"   Trying: {' '.join(cmd)}")
        success, stdout, stderr = run_command(cmd)
        if success:
            print("✅ Successfully installed dependencies")
            return True
        else:
            print(f"   Failed: {stderr.strip()}")
    
    return False

def install_with_system_package():
    """Install cryptography using system package manager"""
    system = platform.system().lower()
    
    if system == "linux":
        print("🐧 Attempting to install with apt (Linux)...")
        commands = [
            ["sudo", "apt", "update"],
            ["sudo", "apt", "install", "-y", "python3-cryptography"],
            ["apt", "install", "-y", "python3-cryptography"]
        ]
        
        for cmd in commands:
            print(f"   Trying: {' '.join(cmd)}")
            success, stdout, stderr = run_command(cmd)
            if success:
                print("✅ Successfully installed python3-cryptography")
                return True
            else:
                print(f"   Failed: {stderr.strip()}")
    
    elif system == "darwin":
        print("🍎 Attempting to install with brew (macOS)...")
        success, stdout, stderr = run_command(["brew", "install", "python-cryptography"])
        if success:
            print("✅ Successfully installed python-cryptography")
            return True
        else:
            print(f"   Failed: {stderr.strip()}")
    
    return False

def create_virtual_environment():
    """Create and set up virtual environment"""
    print("🌐 Creating virtual environment...")
    
    # Create venv
    success, stdout, stderr = run_command([sys.executable, "-m", "venv", "venv"])
    if not success:
        print(f"❌ Failed to create virtual environment: {stderr}")
        return False
    
    # Determine activation script
    if platform.system().lower() == "windows":
        pip_path = os.path.join("venv", "Scripts", "pip.exe")
        python_path = os.path.join("venv", "Scripts", "python.exe")
    else:
        pip_path = os.path.join("venv", "bin", "pip")
        python_path = os.path.join("venv", "bin", "python")
    
    # Install cryptography in venv
    success, stdout, stderr = run_command([pip_path, "install", "cryptography"])
    if success:
        print("✅ Successfully created virtual environment with cryptography")
        print("\n📋 To use the virtual environment:")
        if platform.system().lower() == "windows":
            print("   venv\\Scripts\\activate")
        else:
            print("   source venv/bin/activate")
        print("   python dev-start.py")
        return True
    else:
        print(f"❌ Failed to install cryptography in venv: {stderr}")
        return False

def disable_encryption():
    """Disable encryption for development"""
    print("⚠️  Disabling encryption for development (NOT for production)...")
    
    env_file = ".env"
    if not os.path.exists(env_file):
        print(f"❌ .env file not found at {env_file}")
        return False
    
    # Read current .env file
    with open(env_file, 'r', encoding='utf-8-sig') as f:
        lines = f.readlines()
    
    # Update HIPAA_ENCRYPTION_ENABLED line
    updated = False
    for i, line in enumerate(lines):
        if line.strip().startswith('HIPAA_ENCRYPTION_ENABLED'):
            lines[i] = 'HIPAA_ENCRYPTION_ENABLED=false\n'
            updated = True
            break
    
    if not updated:
        lines.append('HIPAA_ENCRYPTION_ENABLED=false\n')
    
    # Write updated .env file
    with open(env_file, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print("✅ Encryption disabled in .env file")
    print("⚠️  WARNING: PHI data will NOT be encrypted!")
    return True

def main():
    """Main installation routine"""
    print("🔐 MeDocPro Dependency Installer")
    print("=" * 40)
    
    # Check current status
    all_available, missing, versions = check_dependencies()
    if all_available:
        print("✅ All required modules already installed:")
        for module, version in versions.items():
            print(f"   {module}: {version}")
        print("🎉 MeDocPro is ready to use!")
        return 0
    
    print("❌ Missing required modules:", ", ".join(missing))
    print(f"🖥️  Platform: {platform.system()} {platform.release()}")
    print(f"🐍 Python: {sys.version}")
    print()
    
    # Try installation methods
    methods = [
        ("Install with pip", install_with_pip),
        ("Install with system package manager", install_with_system_package),
        ("Create virtual environment", create_virtual_environment),
    ]
    
    for method_name, method_func in methods:
        print(f"\n🔧 Method: {method_name}")
        if method_func():
            # Verify installation
            all_available, missing, versions = check_dependencies()
            if all_available:
                print("🎉 Success! All dependencies are now available:")
                for module, version in versions.items():
                    print(f"   {module}: {version}")
                return 0
            else:
                print("⚠️  Installation reported success but some modules still not available:", missing)
    
    # All methods failed
    print("\n❌ All installation methods failed")
    print("\n📋 Manual installation options:")
    print("1. Install Python with pip: https://www.python.org/downloads/")
    print("2. Use conda: conda install cryptography psutil")
    print("3. Use WSL on Windows: wsl --install")
    print("4. Install individually: pip install cryptography psutil")
    print("5. Disable monitoring for development (install only cryptography)")
    
    while True:
        choice = input("\nDisable encryption for development? (y/N): ").strip().lower()
        if choice in ['y', 'yes']:
            if disable_encryption():
                print("\n✅ You can now run MeDocPro without encryption")
                print("🚀 Start the backend with: python dev-start.py")
                return 0
            else:
                return 1
        elif choice in ['n', 'no', '']:
            print("💡 Please install cryptography manually or use a different environment")
            return 1
        else:
            print("Please enter 'y' or 'n'")

if __name__ == '__main__':
    sys.exit(main())