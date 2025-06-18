from app import db
from datetime import datetime, date
import json

class PatientData(db.Model):
    __tablename__ = 'patient_data'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.String(20), unique=True, nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(20))
    
    # Clinical Information
    primary_diagnosis = db.Column(db.Text)
    secondary_diagnoses = db.Column(db.Text)  # JSON string
    current_medications = db.Column(db.Text)  # JSON string
    allergies = db.Column(db.Text)
    medical_history = db.Column(db.Text)
    
    # Mental Status
    appearance = db.Column(db.Text)
    behavior = db.Column(db.Text)
    speech = db.Column(db.Text)
    mood = db.Column(db.String(100))
    affect = db.Column(db.String(100))
    thought_process = db.Column(db.Text)
    thought_content = db.Column(db.Text)
    perceptions = db.Column(db.Text)
    cognition = db.Column(db.Text)
    insight = db.Column(db.String(50))
    judgment = db.Column(db.String(50))
    
    # Risk Assessment
    suicide_risk = db.Column(db.String(20))
    homicide_risk = db.Column(db.String(20))
    risk_factors = db.Column(db.Text)
    protective_factors = db.Column(db.Text)
    
    # Treatment Information
    treatment_goals = db.Column(db.Text)  # JSON string
    intervention_plan = db.Column(db.Text)
    session_notes = db.Column(db.Text)  # JSON string for multiple sessions
    
    # Administrative
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<PatientData {self.patient_id}: {self.first_name} {self.last_name}>'
    
    @property
    def age(self):
        today = date.today()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_medications_list(self):
        if self.current_medications:
            try:
                return json.loads(self.current_medications)
            except:
                return []
        return []
    
    def get_secondary_diagnoses_list(self):
        if self.secondary_diagnoses:
            try:
                return json.loads(self.secondary_diagnoses)
            except:
                return []
        return []
    
    def get_treatment_goals_list(self):
        if self.treatment_goals:
            try:
                return json.loads(self.treatment_goals)
            except:
                return []
        return []
    
    def get_session_notes_list(self):
        if self.session_notes:
            try:
                return json.loads(self.session_notes)
            except:
                return []
        return []
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'age': self.age,
            'gender': self.gender,
            'primary_diagnosis': self.primary_diagnosis,
            'secondary_diagnoses': self.get_secondary_diagnoses_list(),
            'current_medications': self.get_medications_list(),
            'allergies': self.allergies,
            'medical_history': self.medical_history,
            'appearance': self.appearance,
            'behavior': self.behavior,
            'speech': self.speech,
            'mood': self.mood,
            'affect': self.affect,
            'thought_process': self.thought_process,
            'thought_content': self.thought_content,
            'perceptions': self.perceptions,
            'cognition': self.cognition,
            'insight': self.insight,
            'judgment': self.judgment,
            'suicide_risk': self.suicide_risk,
            'homicide_risk': self.homicide_risk,
            'risk_factors': self.risk_factors,
            'protective_factors': self.protective_factors,
            'treatment_goals': self.get_treatment_goals_list(),
            'intervention_plan': self.intervention_plan,
            'session_notes': self.get_session_notes_list(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }