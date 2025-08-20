#!/usr/bin/env python3

"""
Direct API test for daily information endpoints
Tests the backend independently of the frontend
"""

import requests
import json
from datetime import date

def test_daily_info_api():
    """Test the daily information API endpoints directly"""
    
    # Test authentication first
    print("🔐 Testing authentication...")
    auth_response = requests.post('http://localhost:5000/auth/login', json={
        'username': 'demo@medocpro.com',
        'password': 'demo123'
    })
    
    if auth_response.status_code != 200:
        print(f"❌ Authentication failed: {auth_response.status_code} - {auth_response.text}")
        return
    
    token = auth_response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    print("✅ Authentication successful")
    
    # Test specific patient IDs that are having issues
    problem_patients = [1153, 1161, 1168, 1150, 1152]  # Alexander, Alvarenga, Bustos, Camsel, Crabbe
    today = date.today().isoformat()
    
    print(f"\n📅 Testing daily info for {today}")
    print("🔍 Testing problem patients...")
    
    for patient_id in problem_patients:
        print(f"\n--- Testing Patient {patient_id} ---")
        
        # Test the endpoint the frontend uses
        try:
            response = requests.get(
                f'http://localhost:5000/api/daily-info/{patient_id}?date={today}', 
                headers=headers,
                timeout=10
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Success: {data.get('success')}")
                print(f"Entry count: {data.get('count', 0)}")
                
                if data.get('entries') and len(data['entries']) > 0:
                    entry = data['entries'][0]
                    field_values = entry.get('field_values', {})
                    field_count = len(field_values)
                    print(f"✅ Patient {patient_id} has {field_count} fields")
                    print(f"   Status: {entry.get('status')}")
                    print(f"   Entry ID: {entry.get('id')}")
                    print(f"   Template ID: {entry.get('template_id')}")
                    print(f"   Notes: {entry.get('notes', 'None')[:50]}...")
                    if field_count > 0:
                        print(f"   Sample fields: {list(field_values.keys())[:5]}")
                else:
                    print(f"📭 Patient {patient_id} has NO entries")
            else:
                print(f"❌ Error {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"💥 Request failed: {e}")
    
    # Test bulk endpoint
    print(f"\n🔍 Testing bulk daily info endpoint...")
    try:
        response = requests.get(
            'http://localhost:5000/api/daily-info/today', 
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Bulk endpoint successful: {data.get('count', 0)} total entries")
            
            # Check which problem patients are in bulk data
            entries = data.get('entries', [])
            found_patients = set()
            for entry in entries:
                patient_id = entry.get('patient_census_row_id')
                if patient_id in problem_patients:
                    found_patients.add(patient_id)
                    field_count = len(entry.get('field_values', {}))
                    print(f"✅ Bulk data includes Patient {patient_id} with {field_count} fields")
            
            missing_patients = set(problem_patients) - found_patients
            if missing_patients:
                print(f"📭 Missing from bulk data: {missing_patients}")
        else:
            print(f"❌ Bulk endpoint failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"💥 Bulk request failed: {e}")

if __name__ == "__main__":
    test_daily_info_api()