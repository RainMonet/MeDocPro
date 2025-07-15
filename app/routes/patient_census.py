# app/routes/patient_census.py

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
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
    """Get today's patient census with automatic rollover from previous day"""
    try:
        user_id = get_jwt_identity()
        
        # Use the new get_or_create_today method which handles rollover
        census, was_created, patients_carried, daily_info_carried = PatientCensus.get_or_create_today(user_id)
        
        if was_created:
            log_audit_event(
                user_id, 
                'patient_census_rollover', 
                f'Created census via rollover: {patients_carried} patients, {daily_info_carried} daily info entries'
            )
        else:
            log_audit_event(user_id, 'patient_census_viewed', f'Accessed today\'s census')
        
        return jsonify({
            'success': True,
            'census': census.to_dict(),
            'rollover_info': {
                'was_rollover': was_created,
                'patients_carried_over': patients_carried,
                'daily_info_carried_over': daily_info_carried
            } if was_created else None
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving today's census: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to retrieve today\'s census'}), 500

@patient_census_bp.route('/api/patient-census/history', methods=['GET'])
@jwt_required()
def get_census_history():
    """Get historical census data for calculating averages"""
    try:
        user_id = get_jwt_identity()
        
        # Get number of days to retrieve (default 7)
        days = int(request.args.get('days', 7))
        if days > 30:  # Limit to 30 days for performance
            days = 30
        
        # Calculate date range
        end_date = date.today()
        start_date = end_date - timedelta(days=days-1)  # Include today
        
        # Get census data for the date range
        censuses = PatientCensus.query.filter(
            PatientCensus.user_id == user_id,
            PatientCensus.census_date >= start_date,
            PatientCensus.census_date <= end_date,
            PatientCensus.is_active == True
        ).order_by(PatientCensus.census_date.desc()).all()
        
        # Build historical data
        census_history = []
        for census in censuses:
            # Calculate census counts
            active_count = len([row for row in census.rows if row.status == 'active'])
            admission_count = len([row for row in census.rows if row.status == 'admission'])
            discharge_count = len([row for row in census.rows if row.status == 'discharge'])
            
            census_history.append({
                'census_date': census.census_date.isoformat(),
                'census_count': active_count,
                'admission_count': admission_count,
                'discharge_count': discharge_count,
                'total_capacity': census.total_capacity,
                'facility_name': census.facility_name,
                'unit_name': census.unit_name
            })
        
        log_audit_event(user_id, 'census_history_viewed', f'Retrieved {days} days of census history')
        
        return jsonify({
            'success': True,
            'census_history': census_history,
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days_requested': days
            },
            'count': len(census_history)
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving census history: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve census history'}), 500

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
        
        # Create new patient row - handle workflow_type from frontend
        workflow_type = data.get('workflow_type', data.get('status', 'follow-up'))
        
        row = PatientCensusRow(
            census_id=census_id,
            room_number=data.get('room_number'),
            patient_name=data.get('patient_name'),
            patient_id=data.get('patient_id'),
            status=workflow_type,  # Map workflow_type to status field
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
            'patient_id': row.id,  # Include the database row ID for frontend
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
        
        # Update fields - handle workflow_type from frontend
        if 'room_number' in data:
            row.room_number = data['room_number']
        if 'patient_name' in data:
            row.patient_name = data['patient_name']
        if 'patient_id' in data:
            row.patient_id = data['patient_id']
        if 'workflow_type' in data:
            row.status = data['workflow_type']  # Map workflow_type to status field
        elif 'status' in data:
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
        
        # Delete related daily information entries first to avoid foreign key constraints
        from ..models.daily_information import DailyInformation
        daily_entries = DailyInformation.query.filter_by(patient_census_row_id=row_id).all()
        for entry in daily_entries:
            db.session.delete(entry)
        
        # Now delete the patient row
        db.session.delete(row)
        row.census.last_updated = datetime.utcnow()
        db.session.commit()
        
        log_audit_event(user_id, 'patient_row_deleted', f'Deleted patient row {row_id} and {len(daily_entries)} daily info entries')
        
        return jsonify({
            'success': True,
            'message': f'Patient row deleted successfully (removed {len(daily_entries)} daily entries)'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting patient row {row_id}: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({'success': False, 'error': f'Failed to delete patient row: {str(e)}'}), 500

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

@patient_census_bp.route('/api/patient-census/rows/<int:row_id>/discharge', methods=['POST'])
@jwt_required()
def discharge_patient(row_id):
    """Discharge a patient from the census"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        # Find the patient row
        row = PatientCensusRow.query.join(PatientCensus).filter(
            PatientCensusRow.id == row_id,
            PatientCensus.user_id == user_id,
            PatientCensus.is_active == True
        ).first()
        
        if not row:
            return jsonify({'success': False, 'error': 'Patient not found'}), 404
        
        if row.census.is_finalized:
            return jsonify({'success': False, 'error': 'Cannot modify finalized census'}), 400
        
        # Process discharge
        discharge_date = data.get('discharge_date')
        if discharge_date:
            try:
                discharge_date = datetime.strptime(discharge_date, '%Y-%m-%d').date()
            except ValueError:
                discharge_date = None
        
        discharge_notes = data.get('discharge_notes')
        
        # Mark patient as discharged
        row.discharge(discharge_date=discharge_date, notes=discharge_notes)
        row.census.last_updated = datetime.utcnow()
        db.session.commit()
        
        log_audit_event(
            user_id, 
            'patient_discharged', 
            f'Discharged patient {row.patient_name} from census {row.census_id}'
        )
        
        return jsonify({
            'success': True,
            'row': row.to_dict(),
            'message': f'Patient {row.patient_name} discharged successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error discharging patient {row_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to discharge patient'}), 500

@patient_census_bp.route('/api/patient-census/<int:census_id>/admissions', methods=['POST'])
@jwt_required()
def add_admission(census_id):
    """Add a new patient admission to the census"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['patient_name', 'room_number']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Find the census
        census = PatientCensus.query.filter_by(
            id=census_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not census:
            return jsonify({'success': False, 'error': 'Census not found'}), 404
        
        if census.is_finalized:
            return jsonify({'success': False, 'error': 'Cannot modify finalized census'}), 400
        
        # Check if room is already occupied
        existing_patient = PatientCensusRow.query.filter_by(
            census_id=census_id,
            room_number=data['room_number'],
            status='active'
        ).first()
        
        if existing_patient:
            return jsonify({'success': False, 'error': f'Room {data["room_number"]} is already occupied'}), 400
        
        # Process admission date
        admission_date = data.get('admission_date')
        if admission_date:
            try:
                admission_date = datetime.strptime(admission_date, '%Y-%m-%d').date()
            except ValueError:
                admission_date = None
        
        # Create new patient admission
        new_patient = PatientCensusRow.add_admission(
            census_id=census_id,
            patient_name=data['patient_name'],
            room_number=data['room_number'],
            patient_id=data.get('patient_id'),
            admission_type=data.get('admission_type', 'routine')
        )
        
        # Set admission date if provided
        if admission_date:
            fields = new_patient.data_fields
            fields['admission_date'] = admission_date.isoformat()
            new_patient.data_fields = fields
        
        # Add any additional data fields
        if data.get('additional_data'):
            fields = new_patient.data_fields
            fields.update(data['additional_data'])
            new_patient.data_fields = fields
        
        db.session.add(new_patient)
        census.last_updated = datetime.utcnow()
        db.session.commit()
        
        log_audit_event(
            user_id, 
            'patient_admitted', 
            f'Admitted new patient {new_patient.patient_name} to room {new_patient.room_number}'
        )
        
        return jsonify({
            'success': True,
            'row': new_patient.to_dict(),
            'message': f'Patient {new_patient.patient_name} admitted successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding admission to census {census_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to add admission'}), 500

@patient_census_bp.route('/api/patient-census/rows/<int:row_id>/transfer', methods=['POST'])
@jwt_required()
def transfer_patient(row_id):
    """Transfer a patient to a different room"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('new_room_number'):
            return jsonify({'success': False, 'error': 'New room number is required'}), 400
        
        # Find the patient row
        row = PatientCensusRow.query.join(PatientCensus).filter(
            PatientCensusRow.id == row_id,
            PatientCensus.user_id == user_id,
            PatientCensus.is_active == True
        ).first()
        
        if not row:
            return jsonify({'success': False, 'error': 'Patient not found'}), 404
        
        if row.census.is_finalized:
            return jsonify({'success': False, 'error': 'Cannot modify finalized census'}), 400
        
        new_room = data['new_room_number']
        
        # Check if new room is already occupied
        existing_patient = PatientCensusRow.query.filter_by(
            census_id=row.census_id,
            room_number=new_room,
            status='active'
        ).filter(PatientCensusRow.id != row_id).first()
        
        if existing_patient:
            return jsonify({'success': False, 'error': f'Room {new_room} is already occupied'}), 400
        
        # Perform transfer
        old_room = row.room_number
        row.transfer(new_room, transfer_reason=data.get('transfer_reason'))
        row.census.last_updated = datetime.utcnow()
        db.session.commit()
        
        log_audit_event(
            user_id, 
            'patient_transferred', 
            f'Transferred patient {row.patient_name} from room {old_room} to {new_room}'
        )
        
        return jsonify({
            'success': True,
            'row': row.to_dict(),
            'message': f'Patient {row.patient_name} transferred from {old_room} to {new_room}'
        }), 200
        
    except Exception as e:
        logger.error(f"Error transferring patient {row_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to transfer patient'}), 500