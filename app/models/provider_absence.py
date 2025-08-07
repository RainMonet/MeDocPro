# app/models/provider_absence.py

from ..extensions import db
from datetime import datetime, date
import json

class ProviderAbsence(db.Model):
    """
    Tracks provider time-off periods to pause automated data cleanup
    and ensure patient information persists during extended absences.
    """
    __tablename__ = 'provider_absence'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Provider information
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    provider_name = db.Column(db.String(255), nullable=False)
    
    # Absence period
    start_date = db.Column(db.Date, nullable=False, index=True)
    end_date = db.Column(db.Date, nullable=True, index=True)  # None = indefinite
    planned_return_date = db.Column(db.Date, nullable=True)  # Expected return date
    
    # Absence details
    absence_type = db.Column(db.String(50), nullable=False)  # vacation, medical, emergency, sabbatical, etc.
    reason = db.Column(db.Text, nullable=True)  # Optional reason/notes
    emergency_contact = db.Column(db.String(255), nullable=True)  # Contact info during absence
    
    # Status tracking
    status = db.Column(db.String(20), default='active', nullable=False)  # active, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Data retention settings
    _retention_settings = db.Column('retention_settings', db.Text, nullable=True)
    
    # Relationships
    provider = db.relationship('User', foreign_keys=[user_id], backref=db.backref('provider_absences', lazy=True))
    created_by = db.relationship('User', foreign_keys=[created_by_user_id])
    
    @property
    def retention_settings(self):
        """Get retention settings as dictionary"""
        if self._retention_settings:
            try:
                return json.loads(self._retention_settings)
            except (ValueError, TypeError):
                return self.get_default_retention_settings()
        return self.get_default_retention_settings()
    
    @retention_settings.setter
    def retention_settings(self, value):
        """Set retention settings from dictionary"""
        if value is None:
            self._retention_settings = None
        else:
            self._retention_settings = json.dumps(value)
            self.updated_at = datetime.utcnow()
    
    @classmethod
    def get_default_retention_settings(cls):
        """Default retention settings for provider absences"""
        return {
            'pause_daily_info_cleanup': True,
            'pause_census_cleanup': True,
            'extend_retention_days': 0,  # 0 = indefinite during absence
            'preserve_patient_continuity': True,
            'auto_resume_on_return': True
        }
    
    @property
    def is_active(self):
        """Check if absence is currently active"""
        today = date.today()
        return (
            self.status == 'active' and
            self.start_date <= today and
            (self.end_date is None or self.end_date >= today)
        )
    
    @property
    def days_remaining(self):
        """Calculate days remaining in absence (None if indefinite)"""
        if self.end_date is None:
            return None
        
        today = date.today()
        if self.end_date < today:
            return 0
        
        return (self.end_date - today).days
    
    @property
    def total_days(self):
        """Calculate total days of absence"""
        if self.end_date is None:
            return None
        
        return (self.end_date - self.start_date).days + 1
    
    @property
    def days_elapsed(self):
        """Calculate days elapsed in absence"""
        today = date.today()
        start = max(self.start_date, today) if self.start_date > today else self.start_date
        return (today - start).days + 1 if today >= self.start_date else 0
    
    def is_long_term_absence(self, threshold_days=7):
        """Check if this is a long-term absence (>= threshold days)"""
        if self.end_date is None:
            return True  # Indefinite is considered long-term
        
        total = self.total_days
        return total is not None and total >= threshold_days
    
    def should_pause_cleanup(self):
        """Determine if automated cleanup should be paused"""
        if not self.is_active:
            return False
        
        settings = self.retention_settings
        return settings.get('pause_daily_info_cleanup', True)
    
    def get_extended_retention_days(self):
        """Get number of additional retention days"""
        if not self.is_active:
            return 0
        
        settings = self.retention_settings
        return settings.get('extend_retention_days', 0)
    
    def complete_absence(self):
        """Mark absence as completed"""
        self.status = 'completed'
        self.end_date = date.today()
        self.updated_at = datetime.utcnow()
    
    def cancel_absence(self):
        """Cancel an active absence"""
        self.status = 'cancelled'
        self.updated_at = datetime.utcnow()
    
    def extend_absence(self, new_end_date, reason=None):
        """Extend the absence period"""
        if new_end_date and (self.end_date is None or new_end_date > self.end_date):
            self.end_date = new_end_date
            if reason:
                self.reason = f"{self.reason}\n\nExtended on {date.today()}: {reason}" if self.reason else f"Extended on {date.today()}: {reason}"
            self.updated_at = datetime.utcnow()
    
    @classmethod
    def get_active_absences(cls, user_id=None):
        """Get all currently active absences"""
        query = cls.query.filter_by(status='active')
        
        today = date.today()
        query = query.filter(
            cls.start_date <= today,
            db.or_(cls.end_date.is_(None), cls.end_date >= today)
        )
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        return query.order_by(cls.start_date.desc()).all()
    
    @classmethod
    def is_cleanup_paused_for_provider(cls, user_id):
        """Check if cleanup is paused for a specific provider"""
        active_absences = cls.get_active_absences(user_id)
        return any(absence.should_pause_cleanup() for absence in active_absences)
    
    @classmethod
    def is_any_cleanup_paused(cls):
        """Check if cleanup is paused for any provider"""
        active_absences = cls.get_active_absences()
        return any(absence.should_pause_cleanup() for absence in active_absences)
    
    @classmethod
    def get_max_retention_extension(cls):
        """Get maximum retention extension from all active absences"""
        active_absences = cls.get_active_absences()
        max_extension = 0
        
        for absence in active_absences:
            if absence.should_pause_cleanup():
                extension = absence.get_extended_retention_days()
                if extension == 0:  # 0 means indefinite during absence
                    return None  # Indefinite retention
                max_extension = max(max_extension, extension)
        
        return max_extension if max_extension > 0 else None
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'provider_name': self.provider_name,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'planned_return_date': self.planned_return_date.isoformat() if self.planned_return_date else None,
            'absence_type': self.absence_type,
            'reason': self.reason,
            'emergency_contact': self.emergency_contact,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'retention_settings': self.retention_settings,
            'is_active': self.is_active,
            'days_remaining': self.days_remaining,
            'total_days': self.total_days,
            'days_elapsed': self.days_elapsed,
            'is_long_term': self.is_long_term_absence(),
            'should_pause_cleanup': self.should_pause_cleanup()
        }
    
    def __repr__(self):
        return f'<ProviderAbsence {self.provider_name} ({self.start_date} - {self.end_date or "indefinite"}) - {self.status}>'