# migrate_ai_automation.py - Database migration for AI automation features

#!/usr/bin/env python3
"""
Database migration script for AI automation features.
Run this script to add PatientData model and enhance Template model.
"""

import os
import sys
from datetime import datetime, date
from werkzeug.security import generate_password_hash

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models import Template, PatientData, User

def create_sample_patient_data():
    """Create sample patient data for testing (MOCK DATA ONLY - HIPAA COMPLIANT)"""
    print("Creating sample patient data...")
    
    sample_patients = [
        {
            'patient_id': 'DEMO001',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'date_of_birth': date(1985, 6, 15),
            'chief_complaint': 'Patient reports feeling anxious and having difficulty sleeping over the past two weeks.',
            'observation': 'Patient appears well-groomed and appropriately dressed. Eye contact is good.',
            'compliance': 'Patient reports good medication compliance with current antidepressant regimen.',
            'current_medications': 'Sertraline 50mg daily, Lorazepam 0.5mg PRN anxiety',
            'allergies': 'NKDA',
            'appearance': 'Well-groomed, appropriate dress, good hygiene',
            'mood': 'Anxious',
            'affect': 'Congruent with stated mood, somewhat restricted',
            'speech': 'Normal rate and volume, clear articulation',
            'thought_process': 'Linear and goal-directed',
            'thought_content': 'Denies suicidal or homicidal ideation. Some rumination about work stress.',
            'cognition': 'Alert and oriented x3, memory intact',
            'insight': 'Good - acknowledges anxiety symptoms and need for treatment',
            'judgment': 'Fair - making appropriate decisions regarding self-care',
            'assessment': 'Generalized anxiety disorder, responding well to current treatment with some residual symptoms.',
            'treatment_plan': 'Continue current medication regimen. Increase therapy sessions to weekly. Consider mindfulness techniques.',
            'provider_name': 'Dr. Sarah Johnson, MD',
            'provider_signature': 'Dr. Sarah Johnson',
            'session_type': 'Follow-up',
            'session_duration': 50,
            'subjective_notes': 'Patient reports improvement in anxiety symptoms but still having some sleep difficulties.',
            'objective_notes': 'MSE as noted above. Patient engaged throughout session.',
            'plan_notes': 'Continue current medications, increase therapy frequency, sleep hygiene education.'
        },
        {
            'patient_id': 'DEMO002',
            'first_name': 'Robert',
            'last_name': 'Johnson',
            'date_of_birth': date(1978, 3, 22),
            'chief_complaint': 'Persistent low mood and loss of interest in activities for the past month.',
            'observation': 'Patient appears tired with poor eye contact. Minimal grooming effort noted.',
            'compliance': 'Patient admits to missing doses of medication occasionally.',
            'current_medications': 'Fluoxetine 20mg daily',
            'allergies': 'Penicillin - rash',
            'appearance': 'Disheveled, poor grooming, appears fatigued',
            'mood': 'Depressed',
            'affect': 'Flat, limited range',
            'speech': 'Slow rate, low volume, minimal spontaneous speech',
            'thought_process': 'Slowed, some circumstantial thinking',
            'thought_content': 'Passive suicidal ideation without plan or intent. No homicidal ideation.',
            'cognition': 'Alert and oriented x3, concentration mildly impaired',
            'insight': 'Limited - minimizes severity of symptoms',
            'judgment': 'Impaired regarding medication compliance',
            'assessment': 'Major depressive disorder, moderate severity, with poor medication compliance.',
            'treatment_plan': 'Medication compliance counseling. Consider medication adjustment. Weekly therapy sessions.',
            'provider_name': 'Dr. Michael Chen, MD',
            'provider_signature': 'Dr. Michael Chen',
            'session_type': 'Follow-up',
            'session_duration': 45,
            'subjective_notes': 'Patient reports worsening mood and decreased energy levels.',
            'objective_notes': 'MSE significant for depressed mood and psychomotor retardation.',
            'plan_notes': 'Increase fluoxetine to 40mg daily, emphasize medication compliance, safety planning.'
        },
        {
            'patient_id': 'DEMO003',
            'first_name': 'Maria',
            'last_name': 'Garcia',
            'date_of_birth': date(1992, 11, 8),
            'chief_complaint': 'First episode of panic attacks occurring 2-3 times per week.',
            'observation': 'Patient appears anxious and hypervigilant. Frequent fidgeting noted.',
            'compliance': 'New patient - no prior psychiatric medications.',
            'current_medications': 'None',
            'allergies': 'NKDA',
            'appearance': 'Well-groomed, appropriate dress, appears anxious',
            'mood': 'Anxious and fearful',
            'affect': 'Anxious, labile',
            'speech': 'Rapid rate, increased volume when discussing symptoms',
            'thought_process': 'Racing thoughts, flight of ideas when anxious',
            'thought_content': 'Preoccupied with fear of having another panic attack. Denies SI/HI.',
            'cognition': 'Alert and oriented x3, attention somewhat distractible',
            'insight': 'Good - understands connection between symptoms and stress',
            'judgment': 'Good - seeking appropriate treatment',
            'assessment': 'Panic disorder, new onset, likely related to recent life stressors.',
            'treatment_plan': 'Initiate sertraline 25mg daily. Psychoeducation about panic disorder. CBT referral.',
            'provider_name': 'Dr. Emily Rodriguez, MD',
            'provider_signature': 'Dr. Emily Rodriguez',
            'session_type': 'Initial Evaluation',
            'session_duration': 60,
            'subjective_notes': 'Patient describes sudden onset of intense fear with physical symptoms.',
            'objective_notes': 'Patient demonstrates symptoms of anxiety during interview.',
            'plan_notes': 'Start SSRI, provide panic disorder education materials, schedule follow-up in 2 weeks.'
        }
    ]
    
    for patient_data in sample_patients:
        # Check if patient already exists
        existing = PatientData.query.filter_by(patient_id=patient_data['patient_id']).first()
        if not existing:
            patient = PatientData(**patient_data)
            db.session.add(patient)
            print(f"Added sample patient: {patient_data['patient_id']}")
    
    db.session.commit()
    print("Sample patient data created successfully.")

def enhance_existing_templates():
    """Add AI enhancement zones to existing templates"""
    print("Enhancing existing templates with AI zones...")
    
    templates = Template.query.all()
    for template in templates:
        if '{{BEGIN_CLAUDE}}' not in template.content and '{{BEGIN_AI}}' not in template.content:
            # Add AI enhancement zone to subjective/assessment sections
            enhanced_content = template.content
            
            # Look for common patterns to enhance
            if 'SUBJECTIVE:' in enhanced_content:
                enhanced_content = enhanced_content.replace(
                    'SUBJECTIVE:\n{{subjective_notes}}',
                    'SUBJECTIVE:\n{{BEGIN_AI}}{{subjective_notes}}{{END_AI}}'
                )
            
            if 'ASSESSMENT:' in enhanced_content:
                enhanced_content = enhanced_content.replace(
                    'ASSESSMENT:\n{{assessment}}',
                    'ASSESSMENT:\n{{BEGIN_AI}}{{assessment}}{{END_AI}}'
                )
            
            if enhanced_content != template.content:
                template.content = enhanced_content
                template.ai_enhanced = True
                print(f"Enhanced template: {template.name}")
    
    db.session.commit()
    print("Template enhancement completed.")

def run_migration():
    """Run the complete migration process"""
    app = create_app()
    
    with app.app_context():
        try:
            print("Starting AI automation migration...")
            
            # Create all tables
            print("Creating database tables...")
            db.create_all()
            
            # Create sample patient data
            create_sample_patient_data()
            
            # Enhance existing templates
            enhance_existing_templates()
            
            print("Migration completed successfully!")
            print("\nNext steps:")
            print("1. Ensure Ollama is installed and running with mistral:latest model")
            print("2. Add environment variables:")
            print("   - OLLAMA_API_URL=http://localhost:11434 (optional, defaults to this)")
            print("   - OLLAMA_MODEL=mistral:latest (optional, defaults to this)")
            print("3. Register the documents blueprint in your Flask app")
            print("4. Test the AI automation modal in your frontend")
            
        except Exception as e:
            print(f"Migration failed: {str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    run_migration()