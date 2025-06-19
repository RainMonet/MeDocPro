# app/routes/ai_status.py - Enhanced AI Status Endpoint for MeDocPro
from flask import Blueprint, jsonify, current_app
from app.services.ai_processor import check_ollama_status
import logging
import requests
import os
from datetime import datetime

logger = logging.getLogger(__name__)
ai_status_bp = Blueprint('ai_status', __name__)

@ai_status_bp.route('/api/ai/status', methods=['GET'])
def get_ai_status():
    """
    Enhanced AI service status endpoint for MeDocPro
    Returns detailed information about Ollama availability and configuration
    """
    try:
        # Get configuration
        ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
        configured_model = os.getenv('OLLAMA_MODEL', 'llama3.2')
        
        # Check Ollama status
        status_info = check_ollama_status()
        
        # Enhanced status response
        response_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'ollama',
            'url': ollama_url,
            'configured_model': configured_model,
            'status': status_info.get('status', 'unknown'),
            'available': status_info.get('status') == 'available',
            'models': status_info.get('models', []),
            'model_exists': configured_model in status_info.get('models', []),
            'recommendations': []
        }
        
        # Add specific recommendations based on status
        if status_info.get('status') == 'unavailable':
            response_data['recommendations'].extend([
                'Start Ollama service: ollama serve',
                'Verify Ollama is running on port 11434',
                'Check if Ollama is installed properly'
            ])
        elif status_info.get('status') == 'available':
            if not response_data['model_exists']:
                available_models = status_info.get('models', [])
                if available_models:
                    # Suggest using an available model
                    medical_suitable = [m for m in available_models if any(x in m.lower() for x in ['llama', 'mistral', 'phi', 'gemma'])]
                    if medical_suitable:
                        response_data['recommendations'].append(f'Consider using available model: {medical_suitable[0]}')
                    else:
                        response_data['recommendations'].append(f'Available model found: {available_models[0]}')
                else:
                    response_data['recommendations'].append('No models installed - install a model first')
                
                response_data['recommendations'].extend([
                    f'Install configured model: ollama pull {configured_model}',
                    'Or update OLLAMA_MODEL in .env to use an available model'
                ])
            else:
                response_data['recommendations'].append('AI service ready for medical documentation')
        
        # Test basic functionality if available
        if response_data['available'] and response_data['model_exists']:
            test_result = test_ollama_generation(ollama_url, configured_model)
            response_data['test_generation'] = test_result
            
            if not test_result.get('success'):
                response_data['recommendations'].append('Model loaded but generation test failed')
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error checking AI status: {str(e)}")
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

def test_ollama_generation(ollama_url: str, model: str) -> dict:
    """
    Test Ollama generation with a simple medical prompt
    """
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

@ai_status_bp.route('/api/ai/models', methods=['GET'])
def get_available_models():
    """
    Get list of available Ollama models with medical suitability ratings
    """
    try:
        ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
        
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