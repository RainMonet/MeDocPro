# app/utils/audit.py

from datetime import datetime
import logging
from ..models import db, AuditLog

logger = logging.getLogger(__name__)

def log_audit_event(user_id, action, details=None):
    """
    Log an audit event for HIPAA compliance.
    
    Args:
        user_id (int): ID of the user performing the action
        action (str): Action being performed
        details (str, optional): Additional details about the action
    """
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            timestamp=datetime.utcnow(),
            details=details
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