# app/routes/auth.py - Basic authentication routes

from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import timedelta
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
        
        # Generate JWT tokens
        additional_claims = {
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
        
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
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

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """User logout - placeholder implementation"""
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'Invalid user'}), 401
        
        # Generate new access token
        additional_claims = {
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
        
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims
        )
        
        return jsonify({
            'access_token': access_token,
            'message': 'Token refreshed successfully'
        }), 200
        
    except Exception as e:
        print(f"Refresh token error: {str(e)}")
        return jsonify({'error': 'Token refresh failed'}), 401

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

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get current user profile - placeholder implementation"""
    return jsonify({
        'user': {
            'id': '1',
            'username': 'admin',
            'email': 'admin@medocpro.com',
            'role': 'administrator',
            'first_name': 'Admin',
            'last_name': 'User'
        }
    }), 200