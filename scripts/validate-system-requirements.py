#!/usr/bin/env python3
"""
MeDocPro System Requirements Validation Script
Checks if the system meets minimum requirements for installation
"""

import sys
import os
import platform
import subprocess
import shutil
import psutil
import json
from pathlib import Path

def check_python_version():
    """Check Python version"""
    version = sys.version_info
    required_major, required_minor = 3, 9
    
    if version.major < required_major or (version.major == required_major and version.minor < required_minor):
        return False, f"Python {required_major}.{required_minor}+ required, found {version.major}.{version.minor}"
    
    return True, f"Python {version.major}.{version.minor}.{version.micro}"

def check_system_resources():
    """Check system RAM and disk space"""
    # Check RAM
    ram_gb = psutil.virtual_memory().total / (1024**3)
    ram_available_gb = psutil.virtual_memory().available / (1024**3)
    
    # Check disk space
    disk_usage = psutil.disk_usage('/')
    disk_free_gb = disk_usage.free / (1024**3)
    
    requirements = {
        'ram_total': {'required': 8, 'current': ram_gb, 'unit': 'GB'},
        'ram_available': {'required': 4, 'current': ram_available_gb, 'unit': 'GB'},
        'disk_free': {'required': 10, 'current': disk_free_gb, 'unit': 'GB'}
    }
    
    return requirements

def check_command_exists(command):
    """Check if a command exists in PATH"""
    return shutil.which(command) is not None

def get_command_version(command, version_arg='--version'):
    """Get version of a command"""
    try:
        result = subprocess.run([command, version_arg], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return result.stdout.strip()
        return "Unknown version"
    except (subprocess.SubprocessError, FileNotFoundError):
        return "Not found"

def check_network_connectivity():
    """Check internet connectivity"""
    import socket
    try:
        # Connect to Google DNS
        socket.create_connection(("8.8.8.8", 53), timeout=5)
        return True, "Internet connection available"
    except OSError:
        return False, "No internet connection detected"

def check_ports_available():
    """Check if required ports are available"""
    import socket
    
    required_ports = [5000, 5173, 11434]
    port_status = {}
    
    for port in required_ports:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                result = s.connect_ex(('localhost', port))
                if result == 0:
                    port_status[port] = 'In use'
                else:
                    port_status[port] = 'Available'
        except Exception as e:
            port_status[port] = f'Error: {e}'
    
    return port_status

def check_windows_features():
    """Check Windows-specific features"""
    checks = {}
    
    # Check Windows version
    win_version = platform.platform()
    checks['windows_version'] = win_version
    
    # Check if running as admin
    try:
        import ctypes
        is_admin = ctypes.windll.shell32.IsUserAnAdmin()
        checks['admin_privileges'] = 'Yes' if is_admin else 'No'
    except:
        checks['admin_privileges'] = 'Unknown'
    
    # Check Windows Subsystem for Linux (WSL)
    try:
        wsl_result = subprocess.run(['wsl', '--list'], 
                                  capture_output=True, text=True, timeout=5)
        checks['wsl_available'] = 'Yes' if wsl_result.returncode == 0 else 'No'
    except:
        checks['wsl_available'] = 'No'
    
    return checks

def main():
    print("=" * 60)
    print("MeDocPro System Requirements Validation")
    print("=" * 60)
    print()
    
    # System overview
    print("🖥️  System Overview:")
    print(f"   Platform: {platform.system()} {platform.release()}")
    print(f"   Architecture: {platform.machine()}")
    print(f"   Processor: {platform.processor()}")
    print()
    
    # Check Python version
    print("🐍 Python Version:")
    python_ok, python_info = check_python_version()
    status = "✅" if python_ok else "❌"
    print(f"   {status} {python_info}")
    print()
    
    # Check system resources
    print("💾 System Resources:")
    resources = check_system_resources()
    for resource, info in resources.items():
        current = info['current']
        required = info['required']
        unit = info['unit']
        status = "✅" if current >= required else "❌"
        print(f"   {status} {resource.replace('_', ' ').title()}: {current:.1f}{unit} (required: {required}{unit})")
    print()
    
    # Check required software
    print("🛠️  Required Software:")
    software_checks = {
        'Git': ('git', '--version'),
        'Node.js': ('node', '--version'),
        'npm': ('npm', '--version'),
        'Ollama': ('ollama', '--version')
    }
    
    for name, (command, version_arg) in software_checks.items():
        exists = check_command_exists(command)
        if exists:
            version = get_command_version(command, version_arg)
            print(f"   ✅ {name}: {version}")
        else:
            print(f"   ❌ {name}: Not installed")
    print()
    
    # Check network connectivity
    print("🌐 Network Connectivity:")
    net_ok, net_info = check_network_connectivity()
    status = "✅" if net_ok else "❌"
    print(f"   {status} {net_info}")
    print()
    
    # Check port availability
    print("🚪 Port Availability:")
    ports = check_ports_available()
    for port, status_text in ports.items():
        if status_text == 'Available':
            print(f"   ✅ Port {port}: {status_text}")
        else:
            print(f"   ⚠️  Port {port}: {status_text}")
    print()
    
    # Windows-specific checks
    if platform.system() == 'Windows':
        print("🪟 Windows Features:")
        win_features = check_windows_features()
        for feature, value in win_features.items():
            print(f"   ℹ️  {feature.replace('_', ' ').title()}: {value}")
        print()
    
    # Summary and recommendations
    print("📋 Summary and Recommendations:")
    print()
    
    # Check if all requirements are met
    issues = []
    
    if not python_ok:
        issues.append("Python version too old")
    
    if resources['ram_total']['current'] < resources['ram_total']['required']:
        issues.append("Insufficient RAM")
    
    if resources['disk_free']['current'] < resources['disk_free']['required']:
        issues.append("Insufficient disk space")
    
    if not check_command_exists('git'):
        issues.append("Git not installed")
    
    if not check_command_exists('node'):
        issues.append("Node.js not installed")
    
    if not check_command_exists('ollama'):
        issues.append("Ollama not installed")
    
    if not net_ok:
        issues.append("No internet connection")
    
    if not issues:
        print("🎉 All requirements met! You can proceed with MeDocPro installation.")
        print()
        print("Next steps:")
        print("1. Run the automated installer: install-medocpro.bat")
        print("2. Or follow the manual installation guide: WINDOWS_INSTALLATION_GUIDE.md")
    else:
        print("⚠️  Issues found that need to be resolved:")
        for issue in issues:
            print(f"   • {issue}")
        print()
        print("Recommendations:")
        
        if "Python version too old" in issues:
            print("   • Install Python 3.9+ from https://www.python.org/downloads/")
        
        if "Git not installed" in issues:
            print("   • Install Git from https://git-scm.com/download/win")
            print("   • Or use winget: winget install Git.Git")
        
        if "Node.js not installed" in issues:
            print("   • Install Node.js from https://nodejs.org/")
            print("   • Or use winget: winget install OpenJS.NodeJS")
        
        if "Ollama not installed" in issues:
            print("   • Install Ollama from https://ollama.ai/download")
            print("   • Or use winget: winget install Ollama.Ollama")
        
        if "Insufficient RAM" in issues:
            print("   • Close unnecessary applications to free up memory")
            print("   • Consider upgrading system RAM")
        
        if "Insufficient disk space" in issues:
            print("   • Free up disk space (at least 10GB required)")
            print("   • Consider installing on a different drive")
        
        if "No internet connection" in issues:
            print("   • Check internet connection for downloading dependencies")
    
    print()
    print("For detailed installation instructions, see:")
    print("   WINDOWS_INSTALLATION_GUIDE.md")
    print()
    
    # Save results to file
    results = {
        'timestamp': subprocess.run(['date'], capture_output=True, text=True).stdout.strip(),
        'system': {
            'platform': platform.platform(),
            'architecture': platform.machine(),
            'processor': platform.processor()
        },
        'python': {'ok': python_ok, 'info': python_info},
        'resources': resources,
        'software': {name: check_command_exists(cmd[0]) for name, cmd in software_checks.items()},
        'network': {'ok': net_ok, 'info': net_info},
        'ports': ports,
        'issues': issues
    }
    
    try:
        with open('system_requirements_check.json', 'w') as f:
            json.dump(results, f, indent=2)
        print("📄 Results saved to: system_requirements_check.json")
    except Exception as e:
        print(f"Warning: Could not save results file: {e}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nValidation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError during validation: {e}")
        sys.exit(1)