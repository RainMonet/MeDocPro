# app/routes/auth.py

from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from ..extensions import db
from ..models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/test')
def auth_test():
    """Test endpoint to verify auth blueprint is working"""
    user_count = User.query.count()
    return f"Authentication blueprint is live! User count: {user_count}"

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint with comprehensive debugging"""
    try:
        print("=== LOGIN ATTEMPT DEBUG ===")
        
        # Get request data
        data = request.get_json()
        print(f"Request data received: {data}")
        
        if not data:
            print("No JSON data provided")
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip().lower()
        password = data.get('password', '')
        
        print(f"Username (lowercased): '{username}'")
        print(f"Password provided: {bool(password)}")
        
        # Validate input
        if not username or not password:
            print("Missing username or password")
            return jsonify({'error': 'Username and password required'}), 400
        
        # Find user by username or email (case-insensitive)
        print("Searching for user...")
        user = User.query.filter(
            (db.func.lower(User.username) == username) | (db.func.lower(User.email) == username),
            User.is_deleted == False
        ).first()
        
        print(f"User found: {user}")
        if user:
            print(f"User details: username={user.username}, email={user.email}, active={user.is_active}")
        
        if not user:
            print("User not found in database")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check if account is active
        if not user.is_active:
            print("User account is inactive")
            return jsonify({'error': 'Account is inactive'}), 401
        
        # Check if account is locked
        if user.is_locked():
            print("User account is locked")
            return jsonify({'error': 'Account temporarily locked due to failed login attempts'}), 423
        
        # Verify password
        print("Checking password...")
        password_valid = user.check_password(password)
        print(f"Password check result: {password_valid}")
        
        if not password_valid:
            print("Password verification failed")
            user.increment_failed_login()
            db.session.commit()
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Successful login
        print("Login successful!")
        user.reset_failed_login()
        db.session.commit()
        
        # For now, return a simple success response
        # TODO: Generate JWT tokens
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An error occurred during login'}), 500

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """Change user password - placeholder implementation"""
    return jsonify({'error': 'Not implemented yet'}), 501

@auth_bp.route('/password-requirements', methods=['GET'])
def password_requirements():
    """Get password security requirements"""
    return jsonify({
        'requirements': {
            'min_length': 12,
            'require_uppercase': True,
            'require_lowercase': True,
            'require_numbers': True,
            'require_special_chars': True,
            'allowed_special_chars': '@$!%*?&'
        },
        'policy': {
            'password_expiry_days': 180,
            'password_history_count': 12,
            'max_failed_attempts': 5,
            'lockout_duration_minutes': 30
        }
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """User logout - placeholder implementation"""
    return jsonify({'message': 'Logged out successfully'}), 200
