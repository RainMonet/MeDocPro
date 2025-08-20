# app/models/daily_information.py

from ..extensions import db
from datetime import datetime, date
import json

# Import encryption utilities for clinical PHI data protection
try:
    from ..security.encryption import encrypt_phi_data, decrypt_phi_data, PHIClassification
    ENCRYPTION_AVAILABLE = True
except ImportError:
    # Graceful fallback if encryption module not available
    ENCRYPTION_AVAILABLE = False
    
    # Define stub functions for development environments without encryption
    def encrypt_phi_data(data, patient_id=None):
        """Stub function when encryption not available"""
        return data
    
    def decrypt_phi_data(data):
        """Stub function when encryption not available"""
        return data

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
        
        # Create a mapping of field values with common aliases
        mapped_values = field_values.copy()
        
        # Add common field mappings
        if 'last_name' in field_values and 'first_name' in field_values:
            # Create patient_name from first and last name
            first_name = field_values.get('first_name', '').strip()
            last_name = field_values.get('last_name', '').strip()
            if first_name and last_name:
                mapped_values['patient_name'] = f"{first_name} {last_name}"
            elif last_name:
                mapped_values['patient_name'] = last_name
            elif first_name:
                mapped_values['patient_name'] = first_name
        
        # Add patient info from census row if available
        if self.patient_census_row:
            if 'patient_name' not in mapped_values:
                mapped_values['patient_name'] = self.patient_census_row.patient_name or ''
            if 'room_number' not in mapped_values:
                mapped_values['room_number'] = self.patient_census_row.room_number or ''
            if 'patient_id' not in mapped_values:
                mapped_values['patient_id'] = str(self.patient_census_row.id)
        
        # Add date of service
        if 'date_of_service' not in mapped_values:
            mapped_values['date_of_service'] = self.entry_date.strftime('%Y-%m-%d') if self.entry_date else ''
        
        # Replace template placeholders with actual values
        for field_name, field_value in mapped_values.items():
            placeholder = f"{{{{{field_name}}}}}"
            if placeholder in content:
                content = content.replace(placeholder, str(field_value) if field_value is not None else "")
        
        # Handle any remaining placeholders by marking them as not filled
        import re
        remaining_placeholders = re.findall(r'\{\{([^}]+)\}\}', content)
        for placeholder_name in remaining_placeholders:
            placeholder = f"{{{{{placeholder_name}}}}}"
            content = content.replace(placeholder, f"[{placeholder_name.replace('_', ' ').title()}]")
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
    
    def to_dict(self, include_populated_content=False, encrypt_phi=None):
        """Convert to dictionary for API responses with optional PHI encryption"""
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
        
        # Apply PHI encryption if requested and available
        if encrypt_phi and ENCRYPTION_AVAILABLE:
            try:
                # Use patient census row ID as encryption context
                patient_context = str(self.patient_census_row_id) if self.patient_census_row_id else 'unknown'
                encrypted_data = encrypt_phi_data(data, patient_context)
                return encrypted_data
            except Exception as e:
                # Log error but return unencrypted data (middleware will handle)
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to encrypt daily information data: {e}")
        
        return data
    
    @classmethod
    def from_dict(cls, data, decrypt_phi=None):
        """Create DailyInformation from dictionary data with optional PHI decryption"""
        # Decrypt PHI data if requested and available
        if decrypt_phi and ENCRYPTION_AVAILABLE:
            try:
                decrypted_data = decrypt_phi_data(data)
                data = decrypted_data
            except Exception as e:
                # Log error but continue with original data
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to decrypt daily information data: {e}")
        
        # Extract field values (may contain encrypted clinical data)
        field_values = data.get('field_values', {})
        
        # Create new daily information entry
        daily_info = cls(
            patient_census_row_id=data.get('patient_census_row_id'),
            template_id=data.get('template_id'),
            user_id=data.get('user_id'),
            entry_date=data.get('entry_date'),
            status=data.get('status', 'draft'),
            notes=data.get('notes'),
            field_values=field_values
        )
        
        return daily_info
    
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