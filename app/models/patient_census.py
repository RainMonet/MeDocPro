# app/models/patient_census.py

from ..extensions import db
from datetime import datetime, date
import json

class PatientCensus(db.Model):
    """
    Daily patient census snapshot for template population workflow.
    Represents the current patient list that gets refreshed daily with admissions/discharges.
    """
    __tablename__ = 'patient_census'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Census metadata
    census_date = db.Column(db.Date, default=date.today, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Census configuration
    facility_name = db.Column(db.String(200), nullable=True)
    unit_name = db.Column(db.String(100), nullable=True)
    total_capacity = db.Column(db.Integer, nullable=True)
    
    # Status tracking
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_finalized = db.Column(db.Boolean, default=False, nullable=False)  # Locked for the day
    
    # Relationships
    user = db.relationship('User', backref=db.backref('patient_censuses', lazy=True))
    rows = db.relationship('PatientCensusRow', backref='census', lazy=True, cascade='all, delete-orphan')
    
    @property
    def current_census_count(self):
        """Count of active patients in census"""
        return len([row for row in self.rows if row.status == 'active'])
    
    @property
    def admission_count(self):
        """Count of patients admitted today"""
        return len([row for row in self.rows if row.status == 'admitted'])
    
    @property
    def discharge_count(self):
        """Count of patients discharged today"""
        return len([row for row in self.rows if row.status == 'discharged'])
    
    @property
    def is_today(self):
        """Check if this census is for today"""
        return self.census_date == date.today()
    
    def get_column_headers(self):
        """Get unique column headers from all rows"""
        headers = set()
        for row in self.rows:
            if row.data_fields:
                headers.update(row.data_fields.keys())
        return sorted(list(headers))
    
    def add_patient_row(self, room_number, patient_name, status='active', **data_fields):
        """Add a new patient row to this census"""
        row = PatientCensusRow(
            census_id=self.id,
            room_number=room_number,
            patient_name=patient_name,
            status=status,
            data_fields=data_fields
        )
        self.rows.append(row)
        self.last_updated = datetime.utcnow()
        return row
    
    def finalize_census(self):
        """Lock the census for the day"""
        self.is_finalized = True
        self.last_updated = datetime.utcnow()
    
    def to_dict(self, include_rows=True):
        """Convert to dictionary for API responses"""
        data = {
            'id': self.id,
            'census_date': self.census_date.isoformat() if self.census_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None,
            'facility_name': self.facility_name,
            'unit_name': self.unit_name,
            'total_capacity': self.total_capacity,
            'current_census_count': self.current_census_count,
            'admission_count': self.admission_count,
            'discharge_count': self.discharge_count,
            'is_active': self.is_active,
            'is_finalized': self.is_finalized,
            'is_today': self.is_today,
            'column_headers': self.get_column_headers()
        }
        
        if include_rows:
            data['rows'] = [row.to_dict() for row in self.rows]
        
        return data
    
    def __repr__(self):
        return f'<PatientCensus {self.census_date} - {self.current_census_count} patients>'


class PatientCensusRow(db.Model):
    """
    Individual patient entry in the daily census.
    Contains flexible data fields that map to template placeholders.
    """
    __tablename__ = 'patient_census_row'
    
    id = db.Column(db.Integer, primary_key=True)
    census_id = db.Column(db.Integer, db.ForeignKey('patient_census.id'), nullable=False)
    
    # Basic patient identifiers (minimal PHI)
    room_number = db.Column(db.String(20), nullable=True, index=True)  # Room 312, Bed A, etc.
    patient_name = db.Column(db.String(100), nullable=True)  # Minimal identifier (Last, First initial)
    patient_id = db.Column(db.String(50), nullable=True)     # Medical record number or ID
    
    # Status tracking
    status = db.Column(db.String(20), default='active', nullable=False)  # active, admitted, discharged, transferred
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Flexible data fields for template population
    # Stored as JSON to allow dynamic field mapping
    _data_fields = db.Column('data_fields', db.Text, nullable=True)
    
    @property
    def data_fields(self):
        """Get data fields as dictionary"""
        if self._data_fields:
            try:
                return json.loads(self._data_fields)
            except (ValueError, TypeError):
                return {}
        return {}
    
    @data_fields.setter
    def data_fields(self, value):
        """Set data fields from dictionary"""
        if value is None:
            self._data_fields = None
        else:
            self._data_fields = json.dumps(value)
    
    def update_field(self, field_name, field_value):
        """Update a specific data field"""
        fields = self.data_fields
        fields[field_name] = field_value
        self.data_fields = fields
        self.updated_at = datetime.utcnow()
    
    def remove_field(self, field_name):
        """Remove a specific data field"""
        fields = self.data_fields
        if field_name in fields:
            del fields[field_name]
            self.data_fields = fields
            self.updated_at = datetime.utcnow()
    
    def get_template_data(self):
        """Get data formatted for template population"""
        template_data = {
            'room_number': self.room_number,
            'patient_name': self.patient_name,
            'patient_id': self.patient_id,
            'status': self.status
        }
        
        # Add custom data fields
        if self.data_fields:
            template_data.update(self.data_fields)
        
        return template_data
    
    def populate_from_scratch_note(self, scratch_note):
        """Populate fields from a scratch note (AI-assisted parsing)"""
        # This could be enhanced with AI to parse scratch note content
        # For now, basic implementation
        fields = self.data_fields
        
        # Try to extract common clinical data patterns
        content = scratch_note.content.lower()
        
        # Basic pattern matching (can be enhanced with AI)
        if 'chief complaint:' in content:
            complaint = content.split('chief complaint:')[1].split('\n')[0].strip()
            fields['chief_complaint'] = complaint
        
        if 'assessment:' in content:
            assessment = content.split('assessment:')[1].split('\n')[0].strip()
            fields['assessment'] = assessment
        
        if 'plan:' in content:
            plan = content.split('plan:')[1].split('\n')[0].strip()
            fields['treatment_plan'] = plan
        
        self.data_fields = fields
        self.updated_at = datetime.utcnow()
    
    def discharge(self):
        """Mark patient as discharged"""
        self.status = 'discharged'
        self.updated_at = datetime.utcnow()
    
    def admit(self):
        """Mark patient as newly admitted"""
        self.status = 'admitted'
        self.updated_at = datetime.utcnow()
    
    def transfer(self, new_room):
        """Transfer patient to new room"""
        self.room_number = new_room
        self.status = 'transferred'
        self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'census_id': self.census_id,
            'room_number': self.room_number,
            'patient_name': self.patient_name,
            'patient_id': self.patient_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'data_fields': self.data_fields,
            'template_data': self.get_template_data()
        }
    
    def __repr__(self):
        return f'<PatientCensusRow {self.room_number} - {self.patient_name} ({self.status})>'