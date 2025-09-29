#!/usr/bin/env python3
"""
AI Enhancement Diagnostic Script
Checks all components required for AI enhancement to work properly
"""

import requests
import json
import sys
import subprocess
import time

def check_backend():
    """Check if backend is running"""
    try:
        response = requests.get('http://localhost:5000/health', timeout=2)
        if response.status_code == 200:
            print("✅ Backend server is running on port 5000")
            return True
        else:
            print(f"❌ Backend returned status code: {response.status_code}")
            return False
    except Exception as e:
        print("❌ Backend server is NOT running")
        print(f"   Error: {e}")
        return False

def check_ollama():
    """Check if Ollama is running and has models"""
    try:
        response = requests.get('http://localhost:11434/api/tags', timeout=5)
        if response.status_code == 200:
            data = response.json()
            models = data.get('models', [])
            print(f"✅ Ollama is running with {len(models)} models:")
            for model in models:
                print(f"   - {model['name']}")
            return True
        else:
            print(f"❌ Ollama returned status code: {response.status_code}")
            return False
    except Exception as e:
        print("❌ Ollama is NOT running or not accessible")
        print(f"   Error: {e}")
        return False

def check_ai_enhancement_status():
    """Check AI enhancement status from backend"""
    try:
        response = requests.get('http://localhost:5000/api/ai/ai-enhancement-status', timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('ai_enhancement_available'):
                print("✅ AI enhancement is AVAILABLE")
                print(f"   - Status: {data.get('status')}")
                print(f"   - Circuit breaker active: {data.get('circuit_breaker', {}).get('active', False)}")
                print(f"   - Models: {', '.join(data.get('models_available', []))}")
                return True
            else:
                print("❌ AI enhancement is UNAVAILABLE")
                print(f"   - Error: {data.get('error_message', 'Unknown error')}")
                print(f"   - Circuit breaker: {data.get('circuit_breaker', {})}")
                return False
        else:
            print(f"❌ AI status endpoint returned: {response.status_code}")
            return False
    except Exception as e:
        print("❌ Cannot check AI enhancement status")
        print(f"   Error: {e}")
        return False

def start_backend_if_needed():
    """Offer to start backend if not running"""
    print("\n🔧 Would you like to start the backend server? (y/n): ", end='')
    response = input().strip().lower()
    if response == 'y':
        print("Starting backend server...")
        subprocess.Popen(['python3', 'dev-start.py'], 
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL)
        time.sleep(5)  # Wait for startup
        return check_backend()
    return False

def main():
    print("=== AI Enhancement Diagnostic ===\n")
    
    # Check backend
    backend_ok = check_backend()
    print()
    
    # Check Ollama
    ollama_ok = check_ollama()
    print()
    
    # Check AI enhancement status if backend is running
    if backend_ok:
        ai_ok = check_ai_enhancement_status()
    else:
        print("❌ Cannot check AI enhancement status (backend not running)")
        ai_ok = False
    
    # Summary and recommendations
    print("\n=== Summary ===")
    if backend_ok and ollama_ok and ai_ok:
        print("✅ All systems operational - AI enhancement should work!")
    else:
        print("⚠️  Issues detected:")
        if not backend_ok:
            print("   1. Backend server is not running")
            print("      Fix: Run 'python3 dev-start.py' or 'dev-start.bat'")
            if start_backend_if_needed():
                # Re-check AI status after starting backend
                print("\n🔄 Re-checking AI enhancement status...")
                check_ai_enhancement_status()
        if not ollama_ok:
            print("   2. Ollama is not running")
            print("      Fix: Start Ollama service (usually 'ollama serve')")
        if backend_ok and not ai_ok:
            print("   3. AI enhancement is disabled or circuit breaker is active")
            print("      Fix: Check logs in backend.log for errors")
            print("      Reset circuit breaker: curl http://localhost:5000/api/ai/reset-circuit-breaker")

if __name__ == "__main__":
    main()