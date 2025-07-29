#!/usr/bin/env python3
"""
Direct API test to see what the patient census endpoint returns
"""

import requests
import json

def test_patient_census_api():
    """Test the patient census API directly"""
    
    # Login first to get token
    login_url = "http://localhost:5000/auth/login"
    login_data = {
        "username": "demo@medocpro.com",
        "password": "demo123"
    }
    
    try:
        print("=== Testing Patient Census API ===")
        
        # Get auth token
        print("1. Getting authentication token...")
        login_response = requests.post(login_url, json=login_data)
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return
        
        login_result = login_response.json()
        token = login_result.get('access_token')
        
        if not token:
            print("No access token received")
            print(f"Login response: {login_result}")
            return
        
        print(f"✅ Got token: {token[:20]}...")
        
        # Test patient census today endpoint
        print("\n2. Testing patient census today endpoint...")
        census_url = "http://localhost:5000/api/patient-census/today"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        census_response = requests.get(census_url, headers=headers)
        
        print(f"Status Code: {census_response.status_code}")
        
        if census_response.status_code == 200:
            census_data = census_response.json()
            print(f"✅ Success! Response structure:")
            print(f"  - success: {census_data.get('success')}")
            
            census = census_data.get('census', {})
            print(f"  - census_date: {census.get('census_date')}")
            print(f"  - is_active: {census.get('is_active')}")
            print(f"  - current_census_count: {census.get('current_census_count')}")
            print(f"  - admission_count: {census.get('admission_count')}")
            print(f"  - discharge_count: {census.get('discharge_count')}")
            
            rows = census.get('rows', [])
            print(f"  - total rows: {len(rows)}")
            
            if rows:
                print(f"\n  First 3 patients:")
                for i, patient in enumerate(rows[:3]):
                    print(f"    {i+1}. {patient.get('patient_name')} (ID: {patient.get('patient_id')}) - {patient.get('status')}")
                
                print(f"\n  Last 3 patients:")
                for i, patient in enumerate(rows[-3:]):
                    print(f"    {len(rows)-2+i}. {patient.get('patient_name')} (ID: {patient.get('patient_id')}) - {patient.get('status')}")
        else:
            print(f"❌ Failed with status {census_response.status_code}")
            print(f"Response: {census_response.text}")
        
        # Test yesterday's data
        print("\n3. Testing yesterday's patient census...")
        from datetime import datetime, timedelta
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        yesterday_url = f"http://localhost:5000/api/patient-census?date={yesterday}"
        
        yesterday_response = requests.get(yesterday_url, headers=headers)
        print(f"Yesterday URL: {yesterday_url}")
        print(f"Status Code: {yesterday_response.status_code}")
        
        if yesterday_response.status_code == 200:
            yesterday_data = yesterday_response.json()
            censuses = yesterday_data.get('censuses', [])
            print(f"Yesterday's census records: {len(censuses)}")
            
            if censuses:
                for census in censuses:
                    rows = census.get('rows', [])
                    print(f"  - {census.get('census_date')}: {len(rows)} patients")
        else:
            print(f"Yesterday data failed: {yesterday_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_patient_census_api()