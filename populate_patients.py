#!/usr/bin/env python3
"""
Populate the database with 25 mock psychiatric patients
"""

import requests
import json
import random
from datetime import datetime

# Mock patient data with realistic psychiatric conditions
MOCK_PATIENTS = [
    {
        'patient_name': 'Anderson, Sarah',
        'patient_id': 'PT009',
        'room_number': '201A',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'Major depressive episode with psychotic features',
            'observation': 'disheveled appearance, poor eye contact, psychomotor retardation',
            'mood': 'severely depressed, hopeless',
            'SI': 'active suicidal ideation with plan',
            'HI': 'denies homicidal ideation',
            'assessment': 'Major Depressive Disorder with psychotic features. Initiate antidepressant and antipsychotic. Psychiatric hold for safety.'
        }
    },
    {
        'patient_name': 'Brown, Michael',
        'patient_id': 'PT010',
        'room_number': '201B',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'Bipolar I disorder, manic episode',
            'observation': 'hypervigilant, pressured speech, grandiose delusions',
            'mood': 'euphoric, irritable when challenged',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'Bipolar I, manic episode. Continue lithium, add quetiapine for sleep. Monitor lithium levels.'
        }
    },
    {
        'patient_name': 'Chen, Lisa',
        'patient_id': 'PT011',
        'room_number': '202A',
        'workflow_type': 'discharge',
        'data_fields': {
            'chief_complaint': 'Schizophrenia, paranoid type',
            'observation': 'improved organization, less paranoid, taking medications',
            'mood': 'stable, appropriate affect',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'Schizophrenia, stable on risperidone. Ready for discharge to group home.'
        }
    },
    {
        'patient_name': 'Davis, Robert',
        'patient_id': 'PT012',
        'room_number': '202B',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'Alcohol withdrawal with hallucinations',
            'observation': 'tremulous, diaphoretic, visual hallucinations',
            'mood': 'anxious, fearful',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'Alcohol withdrawal delirium. CIWA protocol, thiamine, folate. Monitor for seizures.'
        }
    },
    {
        'patient_name': 'Evans, Patricia',
        'patient_id': 'PT013',
        'room_number': '203A',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'Generalized anxiety disorder with panic attacks',
            'observation': 'well-groomed, cooperative, appears anxious',
            'mood': 'anxious but stable',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'GAD with panic disorder. Continue sertraline, add lorazepam PRN. CBT referral.'
        }
    },
    {
        'patient_name': 'Foster, James',
        'patient_id': 'PT014',
        'room_number': '203B',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'First episode psychosis',
            'observation': 'disorganized speech, inappropriate affect, responding to internal stimuli',
            'mood': 'labile, inappropriate',
            'SI': 'unable to assess due to disorganization',
            'HI': 'denies but poor insight',
            'assessment': 'First episode psychosis, rule out schizophreniform disorder. Start risperidone.'
        }
    },
    {
        'patient_name': 'Garcia, Maria',
        'patient_id': 'PT015',
        'room_number': '204A',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'PTSD with dissociative episodes',
            'observation': 'hypervigilant, startles easily, poor concentration',
            'mood': 'depressed with anxiety',
            'SI': 'passive thoughts, no plan',
            'HI': 'denies homicidal ideation',
            'assessment': 'PTSD with dissociative features. Continue prazosin, increase sertraline. EMDR therapy.'
        }
    },
    {
        'patient_name': 'Henderson, William',
        'patient_id': 'PT016',
        'room_number': '204B',
        'workflow_type': 'discharge',
        'data_fields': {
            'chief_complaint': 'Substance-induced mood disorder',
            'observation': 'clear-headed, motivated for recovery, good insight',
            'mood': 'stable, optimistic',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'Substance-induced mood disorder, in remission. Discharge to halfway house.'
        }
    },
    {
        'patient_name': 'Jackson, Jennifer',
        'patient_id': 'PT017',
        'room_number': '205A',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'Borderline personality disorder with self-harm',
            'observation': 'multiple superficial cuts on forearms, emotional lability',
            'mood': 'rapidly fluctuating, angry',
            'SI': 'chronic ideation, recent self-harm',
            'HI': 'denies homicidal ideation',
            'assessment': 'BPD with non-suicidal self-injury. DBT skills, safety planning.'
        }
    },
    {
        'patient_name': 'Kim, David',
        'patient_id': 'PT018',
        'room_number': '205B',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'Obsessive-compulsive disorder',
            'observation': 'ritualistic behaviors, checking compulsions, anxious about contamination',
            'mood': 'anxious, frustrated',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'OCD, severe. Increase fluoxetine to 80mg daily. ERP therapy referral.'
        }
    },
    {
        'patient_name': 'Lopez, Ana',
        'patient_id': 'PT019',
        'room_number': '206A',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'Anorexia nervosa, severe malnutrition',
            'observation': 'emaciated appearance, denies hunger, preoccupied with weight',
            'mood': 'anxious about eating, depressed',
            'SI': 'passive thoughts when discussing weight gain',
            'HI': 'denies homicidal ideation',
            'assessment': 'Anorexia nervosa, severe. Medical stabilization, supervised meals, therapy.'
        }
    },
    {
        'patient_name': 'Miller, Thomas',
        'patient_id': 'PT020',
        'room_number': '206B',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'Persistent depressive disorder (dysthymia)',
            'observation': 'chronic low mood, poor energy, pessimistic outlook',
            'mood': 'chronically depressed, stable',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'Persistent depressive disorder. Trial of bupropion added to current regimen.'
        }
    },
    {
        'patient_name': 'Nelson, Carol',
        'patient_id': 'PT021',
        'room_number': '207A',
        'workflow_type': 'discharge',
        'data_fields': {
            'chief_complaint': 'Adjustment disorder with anxiety',
            'observation': 'improved coping, using learned skills, less anxious',
            'mood': 'stable, hopeful',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'Adjustment disorder, resolved. Discharge with outpatient therapy follow-up.'
        }
    },
    {
        'patient_name': 'O\'Connor, Brian',
        'patient_id': 'PT022',
        'room_number': '207B',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'Cocaine intoxication with paranoid delusions',
            'observation': 'hypervigilant, paranoid, believes staff are plotting against him',
            'mood': 'irritable, suspicious',
            'SI': 'denies suicidal ideation',
            'HI': 'vague threats when paranoid',
            'assessment': 'Cocaine intoxication with paranoid delusions. Detox protocol, antipsychotic PRN.'
        }
    },
    {
        'patient_name': 'Parker, Michelle',
        'patient_id': 'PT023',
        'room_number': '208A',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'Social anxiety disorder',
            'observation': 'quiet, avoids eye contact, speaks softly',
            'mood': 'anxious in social situations',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'Social anxiety disorder. Continue paroxetine, group therapy for social skills.'
        }
    },
    {
        'patient_name': 'Quinn, Richard',
        'patient_id': 'PT024',
        'room_number': '208B',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'Delusional disorder, jealous type',
            'observation': 'well-organized except for fixed delusion about spouse\'s infidelity',
            'mood': 'angry, suspicious',
            'SI': 'denies suicidal ideation',
            'HI': 'threats toward suspected paramour',
            'assessment': 'Delusional disorder, jealous type. Safety assessment, antipsychotic trial.'
        }
    },
    {
        'patient_name': 'Rodriguez, Carmen',
        'patient_id': 'PT025',
        'room_number': '209A',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'Bipolar II disorder, depressed',
            'observation': 'appears tired, slowed movements, poor concentration',
            'mood': 'depressed, no recent hypomania',
            'SI': 'passive thoughts, no plan',
            'HI': 'denies homicidal ideation',
            'assessment': 'Bipolar II, current episode depressed. Adjust lamotrigine, monitor mood.'
        }
    },
    {
        'patient_name': 'Smith, Kevin',
        'patient_id': 'PT026',
        'room_number': '209B',
        'workflow_type': 'discharge',
        'data_fields': {
            'chief_complaint': 'Schizoaffective disorder, stabilized',
            'observation': 'taking medications regularly, improved reality testing',
            'mood': 'stable, appropriate',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'Schizoaffective disorder, stable on current regimen. Discharge to assisted living.'
        }
    },
    {
        'patient_name': 'Taylor, Amanda',
        'patient_id': 'PT027',
        'room_number': '210A',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'Conversion disorder with paralysis',
            'observation': 'functional paralysis of left leg, inconsistent with neurological examination',
            'mood': 'anxious, dramatic presentation',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'Conversion disorder. Medical clearance complete, psychiatric evaluation.'
        }
    },
    {
        'patient_name': 'Thompson, Daniel',
        'patient_id': 'PT028',
        'room_number': '210B',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'Attention deficit hyperactivity disorder, adult',
            'observation': 'restless, difficulty sitting still, easily distracted',
            'mood': 'stable, frustrated with concentration',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'ADHD, adult type. Optimize stimulant dosing, behavioral strategies.'
        }
    },
    {
        'patient_name': 'Williams, Rachel',
        'patient_id': 'PT029',
        'room_number': '211A',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'Postpartum depression with psychotic features',
            'observation': 'tearful, expressing guilt about harming baby, poor bonding',
            'mood': 'severely depressed, anxious about baby',
            'SI': 'thoughts of harming self and baby',
            'HI': 'infanticide thoughts',
            'assessment': 'Postpartum depression with psychosis. Emergency psychiatric hold, antidepressant/antipsychotic.'
        }
    },
    {
        'patient_name': 'Wilson, Gregory',
        'patient_id': 'PT030',
        'room_number': '211B',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'Intermittent explosive disorder',
            'observation': 'calm currently, history of explosive anger episodes',
            'mood': 'stable, remorseful about recent incident',
            'SI': 'denies suicidal ideation',
            'HI': 'recent episode of violence',
            'assessment': 'Intermittent explosive disorder. Anger management, mood stabilizer trial.'
        }
    },
    {
        'patient_name': 'Young, Stephanie',
        'patient_id': 'PT031',
        'room_number': '212A',
        'workflow_type': 'discharge',
        'data_fields': {
            'chief_complaint': 'Major depressive disorder, recurrent',
            'observation': 'improved mood, better energy, engaging in activities',
            'mood': 'much improved, optimistic',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'MDD, recurrent, in remission. Discharge on current antidepressant regimen.'
        }
    },
    {
        'patient_name': 'Zhang, Wei',
        'patient_id': 'PT032',
        'room_number': '212B',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'Catatonia associated with mood disorder',
            'observation': 'catatonic stupor, waxy flexibility, minimal responsiveness',
            'mood': 'unable to assess due to catatonia',
            'SI': 'unable to assess',
            'HI': 'unable to assess',
            'assessment': 'Catatonia with mood disorder. Lorazepam challenge, consider ECT if no response.'
        }
    },
    {
        'patient_name': 'Adams, Joshua',
        'patient_id': 'PT033',
        'room_number': '213A',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'Panic disorder with agoraphobia',
            'observation': 'anxious about leaving room, reports panic attacks',
            'mood': 'anxious, avoidant',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'assessment': 'Panic disorder with agoraphobia. Continue SSRI, exposure therapy referral.'
        }
    }
]

def get_auth_token(backend_url="http://localhost:5000"):
    """Get authentication token from the backend"""
    try:
        response = requests.post(f"{backend_url}/auth/login", 
                               headers={'Content-Type': 'application/json'},
                               json={
                                   'username': 'demo@medocpro.com',
                                   'password': 'demo123'
                               })
        if response.status_code == 200:
            data = response.json()
            return data.get('access_token')
    except Exception as e:
        print(f"Error getting auth token: {e}")
    return None

def get_census_id(auth_token, backend_url="http://localhost:5000"):
    """Get today's census ID"""
    try:
        response = requests.get(f"{backend_url}/api/patient-census/today",
                              headers={'Authorization': f'Bearer {auth_token}'})
        if response.status_code == 200:
            data = response.json()
            return data.get('census', {}).get('id')
    except Exception as e:
        print(f"Error getting census ID: {e}")
    return None

def add_patient_to_backend(patient_data, auth_token, census_id, backend_url="http://localhost:5000"):
    """Add a single patient to the backend"""
    try:
        # For main Flask backend, we need authentication and use proper endpoint with census_id
        add_response = requests.post(f"{backend_url}/api/patient-census/{census_id}/rows",
                                   headers={
                                       'Content-Type': 'application/json',
                                       'Authorization': f'Bearer {auth_token}'
                                   },
                                   json=patient_data)
        
        if add_response.status_code in [200, 201]:
            result = add_response.json()
            if result.get('success', True):  # Default to True for 201 Created responses
                print(f"✅ Added: {patient_data['patient_name']} ({patient_data['patient_id']})")
                return True
            else:
                print(f"❌ Failed to add {patient_data['patient_name']}: {result.get('error', 'Unknown error')}")
        else:
            print(f"❌ HTTP error adding {patient_data['patient_name']}: {add_response.status_code}")
    
    except Exception as e:
        print(f"❌ Error adding {patient_data['patient_name']}: {str(e)}")
    
    return False

def main():
    print("🏥 Populating MeDocPro with 25 mock psychiatric patients...")
    print("📡 Connecting to backend at http://localhost:5000")
    
    # Get authentication token
    print("🔑 Authenticating with demo credentials...")
    auth_token = get_auth_token()
    if not auth_token:
        print("❌ Failed to authenticate with backend")
        return
    
    print("✅ Authentication successful!")
    
    # Get today's census ID
    print("📅 Getting today's census...")
    census_id = get_census_id(auth_token)
    if not census_id:
        print("❌ Failed to get census ID")
        return
    
    print(f"✅ Census ID: {census_id}")
    
    success_count = 0
    total_count = len(MOCK_PATIENTS)
    
    for patient in MOCK_PATIENTS:
        if add_patient_to_backend(patient, auth_token, census_id):
            success_count += 1
    
    print(f"\n📊 Population complete: {success_count}/{total_count} patients added successfully")
    
    if success_count == total_count:
        print("✅ All patients added successfully!")
    else:
        print(f"⚠️  {total_count - success_count} patients failed to add")
    
    print("\n🎯 You can now view these patients in the Patient Census Modal")

if __name__ == "__main__":
    main()