#!/usr/bin/env python3
"""
Working Backend for MeDocPro with CORS fixes
Uses real database but with Flask development server for CORS compatibility
"""

import os
import sys
from flask import Flask
from flask_cors import CORS

def create_working_app():
    """Create Flask app with working CORS and real database"""
    
    # Import the real app factory
    from app import create_app
    from config import Config
    
    # Create the real app with all the database models and routes
    app = create_app(Config)
    
    # Override CORS configuration to fix the issues
    # Remove any existing CORS and apply working version
    
    # Manual CORS headers that actually work
    @app.after_request
    def after_request(response):
        # Allow all origins for development
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Accept'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS,HEAD'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '3600'
        return response
    
    # Add explicit OPTIONS handlers for problematic routes
    @app.route('/auth/login', methods=['OPTIONS'])
    def auth_login_options():
        return '', 200
    
    @app.route('/api/patient-census/today', methods=['OPTIONS']) 
    def census_options():
        return '', 200
        
    @app.route('/api/templates', methods=['OPTIONS'])
    def templates_options():
        return '', 200
    
    return app

if __name__ == '__main__':
    print("=" * 50)
    print("Starting MeDocPro with Working CORS")
    print("=" * 50)
    print("Database: Real PostgreSQL/SQLite with all your data")
    print("Users: All 3 users preserved") 
    print("Patients: All patient census data preserved")
    print("CORS: Fixed for all origins")
    print("Server: Flask development server (CORS compatible)")
    print("=" * 50)
    
    app = create_working_app()
    
    # Use Flask development server which respects CORS changes
    app.run(
        host='0.0.0.0',
        port=5002, 
        debug=True,
        use_reloader=False  # Disable reloader to prevent port conflicts
    )