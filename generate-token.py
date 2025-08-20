#!/usr/bin/env python3
"""
MeDocPro Token Generator
Generate authentication tokens for API testing without going through the web interface
"""

import os
import sys
import click
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import create_app
    from app.models import db, User
    from flask_jwt_extended import create_access_token, create_refresh_token
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Please ensure the application factory 'create_app' exists and dependencies are installed.")
    sys.exit(1)

# Create the Flask app instance
app = create_app()

@click.command()
@click.option('--user', '-u', help='Username or email to generate token for')
@click.option('--list-users', '-l', is_flag=True, help='List available users')
@click.option('--duration', '-d', default='15m', help='Token duration (e.g., 15m, 1h, 1d). Default: 15m')
def generate_token(user, list_users, duration):
    """Generate an authentication token for MeDocPro API testing"""
    
    with app.app_context():
        if list_users:
            print("Available users:")
            users = User.query.all()
            for u in users:
                status = "✅ Active" if u.is_active else "❌ Inactive"
                print(f"  • {u.username} ({u.email}) - {u.role} - {status}")
            return
        
        if not user:
            print("❌ Please specify a username or email with --user")
            print("💡 Use --list-users to see available users")
            return
        
        # Find user by username or email (case-insensitive)
        user_record = User.query.filter(
            (db.func.lower(User.username) == user.lower()) | 
            (db.func.lower(User.email) == user.lower())
        ).first()
        
        if not user_record:
            print(f"❌ User '{user}' not found")
            print("💡 Use --list-users to see available users")
            return
        
        if not user_record.is_active:
            print(f"❌ User '{user}' is inactive")
            return
        
        # Parse duration
        try:
            duration_map = {
                'm': 'minutes',
                'h': 'hours', 
                'd': 'days'
            }
            
            if duration[-1] in duration_map:
                unit = duration_map[duration[-1]]
                amount = int(duration[:-1])
            else:
                amount = int(duration)
                unit = 'minutes'
                
            from datetime import timedelta
            expires_delta = timedelta(**{unit: amount})
            
        except (ValueError, KeyError):
            print(f"❌ Invalid duration format: {duration}")
            print("💡 Use formats like: 15m, 1h, 2d")
            return
        
        # Generate tokens
        additional_claims = {
            'username': user_record.username,
            'email': user_record.email,
            'role': user_record.role
        }
        
        access_token = create_access_token(
            identity=str(user_record.id),
            additional_claims=additional_claims,
            expires_delta=expires_delta
        )
        
        refresh_token = create_refresh_token(
            identity=str(user_record.id),
            expires_delta=timedelta(days=30)  # Refresh tokens last 30 days
        )
        
        print("🎉 Token generated successfully!")
        print(f"👤 User: {user_record.username} ({user_record.email})")
        print(f"🔑 Role: {user_record.role}")
        print(f"⏱️  Expires: {expires_delta}")
        print()
        print("🔗 Access Token:")
        print(access_token)
        print()
        print("🔄 Refresh Token:")
        print(refresh_token)
        print()
        print("💡 Usage Examples:")
        print(f"   # Set environment variable")
        print(f"   export MEDOCPRO_TOKEN=\"{access_token}\"")
        print()
        print(f"   # Use with curl")
        print(f"   curl -H \"Authorization: Bearer {access_token}\" \\")
        print(f"        http://localhost:5000/api/users/current")
        print()
        print(f"   # Use with performance test script")
        print(f"   MEDOCPRO_TOKEN=\"{access_token}\" node test-gpu-cpu-performance.js")

if __name__ == '__main__':
    generate_token()