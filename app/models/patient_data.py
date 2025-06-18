# app/models/patient_data.py

from ..extensions import db
from datetime import datetime

class PatientData(db.Model):
    """Represents patient information for template population - MOCK DATA ONLY"""
    __tablename__ = 'patient_data'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Basic Demographics
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    patient_id = db.Column(db.String(20), unique=True, nullable=False)
    date_of_birth = db.Column(db.Date)
    
    # Clinical Information
    chief_complaint = db.Column(db.Text)
    observation = db.Column(db.Text)
    compliance = db.Column(db.Text)
    current_medications = db.Column(db.Text)
    allergies = db.Column(db.Text)
    
    # Mental Status Exam Fields
    appearance = db.Column(db.Text)
    mood = db.Column(db.String(100))
    affect = db.Column(db.String(100))
    speech = db.Column(db.Text)
    thought_process = db.Column(db.Text)
    thought_content = db.Column(db.Text)
    cognition = db.Column(db.Text)
    insight = db.Column(db.Text)
    judgment = db.Column(db.Text)
    
    # Assessment and Plan
    assessment = db.Column(db.Text)
    treatment_plan = db.Column(db.Text)
    
    # Provider Information
    provider_name = db.Column(db.String(100))
    provider_signature = db.Column(db.String(100))
    
    # Session Details
    date_of_service = db.Column(db.Date, default=datetime.utcnow().date)
    session_type = db.Column(db.String(50))
    session_duration = db.Column(db.Integer)  # minutes
    
    # Progress Notes
    subjective_notes = db.Column(db.Text)
    objective_notes = db.Column(db.Text)
    plan_notes = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # User association (for multi-user environments)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    def __repr__(self):
        return f'<PatientData {self.patient_id}: {self.last_name}, {self.first_name}>'
    
    def to_dict(self):
        """Convert patient data to dictionary for template population"""
        return {
            'patient_id': self.patient_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'patient_name': f"{self.last_name}, {self.first_name}",
            'date_of_birth': self.date_of_birth.strftime('%m/%d/%Y') if self.date_of_birth else '',
            'chief_complaint': self.chief_complaint or '',
            'observation': self.observation or '',
            'compliance': self.compliance or '',
            'current_medications': self.current_medications or '',
            'allergies': self.allergies or '',
            'appearance': self.appearance or '',
            'mood': self.mood or '',
            'affect': self.affect or '',
            'speech': self.speech or '',
            'thought_process': self.thought_process or '',
            'thought_content': self.thought_content or '',
            'cognition': self.cognition or '',
            'insight': self.insight or '',
            'judgment': self.judgment or '',
            'assessment': self.assessment or '',
            'treatment_plan': self.treatment_plan or '',
            'provider_name': self.provider_name or '',
            'provider_signature': self.provider_signature or '',
            'date_of_service': self.date_of_service.strftime('%m/%d/%Y') if self.date_of_service else '',
            'session_type': self.session_type or '',
            'session_duration': str(self.session_duration) if self.session_duration else '',
            'subjective_notes': self.subjective_notes or '',
            'objective_notes': self.objective_notes or '',
            'plan_notes': self.plan_notes or ''
        }