#!/usr/bin/env python3
"""Quick backend with working CORS and demo login"""

from flask import Flask, request, jsonify, make_response
import json

app = Flask(__name__)

# CORS headers for all responses
@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

@app.route('/health')
def health():
    return {'status': 'healthy', 'service': 'quick-backend'}

@app.route('/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.get_json() or {}
    username = data.get('username', '')
    password = data.get('password', '')
    
    # Simple demo login
    if username == 'demo@medocpro.com' and password == 'demo123':
        return {
            'access_token': 'demo-token-12345',
            'message': 'Login successful',
            'user': {
                'id': '1',
                'username': 'demo',
                'email': 'demo@medocpro.com',
                'role': 'clinician'
            }
        }
    
    return {'error': 'Invalid credentials'}, 401

@app.route('/api/patient-census/today', methods=['GET', 'OPTIONS'])
def get_patient_census():
    if request.method == 'OPTIONS':
        return '', 200
    
    # Mock patient data with 31 patients
    patients = []
    for i in range(31):
        patients.append({
            'id': i + 1,
            'patient_name': f'Patient {i + 1}',
            'patient_id': f'PT{i + 1:03d}',
            'room_number': f'{200 + i}',
            'status': 'active'
        })
    
    return {
        'success': True,
        'census': {
            'id': 1,
            'current_census_count': 31,
            'rows': patients
        }
    }

@app.route('/api/templates', methods=['GET', 'OPTIONS'])
def get_templates():
    if request.method == 'OPTIONS':
        return '', 200
    
    return {
        'templates': [],
        'count': 0
    }

if __name__ == '__main__':
    print('Starting quick backend with CORS on port 5000...')
    app.run(host='0.0.0.0', port=5001, debug=True)