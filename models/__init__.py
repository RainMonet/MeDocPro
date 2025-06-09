"""
MeDocPro Database Models - Simplified Version
Basic models for initial setup and testing
"""

import os
import uuid
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash

# Initialize SQLAlchemy
db = SQLAlchemy()

class User(db.Model):
    """User model with basic authentication"""
    
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='clinician')
    
    # Account status
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    failed_login_attempts = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def check_password(self, password: str) -> bool:
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'

class Template(db.Model):
    """Clinical documentation template model"""
    
    __tablename__ = 'templates'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    version = db.Column(db.String(20), default='1.0')
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    usage_count = db.Column(db.Integer, default=0)
    
    # Relationships
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert template to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'content': self.content,
            'version': self.version,
            'is_active': self.is_active,
            'usage_count': self.usage_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Template {self.name}>'

class AuditLog(db.Model):
    """Basic audit logging for compliance"""
    
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # User and event information
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    event_type = db.Column(db.String(50), nullable=False)
    action = db.Column(db.String(20), nullable=False)
    resource_type = db.Column(db.String(50))
    resource_id = db.Column(db.String(255))
    
    # Request information
    ip_address = db.Column(db.String(45))
    details = db.Column(db.Text)  # JSON string for now
    
    # Timestamps
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    @classmethod
    def log_event(cls, event_type: str, action: str, user_id: str = None, 
                  resource_type: str = None, resource_id: str = None, 
                  details: str = None, ip_address: str = None):
        """Create an audit log entry"""
        log_entry = cls(
            user_id=user_id,
            event_type=event_type,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address
        )
        
        try:
            db.session.add(log_entry)
            db.session.commit()
        except Exception as e:
            print(f"Failed to create audit log: {e}")
            db.session.rollback()
        
        return log_entry
    
    def to_dict(self):
        """Convert audit log to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_type': self.event_type,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'ip_address': self.ip_address,
            'details': self.details,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
    
    def __repr__(self):
        return f'<AuditLog {self.event_type}:{self.action}>'

# Initialize database helper
def init_database():
    """Initialize database with all tables"""
    db.create_all()
    print("✅ Database tables created successfully")