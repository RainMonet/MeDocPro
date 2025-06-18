from flask import Blueprint, request, jsonify, current_app
from app.models.template import Template
from app.models.patient_data import PatientData
from app.services.ai_processor import ai_processor
from app import db
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

documents_bp = Blueprint('documents', __name__)

@documents_bp.route('/api/patients', methods=['GET'])
def get_patients():
    """Get all patients for selection"""
    try:
        patients = PatientData.query.all()
        return jsonify({
            'success': True,
            'patients': [patient.to_dict() for patient in patients]
        })
    except Exception as e:
        logger.error(f"Error fetching patients: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch patients'
        }), 500

@documents_bp.route('/api/patients/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    """Get specific patient data"""
    try:
        patient = PatientData.query.filter_by(patient_id=patient_id).first()
        if not patient:
            return jsonify({
                'success': False,
                'error': 'Patient not found'
            }), 404
        
        return jsonify({
            'success': True,
            'patient': patient.to_dict()
        })
    except Exception as e:
        logger.error(f"Error fetching patient {patient_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch patient data'
        }), 500

@documents_bp.route('/api/templates', methods=['GET'])
def get_templates():
    """Get all available templates"""
    try:
        templates = Template.query.all()
        return jsonify({
            'success': True,
            'templates': [template.to_dict() for template in templates]
        })
    except Exception as e:
        logger.error(f"Error fetching templates: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch templates'
        }), 500

@documents_bp.route('/api/templates/<int:template_id>', methods=['GET'])
def get_template(template_id):
    """Get specific template"""
    try:
        template = Template.query.get(template_id)
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template not found'
            }), 404
        
        return jsonify({
            'success': True,
            'template': template.to_dict()
        })
    except Exception as e:
        logger.error(f"Error fetching template {template_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch template'
        }), 500

@documents_bp.route('/api/generate-document', methods=['POST'])
def generate_document():
    """Generate document with AI enhancement"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['template_id', 'patient_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Get template
        template = Template.query.get(data['template_id'])
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template not found'
            }), 404
        
        # Get patient data
        patient = PatientData.query.filter_by(patient_id=data['patient_id']).first()
        if not patient:
            return jsonify({
                'success': False,
                'error': 'Patient not found'
            }), 404
        
        # Check if AI enhancement is requested
        use_ai = data.get('use_ai', False)
        
        if use_ai:
            # Test AI connection
            if not ai_processor.test_connection():
                return jsonify({
                    'success': False,
                    'error': 'AI service is not available. Please ensure Ollama is running.'
                }), 503
            
            # Process template with AI
            logger.info(f"Processing template {template.name} with AI for patient {patient.patient_id}")
            processed_content = ai_processor.process_template_zones(
                template.content,
                patient.to_dict(),
                template.template_type
            )
        else:
            # Remove AI zones without processing
            processed_content = template.content.replace("{{BEGIN_AI}}", "").replace("{{END_AI}}", "")
        
        # Replace patient placeholders
        processed_content = replace_patient_placeholders(processed_content, patient)
        
        # Generate document metadata
        document_data = {
            'title': f"{template.name} - {patient.full_name}",
            'content': processed_content,
            'template_name': template.name,
            'template_type': template.template_type,
            'patient_id': patient.patient_id,
            'patient_name': patient.full_name,
            'generated_at': datetime.utcnow().isoformat(),
            'ai_enhanced': use_ai
        }
        
        logger.info(f"Successfully generated document for patient {patient.patient_id}")
        
        return jsonify({
            'success': True,
            'document': document_data
        })
        
    except Exception as e:
        logger.error(f"Error generating document: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate document'
        }), 500

@documents_bp.route('/api/enhance-text', methods=['POST'])
def enhance_text():
    """Enhance existing text with AI"""
    try:
        data = request.get_json()
        
        if 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'Text is required'
            }), 400
        
        # Test AI connection
        if not ai_processor.test_connection():
            return jsonify({
                'success': False,
                'error': 'AI service is not available'
            }), 503
        
        text = data['text']
        enhancement_type = data.get('enhancement_type', 'clinical')
        
        # Enhance text
        enhanced_text = ai_processor.enhance_clinical_text(text, enhancement_type)
        
        return jsonify({
            'success': True,
            'original_text': text,
            'enhanced_text': enhanced_text,
            'enhancement_type': enhancement_type
        })
        
    except Exception as e:
        logger.error(f"Error enhancing text: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to enhance text'
        }), 500

@documents_bp.route('/api/ai-status', methods=['GET'])
def ai_status():
    """Check AI service status"""
    try:
        is_connected = ai_processor.test_connection()
        return jsonify({
            'success': True,
            'ai_available': is_connected,
            'service': 'Ollama',
            'model': ai_processor.model
        })
    except Exception as e:
        logger.error(f"Error checking AI status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to check AI status'
        }), 500

def replace_patient_placeholders(content: str, patient: PatientData) -> str:
    """Replace patient placeholder variables in content"""
    replacements = {
        '{{PATIENT_NAME}}': patient.full_name,
        '{{PATIENT_FIRST_NAME}}': patient.first_name,
        '{{PATIENT_LAST_NAME}}': patient.last_name,
        '{{PATIENT_ID}}': patient.patient_id,
        '{{PATIENT_AGE}}': str(patient.age),
        '{{PATIENT_GENDER}}': patient.gender or 'Not specified',
        '{{PATIENT_DOB}}': patient.date_of_birth.strftime('%m/%d/%Y') if patient.date_of_birth else 'Not specified',
        '{{PRIMARY_DIAGNOSIS}}': patient.primary_diagnosis or 'Not specified',
        '{{CURRENT_DATE}}': datetime.now().strftime('%m/%d/%Y'),
        '{{CURRENT_DATETIME}}': datetime.now().strftime('%m/%d/%Y %I:%M %p'),
        '{{MOOD}}': patient.mood or 'Not assessed',
        '{{AFFECT}}': patient.affect or 'Not assessed',
        '{{SUICIDE_RISK}}': patient.suicide_risk or 'Not assessed',
        '{{HOMICIDE_RISK}}': patient.homicide_risk or 'Not assessed',
        '{{INSIGHT}}': patient.insight or 'Not assessed',
        '{{JUDGMENT}}': patient.judgment or 'Not assessed'
    }
    
    processed_content = content
    for placeholder, value in replacements.items():
        processed_content = processed_content.replace(placeholder, str(value))
    
    return processed_content

# Error handlers
@documents_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Resource not found'
    }), 404

@documents_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500