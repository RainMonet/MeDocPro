# app.py - Fixed MeDocPro Flask Application with AI Integration
from flask import Flask, jsonify
from flask_cors import CORS
from app.routes.documents import documents_bp
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
    
    # Register blueprints
    app.register_blueprint(documents_bp)
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint for monitoring"""
        try:
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'MeDocPro Backend',
                'version': '1.0.0',
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
            # Get configuration
            ollama_url = app.config.get('OLLAMA_URL', 'http://localhost:11434')
            configured_model = app.config.get('OLLAMA_MODEL', 'llama3.2')
            
            # Check if Ollama is running
            try:
                response = requests.get(f'{ollama_url}/api/tags', timeout=5)
                response.raise_for_status()
                
                models_data = response.json()
                models = [model.get('name', '') for model in models_data.get('models', [])]
                
                return jsonify({
                    'timestamp': datetime.utcnow().isoformat(),
                    'service': 'ollama',
                    'url': ollama_url,
                    'configured_model': configured_model,
                    'status': 'available',
                    'available': True,
                    'models': models,
                    'model_exists': configured_model in models,
                    'recommendations': [
                        'AI service ready for medical documentation' if configured_model in models 
                        else f'Install model: ollama pull {configured_model}'
                    ]
                })
                
            except requests.exceptions.ConnectionError:
                return jsonify({
                    'timestamp': datetime.utcnow().isoformat(),
                    'service': 'ollama',
                    'url': ollama_url,
                    'configured_model': configured_model,
                    'status': 'unavailable',
                    'available': False,
                    'models': [],
                    'model_exists': False,
                    'recommendations': [
                        'Start Ollama service: ollama serve',
                        'Verify Ollama is running on port 11434',
                        'Check if Ollama is installed properly'
                    ]
                })
                
        except Exception as e:
            return jsonify({
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'ollama',
                'status': 'error',
                'available': False,
                'error': str(e),
                'recommendations': [
                    'Check Ollama installation',
                    'Verify service is running',
                    'Check backend logs for details'
                ]
            }), 500
    
    # AI Models endpoint
    @app.route('/api/ai/models', methods=['GET'])
    def ai_models():
        """Get available AI models"""
        try:
            ollama_url = app.config.get('OLLAMA_URL', 'http://localhost:11434')
            
            response = requests.get(f"{ollama_url}/api/tags", timeout=10)
            response.raise_for_status()
            
            models_data = response.json()
            models = models_data.get('models', [])
            
            # Rate models for medical documentation suitability
            medical_suitable_keywords = ['llama', 'mistral', 'phi', 'gemma', 'medical', 'clinical']
            
            enhanced_models = []
            for model in models:
                model_name = model.get('name', '')
                size_gb = model.get('size', 0) / (1024**3) if model.get('size') else 0
                
                # Calculate suitability score
                suitability_score = 0
                for keyword in medical_suitable_keywords:
                    if keyword in model_name.lower():
                        suitability_score += 1
                
                # Prefer newer versions
                if any(ver in model_name for ver in ['3.2', '3.1', '2.1', '2.0']):
                    suitability_score += 1
                
                enhanced_models.append({
                    'name': model_name,
                    'size_gb': round(size_gb, 2),
                    'suitability_score': suitability_score,
                    'recommended': suitability_score >= 2,
                    'modified': model.get('modified_at', '')
                })
            
            # Sort by suitability score (descending) then by size (ascending)
            enhanced_models.sort(key=lambda x: (-x['suitability_score'], x['size_gb']))
            
            return jsonify({
                'success': True,
                'models': enhanced_models,
                'count': len(enhanced_models),
                'recommended_models': [m for m in enhanced_models if m['recommended']]
            })
            
        except Exception as e:
            logger.error(f"Error fetching models: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e),
                'models': []
            }), 500
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not found',
            'message': 'The requested resource was not found on this server.'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {str(error)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred.'
        }), 500
    
    return app

def test_ollama_generation(ollama_url: str, model: str) -> dict:
    """Test Ollama generation with a simple medical prompt"""
    try:
        test_prompt = "Enhance this note: Patient reports mild anxiety. Make it more professional."
        
        response = requests.post(
            f"{ollama_url}/api/generate",
            json={
                "model": model,
                "prompt": test_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "max_tokens": 100
                }
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            generated_text = result.get('response', '').strip()
            
            return {
                'success': True,
                'generated_length': len(generated_text),
                'model_responding': bool(generated_text)
            }
        else:
            return {
                'success': False,
                'error': f"HTTP {response.status_code}",
                'details': response.text
            }
            
    except requests.exceptions.Timeout:
        return {
            'success': False,
            'error': 'Generation test timed out',
            'details': 'Model may be slow or unresponsive'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'details': 'Generation test failed'
        }

if __name__ == '__main__':
    # Create the Flask app
    app = create_app()
    
    # Log startup information
    logger.info("Starting MeDocPro Backend Server")
    logger.info(f"Ollama URL: {app.config.get('OLLAMA_URL')}")
    logger.info(f"Ollama Model: {app.config.get('OLLAMA_MODEL')}")
    
    # Run the development server
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        use_reloader=True
    )