#!/usr/bin/env python3
"""Initialize database with admin user"""

from app import create_app
from app.models.user import User
from app.extensions import db
import datetime

def init_database():
    app = create_app()
    with app.app_context():
        # Create all tables
        print('Creating database tables...')
        db.create_all()
        
        # Check if admin user exists
        admin = User.query.filter_by(username='admin').first()
        if admin:
            print('Admin user already exists, unlocking account...')
            admin.failed_login_count = 0
            admin.locked_until = None
            db.session.commit()
        else:
            print('Creating admin user...')
            admin = User(
                username='admin',
                email='admin@medocpro.com',
                first_name='System',
                last_name='Administrator',
                role='administrator',
                is_active=True,
                is_deleted=False,
                failed_login_count=0,
                created_at=datetime.datetime.now(),
                password_changed_at=datetime.datetime.now(),
                mfa_enabled=False
            )
            # Use the model's set_password method
            admin.set_password('ChangeMe123!')
            
            db.session.add(admin)
            db.session.commit()
            print('Admin user created successfully!')
        
        # Verify user count
        user_count = User.query.count()
        print(f'Total users in database: {user_count}')
        
        # Test login
        test_result = admin.check_password('ChangeMe123!')
        print(f'Password verification test: {test_result}')

if __name__ == '__main__':
    init_database()