#!/usr/bin/env python3
"""Simple backend with working CORS and file persistence"""

from flask import Flask, request, jsonify
import time
import json
import os
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-key'

# File persistence
PATIENT_DATA_FILE = 'patient_data.json'

def save_patient_data():
    """Save patient data to file"""
    try:
        with open(PATIENT_DATA_FILE, 'w') as f:
            json.dump({
                'patients': patient_storage,
                'next_id': next_patient_id,
                'last_updated': datetime.now().isoformat()
            }, f, indent=2)
    except Exception as e:
        print(f"Error saving patient data: {e}")

def load_patient_data():
    """Load patient data from file"""
    global patient_storage, next_patient_id
    
    if os.path.exists(PATIENT_DATA_FILE):
        try:
            with open(PATIENT_DATA_FILE, 'r') as f:
                data = json.load(f)
                patient_storage = data.get('patients', [])
                next_patient_id = data.get('next_id', 5)
                print(f"Loaded {len(patient_storage)} patients from file")
                return
        except Exception as e:
            print(f"Error loading patient data: {e}")
    
    print("Using default patient data")

# In-memory storage for patients with comprehensive mock data
patient_storage = [
    {
        'id': 1,
        'patient_name': 'Smith, John',
        'patient_id': 'PT001',
        'room_number': '101A',
        'status': 'follow-up',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'Generalized anxiety with panic episodes',
            'observation': 'alert and cooperative, well-groomed, appropriate affect',
            'compliance': 'compliant with prescribed medications',
            'side_effects': 'minimal side effects reported',
            'mood': 'anxious but stable',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'perceptual_disturbances': 'no hallucinations or delusions reported',
            'sleep': 'improved with medication, 6-7 hours nightly',
            'energy': 'moderate energy levels, some fatigue in afternoons',
            'assessment': 'Generalized Anxiety Disorder, stable on current regimen. Continue sertraline 50mg daily and cognitive behavioral therapy.'
        }
    },
    {
        'id': 2,
        'patient_name': 'Jones, Mary',
        'patient_id': 'PT002', 
        'room_number': '102B',
        'status': 'admission',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'Major depressive episode with anhedonia',
            'observation': 'appears depressed, minimal eye contact, psychomotor retardation noted',
            'compliance': 'new admission, medication naive',
            'side_effects': 'none reported at this time',
            'mood': 'depressed, hopeless',
            'SI': 'passive suicidal ideation without plan',
            'HI': 'denies homicidal ideation',
            'perceptual_disturbances': 'no psychotic features present',
            'sleep': 'early morning awakening, fragmented sleep',
            'energy': 'severely decreased energy and motivation',
            'assessment': 'Major Depressive Disorder, severe episode. Initiate escitalopram 10mg daily. Safety monitoring for suicidal ideation. Individual therapy recommended.'
        }
    },
    {
        'id': 3,
        'patient_name': 'Brown, David',
        'patient_id': 'PT003',
        'room_number': '103A', 
        'status': 'discharge',
        'workflow_type': 'discharge',
        'data_fields': {
            'chief_complaint': 'Manic episode with psychotic features',
            'observation': 'more organized than on admission, mood stabilized',
            'compliance': 'good compliance with mood stabilizers during hospitalization',
            'side_effects': 'mild sedation from quetiapine, tolerable',
            'mood': 'euthymic, no longer manic',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'perceptual_disturbances': 'resolution of auditory hallucinations',
            'sleep': 'normalized sleep pattern, 7-8 hours nightly',
            'energy': 'appropriate energy levels',
            'assessment': 'Bipolar I Disorder, most recent episode manic with psychotic features, now stable. Discharge on lithium 900mg daily, quetiapine 200mg nightly. Follow-up in outpatient clinic in 1 week.'
        }
    },
    {
        'id': 4,
        'patient_name': 'Wilson, Sarah',
        'patient_id': 'PT004',
        'room_number': '104B',
        'status': 'follow-up',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'PTSD with nightmares and hypervigilance',
            'observation': 'guarded but engaged, hypervigilant posture',
            'compliance': 'intermittent compliance with prazosin',
            'side_effects': 'reports dizziness from prazosin when taken regularly',
            'mood': 'anxious with irritable periods',
            'SI': 'denies current suicidal ideation',
            'HI': 'denies homicidal ideation',
            'perceptual_disturbances': 'no hallucinations, occasional flashbacks',
            'sleep': 'nightmares 2-3 times weekly, difficulty falling asleep',
            'energy': 'variable, hypervigilance causes fatigue',
            'assessment': 'PTSD, chronic. Adjust prazosin dosing schedule to minimize side effects. Continue trauma-focused therapy. Consider EMDR referral.'
        }
    },
    {
        'id': 5,
        'patient_name': 'Garcia, Maria',
        'patient_id': 'PT005',
        'room_number': '105A',
        'status': 'admission',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'First episode psychosis with paranoid delusions',
            'observation': 'suspicious, guarded, internally preoccupied',
            'compliance': 'antipsychotic naive, family reports good prior functioning',
            'side_effects': 'none at baseline',
            'mood': 'anxious, paranoid',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation but reports feeling threatened',
            'perceptual_disturbances': 'auditory hallucinations, paranoid delusions',
            'sleep': 'insomnia, reports feeling watched',
            'energy': 'agitated, restless',
            'assessment': 'First episode psychosis, rule out schizophreniform disorder. Initiate risperidone 1mg BID. Family education and support services. Close monitoring for treatment response.'
        }
    },
    {
        'id': 6,
        'patient_name': 'Thompson, Robert',
        'patient_id': 'PT006',
        'room_number': '106B',
        'status': 'follow-up',
        'workflow_type': 'follow-up',
        'data_fields': {
            'chief_complaint': 'Alcohol use disorder in early recovery',
            'observation': 'alert, well-kempt, motivated for treatment',
            'compliance': 'excellent compliance with naltrexone',
            'side_effects': 'mild nausea initially, now resolved',
            'mood': 'stable, optimistic about recovery',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'perceptual_disturbances': 'no perceptual abnormalities',
            'sleep': 'sleep pattern normalizing, 6-7 hours nightly',
            'energy': 'good energy, engaging in activities',
            'assessment': 'Alcohol Use Disorder, moderate, in early remission. Continue naltrexone 50mg daily. Attending AA meetings regularly. Vocational rehabilitation services initiated.'
        }
    },
    {
        'id': 7,
        'patient_name': 'Lee, Jennifer',
        'patient_id': 'PT007',
        'room_number': '107A',
        'status': 'discharge',
        'workflow_type': 'discharge',
        'data_fields': {
            'chief_complaint': 'Eating disorder with purging behaviors',
            'observation': 'improved weight, less preoccupied with food',
            'compliance': 'good compliance with meal plan and medications',
            'side_effects': 'no significant side effects from fluoxetine',
            'mood': 'improved mood, less anxious about eating',
            'SI': 'denies suicidal ideation',
            'HI': 'denies homicidal ideation',
            'perceptual_disturbances': 'some body dysmorphia persists but improved',
            'sleep': 'regular sleep schedule established',
            'energy': 'appropriate energy levels with improved nutrition',
            'assessment': 'Bulimia Nervosa, in partial remission. Discharge to intensive outpatient program. Continue fluoxetine 40mg daily. Weekly therapy sessions scheduled.'
        }
    },
    {
        'id': 8,
        'patient_name': 'Johnson, Michael',
        'patient_id': 'PT008',
        'room_number': '108B',
        'status': 'admission',
        'workflow_type': 'admission',
        'data_fields': {
            'chief_complaint': 'Catatonic features with mood disorder',
            'observation': 'catatonic posturing, minimal responsiveness',
            'compliance': 'unable to assess due to catatonic state',
            'side_effects': 'monitoring for medication effects',
            'mood': 'cannot assess verbally, appears withdrawn',
            'SI': 'unable to assess due to mutism',
            'HI': 'unable to assess due to mutism',
            'perceptual_disturbances': 'unknown due to limited responsiveness',
            'sleep': 'irregular sleep-wake cycle',
            'energy': 'psychomotor abnormalities present',
            'assessment': 'Catatonia associated with mood disorder. Trial of lorazepam initiated. Consider ECT if no response. Medical workup to rule out organic causes completed.'
        }
    }
]

next_patient_id = 9

@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        response = jsonify()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = '*'
        response.headers['Access-Control-Allow-Methods'] = '*'
        return response

@app.after_request  
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

@app.route('/health')
def health():
    return {'status': 'healthy', 'service': 'medocpro-api'}

@app.route('/auth/login', methods=['POST', 'OPTIONS'])  
def login():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.get_json() or {}
    if data.get('username') == 'admin' and data.get('password') == 'ChangeMe123!':
        return {
            'message': 'Login successful', 
            'access_token': 'dev-token', 
            'user': {
                'id': '1',
                'username': 'admin', 
                'email': 'admin@medocpro.com',
                'role': 'administrator',
                'first_name': 'Admin',
                'last_name': 'User'
            }
        }
    return {'error': 'Invalid credentials'}, 401

@app.route('/api/templates', methods=['GET', 'OPTIONS'])
def templates():
    if request.method == 'OPTIONS':
        return '', 200
        
    return {
        'templates': [
            {
                'id': 1, 
                'name': 'Psychiatric Progress Note', 
                'category': 'progress',
                'content_preview': 'PROGRESS NOTE\n\nDate: {{date_of_service}}\nPatient: {{patient_name}}...',
                'created_at': '2024-01-01T00:00:00Z',
                'is_active': True
            },
            {
                'id': 2, 
                'name': 'Mental Status Examination', 
                'category': 'assessment',
                'content_preview': 'MENTAL STATUS EXAMINATION\n\nDate: {{date_of_service}}...',
                'created_at': '2024-01-01T00:00:00Z',
                'is_active': True
            }
        ], 
        'count': 2
    }

@app.route('/api/templates/categories', methods=['GET', 'OPTIONS'])  
def categories():
    if request.method == 'OPTIONS':
        return '', 200
        
    return {
        'categories': {
            'progress': {'name': 'Progress Notes', 'color': '#10b981', 'icon': 'file-text'},
            'assessment': {'name': 'Psychiatric Assessment', 'color': '#0066cc', 'icon': 'clipboard'},
            'treatment': {'name': 'Treatment Plans', 'color': '#8b5cf6', 'icon': 'target'}
        }
    }

@app.route('/api/templates/top-used', methods=['GET', 'OPTIONS'])
def top_used_templates():
    if request.method == 'OPTIONS':
        return '', 200
    
    # Simulate user-specific template usage data
    # In a real system, this would query the database for the current user's template usage
    user_templates = [
        {
            'id': 1,
            'name': 'Psychiatric Progress Note',
            'category': 'progress',
            'usage_count': 47,
            'last_used': '2024-07-07T14:30:00Z',
            'created_by': 'Dr. Jane Smith'
        },
        {
            'id': 2,
            'name': 'Medication Review',
            'category': 'assessment',
            'usage_count': 34,
            'last_used': '2024-07-07T11:15:00Z',
            'created_by': 'Dr. Jane Smith'
        },
        {
            'id': 3,
            'name': 'Individual Therapy Session',
            'category': 'progress',
            'usage_count': 29,
            'last_used': '2024-07-06T16:45:00Z',
            'created_by': 'Dr. Jane Smith'
        },
        {
            'id': 4,
            'name': 'Crisis Intervention Note',
            'category': 'assessment',
            'usage_count': 18,
            'last_used': '2024-07-05T09:20:00Z',
            'created_by': 'Dr. Jane Smith'
        }
    ]
    
    return {
        'success': True,
        'templates': user_templates,
        'total_templates': len(user_templates)
    }

# Patient Census endpoints for testing
@app.route('/api/patient-census/today', methods=['GET', 'OPTIONS'])
def get_today_census():
    if request.method == 'OPTIONS':
        return '', 200
    
    active_patients = [p for p in patient_storage if p['status'] != 'discharged']
    
    return {
        'success': True,
        'census': {
            'id': 1,
            'census_date': '2025-06-27',
            'current_census_count': len(active_patients),
            'admission_count': 2,
            'discharge_count': 1,
            'is_active': True,
            'is_finalized': False,
            'rows': active_patients
        }
    }

@app.route('/api/patient-census/history', methods=['GET', 'OPTIONS'])
def get_census_history():
    if request.method == 'OPTIONS':
        return '', 200
    
    return {
        'success': True,
        'census_history': [
            {'census_date': '2025-06-21', 'census_count': 3, 'admission_count': 1, 'discharge_count': 0},
            {'census_date': '2025-06-22', 'census_count': 4, 'admission_count': 2, 'discharge_count': 1},
            {'census_date': '2025-06-23', 'census_count': 3, 'admission_count': 0, 'discharge_count': 1},
            {'census_date': '2025-06-24', 'census_count': 5, 'admission_count': 3, 'discharge_count': 1},
            {'census_date': '2025-06-25', 'census_count': 4, 'admission_count': 1, 'discharge_count': 2},
            {'census_date': '2025-06-26', 'census_count': 3, 'admission_count': 0, 'discharge_count': 1},
            {'census_date': '2025-06-27', 'census_count': 4, 'admission_count': 2, 'discharge_count': 1}
        ]
    }

@app.route('/api/patient-census/<int:census_id>/rows', methods=['POST', 'OPTIONS'])
def add_patient_row(census_id):
    global next_patient_id
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    
    # Create new patient
    workflow_type = data.get('workflow_type', data.get('status', 'follow-up'))
    new_patient = {
        'id': next_patient_id,
        'patient_name': data.get('patient_name', 'New Patient'),
        'patient_id': data.get('patient_id', f'PT{next_patient_id:03d}'),
        'room_number': data.get('room_number', ''),
        'status': workflow_type,
        'workflow_type': workflow_type,
        'data_fields': data.get('data_fields', {})
    }
    
    # Add to storage
    patient_storage.append(new_patient)
    next_patient_id += 1
    
    # Save to file
    save_patient_data()
    
    print(f"Added patient: {new_patient['patient_name']} (ID: {new_patient['id']})")
    
    return {
        'success': True,
        'row': new_patient
    }

@app.route('/api/patient-census/rows/<int:row_id>', methods=['PUT', 'OPTIONS'])
def update_patient_row(row_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    
    # Find and update patient
    for i, patient in enumerate(patient_storage):
        if patient['id'] == row_id:
            # Update the patient data
            patient_storage[i].update(data)
            
            # Ensure workflow_type is synced with status for compatibility
            if 'workflow_type' in data:
                patient_storage[i]['status'] = data['workflow_type']
            elif 'status' in data:
                patient_storage[i]['workflow_type'] = data['status']
            
            print(f"Updated patient ID {row_id}: {data}")
            print(f"Patient now: {patient_storage[i]}")
            
            # Save to file
            save_patient_data()
            
            return {
                'success': True,
                'row': patient_storage[i]
            }
    
    return {'success': False, 'error': 'Patient not found'}, 404

@app.route('/api/patient-census/rows/<int:row_id>', methods=['DELETE', 'OPTIONS'])
def delete_patient_row(row_id):
    global patient_storage
    if request.method == 'OPTIONS':
        return '', 200
    
    # Find and remove patient
    global patient_storage
    patient_storage = [p for p in patient_storage if p['id'] != row_id]
    print(f"Deleted patient ID {row_id}")
    
    # Save to file
    save_patient_data()
    
    return {'success': True}

@app.route('/api/scratch-notes', methods=['GET', 'OPTIONS'])
def get_scratch_notes():
    if request.method == 'OPTIONS':
        return '', 200
    
    return {
        'success': True,
        'scratch_notes': []
    }

# Daily information entry endpoints
@app.route('/api/daily-info', methods=['POST', 'OPTIONS'])
def save_daily_info():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    patient_id = data.get('patient_id')
    field_values = data.get('field_values', {})
    
    # Find and update patient data
    for patient in patient_storage:
        if patient['id'] == patient_id:
            patient['data_fields'].update(field_values)
            break
    
    save_patient_data()
    
    return {
        'success': True,
        'message': 'Daily information saved successfully'
    }

@app.route('/api/daily-info/<int:patient_id>', methods=['GET', 'OPTIONS'])
def get_daily_info(patient_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    for patient in patient_storage:
        if patient['id'] == patient_id:
            return {
                'success': True,
                'data_fields': patient.get('data_fields', {})
            }
    
    return {'success': False, 'error': 'Patient not found'}, 404

# Document generation endpoints
def populate_template(template, patient_data):
    """Populate template with patient data and daily info"""
    template_name = template.get('name', '').lower()
    patient_name = patient_data.get('patient_name', 'Unknown Patient')
    data_fields = patient_data.get('data_fields', {})
    
    # Current date
    current_date = datetime.now().strftime('%B %d, %Y')
    
    # Base template content based on template type
    if 'progress' in template_name:
        content = f"""PROGRESS NOTE

Date: {current_date}
Patient: {patient_name}
Room: {patient_data.get('room_number', 'N/A')}
Workflow Type: {patient_data.get('workflow_type', 'follow-up').title()}

SUBJECTIVE:
{data_fields.get('subjective', 'Patient reports no acute concerns. Mood and energy levels stable.')}

OBJECTIVE:
{data_fields.get('objective', 'Patient appears alert and oriented. Cooperative with interview. Speech normal rate and rhythm.')}

ASSESSMENT:
{data_fields.get('assessment', data_fields.get('primary_diagnosis', 'Continued psychiatric care as indicated.'))}

PLAN:
{data_fields.get('plan', 'Continue current treatment plan. Follow-up as scheduled.')}

ADDITIONAL NOTES:
{data_fields.get('additional_notes', 'No additional notes at this time.')}

Provider: Dr. Jane Smith, MD
Date: {current_date}
"""
    
    elif 'assessment' in template_name:
        content = f"""PSYCHIATRIC ASSESSMENT

Date: {current_date}
Patient: {patient_name}
Room: {patient_data.get('room_number', 'N/A')}

CHIEF COMPLAINT:
{data_fields.get('chief_complaint', 'Routine psychiatric evaluation')}

HISTORY OF PRESENT ILLNESS:
{data_fields.get('history_present_illness', 'Patient presents for routine psychiatric evaluation.')}

MENTAL STATUS EXAMINATION:
{data_fields.get('mental_status', 'Alert and oriented x3. Cooperative with interview. No acute distress.')}

ASSESSMENT:
{data_fields.get('assessment', data_fields.get('primary_diagnosis', 'Psychiatric condition stable'))}

TREATMENT PLAN:
{data_fields.get('treatment_plan', 'Continue current treatment approach with regular monitoring.')}

Provider: Dr. Jane Smith, MD
Date: {current_date}
"""
    
    elif 'treatment' in template_name:
        newline = '\n'
        default_goals = f'1. Maintain psychiatric stability{newline}2. Improve functional capacity{newline}3. Prevent relapse'
        content = f"""TREATMENT PLAN

Date: {current_date}
Patient: {patient_name}
Room: {patient_data.get('room_number', 'N/A')}

PRIMARY DIAGNOSIS:
{data_fields.get('primary_diagnosis', 'Psychiatric condition requiring ongoing treatment')}

TREATMENT GOALS:
{data_fields.get('treatment_goals', default_goals)}

INTERVENTIONS:
{data_fields.get('interventions', 'Individual therapy sessions, medication management, group therapy as appropriate')}

MEDICATIONS:
{data_fields.get('medications', 'Continue current psychiatric medications as prescribed')}

FOLLOW-UP:
{data_fields.get('follow_up', 'Follow-up appointment scheduled as appropriate')}

Provider: Dr. Jane Smith, MD
Date: {current_date}
"""
    
    elif 'discharge' in template_name:
        content = f"""DISCHARGE SUMMARY

Date: {current_date}
Patient: {patient_name}
Room: {patient_data.get('room_number', 'N/A')}

ADMISSION DATE: {data_fields.get('admission_date', 'N/A')}
DISCHARGE DATE: {current_date}

REASON FOR ADMISSION:
{data_fields.get('admission_reason', 'Psychiatric evaluation and treatment')}

HOSPITAL COURSE:
{data_fields.get('hospital_course', 'Patient responded well to treatment during hospitalization.')}

DISCHARGE DIAGNOSIS:
{data_fields.get('discharge_diagnosis', data_fields.get('primary_diagnosis', 'Psychiatric condition, stable'))}

DISCHARGE MEDICATIONS:
{data_fields.get('discharge_medications', 'Continue current psychiatric medications')}

DISCHARGE INSTRUCTIONS:
{data_fields.get('discharge_instructions', 'Follow-up with outpatient psychiatrist. Continue medications as prescribed.')}

Provider: Dr. Jane Smith, MD
Date: {current_date}
"""
    
    else:
        # Generic template
        content = f"""CLINICAL DOCUMENT

Date: {current_date}
Patient: {patient_name}
Template: {template.get('name', 'Clinical Note')}

CLINICAL INFORMATION:
{data_fields.get('clinical_info', 'Clinical information as documented')}

ASSESSMENT:
{data_fields.get('assessment', 'Clinical assessment as indicated')}

PLAN:
{data_fields.get('plan', 'Continue clinical care as appropriate')}

Provider: Dr. Jane Smith, MD
Date: {current_date}
"""
    
    return content

@app.route('/api/generate-documents', methods=['POST', 'OPTIONS'])
def generate_documents():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    template = data.get('template')
    patients = data.get('patients', [])
    export_format = data.get('exportFormat', 'pdf')
    ai_enhancement = data.get('aiEnhancement', False)
    
    # Generate documents with template population
    generated_docs = []
    for patient in patients:
        # Find the full patient data including daily info
        patient_data = None
        for stored_patient in patient_storage:
            if stored_patient['id'] == patient['id']:
                patient_data = stored_patient
                break
        
        if not patient_data:
            # Fallback if patient not found in storage
            patient_data = patient
        
        # Create template content based on template type
        template_content = populate_template(template, patient_data)
        
        doc = {
            'patient_id': patient['id'],
            'patient_name': patient['patient_name'],
            'template_name': template['name'],
            'content': template_content,
            'format': export_format,
            'ai_enhanced': ai_enhancement,
            'generated_at': datetime.now().isoformat()
        }
        generated_docs.append(doc)
    
    # Simulate processing time
    time.sleep(1)
    
    return {
        'success': True,
        'documents': generated_docs,
        'batch_id': f"batch_{int(time.time())}",
        'total_count': len(generated_docs)
    }

if __name__ == '__main__':
    print('Starting simple backend with CORS on port 5000...')
    # Load existing patient data
    load_patient_data()
    app.run(host='0.0.0.0', port=5000, debug=True)