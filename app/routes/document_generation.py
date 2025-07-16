# app/routes/document_generation.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import DailyInformation, PatientCensusRow, Template, User
from ..utils.audit import log_audit_event
from datetime import datetime, date
import json

document_generation_bp = Blueprint('document_generation', __name__)

@document_generation_bp.route('/generate-documents', methods=['POST'])
@jwt_required()
def generate_batch_documents():
    """Generate documents for multiple patients using template populated with daily information data"""
    try:
        # Get authenticated user
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        template_data = data.get('template')
        patients = data.get('patients', [])
        export_format = data.get('exportFormat', 'pdf')
        ai_enhancement = data.get('aiEnhancement', False)
        
        if not template_data:
            return jsonify({'success': False, 'error': 'Template is required'}), 400
        
        if not patients:
            return jsonify({'success': False, 'error': 'At least one patient is required'}), 400
        
        # Get template from database
        template = Template.query.get(template_data['id'])
        if not template:
            return jsonify({'success': False, 'error': 'Template not found'}), 404
        
        # Generate documents for each patient
        documents = []
        successful_count = 0
        failed_patients = []
        
        for patient in patients:
            try:
                # Get patient from database
                patient_record = PatientCensusRow.query.get(patient['id'])
                if not patient_record:
                    failed_patients.append({
                        'patient_id': patient['id'],
                        'patient_name': patient.get('patient_name', 'Unknown'),
                        'error': 'Patient not found in database'
                    })
                    continue
                
                # Get today's daily information entry for this patient
                daily_info = DailyInformation.get_latest_for_patient(
                    patient_record.id, 
                    date.today()
                )
                
                if not daily_info:
                    # No daily information entry found - create a basic document with patient info only
                    populated_content = template.content
                    
                    # Replace basic patient information placeholders if they exist
                    patient_name_parts = (patient_record.patient_name or '').split(', ')
                    if len(patient_name_parts) >= 2:
                        last_name, first_name = patient_name_parts[0], patient_name_parts[1]
                    else:
                        last_name = patient_record.patient_name or ''
                        first_name = ''
                    
                    # Basic patient info substitutions
                    basic_substitutions = {
                        'last_name': last_name,
                        'first_name': first_name,
                        'patient_name': patient_record.patient_name or '',
                        'room_number': patient_record.room_number or '',
                        'patient_id': str(patient_record.id),
                        'date_of_service': date.today().strftime('%Y-%m-%d')
                    }
                    
                    for field_name, field_value in basic_substitutions.items():
                        placeholder = f"{{{{{field_name}}}}}"
                        if placeholder in populated_content:
                            populated_content = populated_content.replace(placeholder, str(field_value))
                    
                    # Mark remaining placeholders as empty
                    import re
                    remaining_placeholders = re.findall(r'\{\{([^}]+)\}\}', populated_content)
                    for placeholder_name in remaining_placeholders:
                        placeholder = f"{{{{{placeholder_name}}}}}"
                        populated_content = populated_content.replace(placeholder, "[Not completed]")
                    
                    document = {
                        'patient_id': patient_record.id,
                        'patient_name': patient_record.patient_name,
                        'room_number': patient_record.room_number,
                        'template_name': template.name,
                        'populated_content': populated_content,
                        'content': populated_content,  # For PreviewDocumentModal compatibility
                        'has_daily_info': False,
                        'daily_info_id': None,
                        'entry_date': date.today().isoformat(),
                        'status': 'generated_without_daily_info',
                        'format': export_format,
                        'generated_at': datetime.now().isoformat(),
                        'ai_enhanced': ai_enhancement
                    }
                else:
                    # Daily information entry found - use it to populate the template
                    populated_content = daily_info.get_template_populated_content()
                    
                    if not populated_content:
                        # Template content is empty or template is not associated
                        failed_patients.append({
                            'patient_id': patient['id'],
                            'patient_name': patient.get('patient_name', 'Unknown'),
                            'error': 'Template content is empty or not associated with daily info'
                        })
                        continue
                    
                    document = {
                        'patient_id': patient_record.id,
                        'patient_name': patient_record.patient_name,
                        'room_number': patient_record.room_number,
                        'template_name': template.name,
                        'populated_content': populated_content,
                        'content': populated_content,  # For PreviewDocumentModal compatibility
                        'has_daily_info': True,
                        'daily_info_id': daily_info.id,
                        'entry_date': daily_info.entry_date.isoformat(),
                        'status': daily_info.status,
                        'field_values': daily_info.field_values,
                        'format': export_format,
                        'generated_at': datetime.now().isoformat(),
                        'ai_enhanced': ai_enhancement
                    }
                
                # Apply AI enhancement if requested
                if ai_enhancement:
                    try:
                        # TODO: Implement AI enhancement using Ollama
                        # For now, just add a note that enhancement was requested
                        document['ai_enhanced'] = True
                        document['populated_content'] = f"[AI Enhanced]\n\n{document['populated_content']}"
                    except Exception as e:
                        # AI enhancement failed, but continue with unenhanced document
                        document['ai_enhanced'] = False
                        document['ai_enhancement_error'] = str(e)
                
                documents.append(document)
                successful_count += 1
                
            except Exception as e:
                failed_patients.append({
                    'patient_id': patient.get('id', 'unknown'),
                    'patient_name': patient.get('patient_name', 'Unknown'),
                    'error': str(e)
                })
        
        # Generate batch ID for tracking
        batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{current_user_id}"
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='batch_documents_generated',
            resource_type='document_generation',
            resource_id=template.id,
            details={
                'template_id': template.id,
                'template_name': template.name,
                'patient_count': len(patients),
                'successful_count': successful_count,
                'failed_count': len(failed_patients),
                'export_format': export_format,
                'ai_enhancement': ai_enhancement,
                'batch_id': batch_id
            }
        )
        
        return jsonify({
            'success': True,
            'message': f'Generated {successful_count} documents successfully',
            'documents': documents,
            'batch_id': batch_id,
            'total_count': len(patients),
            'successful_count': successful_count,
            'failed_count': len(failed_patients),
            'failed_patients': failed_patients,
            'template': {
                'id': template.id,
                'name': template.name,
                'category': template.category
            },
            'export_format': export_format,
            'ai_enhancement': ai_enhancement
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to generate documents: {str(e)}'
        }), 500

@document_generation_bp.route('/generate-documents/<batch_id>/download', methods=['GET'])
@jwt_required()
def download_batch_documents(batch_id):
    """Download generated documents as a zip file"""
    try:
        # TODO: Implement document download functionality
        # This would involve:
        # 1. Retrieving the batch from temporary storage or database
        # 2. Converting documents to requested format (PDF, DOCX, TXT)
        # 3. Creating a zip file with all documents
        # 4. Returning the zip file for download
        
        return jsonify({
            'success': False,
            'error': 'Document download functionality not yet implemented'
        }), 501
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to download documents: {str(e)}'
        }), 500