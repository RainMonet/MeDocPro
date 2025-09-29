#!/usr/bin/env python3
"""
Test script for audit logging fixes
Verifies that audit logging endpoint works correctly with authentication
"""

import requests
import json
import sys
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000"

def test_backend_connection():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
            return True
        else:
            print(f"❌ Backend returned status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_authentication():
    """Test authentication and get a valid token"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            headers={"Content-Type": "application/json"},
            json={"username": "demo@medocpro.com", "password": "demo123"},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                print("✅ Authentication successful")
                return token
            else:
                print("❌ No access token in response")
                return None
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return None

def test_audit_logs_without_auth():
    """Test audit logs endpoint without authentication"""
    print("\n🧪 Testing audit logs without authentication...")
    try:
        response = requests.get(f"{BASE_URL}/api/audit-logs", timeout=5)
        
        if response.status_code == 401:
            print("✅ Correctly rejected unauthenticated request (401)")
            return True
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing unauthenticated access: {e}")
        return False

def test_audit_logs_with_auth(token):
    """Test audit logs endpoint with valid token"""
    print("\n🧪 Testing audit logs with valid authentication...")
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Test with date range
        today = datetime.now().strftime('%Y-%m-%d')
        last_week = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        
        response = requests.get(
            f"{BASE_URL}/api/audit-logs",
            params={'start_date': last_week, 'end_date': today},
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'logs' in data:
                log_count = data.get('count', 0)
                print(f"✅ Successfully retrieved {log_count} audit logs")
                
                # Show sample log entries
                logs = data.get('logs', [])
                if logs:
                    print("\n📋 Sample log entries:")
                    for i, log in enumerate(logs[:3]):  # Show first 3 entries
                        timestamp = log.get('timestamp', 'N/A')
                        action = log.get('action', 'N/A')
                        user_id = log.get('user_id', 'N/A')
                        print(f"  {i+1}. {timestamp} | User {user_id} | {action}")
                
                return True
            else:
                print(f"❌ Invalid response format: {data}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"    Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing authenticated access: {e}")
        return False

def test_audit_logs_invalid_token():
    """Test audit logs endpoint with invalid token"""
    print("\n🧪 Testing audit logs with invalid token...")
    try:
        headers = {
            "Authorization": "Bearer invalid_token_here",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{BASE_URL}/api/audit-logs",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 422:  # JWT decode error
            print("✅ Correctly rejected invalid token (422)")
            return True
        elif response.status_code == 401:  # Unauthorized
            print("✅ Correctly rejected invalid token (401)")
            return True
        else:
            print(f"❌ Expected 401/422, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing invalid token: {e}")
        return False

def main():
    print("=== Audit Logging Fix Verification ===\n")
    
    # Test backend connection
    if not test_backend_connection():
        print("\n❌ Backend not accessible. Start with 'python3 dev-start.py'")
        sys.exit(1)
    
    # Test authentication 
    token = test_authentication()
    if not token:
        print("\n❌ Cannot authenticate. Check demo credentials.")
        sys.exit(1)
    
    # Run all tests
    tests = [
        test_audit_logs_without_auth(),
        test_audit_logs_invalid_token(),
        test_audit_logs_with_auth(token)
    ]
    
    # Summary
    passed = sum(tests)
    total = len(tests)
    
    print(f"\n=== Test Results ===")
    print(f"✅ Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All audit logging tests passed!")
        print("\nThe audit logging system is working correctly:")
        print("  • Properly rejects unauthenticated requests")
        print("  • Properly rejects invalid tokens") 
        print("  • Successfully returns logs with valid authentication")
        print("\nFrontend error should now show proper authentication messages.")
    else:
        print(f"⚠️  {total - passed} test(s) failed")
        print("Check backend logs and authentication setup.")

if __name__ == "__main__":
    main()