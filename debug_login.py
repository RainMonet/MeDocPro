#!/usr/bin/env python3
"""Debug login with detailed output"""

from app import create_app
from app.models.user import User
from app.extensions import db
from flask import json

app = create_app()

with app.app_context():
    # Test the exact same flow as the login route
    data = {'username': 'admin', 'password': 'ChangeMe123!'}
    
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')
    
    print(f"Input username: '{username}'")
    print(f"Input password: '{password}'")
    print(f"Password length: {len(password)}")
    print(f"Password repr: {repr(password)}")
    
    # Find user
    user = User.query.filter(
        (db.func.lower(User.username) == username) | (db.func.lower(User.email) == username),
        User.is_deleted == False
    ).first()
    
    print(f"User found: {user}")
    
    if user:
        print(f"User active: {user.is_active}")
        print(f"User locked: {user.is_locked()}")
        
        # Test password with different approaches
        result1 = user.check_password(password)
        print(f"check_password result: {result1}")
        
        # Test with hardcoded password
        result2 = user.check_password('ChangeMe123!')
        print(f"hardcoded password result: {result2}")
        
        # Check if passwords are exactly the same
        print(f"Passwords equal: {password == 'ChangeMe123!'}")
        print(f"Password bytes: {[ord(c) for c in password]}")
        print(f"Expected bytes: {[ord(c) for c in 'ChangeMe123!']}")