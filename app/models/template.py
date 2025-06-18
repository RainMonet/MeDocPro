# app/models/template.py - Enhanced version with AI support

from ..extensions import db
from datetime import datetime
import json

class Template(db.Model):
    """Enhanced template model with AI enhancement support."""
    __tablename__ = 'template'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    
    # New fields for enhanced functionality
    category = db.Column(db.String(50), default='custom')
    description = db.Column(db.Text)
    
    # AI Enhancement settings
    ai_enhanced = db.Column(db.Boolean, default=False)
    default_ai_settings = db.Column(db.JSON)  # Store default AI settings as JSON
    
    # Template metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Template usage tracking
    usage_count = db.Column(db.Integer, default=0)
    last_used = db.Column(db.DateTime)
    
    # Template status
    is_active = db.Column(db.Boolean, default=True)
    is_public = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<Template {self.name}>'
    
    def get_ai_settings(self):
        """Get default AI settings for this template."""
        if self.default_ai_settings:
            return self.default_ai_settings
        return {
            'enabled': True,
            'percentage': 80,
            'tone': 'formal'
        }
    
    def set_ai_settings(self, settings):
        """Set default AI settings for this template."""
        self.default_ai_settings = settings
    
    def increment_usage(self):
        """Increment usage counter and update last used timestamp."""
        self.usage_count = (self.usage_count or 0) + 1
        self.last_used = datetime.utcnow()
    
    def to_dict(self):
        """Convert template to dictionary for API responses."""
        return {
            'id': self.id,
            'name': self.name,
            'content': self.content,
            'category': self.category,
            'description': self.description,
            'ai_enhanced': self.ai_enhanced,
            'default_ai_settings': self.get_ai_settings(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'usage_count': self.usage_count or 0,
            'last_used': self.last_used.isoformat() if self.last_used else None,
            'is_active': self.is_active,
            'is_public': self.is_public
        }