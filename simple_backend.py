#!/usr/bin/env python3
"""Simple backend with working CORS"""

from flask import Flask, request, jsonify

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-key'

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
    
    return {
        'success': True,
        'census': {
            'id': 1,
            'census_date': '2025-06-27',
            'current_census_count': 4,
            'admission_count': 2,
            'discharge_count': 1,
            'is_active': True,
            'is_finalized': False,
            'rows': [
                {
                    'id': 1,
                    'patient_name': 'Smith, John',
                    'patient_id': 'PT001',
                    'room_number': '101',
                    'status': 'active',
                    'data_fields': {'chief_complaint': 'Anxiety', 'assessment': 'GAD'}
                },
                {
                    'id': 2,
                    'patient_name': 'Jones, Mary',
                    'patient_id': 'PT002', 
                    'room_number': '102',
                    'status': 'active',
                    'data_fields': {'chief_complaint': 'Depression', 'assessment': 'MDD'}
                },
                {
                    'id': 3,
                    'patient_name': 'Brown, David',
                    'patient_id': 'PT003',
                    'room_number': '103', 
                    'status': 'active',
                    'data_fields': {'chief_complaint': 'Bipolar', 'assessment': 'Bipolar I'}
                },
                {
                    'id': 4,
                    'patient_name': 'Wilson, Sarah',
                    'patient_id': 'PT004',
                    'room_number': '104',
                    'status': 'active',
                    'data_fields': {'chief_complaint': 'PTSD', 'assessment': 'PTSD'}
                }
            ]
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
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    return {
        'success': True,
        'row': {
            'id': 5,
            'patient_name': data.get('patient_name', 'New Patient'),
            'patient_id': data.get('patient_id', 'PT005'),
            'room_number': data.get('room_number', '105'),
            'status': data.get('status', 'active'),
            'data_fields': data.get('data_fields', {})
        }
    }

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