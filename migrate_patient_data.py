#!/usr/bin/env python3
"""
Patient Data Migration Script
Migrates patient data from patient_data.json to the main database
"""

import json
import os
import sys
from datetime import datetime

def migrate_patient_data():
    """Migrate patient data from file to database"""
    try:
        # Add the project root to Python path
        sys.path.insert(0, os.getcwd())
        
        print("Starting patient data migration...")
        
        # Import after path setup
        from app import create_app
        from app.models import db, PatientCensus, PatientCensusRow, User
        
        app = create_app()
        
        with app.app_context():
            # Check if we already have patient data
            existing_count = PatientCensusRow.query.count()
            if existing_count > 0:
                print(f'Database already has {existing_count} patient records. Skipping migration.')
                return True
            
            # Check if patient_data.json exists
            if not os.path.exists('patient_data.json'):
                print('No patient_data.json file found.')
                return True
            
            # Load patient data from file
            try:
                with open('patient_data.json', 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    patients = data.get('patients', [])
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                print(f'Error reading patient_data.json: {e}')
                return False
            
            if not patients:
                print('No patient data found in file.')
                return True
            
            print(f'Found {len(patients)} patients in file.')
            
            # Get or create demo user
            demo_user = User.query.filter_by(email='demo@medocpro.com').first()
            if not demo_user:
                print('Demo user not found. Creating demo user...')
                demo_user = User(
                    email='demo@medocpro.com',
                    password_hash='pbkdf2:sha256:260000$demo$demo',  # password: demo123
                    first_name='Demo',
                    last_name='User',
                    role='psychiatrist',
                    is_active=True
                )
                db.session.add(demo_user)
                db.session.commit()
                print('Demo user created.')
            
            # Create today's census
            today = datetime.now().date()
            census = PatientCensus.query.filter_by(
                user_id=demo_user.id, 
                census_date=today
            ).first()
            
            if not census:
                census = PatientCensus(
                    user_id=demo_user.id,
                    census_date=today,
                    total_patients=len(patients),
                    is_active=True
                )
                db.session.add(census)
                db.session.flush()
                print(f'Created census for {today} with {len(patients)} patients.')
            else:
                print(f'Census for {today} already exists.')
            
            # Add patient rows
            migrated_count = 0
            for patient in patients:
                try:
                    # Check if patient already exists
                    existing_patient = PatientCensusRow.query.filter_by(
                        census_id=census.id,
                        patient_id=patient.get('patient_id', '')
                    ).first()
                    
                    if not existing_patient:
                        patient_row = PatientCensusRow(
                            census_id=census.id,
                            patient_name=patient.get('patient_name', ''),
                            patient_id=patient.get('patient_id', ''),
                            room_number=patient.get('room_number', ''),
                            workflow_type=patient.get('workflow_type', 'follow-up'),
                            data_fields=patient.get('data_fields', {})
                        )
                        db.session.add(patient_row)
                        migrated_count += 1
                except Exception as e:
                    print(f'Error adding patient {patient.get("patient_name", "Unknown")}: {e}')
                    continue
            
            if migrated_count > 0:
                db.session.commit()
                print(f'Successfully migrated {migrated_count} patients to database.')
            else:
                print('No new patients to migrate.')
            
            return True
                    
    except ImportError as e:
        print(f'Import error: {e}')
        print('Make sure you are running from the correct directory with proper dependencies.')
        return False
    except Exception as e:
        print(f'Migration failed: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = migrate_patient_data()
    sys.exit(0 if success else 1)