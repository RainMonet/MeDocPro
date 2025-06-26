# app/models/scratch_note.py

from ..extensions import db
from datetime import datetime, timedelta
import json

class ScratchNote(db.Model):
    """
    Temporary clinical notes with 7-day auto-expiration (HIPAA-compliant minimal PHI retention).
    Mimics handwritten scratch notes used during clinical practice.
    """
    __tablename__ = 'scratch_note'
    
    id = db.Column(db.String(36), primary_key=True)  # UUID for security
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Content fields
    title = db.Column(db.String(200), nullable=True)  # Brief title/identifier
    content = db.Column(db.Text, nullable=False)      # Actual scratch notes
    patient_hint = db.Column(db.String(100), nullable=True)  # Room number or minimal identifier
    note_type = db.Column(db.String(50), default='clinical', nullable=False)  # clinical, phone, idea, etc.
    
    # Temporal fields for auto-expiration
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)  # Auto-calculated as created_at + 7 days
    last_modified = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Status and metadata
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    transferred_to_census = db.Column(db.Boolean, default=False, nullable=False)
    promoted_to_permanent = db.Column(db.Boolean, default=False, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('scratch_notes', lazy=True))
    
    def __init__(self, **kwargs):
        super(ScratchNote, self).__init__(**kwargs)
        # Auto-set expiration to 7 days from creation
        if not self.expires_at:
            self.expires_at = (self.created_at or datetime.utcnow()) + timedelta(days=7)
    
    @property
    def age_in_days(self):
        """Calculate how many days old this note is"""
        return (datetime.utcnow() - self.created_at).days
    
    @property
    def days_until_expiration(self):
        """Calculate days remaining until auto-deletion"""
        remaining = self.expires_at - datetime.utcnow()
        return max(0, remaining.days)
    
    @property
    def hours_until_expiration(self):
        """Calculate hours remaining until auto-deletion"""
        remaining = self.expires_at - datetime.utcnow()
        return max(0, remaining.total_seconds() / 3600)
    
    @property
    def is_expired(self):
        """Check if this note has expired"""
        return datetime.utcnow() > self.expires_at
    
    @property
    def visual_age_stage(self):
        """Return visual age stage for UI styling"""
        days = self.age_in_days
        if days <= 1:
            return 'fresh'      # Green
        elif days <= 3:
            return 'aging'      # Yellow
        elif days <= 5:
            return 'mature'     # Orange
        elif days <= 6:
            return 'expiring'   # Red
        else:
            return 'expired'    # Dark red/burnt
    
    def promote_to_permanent(self):
        """Mark this note as promoted to permanent storage"""
        self.promoted_to_permanent = True
        self.last_modified = datetime.utcnow()
    
    def transfer_to_census(self):
        """Mark this note as transferred to patient census"""
        self.transferred_to_census = True
        self.last_modified = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'patient_hint': self.patient_hint,
            'note_type': self.note_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'last_modified': self.last_modified.isoformat() if self.last_modified else None,
            'age_in_days': self.age_in_days,
            'days_until_expiration': self.days_until_expiration,
            'hours_until_expiration': round(self.hours_until_expiration, 1),
            'visual_age_stage': self.visual_age_stage,
            'is_expired': self.is_expired,
            'is_active': self.is_active,
            'transferred_to_census': self.transferred_to_census,
            'promoted_to_permanent': self.promoted_to_permanent
        }
    
    @staticmethod
    def cleanup_expired():
        """Remove all expired scratch notes (called by scheduled job)"""
        expired_notes = ScratchNote.query.filter(ScratchNote.expires_at < datetime.utcnow()).all()
        count = len(expired_notes)
        for note in expired_notes:
            db.session.delete(note)
        db.session.commit()
        return count
    
    def __repr__(self):
        return f'<ScratchNote {self.id} - {self.title or "Untitled"} (expires in {self.days_until_expiration} days)>'