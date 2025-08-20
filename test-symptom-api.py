#!/usr/bin/env python3

import requests
import json
from datetime import datetime

def test_symptom_api():
    """Test the symptom trends API endpoint"""
    
    # First, let's try to authenticate (you may need to adjust this)
    auth_url = "http://localhost:5000/api/auth/login"
    auth_data = {
        "email": "demo@medocpro.com",
        "password": "demo123"
    }
    
    print("🔐 Authenticating...")
    try:
        auth_response = requests.post(auth_url, json=auth_data)
        if auth_response.status_code == 200:
            auth_result = auth_response.json()
            if auth_result.get('success'):
                token = auth_result.get('access_token')
                print(f"✅ Authentication successful")
            else:
                print(f"❌ Authentication failed: {auth_result.get('error')}")
                return
        else:
            print(f"❌ Authentication request failed: {auth_response.status_code}")
            return
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return
    
    # Test the symptom trends API
    api_url = "http://localhost:5000/api/daily-info/symptom-trends?days=7"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print(f"\n📊 Testing symptom trends API...")
    print(f"URL: {api_url}")
    
    try:
        response = requests.get(api_url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ API call successful")
            print(f"Response keys: {list(result.keys())}")
            
            if result.get('success'):
                print(f"\n📈 Symptom Data Summary:")
                print(f"Total entries: {result.get('summary', {}).get('total_entries', 0)}")
                print(f"Total patients: {result.get('summary', {}).get('total_patients', 0)}")
                print(f"Total symptom points: {result.get('summary', {}).get('total_symptom_points', 0)}")
                
                symptom_data = result.get('symptom_data', [])
                patient_data = result.get('patient_data', [])
                
                print(f"\n👥 Patients found:")
                for patient in patient_data:
                    print(f"  - {patient.get('name')} (ID: {patient.get('id')}, Room: {patient.get('room')})")
                
                if symptom_data:
                    print(f"\n🎯 Sample symptom data:")
                    for i, entry in enumerate(symptom_data[:10]):  # Show first 10 entries
                        print(f"  {i+1}. Patient: {entry.get('patientName')}, Symptom: {entry.get('symptom')}, Intensity: {entry.get('intensity')}, Day: {entry.get('day')}")
                    
                    # Check intensity distribution
                    intensities = [entry.get('intensity', 0) for entry in symptom_data]
                    if intensities:
                        print(f"\n📊 Intensity Statistics:")
                        print(f"  Min: {min(intensities):.3f}")
                        print(f"  Max: {max(intensities):.3f}")
                        print(f"  Avg: {sum(intensities)/len(intensities):.3f}")
                        
                        # Check if all intensities are 0
                        non_zero_count = sum(1 for x in intensities if x > 0)
                        print(f"  Non-zero intensities: {non_zero_count}/{len(intensities)}")
                        
                        if non_zero_count == 0:
                            print(f"  ⚠️ WARNING: All intensities are 0 - this will cause grey/no coloring")
                else:
                    print(f"  ℹ️ No symptom data found")
                    
            else:
                print(f"❌ API returned error: {result.get('error')}")
        else:
            print(f"❌ API call failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"Error details: {error_detail}")
            except:
                print(f"Response text: {response.text}")
    
    except Exception as e:
        print(f"❌ API test error: {e}")

if __name__ == "__main__":
    test_symptom_api()