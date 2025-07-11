#!/usr/bin/env python3
"""Simple CORS fix without Flask-CORS"""

from flask import Flask, request, jsonify
from app.routes.health import health_bp
from app.routes.auth import auth_bp
from app.routes.templates import templates_bp
from app.extensions import db, migrate, jwt
from config import Config

def create_simple_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Manual CORS handling
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = jsonify()
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add('Access-Control-Allow-Headers', "*")
            response.headers.add('Access-Control-Allow-Methods', "*")
            return response

    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    # Register blueprints
    with app.app_context():
        app.register_blueprint(health_bp)
        app.register_blueprint(auth_bp, url_prefix='/auth')
        app.register_blueprint(templates_bp, url_prefix='/api')
        
        # Import models
        from app import models
    
    return app

if __name__ == '__main__':
    app = create_simple_app()
    print("Starting MeDocPro with manual CORS on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)