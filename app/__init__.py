from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from datetime import datetime, date
import json

# Initialize extensions
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///medocpro.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    
    # Register blueprints
    from app.routes.documents import documents_bp
    app.register_blueprint(documents_bp)
    
    # Create tables and sample data
    with app.app_context():
        db.create_all()
        create_sample_data()
    
    return app

def create_sample_data():
    """Create sample patients and templates if they don't exist"""
    
    # Import models here to avoid circular imports
    from app.models.patient_data import PatientData
    from app.models.template import Template
    
    # Check if data already exists
    if PatientData.query.first() is not None:
        return
    
    # Create sample patients
    patients = [
        {
            'patient_id': 'DEMO001',
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'date_of_birth': date(1985, 3, 15),
            'gender': 'Female',
            'primary_diagnosis': 'Major Depressive Disorder, Recurrent, Moderate',
            'secondary_diagnoses': json.dumps([
                'Generalized Anxiety Disorder',
                'Insomnia Disorder'
            ]),
            'current_medications': json.dumps([
                'Sertraline 100mg daily',
                'Trazodone 50mg at bedtime',
                'Lorazepam 0.5mg PRN anxiety'
            ]),
            'allergies': 'NKDA',
            'medical_history': 'Hypothyroidism, managed with levothyroxine. History of migraines.',
            'appearance': 'Well-groomed, appropriately dressed',
            'behavior': 'Cooperative, maintains good eye contact',
            'speech': 'Normal rate and rhythm',
            'mood': 'Depressed',
            'affect': 'Congruent, restricted range',
            'thought_process': 'Linear and goal-directed',
            'thought_content': 'Denies current suicidal ideation',
            'perceptions': 'No reported hallucinations',
            'cognition': 'Grossly intact',
            'insight': 'Good',
            'judgment': 'Good',
            'suicide_risk': 'Low',
            'homicide_risk': 'None',
            'risk_factors': 'History of depression, recent job loss, social isolation',
            'protective_factors': 'Strong family support, engaged in treatment, no substance use',
            'treatment_goals': json.dumps([
                'Reduce depressive symptoms',
                'Improve sleep quality',
                'Return to work within 3 months'
            ]),
            'intervention_plan': 'Continue current medications, weekly therapy sessions, monitor for side effects',
            'session_notes': json.dumps([
                {
                    'date': '2025-06-10',
                    'note': 'Patient reports mild improvement in mood. Sleep remains problematic. Discussed coping strategies.'
                },
                {
                    'date': '2025-06-03',
                    'note': 'Initial assessment completed. Started on sertraline. Patient educated about treatment expectations.'
                }
            ])
        },
        {
            'patient_id': 'DEMO002',
            'first_name': 'Michael',
            'last_name': 'Chen',
            'date_of_birth': date(1992, 8, 22),
            'gender': 'Male',
            'primary_diagnosis': 'Bipolar I Disorder, Most Recent Episode Manic',
            'secondary_diagnoses': json.dumps([
                'Alcohol Use Disorder, In Early Remission'
            ]),
            'current_medications': json.dumps([
                'Lithium 600mg twice daily',
                'Quetiapine 200mg at bedtime',
                'Lamotrigine 100mg twice daily'
            ]),
            'allergies': 'Penicillin - rash',
            'medical_history': 'No significant medical history',
            'appearance': 'Casually dressed, appears younger than stated age',
            'behavior': 'Somewhat restless, fidgety during interview',
            'speech': 'Slightly pressured but interruptible',
            'mood': 'Stable',
            'affect': 'Euthymic, full range',
            'thought_process': 'Organized and coherent',
            'thought_content': 'No delusions or obsessions reported',
            'perceptions': 'Denies hallucinations',
            'cognition': 'Alert and oriented x3',
            'insight': 'Improving',
            'judgment': 'Fair',
            'suicide_risk': 'Low',
            'homicide_risk': 'None',
            'risk_factors': 'History of manic episodes, previous substance use',
            'protective_factors': 'Medication compliant, supportive girlfriend, stable housing',
            'treatment_goals': json.dumps([
                'Maintain mood stability',
                'Continue sobriety',
                'Develop better sleep hygiene',
                'Return to college next semester'
            ]),
            'intervention_plan': 'Mood stabilizers, regular monitoring, therapy, substance abuse counseling',
            'session_notes': json.dumps([
                {
                    'date': '2025-06-15',
                    'note': 'Mood remains stable. Lithium levels therapeutic. Discussed stress management techniques.'
                },
                {
                    'date': '2025-06-08',
                    'note': 'Patient doing well on current regimen. Reports good sleep and energy levels.'
                }
            ])
        },
        {
            'patient_id': 'DEMO003',
            'first_name': 'Emma',
            'last_name': 'Rodriguez',
            'date_of_birth': date(1998, 11, 7),
            'gender': 'Female',
            'primary_diagnosis': 'Post-Traumatic Stress Disorder',
            'secondary_diagnoses': json.dumps([
                'Social Anxiety Disorder',
                'Adjustment Disorder with Depressed Mood'
            ]),
            'current_medications': json.dumps([
                'Prazosin 2mg at bedtime',
                'Escitalopram 20mg daily',
                'Hydroxyzine 25mg PRN anxiety'
            ]),
            'allergies': 'Sulfa drugs - Stevens-Johnson syndrome',
            'medical_history': 'Motor vehicle accident 6 months ago with minor injuries',
            'appearance': 'Neat appearance, appropriate dress',
            'behavior': 'Initially guarded, becomes more open during session',
            'speech': 'Soft-spoken, normal rate',
            'mood': 'Anxious',
            'affect': 'Constricted, anxious',
            'thought_process': 'Logical and organized',
            'thought_content': 'Intrusive thoughts about accident, hypervigilance',
            'perceptions': 'Occasional flashbacks, no current hallucinations',
            'cognition': 'Intact, some concentration difficulties',
            'insight': 'Excellent',
            'judgment': 'Good',
            'suicide_risk': 'Low',
            'homicide_risk': 'None',
            'risk_factors': 'Recent trauma, social isolation, nightmares',
            'protective_factors': 'Strong family support, motivated for treatment, good insight',
            'treatment_goals': json.dumps([
                'Reduce PTSD symptoms',
                'Improve sleep quality',
                'Increase social functioning',
                'Return to driving'
            ]),
            'intervention_plan': 'EMDR therapy, medication management, gradual exposure therapy',
            'session_notes': json.dumps([
                {
                    'date': '2025-06-12',
                    'note': 'Completed third EMDR session. Patient reports decreased intensity of flashbacks.'
                },
                {
                    'date': '2025-06-05',
                    'note': 'Started EMDR protocol. Patient tolerated well. Prazosin helping with nightmares.'
                }
            ])
        }
    ]
    
    # Add patients to database
    for patient_data in patients:
        patient = PatientData(**patient_data)
        db.session.add(patient)
    
    # Create sample templates using the Template model method
    Template.create_sample_templates()
    
    try:
        db.session.commit()
        print("Sample data created successfully!")
    except Exception as e:
        db.session.rollback()
        print(f"Error creating sample data: {e}")

# Create the Flask app instance
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)