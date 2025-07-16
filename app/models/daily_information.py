# app/models/daily_information.py

from ..extensions import db
from datetime import datetime, date
import json

class DailyInformation(db.Model):
    """
    Stores completed daily information entries from templates.
    Links templates with patient data for permanent record keeping.
    """
    __tablename__ = 'daily_information'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign key relationships
    patient_census_row_id = db.Column(db.Integer, db.ForeignKey('patient_census_row.id'), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('template.id'), nullable=True)  # Optional - some entries may not use templates
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Who entered the data
    
    # Entry metadata
    entry_date = db.Column(db.Date, default=date.today, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Data storage - JSON field for flexible field values that map to template placeholders
    _field_values = db.Column('field_values', db.Text, nullable=True)
    
    # Entry status and metadata
    status = db.Column(db.String(20), default='draft', nullable=False)  # draft, completed, reviewed, signed
    notes = db.Column(db.Text, nullable=True)  # Additional notes about this entry
    
    # Relationships
    patient_census_row = db.relationship('PatientCensusRow', backref=db.backref('daily_information_entries', lazy=True))
    template = db.relationship('Template', backref=db.backref('daily_information_entries', lazy=True))
    user = db.relationship('User', backref=db.backref('daily_information_entries', lazy=True))
    
    @property
    def field_values(self):
        """Get field values as dictionary"""
        if self._field_values:
            try:
                return json.loads(self._field_values)
            except (ValueError, TypeError):
                return {}
        return {}
    
    @field_values.setter
    def field_values(self, value):
        """Set field values from dictionary"""
        if value is None:
            self._field_values = None
        else:
            self._field_values = json.dumps(value)
            self.updated_at = datetime.utcnow()
    
    def update_field(self, field_name, field_value):
        """Update a specific field value"""
        fields = self.field_values
        fields[field_name] = field_value
        self.field_values = fields
    
    def remove_field(self, field_name):
        """Remove a specific field value"""
        fields = self.field_values
        if field_name in fields:
            del fields[field_name]
            self.field_values = fields
    
    def get_template_populated_content(self):
        """Get template content with placeholders populated from field values"""
        if not self.template or not self.template.content:
            return None
        
        content = self.template.content
        field_values = self.field_values
        
        # Replace template placeholders with actual values
        for field_name, field_value in field_values.items():
            placeholder = f"{{{{{field_name}}}}}"
            if placeholder in content:
                content = content.replace(placeholder, str(field_value) if field_value is not None else "")
        
        return content
    
    def mark_completed(self):
        """Mark this entry as completed"""
        self.status = 'completed'
        self.updated_at = datetime.utcnow()
    
    def mark_reviewed(self):
        """Mark this entry as reviewed"""
        self.status = 'reviewed'
        self.updated_at = datetime.utcnow()
    
    def mark_signed(self):
        """Mark this entry as signed (final)"""
        self.status = 'signed'
        self.updated_at = datetime.utcnow()
    
    @property
    def is_today(self):
        """Check if this entry is for today"""
        return self.entry_date == date.today()
    
    @property
    def patient_name(self):
        """Get patient name from related census row"""
        return self.patient_census_row.patient_name if self.patient_census_row else None
    
    @property
    def patient_room(self):
        """Get patient room from related census row"""
        return self.patient_census_row.room_number if self.patient_census_row else None
    
    @property
    def template_name(self):
        """Get template name from related template"""
        return self.template.name if self.template else None
    
    def to_dict(self, include_populated_content=False):
        """Convert to dictionary for API responses"""
        data = {
            'id': self.id,
            'patient_census_row_id': self.patient_census_row_id,
            'template_id': self.template_id,
            'user_id': self.user_id,
            'entry_date': self.entry_date.isoformat() if self.entry_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status': self.status,
            'notes': self.notes,
            'field_values': self.field_values,
            'is_today': self.is_today,
            'patient_name': self.patient_name,
            'patient_room': self.patient_room,
            'template_name': self.template_name
        }
        
        if include_populated_content:
            data['populated_content'] = self.get_template_populated_content()
        
        return data
    
    @classmethod
    def get_latest_for_patient(cls, patient_census_row_id, entry_date=None):
        """Get the latest daily information entry for a patient on a specific date"""
        query = cls.query.filter_by(patient_census_row_id=patient_census_row_id)
        
        if entry_date:
            query = query.filter_by(entry_date=entry_date)
        else:
            query = query.filter_by(entry_date=date.today())
        
        return query.order_by(cls.updated_at.desc()).first()
    
    @classmethod
    def get_entries_by_date(cls, entry_date, user_id=None):
        """Get all daily information entries for a specific date"""
        query = cls.query.filter_by(entry_date=entry_date)
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        return query.order_by(cls.created_at.desc()).all()
    
    @classmethod
    def get_patient_history(cls, patient_census_row_id, days=7):
        """Get daily information history for a patient over the last N days"""
        from datetime import timedelta
        start_date = date.today() - timedelta(days=days)
        
        return cls.query.filter(
            cls.patient_census_row_id == patient_census_row_id,
            cls.entry_date >= start_date
        ).order_by(cls.entry_date.desc(), cls.updated_at.desc()).all()
    
    def __repr__(self):
        return f'<DailyInformation {self.entry_date} - {self.patient_name} ({self.status})>'