# simple_app.py - Simplified MeDocPro Flask App for Testing
from flask import Flask, jsonify
from flask_cors import CORS
import requests
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
])

# Configuration
app.config['OLLAMA_URL'] = os.getenv('OLLAMA_URL', 'http://localhost:11434')
app.config['OLLAMA_MODEL'] = os.getenv('OLLAMA_MODEL', 'llama3.2')

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'MeDocPro Backend',
        'version': '1.0.0'
    })

@app.route('/api/ai/status', methods=['GET'])
def ai_status():
    """Check AI service status - SIMPLIFIED VERSION"""
    try:
        ollama_url = app.config.get('OLLAMA_URL', 'http://localhost:11434')
        configured_model = app.config.get('OLLAMA_MODEL', 'llama3.2')
        
        logger.info(f"Checking AI status - URL: {ollama_url}")
        
        # Check if Ollama is running
        try:
            response = requests.get(f'{ollama_url}/api/tags', timeout=5)
            response.raise_for_status()
            
            models_data = response.json()
            models = [model.get('name', '').split(':')[0] for model in models_data.get('models', [])]
            
            configured_model_base = configured_model.split(':')[0]
            model_exists = configured_model_base in models
            
            return jsonify({
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'ollama',
                'url': ollama_url,
                'configured_model': configured_model,
                'status': 'available',
                'available': True,
                'models': models,
                'model_exists': model_exists,
                'recommendations': [
                    'AI service ready for medical documentation' if model_exists 
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
                    'Verify Ollama is running on port 11434'
                ]
            })
            
        except Exception as e:
            return jsonify({
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'ollama',
                'status': 'error',
                'available': False,
                'error': str(e),
                'recommendations': ['Check Ollama installation']
            })
            
    except Exception as e:
        logger.error(f"AI status check failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'available': False,
            'error': str(e)
        }), 500

# Mock data for patients endpoint
@app.route('/api/patients', methods=['GET'])
def get_patients():
    """Get mock patients data"""
    patients = [
        {
            'patient_id': 'DEMO001',
            'name': 'Sarah Johnson',
            'diagnosis': 'Major Depressive Disorder',
            'last_visit': '2024-06-15'
        },
        {
            'patient_id': 'DEMO002', 
            'name': 'Michael Chen',
            'diagnosis': 'Generalized Anxiety Disorder',
            'last_visit': '2024-06-14'
        },
        {
            'patient_id': 'DEMO003',
            'name': 'Emma Rodriguez',
            'diagnosis': 'Bipolar Disorder Type II',
            'last_visit': '2024-06-13'
        }
    ]
    
    return jsonify({
        'success': True,
        'patients': patients
    })

# Mock data for templates endpoint
@app.route('/api/templates', methods=['GET'])
def get_templates():
    """Get mock templates data"""
    templates = [
        {
            'id': 1,
            'name': 'Progress Note - Depression',
            'category': 'progress',
            'description': 'Standard progress note for depression treatment'
        },
        {
            'id': 2,
            'name': 'Initial Psychiatric Assessment',
            'category': 'assessment', 
            'description': 'Comprehensive initial psychiatric evaluation'
        },
        {
            'id': 3,
            'name': 'Treatment Plan - Anxiety',
            'category': 'treatment',
            'description': 'Treatment planning for anxiety disorders'
        },
        {
            'id': 4,
            'name': 'Mental Status Exam',
            'category': 'assessment',
            'description': 'Structured mental status examination'
        }
    ]
    
    return jsonify({
        'success': True,
        'templates': templates
    })

if __name__ == '__main__':
    logger.info("Starting simplified MeDocPro Flask app...")
    logger.info(f"OLLAMA_URL: {app.config.get('OLLAMA_URL')}")
    logger.info(f"OLLAMA_MODEL: {app.config.get('OLLAMA_MODEL')}")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )