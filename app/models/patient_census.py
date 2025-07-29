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
        """Count of all patients in census (status is irrelevant)"""
        return len(self.rows)
    
    @property
    def admission_count(self):
        """Count of patients admitted today"""
        return len([row for row in self.rows if row.status == 'admission'])
    
    @property
    def discharge_count(self):
        """Count of patients discharged today"""
        return len([row for row in self.rows if row.status == 'discharge'])
    
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
    
    @classmethod
    def create_daily_rollover(cls, target_date, user_id, source_date=None):
        """
        Create a new census for target_date by rolling over from the most recent previous census.
        Carries forward active patients and their daily information.
        """
        from datetime import timedelta
        from .daily_information import DailyInformation
        
        # Find source census (most recent census before target_date)
        if source_date:
            source_census = cls.query.filter_by(census_date=source_date).first()
        else:
            source_census = cls.query.filter(
                cls.census_date < target_date
            ).order_by(cls.census_date.desc()).first()
        
        if not source_census:
            # No previous census, create empty census
            new_census = cls(
                user_id=user_id,
                census_date=target_date,
                facility_name=None,
                unit_name=None,
                total_capacity=None
            )
            db.session.add(new_census)
            db.session.commit()
            return new_census, 0, 0
        
        # Check if target census already exists for this user
        existing_census = cls.query.filter_by(census_date=target_date, user_id=user_id, is_active=True).first()
        if existing_census:
            return existing_census, 0, 0  # Already exists, no rollover needed
        
        # Create new census with same metadata
        new_census = cls(
            user_id=user_id,
            census_date=target_date,
            facility_name=source_census.facility_name,
            unit_name=source_census.unit_name,
            total_capacity=source_census.total_capacity
        )
        db.session.add(new_census)
        db.session.flush()  # Get the ID
        
        patients_carried_over = 0
        daily_info_carried_over = 0
        
        # Copy all patients from source census (status is irrelevant, all patients carry over unless manually deleted)
        for source_row in source_census.rows:
            # Create new patient row
            new_row = PatientCensusRow(
                census_id=new_census.id,
                room_number=source_row.room_number,
                patient_name=source_row.patient_name,
                patient_id=source_row.patient_id,
                status=source_row.status,  # Preserve original status
                data_fields=source_row.data_fields  # Carry over any existing data
            )
            db.session.add(new_row)
            db.session.flush()  # Get the new row ID
            patients_carried_over += 1
            
            # Find and carry over the most recent daily information
            latest_daily_info = DailyInformation.get_latest_for_patient(
                source_row.id, 
                source_census.census_date
            )
            
            if latest_daily_info:
                # Create new daily information entry for the new day
                new_daily_info = DailyInformation(
                    patient_census_row_id=new_row.id,
                    template_id=latest_daily_info.template_id,
                    user_id=user_id,
                    entry_date=target_date,
                    field_values=latest_daily_info.field_values,  # Carry over previous values
                    status='draft',  # Reset to draft for new day
                    notes=f"Carried over from {source_census.census_date}"
                )
                db.session.add(new_daily_info)
                daily_info_carried_over += 1
        
        db.session.commit()
        return new_census, patients_carried_over, daily_info_carried_over
    
    @classmethod
    def get_or_create_today(cls, user_id):
        """Get today's census, creating it via rollover if it doesn't exist"""
        today = date.today()
        today_census = cls.query.filter_by(census_date=today, user_id=user_id, is_active=True).first()
        
        if not today_census:
            today_census, patients, daily_info = cls.create_daily_rollover(today, user_id)
            return today_census, True, patients, daily_info  # True = created via rollover
        
        return today_census, False, 0, 0  # False = already existed
    
    @classmethod
    def cleanup_old_censuses(cls, days_to_keep=7):
        """
        Delete patient censuses older than specified days to prevent database growth.
        
        Args:
            days_to_keep (int): Number of days to keep (default: 7)
            
        Returns:
            dict: Statistics about deleted records
        """
        from datetime import timedelta
        from .daily_information import DailyInformation
        
        cutoff_date = date.today() - timedelta(days=days_to_keep)
        
        # Find old censuses to delete
        old_censuses = cls.query.filter(
            cls.census_date < cutoff_date,
            cls.is_active == True
        ).all()
        
        if not old_censuses:
            return {
                'deleted_censuses': 0,
                'deleted_rows': 0,
                'deleted_daily_info': 0,
                'cutoff_date': cutoff_date.isoformat(),
                'message': f'No censuses older than {days_to_keep} days found'
            }
        
        deleted_censuses = 0
        deleted_rows = 0
        deleted_daily_info = 0
        
        for census in old_censuses:
            # Count rows before deletion
            row_count = len(census.rows)
            deleted_rows += row_count
            
            # Count and delete associated daily information
            for row in census.rows:
                daily_info_count = DailyInformation.query.filter_by(
                    patient_census_row_id=row.id
                ).count()
                deleted_daily_info += daily_info_count
                
                # Delete daily information entries
                DailyInformation.query.filter_by(
                    patient_census_row_id=row.id
                ).delete()
            
            # Delete the census (cascades to rows)
            db.session.delete(census)
            deleted_censuses += 1
        
        db.session.commit()
        
        return {
            'deleted_censuses': deleted_censuses,
            'deleted_rows': deleted_rows,
            'deleted_daily_info': deleted_daily_info,
            'cutoff_date': cutoff_date.isoformat(),
            'message': f'Successfully deleted {deleted_censuses} censuses older than {days_to_keep} days'
        }
    
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
    
    def discharge(self, discharge_date=None, notes=None):
        """Mark patient as discharged and record discharge information"""
        self.status = 'discharged'
        self.updated_at = datetime.utcnow()
        
        # Add discharge information to data fields
        fields = self.data_fields
        fields['discharge_date'] = (discharge_date or datetime.utcnow().date()).isoformat()
        if notes:
            fields['discharge_notes'] = notes
        self.data_fields = fields
    
    def admit(self, admission_date=None, admission_type='routine'):
        """Mark patient as newly admitted"""
        self.status = 'active'  # New admissions become active
        self.updated_at = datetime.utcnow()
        
        # Add admission information to data fields
        fields = self.data_fields
        fields['admission_date'] = (admission_date or datetime.utcnow().date()).isoformat()
        fields['admission_type'] = admission_type
        self.data_fields = fields
    
    def transfer(self, new_room, transfer_reason=None):
        """Transfer patient to new room"""
        old_room = self.room_number
        self.room_number = new_room
        self.updated_at = datetime.utcnow()
        
        # Add transfer information to data fields
        fields = self.data_fields
        fields['last_transfer_date'] = datetime.utcnow().date().isoformat()
        fields['previous_room'] = old_room
        if transfer_reason:
            fields['transfer_reason'] = transfer_reason
        self.data_fields = fields
    
    @classmethod
    def add_admission(cls, census_id, patient_name, room_number, patient_id=None, admission_type='routine'):
        """Add a new patient admission to the census"""
        new_patient = cls(
            census_id=census_id,
            room_number=room_number,
            patient_name=patient_name,
            patient_id=patient_id,
            status='active'
        )
        new_patient.admit(admission_type=admission_type)
        return new_patient
    
    def is_active(self):
        """Check if patient is currently active in census"""
        return self.status == 'active'
    
    def get_length_of_stay(self):
        """Calculate length of stay based on admission date"""
        fields = self.data_fields
        admission_date_str = fields.get('admission_date')
        if admission_date_str:
            try:
                from datetime import datetime as dt
                admission_date = dt.strptime(admission_date_str, '%Y-%m-%d').date()
                today = datetime.utcnow().date()
                return (today - admission_date).days
            except (ValueError, TypeError):
                pass
        return None
    
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