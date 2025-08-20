#!/usr/bin/env python3
"""
Add 25 mock patients directly to the simple_backend.py patient storage
"""

import json
import os
from datetime import datetime

# Mock patient data with realistic psychiatric conditions
MOCK_PATIENTS = [
    {
        'id': 9,
        'patient_name': 'Anderson, Sarah',
        'patient_id': 'PT009',
        'room_number': '201A',
        'status': 'admission',
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
        'id': 10,
        'patient_name': 'Brown, Michael',
        'patient_id': 'PT010',
        'room_number': '201B',
        'status': 'follow-up',
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
        'id': 11,
        'patient_name': 'Chen, Lisa',
        'patient_id': 'PT011',
        'room_number': '202A',
        'status': 'discharge',
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
        'id': 12,
        'patient_name': 'Davis, Robert',
        'patient_id': 'PT012',
        'room_number': '202B',
        'status': 'admission',
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
        'id': 13,
        'patient_name': 'Evans, Patricia',
        'patient_id': 'PT013',
        'room_number': '203A',
        'status': 'follow-up',
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
        'id': 14,
        'patient_name': 'Foster, James',
        'patient_id': 'PT014',
        'room_number': '203B',
        'status': 'admission',
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
        'id': 15,
        'patient_name': 'Garcia, Elena',
        'patient_id': 'PT015',
        'room_number': '204A',
        'status': 'follow-up',
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
        'id': 16,
        'patient_name': 'Henderson, William',
        'patient_id': 'PT016',
        'room_number': '204B',
        'status': 'discharge',
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
        'id': 17,
        'patient_name': 'Jackson, Jennifer',
        'patient_id': 'PT017',
        'room_number': '205A',
        'status': 'admission',
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
        'id': 18,
        'patient_name': 'Kim, David',
        'patient_id': 'PT018',
        'room_number': '205B',
        'status': 'follow-up',
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
        'id': 19,
        'patient_name': 'Lopez, Ana',
        'patient_id': 'PT019',
        'room_number': '206A',
        'status': 'admission',
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
        'id': 20,
        'patient_name': 'Miller, Thomas',
        'patient_id': 'PT020',
        'room_number': '206B',
        'status': 'follow-up',
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
        'id': 21,
        'patient_name': 'Nelson, Carol',
        'patient_id': 'PT021',
        'room_number': '207A',
        'status': 'discharge',
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
        'id': 22,
        'patient_name': 'O\'Connor, Brian',
        'patient_id': 'PT022',
        'room_number': '207B',
        'status': 'admission',
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
        'id': 23,
        'patient_name': 'Parker, Michelle',
        'patient_id': 'PT023',
        'room_number': '208A',
        'status': 'follow-up',
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
        'id': 24,
        'patient_name': 'Quinn, Richard',
        'patient_id': 'PT024',
        'room_number': '208B',
        'status': 'admission',
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
        'id': 25,
        'patient_name': 'Rodriguez, Carmen',
        'patient_id': 'PT025',
        'room_number': '209A',
        'status': 'follow-up',
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
        'id': 26,
        'patient_name': 'Smith, Kevin',
        'patient_id': 'PT026',
        'room_number': '209B',
        'status': 'discharge',
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
        'id': 27,
        'patient_name': 'Taylor, Amanda',
        'patient_id': 'PT027',
        'room_number': '210A',
        'status': 'admission',
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
        'id': 28,
        'patient_name': 'Thompson, Daniel',
        'patient_id': 'PT028',
        'room_number': '210B',
        'status': 'follow-up',
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
        'id': 29,
        'patient_name': 'Williams, Rachel',
        'patient_id': 'PT029',
        'room_number': '211A',
        'status': 'admission',
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
        'id': 30,
        'patient_name': 'Wilson, Gregory',
        'patient_id': 'PT030',
        'room_number': '211B',
        'status': 'follow-up',
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
        'id': 31,
        'patient_name': 'Young, Stephanie',
        'patient_id': 'PT031',
        'room_number': '212A',
        'status': 'discharge',
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
        'id': 32,
        'patient_name': 'Zhang, Wei',
        'patient_id': 'PT032',
        'room_number': '212B',
        'status': 'admission',
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
        'id': 33,
        'patient_name': 'Adams, Joshua',
        'patient_id': 'PT033',
        'room_number': '213A',
        'status': 'follow-up',
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

PATIENT_DATA_FILE = 'patient_data.json'

def main():
    print("🏥 Adding 25 mock psychiatric patients to simple_backend data...")
    
    # Read existing data
    existing_data = {
        'patients': [],
        'next_id': 9,
        'last_updated': datetime.now().isoformat()
    }
    
    if os.path.exists(PATIENT_DATA_FILE):
        try:
            with open(PATIENT_DATA_FILE, 'r') as f:
                existing_data = json.load(f)
                print(f"📂 Loaded existing data with {len(existing_data.get('patients', []))} patients")
        except Exception as e:
            print(f"⚠️  Error reading existing data: {e}, using defaults")
    
    # Add new patients to existing data
    all_patients = existing_data.get('patients', [])
    
    # Add new mock patients
    for patient in MOCK_PATIENTS:
        all_patients.append(patient)
    
    # Update the data structure
    updated_data = {
        'patients': all_patients,
        'next_id': 34,  # Next available ID after our 33 patients
        'last_updated': datetime.now().isoformat()
    }
    
    # Write back to file
    try:
        with open(PATIENT_DATA_FILE, 'w') as f:
            json.dump(updated_data, f, indent=2)
        
        print(f"✅ Successfully added {len(MOCK_PATIENTS)} new patients!")
        print(f"📊 Total patients in database: {len(all_patients)}")
        print(f"💾 Data saved to {PATIENT_DATA_FILE}")
        print("\n🎯 You can now view these patients in the web app!")
        print("   Start simple_backend.py if it's not running:")
        print("   python simple_backend.py")
        
    except Exception as e:
        print(f"❌ Error saving data: {e}")

if __name__ == "__main__":
    main()