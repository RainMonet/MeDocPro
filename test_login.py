#!/usr/bin/env python3
"""Test login endpoint directly"""

from app import create_app
from flask import json

app = create_app()

with app.test_client() as client:
    # Test login endpoint
    response = client.post('/auth/login', 
                          data=json.dumps({'username': 'admin', 'password': 'ChangeMe123!'}),
                          content_type='application/json')
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.get_json()}")
    print(f"Headers: {dict(response.headers)}")