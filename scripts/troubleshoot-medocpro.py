#!/usr/bin/env python3
"""
MeDocPro Troubleshooting Script
Comprehensive diagnostic tool for identifying and resolving common issues
"""

import sys
import os
import requests
import subprocess
import json
import time
import platform
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)

def print_section(title):
    """Print a formatted section"""
    print(f"\n🔍 {title}")
    print("-" * 40)

def check_command(command, description):
    """Check if a command exists and is working"""
    try:
        result = subprocess.run([command, '--version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            version = result.stdout.strip().split('\n')[0]
            print(f"   ✅ {description}: {version}")
            return True
        else:
            print(f"   ❌ {description}: Command failed")
            return False
    except subprocess.TimeoutExpired:
        print(f"   ⏰ {description}: Command timed out")
        return False
    except FileNotFoundError:
        print(f"   ❌ {description}: Not installed")
        return False
    except Exception as e:
        print(f"   ❌ {description}: Error - {e}")
        return False

def check_service_health(url, service_name, timeout=10):
    """Check if a service is responding"""
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code == 200:
            print(f"   ✅ {service_name}: Responding (HTTP {response.status_code})")
            return True, response
        else:
            print(f"   ⚠️  {service_name}: HTTP {response.status_code}")
            return False, response
    except requests.exceptions.ConnectionError:
        print(f"   ❌ {service_name}: Connection refused")
        return False, None
    except requests.exceptions.Timeout:
        print(f"   ⏰ {service_name}: Timeout after {timeout}s")
        return False, None
    except Exception as e:
        print(f"   ❌ {service_name}: Error - {e}")
        return False, None

def check_file_exists(filepath, description):
    """Check if a file exists"""
    if os.path.exists(filepath):
        size = os.path.getsize(filepath)
        print(f"   ✅ {description}: Found ({size} bytes)")
        return True
    else:
        print(f"   ❌ {description}: Not found")
        return False

def check_directory_permissions(directory):
    """Check directory permissions"""
    try:
        # Try to create a test file
        test_file = os.path.join(directory, 'permission_test.tmp')
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        print(f"   ✅ {directory}: Read/Write permissions OK")
        return True
    except PermissionError:
        print(f"   ❌ {directory}: Permission denied")
        return False
    except Exception as e:
        print(f"   ⚠️  {directory}: {e}")
        return False

def check_python_environment():
    """Check Python environment and packages"""
    print_section("Python Environment")
    
    # Python version
    version = sys.version_info
    print(f"   📍 Python Version: {version.major}.{version.minor}.{version.micro}")
    
    # Virtual environment
    venv_path = os.environ.get('VIRTUAL_ENV')
    if venv_path:
        print(f"   📍 Virtual Environment: {venv_path}")
    else:
        print("   ⚠️  No virtual environment detected")
    
    # Check critical packages
    critical_packages = [
        'flask', 'sqlalchemy', 'requests', 'cryptography', 
        'psutil', 'werkzeug', 'jwt'
    ]
    
    print("   📦 Critical Packages:")
    missing_packages = []
    for package in critical_packages:
        try:
            __import__(package)
            print(f"      ✅ {package}")
        except ImportError:
            print(f"      ❌ {package}")
            missing_packages.append(package)
    
    return missing_packages

def check_system_services():
    """Check system services and prerequisites"""
    print_section("System Services")
    
    # Check prerequisites
    services = {
        'python': 'Python interpreter',
        'git': 'Git version control',
        'node': 'Node.js runtime',
        'npm': 'Node package manager',
        'ollama': 'Ollama AI service'
    }
    
    issues = []
    for command, description in services.items():
        if not check_command(command, description):
            issues.append(command)
    
    return issues

def check_application_services():
    """Check MeDocPro application services"""
    print_section("Application Services")
    
    services = {
        'http://localhost:5000/health': 'MeDocPro Backend',
        'http://localhost:5173': 'MeDocPro Frontend',
        'http://localhost:11434/api/tags': 'Ollama AI Service'
    }
    
    service_status = {}
    for url, name in services.items():
        is_healthy, response = check_service_health(url, name)
        service_status[name] = is_healthy
        
        # Get additional info for backend
        if name == 'MeDocPro Backend' and is_healthy and response:
            try:
                data = response.json()
                print(f"      Database: {data.get('database', 'unknown')}")
                print(f"      Version: {data.get('version', 'unknown')}")
            except:
                pass
        
        # Get AI model info for Ollama
        if name == 'Ollama AI Service' and is_healthy and response:
            try:
                data = response.json()
                models = data.get('models', [])
                print(f"      Models: {len(models)} available")
                for model in models[:3]:  # Show first 3 models
                    print(f"         - {model.get('name', 'unknown')}")
            except:
                pass
    
    return service_status

def check_configuration_files():
    """Check configuration files"""
    print_section("Configuration Files")
    
    config_files = {
        '.env': 'Environment configuration',
        'requirements.txt': 'Python dependencies',
        'medocpro-dashboard/package.json': 'Frontend dependencies',
        'instance/medocpro.db': 'SQLite database',
        'backend.log': 'Backend log file'
    }
    
    config_status = {}
    for filepath, description in config_files.items():
        config_status[filepath] = check_file_exists(filepath, description)
    
    # Check directory permissions
    directories = ['.', 'instance', 'logs']
    for directory in directories:
        if os.path.exists(directory):
            check_directory_permissions(directory)
    
    return config_status

def check_ai_enhancement():
    """Detailed AI enhancement diagnostics"""
    print_section("AI Enhancement Diagnostics")
    
    try:
        # Check AI status
        response = requests.get('http://localhost:5000/api/ai/ai-enhancement-status', timeout=15)
        if response.status_code == 200:
            data = response.json()
            print(f"   📊 AI Status: {data.get('status', 'unknown')}")
            print(f"   🤖 Available: {data.get('ai_enhancement_available', False)}")
            
            # Startup info
            startup_info = data.get('startup_info', {})
            if startup_info:
                print(f"   🚀 Startup Phase: {startup_info.get('in_startup_phase', 'unknown')}")
                print(f"   ⏱️  Time Since Start: {startup_info.get('time_since_backend_start', 0):.1f}s")
                print(f"   ✅ Verified Ready: {startup_info.get('ollama_verified_ready', False)}")
            
            # Circuit breaker
            circuit = data.get('circuit_breaker', {})
            if circuit:
                print(f"   🔌 Circuit Breaker Active: {circuit.get('active', 'unknown')}")
                print(f"   📉 Failure Count: {circuit.get('failure_count', 0)}")
            
            # Models
            models = data.get('models_available', [])
            if models:
                print(f"   📚 Models Available: {', '.join(models)}")
            
            return True
        else:
            print(f"   ❌ AI Status Check Failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ AI Status Check Error: {e}")
        return False

def check_database():
    """Check database connectivity and status"""
    print_section("Database Status")
    
    try:
        # Try to run database check command
        result = subprocess.run([sys.executable, 'manage.py', 'check-database'], 
                              capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("   ✅ Database connectivity: OK")
            print(f"   📝 Output: {result.stdout.strip()}")
            return True
        else:
            print("   ❌ Database connectivity: Failed")
            print(f"   📝 Error: {result.stderr.strip()}")
            return False
    except Exception as e:
        print(f"   ❌ Database check error: {e}")
        return False

def check_logs():
    """Check recent log entries for errors"""
    print_section("Recent Log Analysis")
    
    log_files = ['backend.log', 'logs/medocpro.log', 'instance/medocpro.log']
    
    for log_file in log_files:
        if os.path.exists(log_file):
            print(f"\n   📄 {log_file}:")
            try:
                with open(log_file, 'r') as f:
                    lines = f.readlines()
                    # Get last 10 lines
                    recent_lines = lines[-10:] if len(lines) > 10 else lines
                    
                    error_count = 0
                    warning_count = 0
                    
                    for line in recent_lines:
                        line = line.strip()
                        if 'ERROR' in line.upper():
                            print(f"      ❌ {line}")
                            error_count += 1
                        elif 'WARNING' in line.upper():
                            print(f"      ⚠️  {line}")
                            warning_count += 1
                    
                    if error_count == 0 and warning_count == 0:
                        print(f"      ✅ No recent errors or warnings")
                    else:
                        print(f"      📊 Recent: {error_count} errors, {warning_count} warnings")
            
            except Exception as e:
                print(f"      ❌ Could not read log file: {e}")

def generate_report(results):
    """Generate comprehensive troubleshooting report"""
    print_header("TROUBLESHOOTING REPORT")
    
    # Count issues
    total_issues = 0
    critical_issues = []
    
    # System service issues
    if results['system_issues']:
        total_issues += len(results['system_issues'])
        critical_issues.extend([f"Missing: {issue}" for issue in results['system_issues']])
    
    # Missing Python packages
    if results['missing_packages']:
        total_issues += len(results['missing_packages'])
        critical_issues.extend([f"Missing package: {pkg}" for pkg in results['missing_packages']])
    
    # Service status
    down_services = [name for name, status in results['service_status'].items() if not status]
    if down_services:
        total_issues += len(down_services)
        critical_issues.extend([f"Service down: {service}" for service in down_services])
    
    # Missing config files
    missing_configs = [name for name, exists in results['config_status'].items() if not exists]
    if missing_configs:
        total_issues += len(missing_configs)
        critical_issues.extend([f"Missing config: {config}" for config in missing_configs])
    
    # Summary
    if total_issues == 0:
        print("\n🎉 NO ISSUES FOUND!")
        print("   All systems appear to be functioning correctly.")
    else:
        print(f"\n⚠️  {total_issues} ISSUES FOUND")
        print("\nCritical Issues:")
        for issue in critical_issues:
            print(f"   • {issue}")
    
    # Recommendations
    print("\n📋 RECOMMENDATIONS:")
    
    if results['system_issues']:
        print("\n   System Prerequisites:")
        for issue in results['system_issues']:
            if issue == 'python':
                print("   • Install Python 3.9+ from https://www.python.org/")
            elif issue == 'git':
                print("   • Install Git from https://git-scm.com/download/win")
            elif issue == 'node':
                print("   • Install Node.js from https://nodejs.org/")
            elif issue == 'ollama':
                print("   • Install Ollama from https://ollama.ai/download")
    
    if results['missing_packages']:
        print("\n   Python Dependencies:")
        print("   • Run: pip install -r requirements.txt")
        print("   • Or run: python install_encryption_deps.py")
    
    if not results['service_status'].get('MeDocPro Backend', True):
        print("\n   Backend Service:")
        print("   • Check if virtual environment is activated")
        print("   • Run: python dev-start.py")
        print("   • Check backend.log for errors")
    
    if not results['service_status'].get('MeDocPro Frontend', True):
        print("\n   Frontend Service:")
        print("   • Navigate to medocpro-dashboard/")
        print("   • Run: npm install")
        print("   • Run: npm run dev")
    
    if not results['service_status'].get('Ollama AI Service', True):
        print("\n   Ollama Service:")
        print("   • Run: ollama serve")
        print("   • Download models: ollama pull mistral:latest")
    
    if not results['ai_status']:
        print("\n   AI Enhancement:")
        print("   • Wait for startup grace period (3 minutes)")
        print("   • Check: python test_ai_startup_reliability.py")
        print("   • Reset circuit breaker: curl http://localhost:5000/api/ai/reset-circuit-breaker")
    
    print("\n🔗 USEFUL COMMANDS:")
    print("   • System validation: python scripts/validate-system-requirements.py")
    print("   • Start application: start-medocpro.bat")
    print("   • Test AI: python test_ai_startup_reliability.py")
    print("   • Check config: python scripts/validate-config.py")
    print("   • View logs: tail -f backend.log")

def main():
    """Main troubleshooting routine"""
    print_header("MeDocPro Troubleshooting Diagnostic")
    print(f"Platform: {platform.system()} {platform.release()}")
    print(f"Python: {sys.version}")
    
    # Initialize results
    results = {
        'missing_packages': [],
        'system_issues': [],
        'service_status': {},
        'config_status': {},
        'ai_status': False,
        'database_status': False
    }
    
    # Run all checks
    results['missing_packages'] = check_python_environment()
    results['system_issues'] = check_system_services()
    results['service_status'] = check_application_services()
    results['config_status'] = check_configuration_files()
    results['ai_status'] = check_ai_enhancement()
    results['database_status'] = check_database()
    
    # Check logs
    check_logs()
    
    # Generate report
    generate_report(results)
    
    # Save results
    try:
        with open('troubleshooting_report.json', 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\n📄 Detailed report saved to: troubleshooting_report.json")
    except Exception as e:
        print(f"\nWarning: Could not save report: {e}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTroubleshooting cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error during troubleshooting: {e}")
        sys.exit(1)