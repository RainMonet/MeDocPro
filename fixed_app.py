# fixed_app.py - MeDocPro with Corrected AI Status Response
from flask import Flask, jsonify, request
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
app.config['OLLAMA_MODEL'] = os.getenv('OLLAMA_MODEL', 'mistral:latest')  # Fixed: Use full model name

# Mock patient data
MOCK_PATIENTS = [
    {'id': 1, 'patient_id': 1, 'name': 'John Smith', 'age': 40, 'diagnosis': 'GAD'},
    {'id': 2, 'patient_id': 2, 'name': 'Jane Doe', 'age': 32, 'diagnosis': 'Depression'},
    {'id': 3, 'patient_id': 3, 'name': 'Bob Wilson', 'age': 26, 'diagnosis': 'PTSD'}
]

# Mock templates
MOCK_TEMPLATES = [
    {'id': 1, 'name': 'Initial Psychiatric Assessment', 'category': 'assessment'},
    {'id': 2, 'name': 'Progress Note', 'category': 'progress'},
    {'id': 3, 'name': 'Treatment Plan', 'category': 'treatment'},
    {'id': 4, 'name': 'Mental Status Exam', 'category': 'assessment'}
]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'MeDocPro Backend',
        'version': '1.0.0'
    })

@app.route('/api/patients', methods=['GET'])
def get_patients():
    """Get all patients"""
    return jsonify({
        'success': True,
        'patients': MOCK_PATIENTS
    })

@app.route('/api/templates', methods=['GET'])  
def get_templates():
    """Get all templates"""
    return jsonify({
        'success': True,
        'templates': MOCK_TEMPLATES
    })

@app.route('/api/ai/status', methods=['GET'])
def ai_status():
    """FIXED AI Status endpoint that matches frontend expectations"""
    try:
        ollama_url = app.config.get('OLLAMA_URL', 'http://localhost:11434')
        configured_model = app.config.get('OLLAMA_MODEL', 'mistral')
        
        logger.info(f"Checking AI status - URL: {ollama_url}, Model: {configured_model}")
        
        # Check if Ollama is running
        try:
            response = requests.get(f'{ollama_url}/api/tags', timeout=5)
            response.raise_for_status()
            
            models_data = response.json()
            model_names = [model.get('name', '') for model in models_data.get('models', [])]
            
            # Clean model names (remove version tags for comparison)
            clean_models = [name.split(':')[0] for name in model_names]
            configured_model_base = configured_model.split(':')[0]
            model_exists = configured_model_base in clean_models
            
            # Prepare recommendations
            recommendations = []
            if model_exists:
                recommendations.append('AI service ready for medical documentation')
            else:
                recommendations.extend([
                    f'Install configured model: ollama pull {configured_model}',
                    f'Available models: {", ".join(model_names)}' if model_names else 'No models installed'
                ])
            
            # FIXED: Return the exact format frontend expects
            return jsonify({
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'ollama',                    # Frontend expects this
                'url': ollama_url,
                'configured_model': configured_model,   # Frontend expects this  
                'status': 'available',                  # Frontend expects this
                'available': True,                      # Frontend expects this (CRITICAL!)
                'models': model_names,                  # Frontend expects this
                'model_exists': model_exists,           # Frontend expects this (CRITICAL!)
                'recommendations': recommendations,     # Frontend expects this
                'test_generation': {                    # Frontend expects this
                    'success': True,
                    'note': 'Basic connectivity confirmed'
                }
            })
            
        except requests.exceptions.ConnectionError:
            # Ollama not running - return format frontend expects
            return jsonify({
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'ollama',
                'url': ollama_url,
                'configured_model': configured_model,
                'status': 'unavailable',
                'available': False,                     # CRITICAL: Frontend checks this
                'models': [],
                'model_exists': False,                  # CRITICAL: Frontend checks this
                'recommendations': [
                    'Start Ollama service: ollama serve',
                    'Verify Ollama is running on port 11434'
                ],
                'test_generation': {
                    'success': False,
                    'error': 'Ollama service not running'
                }
            })
            
    except Exception as e:
        logger.error(f"Error checking AI status: {str(e)}")
        return jsonify({
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'ollama',
            'status': 'error',
            'available': False,                         # CRITICAL: Frontend checks this
            'error': str(e),
            'recommendations': ['Check backend logs for details']
        }), 500

def generate_documents():
    """Generate AI-enhanced documents for patients using templates"""
    try:
        data = request.get_json()
        
        # DEBUG: Log the incoming data
        logger.info(f"Received generation request: {data}")
        
        # Validate request data
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        patient_ids = data.get('patient_ids', [])
        template_id = data.get('template_id')
        ai_settings = data.get('ai_settings', {})
        
        # DEBUG: Log the extracted values
        logger.info(f"Patient IDs: {patient_ids}, Template ID: {template_id}")
        logger.info(f"Available patients: {MOCK_PATIENTS}")
        
        # Find the selected template
        template = next((t for t in MOCK_TEMPLATES if t['id'] == int(template_id)), None)
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template not found'
            }), 404
        
        # Find selected patients
        selected_patients = [p for p in MOCK_PATIENTS if p['id'] in patient_ids]
        
        # Generate documents for each patient
        results = []
        for patient in selected_patients:
            # Create a mock document
            document_content = f"""
{template['name']}

Patient: {patient['name']}
Age: {patient['age']}
Primary Diagnosis: {patient['diagnosis']}

Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

This is a mock document generated for demonstration purposes.
The actual template content would be populated here with patient-specific information.

AI Enhancement: {'Enabled' if ai_settings.get('enable_ai', False) else 'Disabled'}
"""
            
            # If AI enhancement is enabled, add a note about it
            if ai_settings.get('enable_ai', False):
                enhancement_level = ai_settings.get('enhancement_percentage', 80)
                tone = ai_settings.get('tone', 'formal')
                document_content += f"""
AI Enhancement Settings:
- Enhancement Level: {enhancement_level}%
- Tone: {tone}
- Note: AI would enhance the clinical language and structure in a real implementation
"""
            
            results.append({
                'patient_id': patient['id'],
                'patient_name': patient['name'],
                'template_id': template_id,
                'template_name': template['name'],
                'content': document_content,
                'ai_enhanced': ai_settings.get('enable_ai', False),
                'generated_at': datetime.utcnow().isoformat()
            })
        
        return jsonify({
            'success': True,
            'results': results,
            'template_used': template['name'],
            'patients_processed': len(selected_patients),
            'ai_enhanced': ai_settings.get('enable_ai', False),
            'message': f'Successfully generated {len(results)} documents'
        })
        
    except Exception as e:
        logger.error(f"Error generating documents: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Document generation failed: {str(e)}'
        }), 500

@app.route('/api/documents/generate', methods=['POST'])
def generate_documents():
    """Generate AI-enhanced documents for patients using templates"""
    try:
        data = request.get_json()
        
        # DEBUG: Log incoming data
        logger.info(f"Generation request: {data}")
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        patient_ids = data.get('patient_ids', [])
        template_id = data.get('template_id')
        ai_settings = data.get('ai_settings', {})
        
        # Convert IDs to integers (handle both string and int inputs)
        try:
            patient_ids = [int(pid) for pid in patient_ids]
            template_id = int(template_id)
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Invalid ID format'}), 400
        
        if not patient_ids:
            return jsonify({'success': False, 'error': 'No patients selected'}), 400
        
        # Find template and patients
        template = next((t for t in MOCK_TEMPLATES if t['id'] == template_id), None)
        if not template:
            return jsonify({'success': False, 'error': 'Template not found'}), 404
        
        selected_patients = [p for p in MOCK_PATIENTS if p['id'] in patient_ids]
        logger.info(f"Found {len(selected_patients)} patients")
        
        # Generate documents
        results = []
        for patient in selected_patients:
            document_content = f"""
{template['name']}

Patient: {patient['name']}
Age: {patient['age']}
Primary Diagnosis: {patient['diagnosis']}

Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

This is a mock document generated for demonstration purposes.
AI Enhancement: {'Enabled' if ai_settings.get('enable_ai', False) else 'Disabled'}
"""
            
            if ai_settings.get('enable_ai', False):
                enhancement_level = ai_settings.get('enhancement_percentage', 80)
                tone = ai_settings.get('tone', 'formal')
                document_content += f"""
AI Enhancement Settings:
- Enhancement Level: {enhancement_level}%
- Tone: {tone}
"""
            
            results.append({
                'patient_id': patient['id'],
                'patient_name': patient['name'],
                'template_id': template_id,
                'template_name': template['name'],
                'content': document_content,
                'ai_enhanced': ai_settings.get('enable_ai', False),
                'generated_at': datetime.utcnow().isoformat()
            })
        
        return jsonify({
            'success': True,
            'results': results,
            'template_used': template['name'],
            'patients_processed': len(selected_patients),
            'ai_enhanced': ai_settings.get('enable_ai', False),
            'message': f'Successfully generated {len(results)} documents'
        })
        
    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting MeDocPro Backend (Fixed Version)")
    print(f"🔗 Ollama URL: {app.config['OLLAMA_URL']}")
    print(f"🤖 Configured Model: {app.config['OLLAMA_MODEL']}")
    print("🌐 Server will start on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)