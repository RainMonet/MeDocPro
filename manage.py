#!/usr/bin/env python3
"""
MeDocPro Database Management CLI
Provides command-line tools for database initialization, user management, and maintenance
"""

import os
import sys
import click
from datetime import datetime
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import after path setup
try:
    from app import create_app
    from app.models import db, User, Template, AuditLog, ScratchNote, PatientCensus, PatientCensusRow, DailyInformation, SavedDocument
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Please ensure the application factory 'create_app' exists and dependencies are installed.")
    sys.exit(1)

# Create the Flask app instance using the factory
app = create_app()

@click.group()
def cli():
    """MeDocPro Database Management CLI"""
    pass

@cli.command()
def init_database():
    """Initialize the database with all required tables"""
    click.echo("Initializing MeDocPro database...")
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            click.echo("Database tables created successfully")
            
            # Create default data
            create_default_data()
            
            click.echo("Database initialization complete")
            
        except Exception as e:
            click.echo(f"Database initialization failed: {e}")
            sys.exit(1)

def create_default_data():
    """Create default data like sample templates"""
    
    # Create sample templates if none exist
    if Template.query.count() == 0:
        click.echo("Creating default clinical templates...")
        
        templates = [
            {
                'name': 'Psychiatric Progress Note',
                'content': '''PSYCHIATRIC PROGRESS NOTE

Date: {{date_of_service}}
Patient: {{patient_name}}
Provider: {{provider_name}}

SUBJECTIVE:
{{subjective_notes}}

OBJECTIVE:
Mental Status Exam:
- Appearance: {{appearance}}
- Mood: {{mood}}
- Affect: {{affect}}
- Speech: {{speech}}
- Thought Process: {{thought_process}}
- Thought Content: {{thought_content}}
- Cognition: {{cognition}}
- Insight: {{insight}}
- Judgment: {{judgment}}

ASSESSMENT:
{{assessment}}

PLAN:
{{treatment_plan}}

Provider: {{provider_signature}}'''
            },
            {
                'name': 'Mental Status Examination',
                'content': '''MENTAL STATUS EXAMINATION

Date: {{date_of_service}}
Patient: {{patient_name}}
Examiner: {{examiner_name}}

APPEARANCE:
{{appearance_description}}

BEHAVIOR:
{{behavior_observations}}

SPEECH:
Rate: {{speech_rate}}
Volume: {{speech_volume}}
Fluency: {{speech_fluency}}

MOOD: {{mood_reported}}
AFFECT: {{affect_observed}}

THOUGHT PROCESS:
{{thought_process_description}}

THOUGHT CONTENT:
{{thought_content_findings}}

PERCEPTUAL DISTURBANCES:
{{perceptual_findings}}

COGNITIVE ASSESSMENT:
Orientation: {{orientation_status}}
Attention: {{attention_assessment}}
Memory: {{memory_assessment}}
Abstract Thinking: {{abstract_thinking}}

INSIGHT: {{insight_level}}
JUDGMENT: {{judgment_assessment}}

SUMMARY:
{{mse_summary}}

Examiner: {{examiner_signature}}'''
            },
            {
                'name': 'Treatment Plan Template',
                'content': '''TREATMENT PLAN

Patient: {{patient_name}}
Date: {{plan_date}}
Provider: {{provider_name}}

CLINICAL DIAGNOSIS:
Primary: {{primary_diagnosis}}
Secondary: {{secondary_diagnosis}}

TREATMENT GOALS:
1. {{goal_1}}
2. {{goal_2}}
3. {{goal_3}}

INTERVENTIONS:
Psychotherapy: {{therapy_type}}
Frequency: {{therapy_frequency}}

Medications: {{medication_plan}}

Psychosocial Interventions: {{psychosocial_interventions}}

MEASURABLE OBJECTIVES:
{{measurable_objectives}}

TARGET DATES:
Short-term (30 days): {{short_term_targets}}
Medium-term (90 days): {{medium_term_targets}}
Long-term (6 months): {{long_term_targets}}

DISCHARGE CRITERIA:
{{discharge_criteria}}

Provider: {{provider_signature}}
Date: {{signature_date}}'''
            }
        ]
        
        for template_data in templates:
            template = Template(
                name=template_data['name'],
                content=template_data['content']
            )
            db.session.add(template)
        
        db.session.commit()
        click.echo(f"Created {len(templates)} default templates")

@cli.command()
@click.option('--username', prompt=True, help='Administrator username')
@click.option('--email', prompt=True, help='Administrator email')
@click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True, help='Administrator password')
def create_admin(username, email, password):
    """Create an administrator user"""
    click.echo("Creating administrator user...")
    
    with app.app_context():
        try:
            # Check if user already exists
            existing_user = User.query.filter(
                (User.username == username) | (User.email == email)
            ).first()
            
            if existing_user:
                click.echo(f"User with username '{username}' or email '{email}' already exists")
                return
            
            # Create admin user
            admin_user = User(
                username=username,
                email=email,
                password_hash=generate_password_hash(password)
            )
            
            db.session.add(admin_user)
            db.session.commit()
            
            click.echo(f"Administrator user '{username}' created successfully")
            click.echo("Please log in and change the password immediately")
            
        except Exception as e:
            click.echo(f"Failed to create administrator: {e}")
            db.session.rollback()

@cli.command()
def list_users():
    """List all users in the system"""
    click.echo("System Users:")
    
    with app.app_context():
        try:
            users = User.query.all()
            
            if not users:
                click.echo("No users found")
                return
            
            click.echo(f"{'Username':<20} {'Email':<30} {'Created'}")
            click.echo("-" * 65)
            
            for user in users:
                created_date = user.created_at.strftime('%Y-%m-%d') if user.created_at else "Unknown"
                click.echo(f"{user.username:<20} {user.email:<30} {created_date}")
            
        except Exception as e:
            click.echo(f"Failed to list users: {e}")

@cli.command()
def check_database():
    """Check database connection and integrity"""
    click.echo("Checking database status...")
    
    with app.app_context():
        try:
            # Test basic connection
            result = db.session.execute(db.text('SELECT 1')).scalar()
            if result == 1:
                click.echo("Database connection successful")
            
            # Check table existence
            tables = ['user', 'template', 'audit_log', 'scratch_note', 'patient_census', 'patient_census_row', 'daily_information']
            for table in tables:
                try:
                    db.session.execute(db.text(f'SELECT COUNT(*) FROM {table}')).scalar()
                    click.echo(f"Table '{table}' exists and accessible")
                except Exception:
                    click.echo(f"Table '{table}' missing or inaccessible")
            
            # Count records
            user_count = User.query.count()
            template_count = Template.query.count()
            audit_count = AuditLog.query.count()
            scratch_note_count = ScratchNote.query.count() if 'scratch_note' in [t.name for t in db.metadata.tables.values()] else 0
            census_count = PatientCensus.query.count() if 'patient_census' in [t.name for t in db.metadata.tables.values()] else 0
            daily_info_count = DailyInformation.query.count() if 'daily_information' in [t.name for t in db.metadata.tables.values()] else 0
            
            click.echo(f"Database Statistics:")
            click.echo(f"   Users: {user_count}")
            click.echo(f"   Templates: {template_count}")
            click.echo(f"   Audit Logs: {audit_count}")
            click.echo(f"   Scratch Notes: {scratch_note_count}")
            click.echo(f"   Patient Censuses: {census_count}")
            click.echo(f"   Daily Information Entries: {daily_info_count}")
            
        except Exception as e:
            click.echo(f"Database check failed: {e}")

@cli.command()
def show_config():
    """Show current configuration"""
    click.echo("Current Configuration:")
    click.echo(f"Database URL: {os.getenv('DATABASE_URL', 'Not set')}")
    click.echo(f"Flask Environment: {os.getenv('FLASK_ENV', 'Not set')}")
    click.echo(f"Debug Mode: {os.getenv('DEBUG', 'Not set')}")
    click.echo(f"Secret Key: {'Set' if os.getenv('SECRET_KEY') else 'Not set'}")

@cli.command()
@click.option('--target-date', help='Target date for rollover (YYYY-MM-DD). Defaults to today')
@click.option('--user-id', type=int, help='User ID to perform rollover for. If not specified, performs for all users')
@click.option('--dry-run', is_flag=True, help='Show what would be done without making changes')
def daily_rollover(target_date, user_id, dry_run):
    """Perform daily census and information rollover"""
    from datetime import datetime as dt
    click.echo("MeDocPro Daily Rollover Operation")
    click.echo("=" * 40)
    
    with app.app_context():
        try:
            # Parse target date
            if target_date:
                try:
                    target_date = dt.strptime(target_date, '%Y-%m-%d').date()
                except ValueError:
                    click.echo("Error: Invalid date format. Use YYYY-MM-DD")
                    return
            else:
                target_date = datetime.today().date()
            
            click.echo(f"Target date: {target_date}")
            
            # Get users to process
            if user_id:
                users = [User.query.get(user_id)]
                if not users[0]:
                    click.echo(f"Error: User {user_id} not found")
                    return
            else:
                users = User.query.all()
            
            click.echo(f"Processing {len(users)} user(s)")
            
            total_patients = 0
            total_daily_info = 0
            
            for user in users:
                click.echo(f"\nProcessing user: {user.username} (ID: {user.id})")
                
                if dry_run:
                    # Check what would happen
                    existing_census = PatientCensus.query.filter_by(
                        user_id=user.id,
                        census_date=target_date
                    ).first()
                    
                    if existing_census:
                        click.echo(f"  - Census for {target_date} already exists ({len(existing_census.rows)} patients)")
                        continue
                    
                    # Find source census
                    source_census = PatientCensus.query.filter(
                        PatientCensus.user_id == user.id,
                        PatientCensus.census_date < target_date
                    ).order_by(PatientCensus.census_date.desc()).first()
                    
                    if source_census:
                        active_patients = len([r for r in source_census.rows if r.status == 'active'])
                        click.echo(f"  - Would rollover {active_patients} patients from {source_census.census_date}")
                        
                        # Count daily info that would be carried over
                        daily_info_count = 0
                        for row in source_census.rows:
                            if row.status == 'active':
                                latest_info = DailyInformation.get_latest_for_patient(row.id, source_census.census_date)
                                if latest_info:
                                    daily_info_count += 1
                        
                        click.echo(f"  - Would carry over {daily_info_count} daily information entries")
                    else:
                        click.echo(f"  - No previous census found, would create empty census")
                else:
                    # Perform actual rollover
                    census, patients_carried, daily_info_carried = PatientCensus.create_daily_rollover(
                        target_date, user.id
                    )
                    
                    click.echo(f"  - Rollover completed: {patients_carried} patients, {daily_info_carried} daily info entries")
                    total_patients += patients_carried
                    total_daily_info += daily_info_carried
            
            if not dry_run:
                click.echo(f"\nRollover Summary:")
                click.echo(f"  Total patients carried over: {total_patients}")
                click.echo(f"  Total daily info entries carried over: {total_daily_info}")
                click.echo("  Operation completed successfully!")
            else:
                click.echo(f"\nDry run completed. Use --dry-run=false to perform actual rollover.")
                
        except Exception as e:
            click.echo(f"Rollover failed: {e}")
            if not dry_run:
                db.session.rollback()

@cli.command()
@click.option('--days', default=30, help='Number of days of history to show')
def census_stats(days):
    """Show census statistics and rollover history"""
    click.echo("MeDocPro Census Statistics")
    click.echo("=" * 30)
    
    with app.app_context():
        try:
            from datetime import timedelta
            
            start_date = datetime.today().date() - timedelta(days=days)
            
            # Get census statistics
            censuses = PatientCensus.query.filter(
                PatientCensus.census_date >= start_date
            ).order_by(PatientCensus.census_date.desc()).all()
            
            if not censuses:
                click.echo("No census data found")
                return
            
            click.echo(f"Census history for last {days} days:")
            click.echo(f"{'Date':<12} {'Patients':<10} {'Users':<8} {'Daily Info':<12}")
            click.echo("-" * 45)
            
            for census in censuses:
                active_patients = len([r for r in census.rows if r.status == 'active'])
                daily_info_count = DailyInformation.query.filter_by(entry_date=census.census_date).count()
                
                click.echo(f"{census.census_date} {active_patients:>8} {census.user_id:>8} {daily_info_count:>10}")
            
            # Summary statistics
            total_unique_patients = len(set(
                row.patient_name for census in censuses for row in census.rows
            ))
            total_daily_entries = DailyInformation.query.filter(
                DailyInformation.entry_date >= start_date
            ).count()
            
            click.echo("-" * 45)
            click.echo(f"Total unique patients: {total_unique_patients}")
            click.echo(f"Total daily info entries: {total_daily_entries}")
            
        except Exception as e:
            click.echo(f"Error retrieving statistics: {e}")

@cli.command()
@click.option('--days', default=7, help='Number of days to keep (default: 7)')
@click.option('--dry-run', is_flag=True, help='Show what would be deleted without making changes')
def cleanup_census(days, dry_run):
    """Clean up old patient census data to prevent database growth"""
    click.echo("MeDocPro Census Cleanup Operation")
    click.echo("=" * 40)
    
    with app.app_context():
        try:
            from datetime import timedelta
            
            cutoff_date = datetime.today().date() - timedelta(days=days)
            click.echo(f"Cleaning up censuses older than {days} days (before {cutoff_date})")
            
            if dry_run:
                # Show what would be deleted
                old_censuses = PatientCensus.query.filter(
                    PatientCensus.census_date < cutoff_date,
                    PatientCensus.is_active == True
                ).all()
                
                if not old_censuses:
                    click.echo(f"No censuses older than {days} days found")
                    return
                
                total_rows = sum(len(census.rows) for census in old_censuses)
                total_daily_info = 0
                
                for census in old_censuses:
                    for row in census.rows:
                        daily_info_count = DailyInformation.query.filter_by(
                            patient_census_row_id=row.id
                        ).count()
                        total_daily_info += daily_info_count
                
                click.echo(f"\nDry run results:")
                click.echo(f"  Censuses to delete: {len(old_censuses)}")
                click.echo(f"  Patient rows to delete: {total_rows}")
                click.echo(f"  Daily info entries to delete: {total_daily_info}")
                click.echo(f"\nOld censuses found:")
                click.echo(f"{'Date':<12} {'User ID':<8} {'Patients':<10}")
                click.echo("-" * 32)
                
                for census in sorted(old_censuses, key=lambda c: c.census_date):
                    click.echo(f"{census.census_date} {census.user_id:>7} {len(census.rows):>8}")
                
                click.echo(f"\nUse --dry-run=false to perform actual cleanup")
                
            else:
                # Perform actual cleanup
                result = PatientCensus.cleanup_old_censuses(days_to_keep=days)
                
                click.echo(f"Cleanup completed successfully!")
                click.echo(f"  Deleted censuses: {result['deleted_censuses']}")
                click.echo(f"  Deleted patient rows: {result['deleted_rows']}")
                click.echo(f"  Deleted daily info entries: {result['deleted_daily_info']}")
                click.echo(f"  Cutoff date: {result['cutoff_date']}")
                click.echo(f"  Message: {result['message']}")
                
        except Exception as e:
            click.echo(f"Cleanup failed: {e}")
            if not dry_run:
                db.session.rollback()

if __name__ == '__main__':
    cli()