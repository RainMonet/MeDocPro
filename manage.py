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
    from app.models import db, User, Template, AuditLog, ScratchNote, PatientCensus, PatientCensusRow
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
            tables = ['user', 'template', 'audit_log', 'scratch_note', 'patient_census', 'patient_census_row']
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
            
            click.echo(f"Database Statistics:")
            click.echo(f"   Users: {user_count}")
            click.echo(f"   Templates: {template_count}")
            click.echo(f"   Audit Logs: {audit_count}")
            click.echo(f"   Scratch Notes: {scratch_note_count}")
            click.echo(f"   Patient Censuses: {census_count}")
            
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

if __name__ == '__main__':
    cli()