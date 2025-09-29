#!/usr/bin/env python3
"""
Test script to verify AI enhancement reliability fixes

This script tests the improved AI enhancement system including:
- Circuit breaker behavior
- Status endpoint reliability
- Timeout handling
- Connection pooling
"""

import requests
import time
import json
from datetime import datetime

def test_ai_enhancement_status():
    """Test the improved AI enhancement status endpoint"""
    print("🧪 Testing AI Enhancement Status Endpoint")
    print("-" * 50)
    
    base_url = "http://localhost:5000"
    
    try:
        start_time = time.time()
        response = requests.get(f"{base_url}/api/ai/ai-enhancement-status", timeout=15)
        response_time = int((time.time() - start_time) * 1000)
        
        print(f"✅ Status check completed in {response_time}ms")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Status: {data.get('status', 'unknown')}")
            print(f"🔌 AI Available: {data.get('ai_enhancement_available', False)}")
            
            # Circuit breaker information
            cb_info = data.get('circuit_breaker', {})
            print(f"🔄 Circuit Breaker Active: {cb_info.get('active', 'unknown')}")
            print(f"📈 Failure Count: {cb_info.get('failure_count', 0)}/{cb_info.get('max_failures', 'unknown')}")
            
            if cb_info.get('disabled_until'):
                print(f"⏰ Disabled Until: {cb_info.get('disabled_until')}")
            
            # Models information
            models = data.get('models_available', [])
            print(f"🤖 Models Available: {len(models)}")
            if models:
                print(f"   Models: {', '.join(models[:3])}{'...' if len(models) > 3 else ''}")
                
            print(f"🌐 Ollama URL: {data.get('ollama_url', 'unknown')}")
            print(f"⚡ Connection Test: {data.get('connection_test', 'unknown')}")
            
            return data
        else:
            print(f"❌ Status check failed with code {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return None
            
    except requests.exceptions.Timeout:
        print("❌ Status check timed out (15 seconds)")
        return None
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to MeDocPro backend")
        print("   Make sure the backend is running on localhost:5000")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def test_debug_endpoint():
    """Test the debug endpoint for detailed diagnostics"""
    print("\n🔍 Testing Debug Endpoint")
    print("-" * 50)
    
    base_url = "http://localhost:5000"
    
    try:
        response = requests.get(f"{base_url}/api/ai/debug-status", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Debug endpoint accessible")
            
            # Circuit breaker details
            cb = data.get('circuit_breaker', {})
            print(f"🔄 CB Failures: {cb.get('failures', 0)}")
            print(f"🔄 CB Max Failures: {cb.get('max_failures', 'unknown')}")
            print(f"🔄 CB Active: {cb.get('is_active', 'unknown')}")
            
            # Session information
            session = data.get('session_info', {})
            print(f"📡 Session Exists: {session.get('session_exists', 'unknown')}")
            print(f"📡 Last Used: {session.get('last_used', 'never')}")
            
            # Ollama ping
            ping = data.get('ollama_ping', {})
            if ping.get('success'):
                print(f"🏓 Ollama Ping: ✅ {ping.get('response_time_ms', 0)}ms")
                if ping.get('version'):
                    print(f"🏓 Ollama Version: {ping.get('version')}")
            else:
                print(f"🏓 Ollama Ping: ❌ {ping.get('error', 'unknown error')}")
                
            return data
        else:
            print(f"❌ Debug endpoint failed with code {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Debug endpoint error: {e}")
        return None

def test_multiple_status_checks():
    """Test multiple rapid status checks to verify stability"""
    print("\n⚡ Testing Multiple Rapid Status Checks")
    print("-" * 50)
    
    base_url = "http://localhost:5000"
    results = []
    
    for i in range(5):
        try:
            start_time = time.time()
            response = requests.get(f"{base_url}/api/ai/ai-enhancement-status", timeout=10)
            response_time = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', 'unknown')
                available = data.get('ai_enhancement_available', False)
                results.append({
                    'check': i + 1,
                    'success': True,
                    'response_time': response_time,
                    'status': status,
                    'available': available
                })
                print(f"Check {i+1}: ✅ {status} ({response_time}ms)")
            else:
                results.append({
                    'check': i + 1,
                    'success': False,
                    'response_time': response_time,
                    'error': f"HTTP {response.status_code}"
                })
                print(f"Check {i+1}: ❌ HTTP {response.status_code} ({response_time}ms)")
                
        except Exception as e:
            results.append({
                'check': i + 1,
                'success': False,
                'error': str(e)[:50]
            })
            print(f"Check {i+1}: ❌ {str(e)[:50]}")
        
        # Small delay between checks
        if i < 4:
            time.sleep(0.5)
    
    # Summary
    successful = sum(1 for r in results if r.get('success'))
    print(f"\n📊 Results: {successful}/5 successful checks")
    
    if successful > 0:
        avg_time = sum(r['response_time'] for r in results if r.get('success')) / successful
        print(f"⏱️  Average response time: {avg_time:.1f}ms")
    
    return results

def main():
    print("🚀 AI Enhancement Reliability Test")
    print("=" * 60)
    print()
    
    # Test 1: Basic status check
    status_data = test_ai_enhancement_status()
    
    # Test 2: Debug information
    debug_data = test_debug_endpoint()
    
    # Test 3: Multiple rapid checks
    rapid_results = test_multiple_status_checks()
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    
    if status_data:
        ai_available = status_data.get('ai_enhancement_available', False)
        circuit_active = status_data.get('circuit_breaker', {}).get('active', False)
        
        if ai_available and not circuit_active:
            print("✅ AI Enhancement: AVAILABLE and ready to use")
        elif circuit_active:
            print("⚠️  AI Enhancement: Circuit breaker is active")
            cb_info = status_data.get('circuit_breaker', {})
            if cb_info.get('disabled_until'):
                print(f"   Will retry at: {cb_info.get('disabled_until')}")
        else:
            print("❌ AI Enhancement: Not available")
            print(f"   Reason: {status_data.get('error_message', 'Unknown')}")
    else:
        print("❌ Could not determine AI enhancement status")
    
    if debug_data:
        print("✅ Debug endpoint: Accessible")
    else:
        print("❌ Debug endpoint: Not accessible")
    
    successful_checks = sum(1 for r in rapid_results if r.get('success'))
    print(f"📊 Rapid checks: {successful_checks}/5 successful")
    
    if successful_checks >= 4:
        print("\n🎉 AI Enhancement system appears to be working reliably!")
    elif successful_checks >= 2:
        print("\n⚠️  AI Enhancement system has some issues but is partially working")
    else:
        print("\n❌ AI Enhancement system appears to have significant issues")
    
    print("\n💡 Tips:")
    print("- If circuit breaker is active, wait for the timeout to expire")
    print("- Check that Ollama is running on localhost:11434")
    print("- Use the debug endpoint for detailed diagnostics")
    print("- Try the manual circuit breaker reset endpoint if needed")

if __name__ == "__main__":
    main()