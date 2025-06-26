# app/routes/patient_census.py

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import logging

from ..models import db, PatientCensus, PatientCensusRow, ScratchNote, User
from ..utils.audit import log_audit_event

# Create blueprint
patient_census_bp = Blueprint('patient_census', __name__)

logger = logging.getLogger(__name__)

@patient_census_bp.route('/api/patient-census', methods=['GET'])
@jwt_required()
def get_patient_censuses():
    """Get patient censuses for the current user"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        census_date = request.args.get('date')
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        # Build query
        query = PatientCensus.query.filter_by(user_id=user_id)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        if census_date:
            try:
                target_date = datetime.strptime(census_date, '%Y-%m-%d').date()
                query = query.filter_by(census_date=target_date)
            except ValueError:
                return jsonify({'success': False, 'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Order by date (newest first)
        censuses = query.order_by(PatientCensus.census_date.desc()).all()
        
        log_audit_event(user_id, 'patient_census_viewed', f'Retrieved {len(censuses)} patient censuses')
        
        return jsonify({
            'success': True,
            'censuses': [census.to_dict() for census in censuses],
            'count': len(censuses)
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving patient censuses: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve patient censuses'}), 500

@patient_census_bp.route('/api/patient-census/today', methods=['GET'])
@jwt_required()
def get_todays_census():
    """Get today's patient census, create if doesn't exist"""
    try:
        user_id = get_jwt_identity()
        today = date.today()
        
        # Look for today's census
        census = PatientCensus.query.filter_by(
            user_id=user_id,
            census_date=today,
            is_active=True
        ).first()
        
        if not census:
            # Create today's census
            census = PatientCensus(
                user_id=user_id,
                census_date=today,
                created_at=datetime.utcnow()
            )
            db.session.add(census)
            db.session.commit()
            
            log_audit_event(user_id, 'patient_census_created', f'Created census for {today}')
        
        return jsonify({
            'success': True,
            'census': census.to_dict(),
            'is_new': census.created_at.date() == today
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving today's census: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to retrieve today\'s census'}), 500

@patient_census_bp.route('/api/patient-census', methods=['POST'])
@jwt_required()
def create_patient_census():
    """Create a new patient census"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        census_date = data.get('census_date')
        if census_date:
            try:
                census_date = datetime.strptime(census_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'success': False, 'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            census_date = date.today()
        
        # Check if census already exists for this date
        existing = PatientCensus.query.filter_by(
            user_id=user_id,
            census_date=census_date,
            is_active=True
        ).first()
        
        if existing:
            return jsonify({'success': False, 'error': 'Census already exists for this date'}), 400
        
        # Create new census
        census = PatientCensus(
            user_id=user_id,
            census_date=census_date,
            facility_name=data.get('facility_name'),
            unit_name=data.get('unit_name'),
            total_capacity=data.get('total_capacity'),
            created_at=datetime.utcnow()
        )
        
        db.session.add(census)
        db.session.commit()
        
        log_audit_event(user_id, 'patient_census_created', f'Created census for {census_date}')
        
        return jsonify({
            'success': True,
            'census': census.to_dict(),
            'message': 'Patient census created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating patient census: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to create patient census'}), 500

@patient_census_bp.route('/api/patient-census/<int:census_id>', methods=['GET'])
@jwt_required()
def get_patient_census(census_id):
    """Get a specific patient census"""
    try:
        user_id = get_jwt_identity()
        
        census = PatientCensus.query.filter_by(id=census_id, user_id=user_id, is_active=True).first()
        if not census:
            return jsonify({'success': False, 'error': 'Patient census not found'}), 404
        
        log_audit_event(user_id, 'patient_census_viewed', f'Viewed census: {census_id}')
        
        return jsonify({
            'success': True,
            'census': census.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving patient census {census_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve patient census'}), 500

@patient_census_bp.route('/api/patient-census/<int:census_id>/rows', methods=['POST'])
@jwt_required()
def add_patient_row(census_id):
    """Add a new patient row to the census"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        census = PatientCensus.query.filter_by(id=census_id, user_id=user_id, is_active=True).first()
        if not census:
            return jsonify({'success': False, 'error': 'Patient census not found'}), 404
        
        if census.is_finalized:
            return jsonify({'success': False, 'error': 'Cannot modify finalized census'}), 400
        
        # Create new patient row
        row = PatientCensusRow(
            census_id=census_id,
            room_number=data.get('room_number'),
            patient_name=data.get('patient_name'),
            patient_id=data.get('patient_id'),
            status=data.get('status', 'active'),
            data_fields=data.get('data_fields', {}),
            created_at=datetime.utcnow()
        )
        
        db.session.add(row)
        census.last_updated = datetime.utcnow()
        db.session.commit()
        
        log_audit_event(user_id, 'patient_row_added', f'Added patient row to census {census_id}')
        
        return jsonify({
            'success': True,
            'row': row.to_dict(),
            'message': 'Patient row added successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding patient row to census {census_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to add patient row'}), 500

@patient_census_bp.route('/api/patient-census/rows/<int:row_id>', methods=['PUT'])
@jwt_required()
def update_patient_row(row_id):
    """Update a patient census row"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        row = PatientCensusRow.query.join(PatientCensus).filter(
            PatientCensusRow.id == row_id,
            PatientCensus.user_id == user_id,
            PatientCensus.is_active == True
        ).first()
        
        if not row:
            return jsonify({'success': False, 'error': 'Patient row not found'}), 404
        
        if row.census.is_finalized:
            return jsonify({'success': False, 'error': 'Cannot modify finalized census'}), 400
        
        # Update fields
        if 'room_number' in data:
            row.room_number = data['room_number']
        if 'patient_name' in data:
            row.patient_name = data['patient_name']
        if 'patient_id' in data:
            row.patient_id = data['patient_id']
        if 'status' in data:
            row.status = data['status']
        if 'data_fields' in data:
            row.data_fields = data['data_fields']
        
        row.updated_at = datetime.utcnow()
        row.census.last_updated = datetime.utcnow()
        
        db.session.commit()
        
        log_audit_event(user_id, 'patient_row_updated', f'Updated patient row {row_id}')
        
        return jsonify({
            'success': True,
            'row': row.to_dict(),
            'message': 'Patient row updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating patient row {row_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to update patient row'}), 500

@patient_census_bp.route('/api/patient-census/rows/<int:row_id>/populate-from-scratch', methods=['POST'])
@jwt_required()
def populate_from_scratch_note(row_id):
    """Populate patient row from scratch note"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        scratch_note_id = data.get('scratch_note_id')
        if not scratch_note_id:
            return jsonify({'success': False, 'error': 'Scratch note ID is required'}), 400
        
        # Get patient row
        row = PatientCensusRow.query.join(PatientCensus).filter(
            PatientCensusRow.id == row_id,
            PatientCensus.user_id == user_id,
            PatientCensus.is_active == True
        ).first()
        
        if not row:
            return jsonify({'success': False, 'error': 'Patient row not found'}), 404
        
        # Get scratch note
        scratch_note = ScratchNote.query.filter_by(
            id=scratch_note_id,
            user_id=user_id,
            is_active=True
        ).first()
        
        if not scratch_note:
            return jsonify({'success': False, 'error': 'Scratch note not found'}), 404
        
        # Populate from scratch note
        row.populate_from_scratch_note(scratch_note)
        
        # Mark scratch note as transferred
        scratch_note.transfer_to_census()
        
        db.session.commit()
        
        log_audit_event(user_id, 'row_populated_from_scratch', f'Populated row {row_id} from scratch note {scratch_note_id}')
        
        return jsonify({
            'success': True,
            'row': row.to_dict(),
            'message': 'Patient row populated from scratch note successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error populating row {row_id} from scratch note: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to populate from scratch note'}), 500

@patient_census_bp.route('/api/patient-census/rows/<int:row_id>', methods=['DELETE'])
@jwt_required()
def delete_patient_row(row_id):
    """Delete a patient census row"""
    try:
        user_id = get_jwt_identity()
        
        row = PatientCensusRow.query.join(PatientCensus).filter(
            PatientCensusRow.id == row_id,
            PatientCensus.user_id == user_id,
            PatientCensus.is_active == True
        ).first()
        
        if not row:
            return jsonify({'success': False, 'error': 'Patient row not found'}), 404
        
        if row.census.is_finalized:
            return jsonify({'success': False, 'error': 'Cannot modify finalized census'}), 400
        
        db.session.delete(row)
        row.census.last_updated = datetime.utcnow()
        db.session.commit()
        
        log_audit_event(user_id, 'patient_row_deleted', f'Deleted patient row {row_id}')
        
        return jsonify({
            'success': True,
            'message': 'Patient row deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting patient row {row_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to delete patient row'}), 500

@patient_census_bp.route('/api/patient-census/<int:census_id>/template-data', methods=['GET'])
@jwt_required()
def get_template_data(census_id):
    """Get template population data for all patients in census"""
    try:
        user_id = get_jwt_identity()
        
        census = PatientCensus.query.filter_by(id=census_id, user_id=user_id, is_active=True).first()
        if not census:
            return jsonify({'success': False, 'error': 'Patient census not found'}), 404
        
        # Get template data for all active patients
        template_data = []
        for row in census.rows:
            if row.status == 'active':
                template_data.append({
                    'row_id': row.id,
                    'patient_identifier': f"{row.room_number} - {row.patient_name}" if row.room_number and row.patient_name else row.patient_name or row.room_number,
                    'template_data': row.get_template_data()
                })
        
        log_audit_event(user_id, 'template_data_retrieved', f'Retrieved template data for census {census_id}')
        
        return jsonify({
            'success': True,
            'census_id': census_id,
            'census_date': census.census_date.isoformat(),
            'template_data': template_data,
            'column_headers': census.get_column_headers()
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving template data for census {census_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve template data'}), 500

@patient_census_bp.route('/api/patient-census/<int:census_id>/finalize', methods=['POST'])
@jwt_required()
def finalize_census(census_id):
    """Finalize the census for the day (lock editing)"""
    try:
        user_id = get_jwt_identity()
        
        census = PatientCensus.query.filter_by(id=census_id, user_id=user_id, is_active=True).first()
        if not census:
            return jsonify({'success': False, 'error': 'Patient census not found'}), 404
        
        census.finalize_census()
        db.session.commit()
        
        log_audit_event(user_id, 'patient_census_finalized', f'Finalized census {census_id}')
        
        return jsonify({
            'success': True,
            'census': census.to_dict(),
            'message': 'Patient census finalized successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error finalizing census {census_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to finalize census'}), 500