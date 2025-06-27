#!/usr/bin/env python3
"""Simple backend with working CORS"""

from flask import Flask, request, jsonify
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-key'

# In-memory storage for patients (will reset when server restarts)
patient_storage = [
    {
        'id': 1,
        'patient_name': 'Smith, John',
        'patient_id': 'PT001',
        'room_number': '101',
        'status': 'follow-up',
        'workflow_type': 'follow-up',
        'data_fields': {'chief_complaint': 'Anxiety', 'assessment': 'GAD'}
    },
    {
        'id': 2,
        'patient_name': 'Jones, Mary',
        'patient_id': 'PT002', 
        'room_number': '102',
        'status': 'admission',
        'workflow_type': 'admission',
        'data_fields': {'chief_complaint': 'Depression', 'assessment': 'MDD'}
    },
    {
        'id': 3,
        'patient_name': 'Brown, David',
        'patient_id': 'PT003',
        'room_number': '103', 
        'status': 'discharge',
        'workflow_type': 'discharge',
        'data_fields': {'chief_complaint': 'Bipolar', 'assessment': 'Bipolar I'}
    },
    {
        'id': 4,
        'patient_name': 'Wilson, Sarah',
        'patient_id': 'PT004',
        'room_number': '104',
        'status': 'follow-up',
        'workflow_type': 'follow-up',
        'data_fields': {'chief_complaint': 'PTSD', 'assessment': 'PTSD'}
    }
]

next_patient_id = 5

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
    patient_storage = [p for p in patient_storage if p['id'] != row_id]
    print(f"Deleted patient ID {row_id}")
    
    return {'success': True}

@app.route('/api/scratch-notes', methods=['GET', 'OPTIONS'])
def get_scratch_notes():
    if request.method == 'OPTIONS':
        return '', 200
    
    return {
        'success': True,
        'scratch_notes': []
    }

if __name__ == '__main__':
    print('Starting simple backend with CORS on port 5001...')
    app.run(host='0.0.0.0', port=5001, debug=True)