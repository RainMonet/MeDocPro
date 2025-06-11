# app/__init__.py

from flask import Flask
from flask_cors import CORS
from config import Config
from .extensions import db, migrate, jwt

def create_app(config_class=Config):
    """The application factory."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Flask extensions here
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Enable CORS for all domains and routes
    CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"])

    # Register blueprints here
    # Use a with block to ensure app context is available for blueprint registration
    with app.app_context():
        # Health endpoints (no prefix for easy access)
        from .routes.health import health_bp
        app.register_blueprint(health_bp)
        
        # Auth endpoints
        from .routes.auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/auth')
        
        # Template endpoints
        from .routes.templates import templates_bp
        app.register_blueprint(templates_bp, url_prefix='/api')

        # Import models here to ensure they are registered with SQLAlchemy
        from . import models

    return app