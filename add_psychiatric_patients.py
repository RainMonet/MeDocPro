#!/usr/bin/env python3
"""Add 25 psychiatric patients for batch generation testing"""

import requests
import json
import random

# Psychiatric patient data for testing
psychiatric_patients = [
    {"name": "Anderson, Michael", "id": "PSY001", "room": "201", "diagnosis": "Major Depressive Disorder", "complaint": "Depression with anxiety", "workflow": "follow-up"},
    {"name": "Barnes, Sarah", "id": "PSY002", "room": "202", "diagnosis": "Bipolar I Disorder", "complaint": "Manic episode", "workflow": "admission"},
    {"name": "Chen, David", "id": "PSY003", "room": "203", "diagnosis": "Schizophrenia", "complaint": "Auditory hallucinations", "workflow": "follow-up"},
    {"name": "Davis, Emily", "id": "PSY004", "room": "204", "diagnosis": "PTSD", "complaint": "Trauma-related nightmares", "workflow": "follow-up"},
    {"name": "Evans, Robert", "id": "PSY005", "room": "205", "diagnosis": "Generalized Anxiety Disorder", "complaint": "Severe anxiety", "workflow": "admission"},
    {"name": "Foster, Lisa", "id": "PSY006", "room": "206", "diagnosis": "Borderline Personality Disorder", "complaint": "Self-harm behaviors", "workflow": "follow-up"},
    {"name": "Garcia, Carlos", "id": "PSY007", "room": "207", "diagnosis": "Substance Use Disorder", "complaint": "Alcohol withdrawal", "workflow": "admission"},
    {"name": "Harris, Jennifer", "id": "PSY008", "room": "208", "diagnosis": "Obsessive-Compulsive Disorder", "complaint": "Intrusive thoughts", "workflow": "follow-up"},
    {"name": "Johnson, Kevin", "id": "PSY009", "room": "209", "diagnosis": "Bipolar II Disorder", "complaint": "Depressive episode", "workflow": "discharge"},
    {"name": "Kim, Michelle", "id": "PSY010", "room": "210", "diagnosis": "Panic Disorder", "complaint": "Recurrent panic attacks", "workflow": "follow-up"},
    {"name": "Lee, Thomas", "id": "PSY011", "room": "211", "diagnosis": "Schizoaffective Disorder", "complaint": "Mixed mood and psychotic symptoms", "workflow": "admission"},
    {"name": "Martinez, Anna", "id": "PSY012", "room": "212", "diagnosis": "Anorexia Nervosa", "complaint": "Restrictive eating", "workflow": "follow-up"},
    {"name": "Nelson, Brian", "id": "PSY013", "room": "213", "diagnosis": "Autism Spectrum Disorder", "complaint": "Behavioral concerns", "workflow": "discharge"},
    {"name": "O'Connor, Kelly", "id": "PSY014", "room": "214", "diagnosis": "Major Depressive Disorder", "complaint": "Suicidal ideation", "workflow": "admission"},
    {"name": "Patel, Raj", "id": "PSY015", "room": "215", "diagnosis": "Social Anxiety Disorder", "complaint": "Social phobia", "workflow": "follow-up"},
    {"name": "Quinn, Rebecca", "id": "PSY016", "room": "216", "diagnosis": "Bipolar I Disorder", "complaint": "Rapid cycling", "workflow": "follow-up"},
    {"name": "Rodriguez, Maria", "id": "PSY017", "room": "217", "diagnosis": "ADHD", "complaint": "Attention difficulties", "workflow": "discharge"},
    {"name": "Smith, Daniel", "id": "PSY018", "room": "218", "diagnosis": "Dysthymia", "complaint": "Chronic depression", "workflow": "follow-up"},
    {"name": "Taylor, Jessica", "id": "PSY019", "room": "219", "diagnosis": "Adjustment Disorder", "complaint": "Life stressor reaction", "workflow": "discharge"},
    {"name": "Thompson, Mark", "id": "PSY020", "room": "220", "diagnosis": "Paranoid Personality Disorder", "complaint": "Suspicious thoughts", "workflow": "admission"},
    {"name": "Williams, Ashley", "id": "PSY021", "room": "221", "diagnosis": "Bulimia Nervosa", "complaint": "Binge-purge cycle", "workflow": "follow-up"},
    {"name": "Wilson, Christopher", "id": "PSY022", "room": "222", "diagnosis": "Dissociative Identity Disorder", "complaint": "Memory gaps", "workflow": "follow-up"},
    {"name": "Young, Stephanie", "id": "PSY023", "room": "223", "diagnosis": "Trichotillomania", "complaint": "Hair pulling urges", "workflow": "discharge"},
    {"name": "Zhang, William", "id": "PSY024", "room": "224", "diagnosis": "Intermittent Explosive Disorder", "complaint": "Anger outbursts", "workflow": "admission"},
    {"name": "Adams, Nicole", "id": "PSY025", "room": "225", "diagnosis": "Selective Mutism", "complaint": "Communication difficulties", "workflow": "follow-up"}
]

def add_patients():
    """Add all psychiatric patients to the census"""
    base_url = "http://localhost:5001"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token'  # Simple auth for dev backend
    }
    
    print("Adding 25 psychiatric patients...")
    
    for i, patient in enumerate(psychiatric_patients, 1):
        patient_data = {
            "patient_name": patient["name"],
            "patient_id": patient["id"],
            "room_number": patient["room"],
            "workflow_type": patient["workflow"],
            "status": patient["workflow"],
            "data_fields": {
                "chief_complaint": patient["complaint"],
                "assessment": patient["diagnosis"],
                "treatment_plan": "Individualized therapy and medication management",
                "progress_notes": "Initial assessment completed"
            }
        }
        
        try:
            response = requests.post(
                f"{base_url}/api/patient-census/1/rows",
                headers=headers,
                json=patient_data
            )
            
            if response.status_code == 200:
                print(f"✓ Added {patient['name']} ({patient['diagnosis']})")
            else:
                print(f"✗ Failed to add {patient['name']}: {response.status_code}")
                
        except Exception as e:
            print(f"✗ Error adding {patient['name']}: {e}")
    
    print(f"\nCompleted adding patients. Checking final count...")
    
    # Verify the count
    try:
        response = requests.get(f"{base_url}/api/patient-census/today", headers=headers)
        if response.status_code == 200:
            data = response.json()
            count = len(data.get('census', {}).get('rows', []))
            print(f"✓ Total patients in census: {count}")
            
            # Show workflow distribution
            workflows = {}
            for row in data.get('census', {}).get('rows', []):
                wf = row.get('workflow_type', 'unknown')
                workflows[wf] = workflows.get(wf, 0) + 1
            
            print("\nWorkflow distribution:")
            for workflow, count in workflows.items():
                print(f"  {workflow}: {count} patients")
        else:
            print(f"✗ Failed to verify: {response.status_code}")
    except Exception as e:
        print(f"✗ Error verifying: {e}")

if __name__ == "__main__":
    add_patients()