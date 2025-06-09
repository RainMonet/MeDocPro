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
    from app import app, db
    from models import User, Template, AuditLog
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Please ensure all required files are present and dependencies are installed")
    sys.exit(1)

@click.group()
def cli():
    """MeDocPro Database Management CLI"""
    pass

@cli.command()
def init_database():
    """Initialize the database with all required tables"""
    click.echo("🔧 Initializing MeDocPro database...")
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            click.echo("✅ Database tables created successfully")
            
            # Create default roles if they don't exist
            create_default_data()
            
            click.echo("✅ Database initialization complete")
            
        except Exception as e:
            click.echo(f"❌ Database initialization failed: {e}")
            sys.exit(1)

def create_default_data():
    """Create default data like roles and sample templates"""
    
    # Create sample templates if none exist
    if Template.query.count() == 0:
        click.echo("📝 Creating default clinical templates...")
        
        templates = [
            {
                'name': 'Psychiatric Progress Note',
                'category': 'progress',
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

Provider: {{provider_signature}}''',
                'version': '1.0',
                'is_active': True
            },
            {
                'name': 'Mental Status Examination',
                'category': 'assessment',
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

Examiner: {{examiner_signature}}''',
                'version': '1.0',
                'is_active': True
            },
            {
                'name': 'Treatment Plan Template',
                'category': 'treatment',
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
Date: {{signature_date}}''',
                'version': '1.0',
                'is_active': True
            }
        ]
        
        for template_data in templates:
            template = Template(
                name=template_data['name'],
                category=template_data['category'],
                content=template_data['content'],
                version=template_data['version'],
                is_active=template_data['is_active'],
                created_by=None  # System created
            )
            db.session.add(template)
        
        db.session.commit()
        click.echo(f"✅ Created {len(templates)} default templates")

@cli.command()
@click.option('--username', prompt=True, help='Administrator username')
@click.option('--email', prompt=True, help='Administrator email')
@click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True, help='Administrator password')
def create_admin(username, email, password):
    """Create an administrator user"""
    click.echo("👤 Creating administrator user...")
    
    with app.app_context():
        try:
            # Check if user already exists
            existing_user = User.query.filter(
                (User.username == username) | (User.email == email)
            ).first()
            
            if existing_user:
                click.echo(f"❌ User with username '{username}' or email '{email}' already exists")
                return
            
            # Create admin user
            admin_user = User(
                username=username,
                email=email,
                password_hash=generate_password_hash(password),
                role='administrator',
                is_active=True
            )
            
            db.session.add(admin_user)
            db.session.commit()
            
            click.echo(f"✅ Administrator user '{username}' created successfully")
            click.echo("🔒 Please log in and change the password immediately")
            
        except Exception as e:
            click.echo(f"❌ Failed to create administrator: {e}")
            db.session.rollback()

@cli.command()
@click.option('--username', prompt=True, help='Username to create')
@click.option('--email', prompt=True, help='User email')
@click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True, help='User password')
@click.option('--role', default='clinician', type=click.Choice(['administrator', 'clinician', 'read_only']), help='User role')
def create_user(username, email, password, role):
    """Create a new user"""
    click.echo(f"👤 Creating {role} user...")
    
    with app.app_context():
        try:
            # Check if user already exists
            existing_user = User.query.filter(
                (User.username == username) | (User.email == email)
            ).first()
            
            if existing_user:
                click.echo(f"❌ User with username '{username}' or email '{email}' already exists")
                return
            
            # Create user
            user = User(
                username=username,
                email=email,
                password_hash=generate_password_hash(password),
                role=role,
                is_active=True
            )
            
            db.session.add(user)
            db.session.commit()
            
            click.echo(f"✅ User '{username}' created successfully with role '{role}'")
            
        except Exception as e:
            click.echo(f"❌ Failed to create user: {e}")
            db.session.rollback()

@cli.command()
def list_users():
    """List all users in the system"""
    click.echo("👥 System Users:")
    
    with app.app_context():
        try:
            users = User.query.all()
            
            if not users:
                click.echo("No users found")
                return
            
            click.echo(f"{'Username':<20} {'Email':<30} {'Role':<15} {'Active':<8} {'Created'}")
            click.echo("-" * 85)
            
            for user in users:
                active_status = "Yes" if user.is_active else "No"
                created_date = user.created_at.strftime('%Y-%m-%d') if user.created_at else "Unknown"
                click.echo(f"{user.username:<20} {user.email:<30} {user.role:<15} {active_status:<8} {created_date}")
            
        except Exception as e:
            click.echo(f"❌ Failed to list users: {e}")

@cli.command()
@click.option('--username', prompt=True, help='Username to deactivate')
@click.confirmation_option(prompt='Are you sure you want to deactivate this user?')
def deactivate_user(username):
    """Deactivate a user account"""
    
    with app.app_context():
        try:
            user = User.query.filter_by(username=username).first()
            
            if not user:
                click.echo(f"❌ User '{username}' not found")
                return
            
            user.is_active = False
            db.session.commit()
            
            click.echo(f"✅ User '{username}' deactivated successfully")
            
        except Exception as e:
            click.echo(f"❌ Failed to deactivate user: {e}")
            db.session.rollback()

@cli.command()
def reset_database():
    """Reset the database (WARNING: This will delete all data!)"""
    click.echo("⚠️  WARNING: This will permanently delete ALL data!")
    click.confirm('Are you absolutely sure you want to reset the database?', abort=True)
    
    with app.app_context():
        try:
            # Drop all tables
            db.drop_all()
            click.echo("🗑️  All tables dropped")
            
            # Recreate tables
            db.create_all()
            click.echo("🔧 Tables recreated")
            
            # Create default data
            create_default_data()
            
            click.echo("✅ Database reset complete")
            click.echo("🔒 Remember to create an administrator user!")
            
        except Exception as e:
            click.echo(f"❌ Database reset failed: {e}")

@cli.command()
def backup_database():
    """Create a backup of the database"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = 'backups'
    
    # Create backup directory if it doesn't exist
    os.makedirs(backup_dir, exist_ok=True)
    
    click.echo(f"💾 Creating database backup...")
    
    # For PostgreSQL
    if 'postgresql' in os.getenv('DATABASE_URL', ''):
        backup_file = os.path.join(backup_dir, f'medocpro_backup_{timestamp}.sql')
        
        # Extract database connection info
        db_url = os.getenv('DATABASE_URL')
        # This is a simplified version - in production, use proper pg_dump
        click.echo(f"📁 Backup file would be: {backup_file}")
        click.echo("💡 Use pg_dump for PostgreSQL backups in production")
    
    # For SQLite
    else:
        import shutil
        backup_file = os.path.join(backup_dir, f'medocpro_backup_{timestamp}.db')
        
        try:
            db_file = 'medocpro.db'  # Default SQLite file
            if os.path.exists(db_file):
                shutil.copy2(db_file, backup_file)
                click.echo(f"✅ Database backed up to: {backup_file}")
            else:
                click.echo("❌ Database file not found")
        except Exception as e:
            click.echo(f"❌ Backup failed: {e}")

@cli.command()
def check_database():
    """Check database connection and integrity"""
    click.echo("🔍 Checking database status...")
    
    with app.app_context():
        try:
            # Test basic connection
            result = db.session.execute('SELECT 1').scalar()
            if result == 1:
                click.echo("✅ Database connection successful")
            
            # Check table existence
            tables = ['users', 'templates', 'audit_logs']
            for table in tables:
                try:
                    db.session.execute(f'SELECT COUNT(*) FROM {table}').scalar()
                    click.echo(f"✅ Table '{table}' exists and accessible")
                except Exception:
                    click.echo(f"❌ Table '{table}' missing or inaccessible")
            
            # Count records
            user_count = User.query.count()
            template_count = Template.query.count()
            audit_count = AuditLog.query.count()
            
            click.echo(f"📊 Database Statistics:")
            click.echo(f"   Users: {user_count}")
            click.echo(f"   Templates: {template_count}")
            click.echo(f"   Audit Logs: {audit_count}")
            
        except Exception as e:
            click.echo(f"❌ Database check failed: {e}")

@cli.command()
@click.option('--days', default=90, help='Number of days to keep audit logs')
def cleanup_audit_logs(days):
    """Clean up old audit logs"""
    click.echo(f"🧹 Cleaning up audit logs older than {days} days...")
    
    with app.app_context():
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Count logs to be deleted
            old_logs = AuditLog.query.filter(AuditLog.timestamp < cutoff_date).count()
            
            if old_logs == 0:
                click.echo("✅ No old audit logs to clean up")
                return
            
            click.confirm(f'This will delete {old_logs} audit log entries. Continue?', abort=True)
            
            # Delete old logs
            deleted = AuditLog.query.filter(AuditLog.timestamp < cutoff_date).delete()
            db.session.commit()
            
            click.echo(f"✅ Deleted {deleted} old audit log entries")
            
        except Exception as e:
            click.echo(f"❌ Audit log cleanup failed: {e}")
            db.session.rollback()

@cli.command()
def show_config():
    """Show current configuration"""
    click.echo("⚙️  Current Configuration:")
    click.echo(f"Database URL: {os.getenv('DATABASE_URL', 'Not set')}")
    click.echo(f"Redis URL: {os.getenv('REDIS_URL', 'Not set')}")
    click.echo(f"Flask Environment: {os.getenv('FLASK_ENV', 'Not set')}")
    click.echo(f"Debug Mode: {os.getenv('DEBUG', 'Not set')}")
    click.echo(f"JWT Access Token Expires: {os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 'Not set')} seconds")
    click.echo(f"Ollama Base URL: {os.getenv('OLLAMA_BASE_URL', 'Not set')}")
    click.echo(f"Log Level: {os.getenv('LOG_LEVEL', 'Not set')}")

if __name__ == '__main__':
    cli()