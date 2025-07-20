from ..extensions import db
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    title = db.Column(db.String(20), nullable=True)
    department = db.Column(db.String(50), nullable=True)
    role = db.Column(db.String(20), nullable=False, default='clinician')
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)
    failed_login_count = db.Column(db.Integer, nullable=False, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)
    last_login = db.Column(db.DateTime, nullable=True)
    password_changed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    mfa_enabled = db.Column(db.Boolean, nullable=False, default=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Multi-user support fields
    account_id = db.Column(db.Integer, nullable=True)  # Group users by account for multi-user support
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Reference to creator
    is_primary = db.Column(db.Boolean, nullable=False, default=False)  # Original account owner
    
    # Self-referential relationship for user creation tracking
    created_users = db.relationship('User', backref=db.backref('creator', remote_side=[id]))

    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        self.password_changed_at = datetime.utcnow()
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def is_locked(self):
        if self.locked_until is None:
            return False
        return datetime.utcnow() < self.locked_until
    
    def increment_failed_login(self):
        self.failed_login_count += 1
        if self.failed_login_count >= 5:
            self.locked_until = datetime.utcnow() + timedelta(minutes=30)
    
    def reset_failed_login(self):
        self.failed_login_count = 0
        self.locked_until = None
        self.last_login = datetime.utcnow()
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': str(self.id),
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'account_id': self.account_id,
            'is_primary': self.is_primary,
            'created_by': str(self.created_by) if self.created_by else None,
        }
        return data
    
    def get_effective_role(self):
        """Get effective role considering development mode privileges"""
        from flask import current_app
        if current_app.config.get('DEVELOPMENT_MODE') and current_app.config.get('DEVELOPMENT_ADMIN_PRIVILEGES'):
            return 'administrator'
        return self.role
