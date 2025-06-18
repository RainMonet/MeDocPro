# app/routes/documents.py - Updated with full AI integration
from flask import Blueprint, request, jsonify, current_app
from app.models.template import Template
from app.models.patient_data import PatientData
from app.services.ai_processor import process_text_with_ollama, check_ollama_status
from app import db
import logging
from datetime import datetime
import json

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

# ============================================================================
# AI AUTOMATION ENDPOINTS
# ============================================================================

@documents_bp.route('/api/documents/ai-status', methods=['GET'])
def check_ai_status():
    """Check if AI service (Ollama) is available"""
    try:
        status = check_ollama_status()
        return jsonify(status), 200
    except Exception as e:
        logger.error(f"Error checking AI status: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@documents_bp.route('/api/documents/generate', methods=['POST'])
def generate_ai_documents():
    """Generate AI-enhanced documents for patients using templates"""
    try:
        data = request.get_json()
        
        # Validate request data
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        patient_ids = data.get('patient_ids', [])
        template_id = data.get('template_id')
        ai_settings = data.get('ai_settings', {})
        
        if not patient_ids or not template_id:
            return jsonify({
                'success': False,
                'error': 'Patient IDs and template ID are required'
            }), 400
        
        # Get template
        template = Template.query.get(template_id)
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template not found'
            }), 404
        
        # Get patients
        patients = PatientData.query.filter(PatientData.patient_id.in_(patient_ids)).all()
        if len(patients) != len(patient_ids):
            return jsonify({
                'success': False,
                'error': 'One or more patients not found'
            }), 404
        
        # Generate documents for each patient
        results = []
        
        for patient in patients:
            try:
                # Populate template with patient data
                populated_content = populate_template_with_patient_data(template, patient)
                
                # Apply AI enhancement if requested
                enhanced_content = populated_content
                if ai_settings.get('enable_ai', False):
                    enhancement_percentage = ai_settings.get('enhancement_percentage', 80)
                    tone = ai_settings.get('tone', 'formal')
                    
                    enhanced_content = process_text_with_ollama(
                        text=populated_content,
                        percentage=enhancement_percentage,
                        tone=tone
                    )
                
                # Create result for this patient
                patient_result = {
                    'patient_id': patient.patient_id,
                    'patient_name': f"{patient.first_name} {patient.last_name}",
                    'template_name': template.name,
                    'original_content': populated_content,
                    'enhanced_content': enhanced_content if ai_settings.get('enable_ai', False) else None,
                    'ai_enhanced': ai_settings.get('enable_ai', False),
                    'ai_settings': ai_settings if ai_settings.get('enable_ai', False) else None,
                    'generated_at': datetime.now().isoformat()
                }
                
                results.append(patient_result)
                
            except Exception as e:
                logger.error(f"Error generating document for patient {patient.patient_id}: {str(e)}")
                results.append({
                    'patient_id': patient.patient_id,
                    'patient_name': f"{patient.first_name} {patient.last_name}",
                    'error': f"Failed to generate document: {str(e)}"
                })
        
        return jsonify({
            'success': True,
            'results': results,
            'template_used': template.name,
            'patients_processed': len(patients),
            'ai_enhanced': ai_settings.get('enable_ai', False)
        })
        
    except Exception as e:
        logger.error(f"Error in generate_ai_documents: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Document generation failed: {str(e)}'
        }), 500

@documents_bp.route('/api/documents/enhance-text', methods=['POST'])
def enhance_text():
    """Enhance specific text with AI"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'Text is required'
            }), 400
        
        text = data.get('text', '').strip()
        if not text:
            return jsonify({
                'success': False,
                'error': 'Text cannot be empty'
            }), 400
        
        # AI enhancement settings
        enhancement_percentage = data.get('enhancement_percentage', 80)
        tone = data.get('tone', 'formal')
        
        # Validate settings
        if not (20 <= enhancement_percentage <= 90):
            enhancement_percentage = 80
        
        # Process text with AI
        enhanced_text = process_text_with_ollama(
            text=text,
            percentage=enhancement_percentage,
            tone=tone
        )
        
        return jsonify({
            'success': True,
            'original_text': text,
            'enhanced_text': enhanced_text,
            'settings': {
                'enhancement_percentage': enhancement_percentage,
                'tone': tone
            },
            'enhanced_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in enhance_text: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Text enhancement failed: {str(e)}'
        }), 500

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def populate_template_with_patient_data(template, patient):
    """Populate template content with patient data"""
    try:
        content = template.content
        
        # Create substitution mapping from patient data
        substitutions = {
            # Basic demographics
            '{{patient_name}}': f"{patient.first_name} {patient.last_name}",
            '{{patient_id}}': patient.patient_id,
            '{{first_name}}': patient.first_name,
            '{{last_name}}': patient.last_name,
            '{{date_of_birth}}': str(patient.date_of_birth),
            '{{gender}}': patient.gender,
            '{{age}}': str(patient.calculate_age()) if hasattr(patient, 'calculate_age') else 'Unknown',
            
            # Clinical information
            '{{primary_diagnosis}}': patient.primary_diagnosis,
            '{{secondary_diagnoses}}': ', '.join(json.loads(patient.secondary_diagnoses)) if patient.secondary_diagnoses else 'None',
            '{{current_medications}}': ', '.join(json.loads(patient.current_medications)) if patient.current_medications else 'None',
            '{{allergies}}': patient.allergies,
            '{{medical_history}}': patient.medical_history,
            
            # Mental status exam
            '{{appearance}}': patient.appearance,
            '{{behavior}}': patient.behavior,
            '{{speech}}': patient.speech,
            '{{mood}}': patient.mood,
            '{{affect}}': patient.affect,
            '{{thought_process}}': patient.thought_process,
            '{{thought_content}}': patient.thought_content,
            '{{perceptions}}': patient.perceptions,
            '{{cognition}}': patient.cognition,
            '{{insight}}': patient.insight,
            '{{judgment}}': patient.judgment,
            
            # Risk assessment
            '{{suicide_risk}}': patient.suicide_risk,
            '{{homicide_risk}}': patient.homicide_risk,
            '{{risk_factors}}': patient.risk_factors,
            '{{protective_factors}}': patient.protective_factors,
            
            # Treatment
            '{{treatment_goals}}': ', '.join(json.loads(patient.treatment_goals)) if patient.treatment_goals else 'To be determined',
            '{{intervention_plan}}': patient.intervention_plan,
            
            # Date placeholders
            '{{current_date}}': datetime.now().strftime('%B %d, %Y'),
            '{{current_time}}': datetime.now().strftime('%I:%M %p'),
        }
        
        # Apply substitutions
        populated_content = content
        for placeholder, value in substitutions.items():
            if value is None:
                value = 'Not specified'
            populated_content = populated_content.replace(placeholder, str(value))
        
        return populated_content
        
    except Exception as e:
        logger.error(f"Error populating template: {str(e)}")
        return f"Error populating template: {str(e)}"

# Test endpoint for debugging
@documents_bp.route('/test')
def test():
    return {
        "message": "Documents blueprint loaded with full AI integration",
        "endpoints": [
            "/api/patients",
            "/api/templates", 
            "/api/documents/ai-status",
            "/api/documents/generate",
            "/api/documents/enhance-text"
        ]
    }