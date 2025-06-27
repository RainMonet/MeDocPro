# app/routes/scratch_notes.py

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import uuid
import logging

from ..models import db, ScratchNote, User
from ..utils.audit import log_audit_event

# Create blueprint
scratch_notes_bp = Blueprint('scratch_notes', __name__)

logger = logging.getLogger(__name__)

@scratch_notes_bp.route('/api/scratch-notes', methods=['GET'])
@jwt_required()
def get_scratch_notes():
    """Get all active scratch notes for the current user"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        include_expired = request.args.get('include_expired', 'false').lower() == 'true'
        note_type = request.args.get('type')
        
        # Build query
        query = ScratchNote.query.filter_by(user_id=user_id, is_active=True)
        
        if not include_expired:
            query = query.filter(ScratchNote.expires_at > datetime.utcnow())
        
        if note_type:
            query = query.filter_by(note_type=note_type)
        
        # Order by creation date (newest first)
        notes = query.order_by(ScratchNote.created_at.desc()).all()
        
        log_audit_event(user_id, 'scratch_notes_viewed', f'Retrieved {len(notes)} scratch notes')
        
        return jsonify({
            'success': True,
            'scratch_notes': [note.to_dict() for note in notes],
            'count': len(notes)
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving scratch notes: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve scratch notes'}), 500

@scratch_notes_bp.route('/api/scratch-notes', methods=['POST'])
@jwt_required()
def create_scratch_note():
    """Create a new scratch note"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('content'):
            return jsonify({'success': False, 'error': 'Content is required'}), 400
        
        # Create new scratch note
        note = ScratchNote(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=data.get('title'),
            content=data.get('content'),
            patient_hint=data.get('patient_hint'),
            note_type=data.get('note_type', 'clinical'),
            created_at=datetime.utcnow()
        )
        
        # Expiration is auto-calculated in the model __init__
        
        db.session.add(note)
        db.session.commit()
        
        log_audit_event(user_id, 'scratch_note_created', f'Created scratch note: {note.id}')
        
        return jsonify({
            'success': True,
            'scratch_note': note.to_dict(),
            'message': 'Scratch note created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating scratch note: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to create scratch note'}), 500

@scratch_notes_bp.route('/api/scratch-notes/<note_id>', methods=['GET'])
@jwt_required()
def get_scratch_note(note_id):
    """Get a specific scratch note"""
    try:
        user_id = get_jwt_identity()
        
        note = ScratchNote.query.filter_by(id=note_id, user_id=user_id, is_active=True).first()
        if not note:
            return jsonify({'success': False, 'error': 'Scratch note not found'}), 404
        
        log_audit_event(user_id, 'scratch_note_viewed', f'Viewed scratch note: {note_id}')
        
        return jsonify({
            'success': True,
            'scratch_note': note.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving scratch note {note_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve scratch note'}), 500

@scratch_notes_bp.route('/api/scratch-notes/<note_id>', methods=['PUT'])
@jwt_required()
def update_scratch_note(note_id):
    """Update a scratch note"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        note = ScratchNote.query.filter_by(id=note_id, user_id=user_id, is_active=True).first()
        if not note:
            return jsonify({'success': False, 'error': 'Scratch note not found'}), 404
        
        # Check if note is expired
        if note.is_expired:
            return jsonify({'success': False, 'error': 'Cannot update expired scratch note'}), 400
        
        # Update fields
        if 'title' in data:
            note.title = data['title']
        if 'content' in data:
            note.content = data['content']
        if 'patient_hint' in data:
            note.patient_hint = data['patient_hint']
        if 'note_type' in data:
            note.note_type = data['note_type']
        
        note.last_modified = datetime.utcnow()
        
        db.session.commit()
        
        log_audit_event(user_id, 'scratch_note_updated', f'Updated scratch note: {note_id}')
        
        return jsonify({
            'success': True,
            'scratch_note': note.to_dict(),
            'message': 'Scratch note updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating scratch note {note_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to update scratch note'}), 500

@scratch_notes_bp.route('/api/scratch-notes/<note_id>', methods=['DELETE'])
@jwt_required()
def delete_scratch_note(note_id):
    """Delete a scratch note (soft delete)"""
    try:
        user_id = get_jwt_identity()
        
        note = ScratchNote.query.filter_by(id=note_id, user_id=user_id, is_active=True).first()
        if not note:
            return jsonify({'success': False, 'error': 'Scratch note not found'}), 404
        
        # Soft delete
        note.is_active = False
        note.last_modified = datetime.utcnow()
        
        db.session.commit()
        
        log_audit_event(user_id, 'scratch_note_deleted', f'Deleted scratch note: {note_id}')
        
        return jsonify({
            'success': True,
            'message': 'Scratch note deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting scratch note {note_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to delete scratch note'}), 500

@scratch_notes_bp.route('/api/scratch-notes/<note_id>/promote', methods=['POST'])
@jwt_required()
def promote_scratch_note(note_id):
    """Promote scratch note to permanent storage (template or document)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        note = ScratchNote.query.filter_by(id=note_id, user_id=user_id, is_active=True).first()
        if not note:
            return jsonify({'success': False, 'error': 'Scratch note not found'}), 404
        
        promotion_type = data.get('type', 'template')  # 'template' or 'document'
        
        # Mark as promoted
        note.promote_to_permanent()
        
        db.session.commit()
        
        log_audit_event(user_id, 'scratch_note_promoted', f'Promoted scratch note {note_id} to {promotion_type}')
        
        return jsonify({
            'success': True,
            'scratch_note': note.to_dict(),
            'message': f'Scratch note promoted to {promotion_type} successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error promoting scratch note {note_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to promote scratch note'}), 500

@scratch_notes_bp.route('/api/scratch-notes/<note_id>/transfer-to-census', methods=['POST'])
@jwt_required()
def transfer_to_census(note_id):
    """Transfer scratch note content to patient census"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        note = ScratchNote.query.filter_by(id=note_id, user_id=user_id, is_active=True).first()
        if not note:
            return jsonify({'success': False, 'error': 'Scratch note not found'}), 404
        
        census_row_id = data.get('census_row_id')
        if not census_row_id:
            return jsonify({'success': False, 'error': 'Census row ID is required'}), 400
        
        # Mark as transferred
        note.transfer_to_census()
        
        db.session.commit()
        
        log_audit_event(user_id, 'scratch_note_transferred', f'Transferred scratch note {note_id} to census row {census_row_id}')
        
        return jsonify({
            'success': True,
            'scratch_note': note.to_dict(),
            'message': 'Scratch note transferred to census successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error transferring scratch note {note_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to transfer scratch note'}), 500

@scratch_notes_bp.route('/api/scratch-notes/cleanup-expired', methods=['POST'])
@jwt_required()
def cleanup_expired_notes():
    """Manual cleanup of expired scratch notes (admin function)"""
    try:
        user_id = get_jwt_identity()
        
        # This could be restricted to admin users only
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        
        count = ScratchNote.cleanup_expired()
        
        log_audit_event(user_id, 'scratch_notes_cleanup', f'Cleaned up {count} expired scratch notes')
        
        return jsonify({
            'success': True,
            'message': f'Cleaned up {count} expired scratch notes',
            'count': count
        }), 200
        
    except Exception as e:
        logger.error(f"Error cleaning up expired notes: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to cleanup expired notes'}), 500

@scratch_notes_bp.route('/api/scratch-notes/stats', methods=['GET'])
@jwt_required()
def get_scratch_notes_stats():
    """Get statistics about user's scratch notes"""
    try:
        user_id = get_jwt_identity()
        
        total_count = ScratchNote.query.filter_by(user_id=user_id, is_active=True).count()
        
        # Count by visual age stage
        fresh_count = 0
        aging_count = 0
        mature_count = 0
        expiring_count = 0
        expired_count = 0
        
        notes = ScratchNote.query.filter_by(user_id=user_id, is_active=True).all()
        
        for note in notes:
            stage = note.visual_age_stage
            if stage == 'fresh':
                fresh_count += 1
            elif stage == 'aging':
                aging_count += 1
            elif stage == 'mature':
                mature_count += 1
            elif stage == 'expiring':
                expiring_count += 1
            elif stage == 'expired':
                expired_count += 1
        
        return jsonify({
            'success': True,
            'stats': {
                'total_count': total_count,
                'fresh_count': fresh_count,
                'aging_count': aging_count,
                'mature_count': mature_count,
                'expiring_count': expiring_count,
                'expired_count': expired_count,
                'promoted_count': ScratchNote.query.filter_by(user_id=user_id, promoted_to_permanent=True).count(),
                'transferred_count': ScratchNote.query.filter_by(user_id=user_id, transferred_to_census=True).count()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving scratch notes stats: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to retrieve statistics'}), 500