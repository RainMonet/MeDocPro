#!/usr/bin/env python3
"""
Test script for daily rollover functionality
"""

from app import create_app
from app.models import db, PatientCensus, PatientCensusRow, DailyInformation
from datetime import date, timedelta

app = create_app()

def test_rollover():
    """Test the daily rollover functionality"""
    
    with app.app_context():
        print("Testing Daily Rollover Functionality")
        print("=" * 40)
        
        # Test rollover for tomorrow
        tomorrow = date.today() + timedelta(days=1)
        user_id = 2  # Demo user
        
        print(f"Testing rollover to: {tomorrow}")
        print(f"User ID: {user_id}")
        
        # Check if tomorrow's census already exists
        existing = PatientCensus.query.filter_by(
            user_id=user_id,
            census_date=tomorrow
        ).first()
        
        if existing:
            print(f"Tomorrow's census already exists with {len(existing.rows)} patients")
            return
        
        # Perform rollover
        print("\nPerforming rollover...")
        census, patients_carried, daily_info_carried = PatientCensus.create_daily_rollover(
            tomorrow, user_id
        )
        
        print(f"✅ Rollover completed successfully!")
        print(f"   - Patients carried over: {patients_carried}")
        print(f"   - Daily info entries carried over: {daily_info_carried}")
        print(f"   - New census ID: {census.id}")
        
        # Verify the rollover
        print(f"\nVerifying rollover results...")
        
        # Check patients
        active_patients = [row for row in census.rows if row.status == 'active']
        print(f"   - Active patients in new census: {len(active_patients)}")
        
        # Check daily information
        daily_entries = DailyInformation.query.filter_by(
            entry_date=tomorrow
        ).all()
        print(f"   - Daily information entries for {tomorrow}: {len(daily_entries)}")
        
        # Show sample data
        if daily_entries:
            sample_entry = daily_entries[0]
            print(f"   - Sample entry notes: {sample_entry.notes}")
            print(f"   - Sample field values: {list(sample_entry.field_values.keys())[:3]}")
        
        print(f"\n🎉 Test completed successfully!")

if __name__ == '__main__':
    test_rollover()