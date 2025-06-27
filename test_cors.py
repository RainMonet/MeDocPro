#!/usr/bin/env python3
"""Test CORS configuration"""

from app import create_app

app = create_app()

with app.test_client() as client:
    # Test OPTIONS request with CORS headers
    response = client.options('/api/templates', 
                            headers={
                                'Origin': 'http://localhost:5174',
                                'Access-Control-Request-Method': 'GET'
                            })
    
    print(f"Status Code: {response.status_code}")
    print("Response Headers:")
    for header, value in response.headers:
        if 'cors' in header.lower() or 'origin' in header.lower():
            print(f"  {header}: {value}")
    
    # Test actual GET request
    get_response = client.get('/api/templates',
                             headers={'Origin': 'http://localhost:5174'})
    
    print(f"\nGET Request Status: {get_response.status_code}")
    print("GET Response Headers:")
    for header, value in get_response.headers:
        if 'cors' in header.lower() or 'origin' in header.lower():
            print(f"  {header}: {value}")