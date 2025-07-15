# app/utils/audit.py

from datetime import datetime
import logging
from ..models import db, AuditLog

logger = logging.getLogger(__name__)

def log_audit_event(user_id, action, details=None, resource_type=None, resource_id=None):
    """
    Log an audit event for HIPAA compliance.
    
    Args:
        user_id (int): ID of the user performing the action
        action (str): Action being performed
        details (str or dict, optional): Additional details about the action
        resource_type (str, optional): Type of resource being accessed
        resource_id (int, optional): ID of the resource being accessed
    """
    try:
        # Combine details with resource information
        audit_details = details or {}
        
        # Handle string details
        if isinstance(details, str):
            audit_details = {'message': details}
        elif isinstance(details, dict):
            audit_details = details.copy()
        else:
            audit_details = {}
        
        # Add resource information if provided
        if resource_type:
            audit_details['resource_type'] = resource_type
        if resource_id:
            audit_details['resource_id'] = resource_id
        
        # Convert to string for storage
        import json
        details_str = json.dumps(audit_details) if audit_details else None
        
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            timestamp=datetime.utcnow(),
            details=details_str
        )
        
        db.session.add(audit_log)
        db.session.commit()
        
        logger.info(f"Audit event logged: User {user_id}, Action: {action}")
        
    except Exception as e:
        logger.error(f"Failed to log audit event: {str(e)}")
        # Don't raise the exception to avoid breaking the main operation
        # Audit logging failure should not prevent the actual operation
        try:
            db.session.rollback()
        except:
            pass