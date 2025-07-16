# app/routes/daily_information.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from ..extensions import db
from ..models import DailyInformation, PatientCensusRow, Template, User
from ..utils.audit import log_audit_event
from datetime import datetime, date

daily_info_bp = Blueprint('daily_info', __name__)

@daily_info_bp.route('/daily-info', methods=['POST'])
@jwt_required()
def create_daily_info():
    """Save daily information entry for a patient"""
    try:
        # Get authenticated user
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        patient_census_row_id = data.get('patient_census_row_id') or data.get('patient_id')
        if not patient_census_row_id:
            return jsonify({'success': False, 'error': 'Patient ID is required'}), 400
        
        field_values = data.get('field_values', {})
        if not field_values:
            return jsonify({'success': False, 'error': 'Field values are required'}), 400
        
        # Verify patient exists
        patient = PatientCensusRow.query.get(patient_census_row_id)
        if not patient:
            return jsonify({'success': False, 'error': 'Patient not found'}), 404
        
        # Get optional fields
        template_id = data.get('template_id')
        entry_date = data.get('entry_date')
        notes = data.get('notes')
        
        # Parse entry_date if provided
        if entry_date:
            try:
                entry_date = datetime.strptime(entry_date, '%Y-%m-%d').date()
            except ValueError:
                entry_date = date.today()
        else:
            entry_date = date.today()
        
        # Verify template exists if provided
        if template_id:
            template = Template.query.get(template_id)
            if not template:
                return jsonify({'success': False, 'error': 'Template not found'}), 404
        
        # Check if entry already exists for this patient/date
        existing_entry = DailyInformation.get_latest_for_patient(patient_census_row_id, entry_date)
        
        if existing_entry:
            # Update existing entry
            existing_entry.field_values = field_values
            existing_entry.template_id = template_id
            existing_entry.notes = notes
            existing_entry.status = data.get('status', 'draft')
            daily_info = existing_entry
            action = 'updated'
        else:
            # Create new entry
            daily_info = DailyInformation(
                patient_census_row_id=patient_census_row_id,
                template_id=template_id,
                user_id=current_user_id,
                entry_date=entry_date,
                field_values=field_values,
                notes=notes,
                status=data.get('status', 'draft')
            )
            db.session.add(daily_info)
            action = 'created'
        
        db.session.commit()
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action=f'daily_info_{action}',
            resource_type='daily_information',
            resource_id=daily_info.id,
            details={
                'patient_id': patient_census_row_id,
                'entry_date': entry_date.isoformat(),
                'template_id': template_id,
                'field_count': len(field_values)
            }
        )
        
        return jsonify({
            'success': True,
            'message': f'Daily information {action} successfully',
            'daily_info': daily_info.to_dict(include_populated_content=False),
            'action': action
        }), 201 if action == 'created' else 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to save daily information: {str(e)}'
        }), 500

@daily_info_bp.route('/daily-info/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_daily_info(patient_id):
    """Get daily information entries for a specific patient"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        entry_date_str = request.args.get('date')
        days = request.args.get('days', 7, type=int)
        include_content = request.args.get('include_content', 'false').lower() == 'true'
        
        # Parse entry date if provided
        if entry_date_str:
            try:
                entry_date = datetime.strptime(entry_date_str, '%Y-%m-%d').date()
                # Get entry for specific date
                daily_info = DailyInformation.get_latest_for_patient(patient_id, entry_date)
                if daily_info:
                    entries = [daily_info]
                else:
                    entries = []
            except ValueError:
                return jsonify({'success': False, 'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            # Get history for the last N days
            entries = DailyInformation.get_patient_history(patient_id, days)
        
        # Convert to dictionaries
        entries_data = []
        for entry in entries:
            entries_data.append(entry.to_dict(include_populated_content=include_content))
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='daily_info_viewed',
            resource_type='daily_information',
            resource_id=patient_id,
            details={
                'patient_id': patient_id,
                'entries_count': len(entries_data),
                'date_filter': entry_date_str,
                'days_filter': days
            }
        )
        
        return jsonify({
            'success': True,
            'entries': entries_data,
            'count': len(entries_data),
            'patient_id': patient_id
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to retrieve daily information: {str(e)}'
        }), 500

@daily_info_bp.route('/daily-info/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_daily_info(entry_id):
    """Update a specific daily information entry"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get the entry
        daily_info = DailyInformation.query.get_or_404(entry_id)
        
        # Optional: Check if user owns this entry or has permission to edit
        # if daily_info.user_id != current_user_id:
        #     return jsonify({'success': False, 'error': 'Permission denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Update fields
        if 'field_values' in data:
            daily_info.field_values = data['field_values']
        
        if 'template_id' in data:
            daily_info.template_id = data['template_id']
        
        if 'notes' in data:
            daily_info.notes = data['notes']
        
        if 'status' in data:
            daily_info.status = data['status']
        
        db.session.commit()
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='daily_info_updated',
            resource_type='daily_information',
            resource_id=entry_id,
            details={
                'patient_id': daily_info.patient_census_row_id,
                'entry_date': daily_info.entry_date.isoformat(),
                'new_status': daily_info.status
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Daily information updated successfully',
            'daily_info': daily_info.to_dict(include_populated_content=False)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to update daily information: {str(e)}'
        }), 500

@daily_info_bp.route('/daily-info/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_daily_info(entry_id):
    """Delete a specific daily information entry"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get the entry
        daily_info = DailyInformation.query.get_or_404(entry_id)
        
        # Store info for audit log before deletion
        patient_id = daily_info.patient_census_row_id
        entry_date = daily_info.entry_date
        
        # Optional: Check if user owns this entry or has permission to delete
        # if daily_info.user_id != current_user_id:
        #     return jsonify({'success': False, 'error': 'Permission denied'}), 403
        
        db.session.delete(daily_info)
        db.session.commit()
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='daily_info_deleted',
            resource_type='daily_information',
            resource_id=entry_id,
            details={
                'patient_id': patient_id,
                'entry_date': entry_date.isoformat()
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Daily information deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to delete daily information: {str(e)}'
        }), 500

@daily_info_bp.route('/daily-info/<int:entry_id>/populate', methods=['GET'])
@jwt_required()
def get_populated_template(entry_id):
    """Get template content populated with daily information data"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get the entry
        daily_info = DailyInformation.query.get_or_404(entry_id)
        
        # Get populated content
        populated_content = daily_info.get_template_populated_content()
        
        if not populated_content:
            return jsonify({
                'success': False,
                'error': 'No template associated with this entry or template content is empty'
            }), 404
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='daily_info_template_generated',
            resource_type='daily_information',
            resource_id=entry_id,
            details={
                'patient_id': daily_info.patient_census_row_id,
                'template_id': daily_info.template_id
            }
        )
        
        return jsonify({
            'success': True,
            'populated_content': populated_content,
            'template_name': daily_info.template_name,
            'patient_name': daily_info.patient_name,
            'entry_date': daily_info.entry_date.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to generate populated template: {str(e)}'
        }), 500

@daily_info_bp.route('/daily-info/today', methods=['GET'])
@jwt_required()
def get_today_entries():
    """Get all daily information entries for today"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get today's entries for the current user
        today_entries = DailyInformation.get_entries_by_date(date.today(), current_user_id)
        
        # Convert to dictionaries
        entries_data = []
        for entry in today_entries:
            entries_data.append(entry.to_dict(include_populated_content=False))
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='daily_info_today_viewed',
            resource_type='daily_information',
            details={
                'entries_count': len(entries_data),
                'date': date.today().isoformat()
            }
        )
        
        return jsonify({
            'success': True,
            'entries': entries_data,
            'count': len(entries_data),
            'date': date.today().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to retrieve today\'s entries: {str(e)}'
        }), 500