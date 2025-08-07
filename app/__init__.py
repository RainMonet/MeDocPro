# app/__init__.py - Updated with proper blueprint registration

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
    
    # Remove Flask-CORS and use manual CORS for better control
    # CORS(app, origins="*", supports_credentials=True)
    
    # Add manual CORS headers for all responses
    @app.after_request
    def after_request(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    # Register blueprints here
    # Use a with block to ensure app context is available for blueprint registration
    with app.app_context():
        # Health endpoints (no prefix for easy access)
        from .routes.health import health_bp
        app.register_blueprint(health_bp)
        
        # Auth endpoints
        from .routes.auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/auth')
        
        # User management endpoints
        from .routes.users import users_bp
        app.register_blueprint(users_bp, url_prefix='/api/users')
        
        # Template endpoints
        from .routes.templates import templates_bp
        app.register_blueprint(templates_bp, url_prefix='/api')
        
        # Clinical workflow endpoints
        from .routes.scratch_notes import scratch_notes_bp
        app.register_blueprint(scratch_notes_bp)
        
        from .routes.patient_census import patient_census_bp
        app.register_blueprint(patient_census_bp)
        
        # Daily information endpoints
        from .routes.daily_information import daily_info_bp
        app.register_blueprint(daily_info_bp, url_prefix='/api')
        
        # Document generation endpoints
        from .routes.document_generation import document_generation_bp
        app.register_blueprint(document_generation_bp, url_prefix='/api')
        
        # AI enhancement endpoints
        from .routes.ai_enhancement import ai_bp
        app.register_blueprint(ai_bp, url_prefix='/api/ai')
        
        # AI analysis endpoints
        from .routes.ai_analysis import ai_analysis_bp
        app.register_blueprint(ai_analysis_bp)
        
        # Audit log endpoints
        from .routes.audit_logs import audit_logs_bp
        app.register_blueprint(audit_logs_bp, url_prefix='/api')
        
        # Provider absence management endpoints
        from .routes.provider_absence import provider_absence_bp
        app.register_blueprint(provider_absence_bp, url_prefix='/api')
        
        # Monitoring endpoints (disabled temporarily for database init)
        try:
            from .routes.monitoring import monitoring_bp
            app.register_blueprint(monitoring_bp)
        except ImportError as e:
            app.logger.warning(f"Monitoring endpoints disabled due to missing dependencies: {e}")

        # Import models here to ensure they are registered with SQLAlchemy
        from . import models

    return app