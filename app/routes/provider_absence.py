# app/routes/provider_absence.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from ..extensions import db
from ..models import ProviderAbsence, User
from ..utils.audit import log_audit_event
from datetime import datetime, date

provider_absence_bp = Blueprint('provider_absence', __name__)

@provider_absence_bp.route('/provider-absence', methods=['POST'])
@jwt_required()
def create_absence():
    """Create a new provider absence period"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['user_id', 'provider_name', 'start_date', 'absence_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Parse dates
        try:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            end_date = None
            if data.get('end_date'):
                end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            planned_return_date = None
            if data.get('planned_return_date'):
                planned_return_date = datetime.strptime(data['planned_return_date'], '%Y-%m-%d').date()
        except ValueError as e:
            return jsonify({'success': False, 'error': f'Invalid date format: {str(e)}'}), 400
        
        # Validate date logic
        if end_date and start_date > end_date:
            return jsonify({'success': False, 'error': 'Start date cannot be after end date'}), 400
        
        # Verify the provider exists
        provider = User.query.get(data['user_id'])
        if not provider:
            return jsonify({'success': False, 'error': 'Provider not found'}), 404
        
        # Check for overlapping absences
        overlapping = ProviderAbsence.query.filter(
            ProviderAbsence.user_id == data['user_id'],
            ProviderAbsence.status == 'active',
            ProviderAbsence.start_date <= (end_date or date.max),
            db.or_(
                ProviderAbsence.end_date.is_(None),
                ProviderAbsence.end_date >= start_date
            )
        ).first()
        
        if overlapping:
            return jsonify({
                'success': False, 
                'error': f'Provider already has an active absence during this period (ID: {overlapping.id})'
            }), 400
        
        # Create absence record
        absence = ProviderAbsence(
            user_id=data['user_id'],
            provider_name=data['provider_name'],
            start_date=start_date,
            end_date=end_date,
            planned_return_date=planned_return_date,
            absence_type=data['absence_type'],
            reason=data.get('reason'),
            emergency_contact=data.get('emergency_contact'),
            created_by_user_id=current_user_id
        )
        
        # Set custom retention settings if provided
        if 'retention_settings' in data:
            absence.retention_settings = data['retention_settings']
        
        db.session.add(absence)
        db.session.commit()
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='provider_absence_created',
            resource_type='provider_absence',
            resource_id=absence.id,
            details={
                'provider_id': data['user_id'],
                'provider_name': data['provider_name'],
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat() if end_date else None,
                'absence_type': data['absence_type'],
                'is_long_term': absence.is_long_term_absence()
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Provider absence created successfully',
            'absence': absence.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to create provider absence: {str(e)}'
        }), 500

@provider_absence_bp.route('/provider-absence', methods=['GET'])
@jwt_required()
def get_absences():
    """Get provider absences with optional filtering"""
    try:
        current_user_id = get_jwt_identity()
        
        # Query parameters
        status = request.args.get('status', 'all')  # active, completed, cancelled, all
        user_id = request.args.get('user_id', type=int)
        include_expired = request.args.get('include_expired', 'false').lower() == 'true'
        
        # Build query
        query = ProviderAbsence.query
        
        # Filter by status
        if status != 'all':
            query = query.filter_by(status=status)
        
        # Filter by user
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        # Filter expired absences
        if not include_expired:
            today = date.today()
            query = query.filter(
                db.or_(
                    ProviderAbsence.end_date.is_(None),
                    ProviderAbsence.end_date >= today
                )
            )
        
        absences = query.order_by(ProviderAbsence.start_date.desc()).all()
        
        # Convert to dictionaries
        absences_data = [absence.to_dict() for absence in absences]
        
        # Get summary statistics
        active_count = sum(1 for a in absences if a.is_active)
        long_term_count = sum(1 for a in absences if a.is_long_term_absence() and a.is_active)
        cleanup_paused = ProviderAbsence.is_any_cleanup_paused()
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='provider_absences_viewed',
            resource_type='provider_absence',
            details={
                'total_absences': len(absences),
                'active_absences': active_count,
                'status_filter': status,
                'user_filter': user_id
            }
        )
        
        return jsonify({
            'success': True,
            'absences': absences_data,
            'summary': {
                'total': len(absences),
                'active': active_count,
                'long_term_active': long_term_count,
                'cleanup_paused': cleanup_paused
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to retrieve provider absences: {str(e)}'
        }), 500

@provider_absence_bp.route('/provider-absence/<int:absence_id>', methods=['PUT'])
@jwt_required()
def update_absence(absence_id):
    """Update an existing provider absence"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get the absence
        absence = ProviderAbsence.query.get_or_404(absence_id)
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Store original values for audit
        original_end_date = absence.end_date
        
        # Update fields
        if 'end_date' in data:
            if data['end_date']:
                try:
                    new_end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
                    if new_end_date < absence.start_date:
                        return jsonify({'success': False, 'error': 'End date cannot be before start date'}), 400
                    absence.end_date = new_end_date
                except ValueError:
                    return jsonify({'success': False, 'error': 'Invalid end date format'}), 400
            else:
                absence.end_date = None  # Make indefinite
        
        if 'planned_return_date' in data:
            if data['planned_return_date']:
                try:
                    absence.planned_return_date = datetime.strptime(data['planned_return_date'], '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({'success': False, 'error': 'Invalid planned return date format'}), 400
            else:
                absence.planned_return_date = None
        
        if 'reason' in data:
            absence.reason = data['reason']
        
        if 'emergency_contact' in data:
            absence.emergency_contact = data['emergency_contact']
        
        if 'retention_settings' in data:
            absence.retention_settings = data['retention_settings']
        
        if 'status' in data and data['status'] in ['active', 'completed', 'cancelled']:
            absence.status = data['status']
        
        db.session.commit()
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='provider_absence_updated',
            resource_type='provider_absence',
            resource_id=absence_id,
            details={
                'provider_id': absence.user_id,
                'provider_name': absence.provider_name,
                'original_end_date': original_end_date.isoformat() if original_end_date else None,
                'new_end_date': absence.end_date.isoformat() if absence.end_date else None,
                'status': absence.status
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Provider absence updated successfully',
            'absence': absence.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to update provider absence: {str(e)}'
        }), 500

@provider_absence_bp.route('/provider-absence/<int:absence_id>/complete', methods=['POST'])
@jwt_required()
def complete_absence(absence_id):
    """Mark an absence as completed (provider returned)"""
    try:
        current_user_id = get_jwt_identity()
        
        absence = ProviderAbsence.query.get_or_404(absence_id)
        
        if absence.status != 'active':
            return jsonify({'success': False, 'error': 'Only active absences can be completed'}), 400
        
        absence.complete_absence()
        db.session.commit()
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='provider_absence_completed',
            resource_type='provider_absence',
            resource_id=absence_id,
            details={
                'provider_id': absence.user_id,
                'provider_name': absence.provider_name,
                'completed_date': date.today().isoformat(),
                'total_days': absence.total_days
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Provider absence marked as completed',
            'absence': absence.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to complete provider absence: {str(e)}'
        }), 500

@provider_absence_bp.route('/provider-absence/<int:absence_id>/extend', methods=['POST'])
@jwt_required()
def extend_absence(absence_id):
    """Extend an existing absence period"""
    try:
        current_user_id = get_jwt_identity()
        
        absence = ProviderAbsence.query.get_or_404(absence_id)
        
        if absence.status != 'active':
            return jsonify({'success': False, 'error': 'Only active absences can be extended'}), 400
        
        data = request.get_json()
        if not data or 'new_end_date' not in data:
            return jsonify({'success': False, 'error': 'New end date is required'}), 400
        
        try:
            new_end_date = datetime.strptime(data['new_end_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid date format'}), 400
        
        if new_end_date <= absence.start_date:
            return jsonify({'success': False, 'error': 'Extension date must be after start date'}), 400
        
        if absence.end_date and new_end_date <= absence.end_date:
            return jsonify({'success': False, 'error': 'Extension date must be after current end date'}), 400
        
        original_end_date = absence.end_date
        absence.extend_absence(new_end_date, data.get('reason'))
        db.session.commit()
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='provider_absence_extended',
            resource_type='provider_absence',
            resource_id=absence_id,
            details={
                'provider_id': absence.user_id,
                'provider_name': absence.provider_name,
                'original_end_date': original_end_date.isoformat() if original_end_date else None,
                'new_end_date': new_end_date.isoformat(),
                'extension_reason': data.get('reason')
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Provider absence extended successfully',
            'absence': absence.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to extend provider absence: {str(e)}'
        }), 500

@provider_absence_bp.route('/provider-absence/cleanup-status', methods=['GET'])
@jwt_required()
def get_cleanup_status():
    """Get current cleanup status and retention information"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get active absences
        active_absences = ProviderAbsence.get_active_absences()
        
        # Check cleanup status
        cleanup_paused = ProviderAbsence.is_any_cleanup_paused()
        max_retention_extension = ProviderAbsence.get_max_retention_extension()
        
        # Get individual provider statuses
        provider_statuses = []
        for absence in active_absences:
            provider_statuses.append({
                'provider_id': absence.user_id,
                'provider_name': absence.provider_name,
                'absence_id': absence.id,
                'start_date': absence.start_date.isoformat(),
                'end_date': absence.end_date.isoformat() if absence.end_date else None,
                'days_remaining': absence.days_remaining,
                'is_long_term': absence.is_long_term_absence(),
                'pauses_cleanup': absence.should_pause_cleanup(),
                'retention_extension': absence.get_extended_retention_days()
            })
        
        # Calculate effective retention period
        if cleanup_paused and max_retention_extension is None:
            effective_retention = "Indefinite during absence periods"
        elif max_retention_extension:
            effective_retention = f"{7 + max_retention_extension} days"
        else:
            effective_retention = "7 days (standard)"
        
        return jsonify({
            'success': True,
            'cleanup_status': {
                'is_paused': cleanup_paused,
                'max_retention_extension_days': max_retention_extension,
                'effective_retention_period': effective_retention,
                'active_absences_count': len(active_absences),
                'long_term_absences_count': sum(1 for a in active_absences if a.is_long_term_absence())
            },
            'provider_statuses': provider_statuses
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get cleanup status: {str(e)}'
        }), 500