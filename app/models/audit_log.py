# app/models/audit_log.py

from ..extensions import db
from datetime import datetime

class AuditLog(db.Model):
    """Represents an audit trail event for HIPAA compliance."""
    __tablename__ = 'audit_log'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # May be a system event
    action = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text, nullable=True)

    user = db.relationship('User', backref=db.backref('audit_logs', lazy=True))

    def __repr__(self):
        return f'<AuditLog {self.id} - {self.action}>'
    
    def to_dict(self):
        """Convert audit log entry to dictionary for API responses"""
        import json
        
        # Parse details JSON
        details_dict = None
        if self.details:
            try:
                details_dict = json.loads(self.details)
            except (ValueError, TypeError):
                details_dict = self.details
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'details': details_dict,
            'resource_type': details_dict.get('resource_type') if isinstance(details_dict, dict) else None,
            'resource_id': details_dict.get('resource_id') if isinstance(details_dict, dict) else None
        }
    
    @classmethod
    def log_action(cls, user_id, action, resource_type=None, resource_id=None, details=None):
        """
        Create a new audit log entry
        
        Args:
            user_id: ID of the user performing the action
            action: Description of the action performed
            resource_type: Optional type of resource affected
            resource_id: Optional ID of the resource affected
            details: Optional additional details (dict will be JSON encoded)
        """
        import json
        
        # Prepare details
        if details is None:
            details = {}
        
        # Add resource information to details
        if resource_type:
            details['resource_type'] = resource_type
        if resource_id:
            details['resource_id'] = resource_id
            
        # Convert details to JSON string
        details_str = json.dumps(details) if details else None
        
        # Create audit log entry
        log_entry = cls(
            user_id=user_id,
            action=action,
            details=details_str
        )
        
        try:
            db.session.add(log_entry)
            db.session.commit()
            return log_entry
        except Exception as e:
            db.session.rollback()
            # For now, just log the error and continue
            # In production, you might want to handle this differently
            print(f"Failed to create audit log: {e}")
            return None