#!/usr/bin/env python3
"""
Debug script to check patient data in database
"""

import sys
import os
from datetime import datetime, timedelta

# Add the project root to Python path
sys.path.insert(0, os.getcwd())

try:
    from app import create_app
    from app.models import db, PatientCensus, PatientCensusRow, User
    
    app = create_app()
    
    with app.app_context():
        print("=== Database Patient Data Debug ===")
        
        # Check all users
        users = User.query.all()
        print(f"\nTotal users in database: {len(users)}")
        for user in users:
            print(f"  - {user.email} ({user.first_name} {user.last_name}) - Role: {user.role}")
        
        # Check all census records
        censuses = PatientCensus.query.all()
        print(f"\nTotal census records: {len(censuses)}")
        for census in censuses[-5:]:  # Show last 5
            patient_count = len(census.rows)
            print(f"  - {census.census_date} (User: {census.user_id}) - {patient_count} patients")
        
        # Check recent census records (last 3 days)
        recent_date = datetime.now().date() - timedelta(days=3)
        recent_censuses = PatientCensus.query.filter(PatientCensus.census_date >= recent_date).all()
        print(f"\nRecent census records (last 3 days): {len(recent_censuses)}")
        
        for census in recent_censuses:
            user = User.query.get(census.user_id)
            patient_count = PatientCensusRow.query.filter_by(census_id=census.id).count()
            print(f"  - {census.census_date} ({user.email if user else 'Unknown user'}) - {patient_count} patients")
            
            # Show some patients from this census
            patients = PatientCensusRow.query.filter_by(census_id=census.id).limit(3).all()
            for patient in patients:
                print(f"    * {patient.patient_name} (ID: {patient.patient_id}) - {patient.status}")
        
        # Check today's data specifically
        today = datetime.now().date()
        today_censuses = PatientCensus.query.filter_by(census_date=today).all()
        print(f"\nToday's census records ({today}): {len(today_censuses)}")
        
        for census in today_censuses:
            user = User.query.get(census.user_id)
            patient_count = PatientCensusRow.query.filter_by(census_id=census.id).count()
            print(f"  - User: {user.email if user else 'Unknown'} - {patient_count} patients")
        
        # Check yesterday's data
        yesterday = today - timedelta(days=1)
        yesterday_censuses = PatientCensus.query.filter_by(census_date=yesterday).all()
        print(f"\nYesterday's census records ({yesterday}): {len(yesterday_censuses)}")
        
        for census in yesterday_censuses:
            user = User.query.get(census.user_id)
            patient_count = PatientCensusRow.query.filter_by(census_id=census.id).count()
            print(f"  - User: {user.email if user else 'Unknown'} - {patient_count} patients")
            
            # Show some patients from yesterday
            patients = PatientCensusRow.query.filter_by(census_id=census.id).limit(5).all()
            for patient in patients:
                print(f"    * {patient.patient_name} (ID: {patient.patient_id}) - {patient.status}")
        
        print(f"\n=== Total PatientCensusRow records: {PatientCensusRow.query.count()} ===")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()