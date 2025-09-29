#!/usr/bin/env python3
"""
AI Enhancement Startup Reliability Test
Tests the new startup-aware AI enhancement system to verify it handles startup gracefully
"""

import requests
import json
import time
import sys
import subprocess
from datetime import datetime

BASE_URL = "http://localhost:5000"

def test_ollama_direct():
    """Test direct Ollama connectivity"""
    print("🔗 Testing direct Ollama connectivity...")
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=10)
        if response.status_code == 200:
            models = response.json().get('models', [])
            print(f"   ✅ Ollama accessible with {len(models)} models")
            for model in models:
                print(f"      - {model.get('name', 'unknown')}")
            return True
        else:
            print(f"   ❌ Ollama returned status: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Ollama not accessible: {e}")
        return False

def test_backend_status():
    """Test backend health"""
    print("\n🏥 Testing backend health...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ Backend is healthy")
            return True
        else:
            print(f"   ❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Backend not accessible: {e}")
        return False

def test_ai_enhancement_status_detailed():
    """Test the enhanced AI enhancement status endpoint"""
    print("\n🧠 Testing enhanced AI enhancement status...")
    try:
        response = requests.get(f"{BASE_URL}/api/ai/ai-enhancement-status", timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            
            print("   ✅ AI status endpoint accessible")
            print(f"   📊 Status: {data.get('status', 'unknown')}")
            print(f"   🤖 AI Available: {data.get('ai_enhancement_available', False)}")
            
            # Show startup information
            startup_info = data.get('startup_info', {})
            if startup_info:
                print("\n   📈 Startup Information:")
                print(f"      - In startup phase: {startup_info.get('in_startup_phase', 'unknown')}")
                print(f"      - Ollama verified ready: {startup_info.get('ollama_verified_ready', 'unknown')}")
                print(f"      - Time since backend start: {startup_info.get('time_since_backend_start', 0):.1f}s")
                print(f"      - Grace period: {startup_info.get('startup_grace_period_seconds', 0):.0f}s")
            
            # Show circuit breaker information
            circuit_info = data.get('circuit_breaker', {})
            if circuit_info:
                print("\n   🔌 Circuit Breaker:")
                print(f"      - Active: {circuit_info.get('active', 'unknown')}")
                print(f"      - Failure count: {circuit_info.get('failure_count', 0)}")
                print(f"      - Max failures: {circuit_info.get('max_failures', 0)}")
            
            # Show connection test details
            connection_test = data.get('connection_test', 'unknown')
            print(f"\n   🔗 Connection Test: {connection_test}")
            
            # Show warmup status if available
            warmup_status = data.get('warmup_status')
            if warmup_status:
                print(f"   🔥 Warmup Status: {warmup_status}")
            
            # Show error message if any
            error_message = data.get('error_message')
            if error_message:
                print(f"   ⚠️  Error: {error_message}")
            
            # Show models if available
            models = data.get('models_available', [])
            if models:
                print(f"\n   📚 Available Models ({len(models)}):")
                for model in models:
                    print(f"      - {model}")
            
            return data.get('ai_enhancement_available', False)
        
        else:
            print(f"   ❌ AI status check failed: {response.status_code}")
            print(f"      Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ AI status check error: {e}")
        return False

def test_startup_sequence():
    """Test multiple status checks to see how startup is handled"""
    print("\n🚀 Testing startup sequence with multiple checks...")
    
    checks = []
    for i in range(5):
        print(f"\n   📍 Check #{i+1}/5:")
        start_time = time.time()
        
        try:
            response = requests.get(f"{BASE_URL}/api/ai/ai-enhancement-status", timeout=15)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', 'unknown')
                available = data.get('ai_enhancement_available', False)
                startup_phase = data.get('startup_info', {}).get('in_startup_phase', False)
                verified_ready = data.get('startup_info', {}).get('ollama_verified_ready', False)
                connection_test = data.get('connection_test', 'unknown')
                
                check_result = {
                    'check_number': i + 1,
                    'duration': duration,
                    'status': status,
                    'available': available,
                    'startup_phase': startup_phase,
                    'verified_ready': verified_ready,
                    'connection_test': connection_test
                }
                checks.append(check_result)
                
                print(f"      ⏱️  Duration: {duration:.2f}s")
                print(f"      📊 Status: {status}")
                print(f"      🤖 Available: {available}")
                print(f"      🚀 Startup Phase: {startup_phase}")
                print(f"      ✅ Verified Ready: {verified_ready}")
                print(f"      🔗 Connection: {connection_test}")
                
            else:
                print(f"      ❌ Failed: {response.status_code}")
                
        except Exception as e:
            print(f"      ❌ Error: {e}")
        
        if i < 4:  # Don't wait after the last check
            time.sleep(2)  # Wait 2 seconds between checks
    
    # Analyze the sequence
    print(f"\n   📈 Startup Sequence Analysis:")
    available_count = sum(1 for check in checks if check['available'])
    startup_count = sum(1 for check in checks if check['startup_phase'])
    verified_count = sum(1 for check in checks if check['verified_ready'])
    
    print(f"      - Available in {available_count}/5 checks")
    print(f"      - Startup phase in {startup_count}/5 checks")
    print(f"      - Verified ready in {verified_count}/5 checks")
    
    # Check for improvement over time
    if len(checks) >= 2:
        first_available = checks[0]['available']
        last_available = checks[-1]['available']
        
        if not first_available and last_available:
            print(f"      ✅ AI became available during test sequence!")
        elif first_available and last_available:
            print(f"      ✅ AI remained available throughout test")
        elif not first_available and not last_available:
            print(f"      ⚠️  AI remained unavailable - may need more time")
    
    return checks

def main():
    print("=== AI Enhancement Startup Reliability Test ===\n")
    
    # Test direct Ollama connectivity
    ollama_ok = test_ollama_direct()
    
    # Test backend health
    backend_ok = test_backend_status()
    
    if not backend_ok:
        print("\n❌ Backend not accessible. Start with 'python3 dev-start.py'")
        sys.exit(1)
    
    # Test enhanced AI status
    ai_ok = test_ai_enhancement_status_detailed()
    
    # Test startup sequence
    checks = test_startup_sequence()
    
    # Summary and recommendations
    print(f"\n=== Summary and Analysis ===")
    
    if ollama_ok and backend_ok:
        print("✅ Infrastructure: All systems accessible")
    else:
        print("⚠️  Infrastructure: Some systems not accessible")
    
    if ai_ok:
        print("✅ AI Enhancement: Currently available")
    else:
        print("⚠️  AI Enhancement: Currently unavailable")
        
        # Check if we're in startup phase
        if checks and any(check['startup_phase'] for check in checks):
            print("   💡 System is in startup phase - this is expected")
            print("   ⏳ AI should become available within 3 minutes of backend start")
        else:
            print("   💡 System is past startup phase - investigate logs")
    
    # Performance analysis
    if checks:
        avg_duration = sum(check['duration'] for check in checks) / len(checks)
        print(f"\n📊 Performance: Average status check duration: {avg_duration:.2f}s")
        
        if avg_duration > 5:
            print("   ⚠️  Status checks are slow - may indicate Ollama performance issues")
        elif avg_duration < 1:
            print("   ✅ Status checks are fast - good performance")
    
    print(f"\n🎯 Next Steps:")
    if not ai_ok and ollama_ok:
        print("   1. Wait for startup grace period to complete (up to 3 minutes)")
        print("   2. Check backend logs for any warmup issues")
        print("   3. Verify no circuit breaker activation in logs")
    elif ai_ok:
        print("   1. AI Enhancement should now be available in the frontend")
        print("   2. Startup reliability improvements are working correctly")
    else:
        print("   1. Check Ollama service: ollama serve")
        print("   2. Verify Ollama has models loaded: ollama list")
        print("   3. Check backend logs for detailed error information")

if __name__ == "__main__":
    main()