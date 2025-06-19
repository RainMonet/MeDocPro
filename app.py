# app.py - Fixed MeDocPro Flask Application with Database Integration
from flask import Flask, jsonify
from flask_cors import CORS
import logging
import os
import requests
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative React dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ])
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-me')
    app.config['OLLAMA_URL'] = os.getenv('OLLAMA_URL', 'http://localhost:11434')
    app.config['OLLAMA_MODEL'] = os.getenv('OLLAMA_MODEL', 'llama3.2')
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///medocpro.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize database with the app
    from app import db
    db.init_app(app)
    
    # Register blueprints
    from app.routes.documents import documents_bp
    app.register_blueprint(documents_bp)
    
    # Create tables and sample data within app context
    with app.app_context():
        try:
            db.create_all()
            # Import and call the sample data creation function
            from app import create_sample_data
            create_sample_data()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization failed: {str(e)}")
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint for monitoring"""
        try:
            # Test database connectivity
            with app.app_context():
                result = db.session.execute(db.text('SELECT 1')).scalar()
                db_status = 'connected' if result == 1 else 'disconnected'
            
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'MeDocPro Backend',
                'version': '1.0.0',
                'database': db_status,
                'ai_configured': bool(app.config.get('OLLAMA_URL')),
                'ai_model': app.config.get('OLLAMA_MODEL')
            })
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return jsonify({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500
    
    # AI Status endpoint
    @app.route('/api/ai/status', methods=['GET'])
    def ai_status():
        """Check AI service status"""
        try:
            # Get configuration from app config
            ollama_url = app.config.get('OLLAMA_URL', 'http://localhost:11434')
            configured_model = app.config.get('OLLAMA_MODEL', 'llama3.2')
            
            logger.info(f"Checking AI status - URL: {ollama_url}, Model: {configured_model}")
            
            # Check if Ollama is running
            try:
                response = requests.get(f'{ollama_url}/api/tags', timeout=5)
                response.raise_for_status()
                
                models_data = response.json()
                models = [model.get('name', '').split(':')[0] for model in models_data.get('models', [])]
                
                # Check if configured model exists (remove version tag if present)
                configured_model_base = configured_model.split(':')[0]
                model_exists = configured_model_base in models
                
                recommendations = []
                if model_exists:
                    recommendations.append('AI service ready for medical documentation')
                else:
                    recommendations.extend([
                        f'Install configured model: ollama pull {configured_model}',
                        'Available models: ' + ', '.join(models) if models else 'No models installed'
                    ])
                
                return jsonify({
                    'timestamp': datetime.utcnow().isoformat(),
                    'service': 'ollama',
                    'url': ollama_url,
                    'configured_model': configured_model,
                    'status': 'available',
                    'available': True,
                    'models': models,
                    'model_exists': model_exists,
                    'recommendations': recommendations
                })
                
            except requests.exceptions.ConnectionError:
                logger.warning(f"Ollama connection failed at {ollama_url}")
                return jsonify({
                    'timestamp': datetime.utcnow().isoformat(),
                    'service': 'ollama',
                    'url': ollama_url,
                    'configured_model': configured_model,
                    'status': 'unavailable',
                    'available': False,
                    'models': [],
                    'model_exists': False,
                    'error': 'Connection refused',
                    'recommendations': [
                        'Start Ollama service: ollama serve',
                        'Verify Ollama is running on port 11434',
                        'Check if Ollama is installed properly'
                    ]
                })
                
            except requests.exceptions.Timeout:
                logger.warning(f"Ollama timeout at {ollama_url}")
                return jsonify({
                    'timestamp': datetime.utcnow().isoformat(),
                    'service': 'ollama',
                    'url': ollama_url,
                    'configured_model': configured_model,
                    'status': 'timeout',
                    'available': False,
                    'models': [],
                    'model_exists': False,
                    'error': 'Request timeout',
                    'recommendations': [
                        'Ollama may be starting up - wait a moment and try again',
                        'Check Ollama service status'
                    ]
                })
                
            except Exception as api_error:
                logger.error(f"Ollama API error: {str(api_error)}")
                return jsonify({
                    'timestamp': datetime.utcnow().isoformat(),
                    'service': 'ollama',
                    'url': ollama_url,
                    'configured_model': configured_model,
                    'status': 'error',
                    'available': False,
                    'models': [],
                    'model_exists': False,
                    'error': str(api_error),
                    'recommendations': [
                        'Check Ollama API response format',
                        'Verify Ollama version compatibility'
                    ]
                })
                
        except Exception as e:
            logger.error(f"AI status check failed: {str(e)}")
            return jsonify({
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'ollama',
                'status': 'error',
                'available': False,
                'error': str(e),
                'recommendations': [
                    'Check application configuration',
                    'Verify environment variables'
                ]
            }), 500
    
    logger.info("MeDocPro Flask application created successfully")
    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    # Development server
    logger.info("Starting MeDocPro development server...")
    logger.info(f"OLLAMA_URL: {app.config.get('OLLAMA_URL')}")
    logger.info(f"OLLAMA_MODEL: {app.config.get('OLLAMA_MODEL')}")
    logger.info(f"DATABASE_URI: {app.config.get('SQLALCHEMY_DATABASE_URI')}")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=True
    )