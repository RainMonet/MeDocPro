"""
Authentication API Blueprint
Handles user authentication, JWT token management, and security features

Endpoints:
- POST /api/auth/login - User login with credentials
- POST /api/auth/logout - User logout (token invalidation)
- POST /api/auth/refresh - Refresh access token
- POST /api/auth/change-password - Change user password
- GET /api/auth/profile - Get current user profile
- PUT /api/auth/profile - Update user profile
"""

from flask import Blueprint, request, jsonify, g, current_app
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import check_password_hash
from datetime import datetime, timedelta
import re
import jwt

from models import db, User, AuditLog
from app import require_auth, generate_tokens, verify_token, limiter

auth_bp = Blueprint('auth', __name__)

# Input validation patterns
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
PASSWORD_PATTERN = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$')

def validate_password_strength(password):
    """Validate password meets security requirements"""
    if len(password) < 12:
        return False, "Password must be at least 12 characters long"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[@$!%*?&]', password):
        return False, "Password must contain at least one special character (@$!%*?&)"
    
    return True, "Password meets security requirements"

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """
    User login endpoint with comprehensive security measures
    
    Request body:
    {
        "username": "user@example.com",
        "password": "userpassword"
    }
    
    Response:
    {
        "access_token": "...",
        "refresh_token": "...",
        "user": {...},
        "expires_in": 900
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip().lower()
        password = data.get('password', '')
        
        # Validate input
        if not username or not password:
            AuditLog.log_event(
                user_id=None,
                event_type='login_attempt',
                action='FAILED',
                details={'reason': 'missing_credentials', 'username': username},
                ip_address=request.remote_addr
            )
            return jsonify({'error': 'Username and password required'}), 400
        
        # Find user by username or email (case-insensitive)
        user = User.query.filter(
            (db.func.lower(User.username) == username.lower()) | (db.func.lower(User.email) == username.lower()),
            User.is_deleted == False
        ).first()
        
        if not user:
            AuditLog.log_event(
                user_id=None,
                event_type='login_attempt',
                action='FAILED',
                details={'reason': 'user_not_found', 'username': username},
                ip_address=request.remote_addr
            )
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check if account is locked
        if user.is_locked():
            AuditLog.log_event(
                user_id=str(user.id),
                event_type='login_attempt',
                action='FAILED',
                details={'reason': 'account_locked', 'username': username},
                ip_address=request.remote_addr
            )
            return jsonify({'error': 'Account temporarily locked due to failed login attempts'}), 423
        
        # Check if account is active
        if not user.is_active:
            AuditLog.log_event(
                user_id=str(user.id),
                event_type='login_attempt',
                action='FAILED',
                details={'reason': 'account_inactive', 'username': username},
                ip_address=request.remote_addr
            )
            return jsonify({'error': 'Account is inactive'}), 401
        
        # Verify password
        if not user.check_password(password):
            user.increment_failed_login()
            db.session.commit()
            
            AuditLog.log_event(
                user_id=str(user.id),
                event_type='login_attempt',
                action='FAILED',
                details={'reason': 'invalid_password', 'username': username},
                ip_address=request.remote_addr
            )
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Successful login
        user.reset_failed_login()
        db.session.commit()
        
        # Generate tokens
        access_token, refresh_token = generate_tokens(user.id)
        
        # Log successful login
        AuditLog.log_event(
            user_id=str(user.id),
            event_type='login_success',
            action='CREATE',
            details={'username': username, 'role': user.role},
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict(),
            'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'An error occurred during login'}), 500

@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """
    User logout endpoint
    Invalidates the current session and logs the event
    """
    try:
        # Log logout event
        AuditLog.log_event(
            user_id=g.current_user_id,
            event_type='logout',
            action='DELETE',
            details={'logout_method': 'explicit'},
            ip_address=request.remote_addr
        )
        
        # Note: JWT tokens are stateless, so we rely on client-side removal
        # In a production system, you might want to maintain a blacklist
        
        return jsonify({'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'An error occurred during logout'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@limiter.limit("10 per minute")
def refresh_token():
    """
    Refresh access token using refresh token
    
    Request body:
    {
        "refresh_token": "..."
    }
    
    Response:
    {
        "access_token": "...",
        "expires_in": 900
    }
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('refresh_token'):
            return jsonify({'error': 'Refresh token required'}), 400
        
        refresh_token = data['refresh_token']
        
        # Verify refresh token
        payload = verify_token(refresh_token)
        if not payload or payload.get('type') != 'refresh':
            return jsonify({'error': 'Invalid refresh token'}), 401
        
        # Check if user still exists and is active
        user = User.query.get(payload['user_id'])
        if not user or not user.is_active or user.is_deleted:
            return jsonify({'error': 'User account is invalid'}), 401
        
        # Generate new access token
        access_token, _ = generate_tokens(user.id)
        
        # Log token refresh
        AuditLog.log_event(
            user_id=str(user.id),
            event_type='token_refresh',
            action='CREATE',
            details={'token_type': 'access'},
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'access_token': access_token,
            'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'An error occurred during token refresh'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@require_auth
@limiter.limit("3 per minute")
def change_password():
    """
    Change user password
    
    Request body:
    {
        "current_password": "...",
        "new_password": "...",
        "confirm_password": "..."
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')
        
        # Validate input
        if not all([current_password, new_password, confirm_password]):
            return jsonify({'error': 'All password fields are required'}), 400
        
        if new_password != confirm_password:
            return jsonify({'error': 'New passwords do not match'}), 400
        
        # Get current user
        user = User.query.get(g.current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify current password
        if not user.check_password(current_password):
            AuditLog.log_event(
                user_id=str(user.id),
                event_type='password_change_attempt',
                action='FAILED',
                details={'reason': 'invalid_current_password'},
                ip_address=request.remote_addr
            )
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password strength
        is_valid, message = validate_password_strength(new_password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if new password is same as current
        if user.check_password(new_password):
            return jsonify({'error': 'New password must be different from current password'}), 400
        
        # Update password
        user.set_password(new_password)
        db.session.commit()
        
        # Log successful password change
        AuditLog.log_event(
            user_id=str(user.id),
            event_type='password_change',
            action='UPDATE',
            details={'success': True},
            ip_address=request.remote_addr
        )
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Password change error: {str(e)}")
        return jsonify({'error': 'An error occurred while changing password'}), 500

@auth_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile():
    """Get current user profile information"""
    try:
        user = User.query.get(g.current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Log profile access
        AuditLog.log_event(
            user_id=str(user.id),
            event_type='profile_access',
            action='READ',
            details={'fields_accessed': 'basic_profile'},
            ip_address=request.remote_addr
        )
        
        profile_data = user.to_dict()
        
        # Add additional profile information
        profile_data.update({
            'password_age_days': (datetime.utcnow() - user.password_changed_at).days,
            'mfa_enabled': user.mfa_enabled,
            'last_login': user.last_login.isoformat() if user.last_login else None
        })
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Get profile error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching profile'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@require_auth
@limiter.limit("5 per hour")
def update_profile():
    """
    Update user profile information
    
    Request body:
    {
        "first_name": "...",
        "last_name": "...",
        "title": "...",
        "department": "..."
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        user = User.query.get(g.current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Track what fields are being updated
        updated_fields = []
        
        # Update allowed fields
        updateable_fields = ['first_name', 'last_name', 'title', 'department']
        
        for field in updateable_fields:
            if field in data:
                old_value = getattr(user, field)
                new_value = data[field].strip() if data[field] else None
                
                if old_value != new_value:
                    setattr(user, field, new_value)
                    updated_fields.append(field)
        
        if not updated_fields:
            return jsonify({'message': 'No changes detected'}), 200
        
        # Save changes
        db.session.commit()
        
        # Log profile update
        AuditLog.log_event(
            user_id=str(user.id),
            event_type='profile_update',
            action='UPDATE',
            details={'updated_fields': updated_fields},
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'message': 'Profile updated successfully',
            'updated_fields': updated_fields,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Update profile error: {str(e)}")
        return jsonify({'error': 'An error occurred while updating profile'}), 500

@auth_bp.route('/validate-token', methods=['POST'])
def validate_token():
    """
    Validate a JWT token without requiring authentication middleware
    Useful for frontend token validation
    
    Request body:
    {
        "token": "..."
    }
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('token'):
            return jsonify({'valid': False, 'error': 'Token required'}), 400
        
        token = data['token']
        payload = verify_token(token)
        
        if not payload:
            return jsonify({'valid': False, 'error': 'Invalid or expired token'}), 200
        
        # Check if user still exists and is active
        user = User.query.get(payload['user_id'])
        if not user or not user.is_active or user.is_deleted:
            return jsonify({'valid': False, 'error': 'User account is invalid'}), 200
        
        return jsonify({
            'valid': True,
            'user_id': payload['user_id'],
            'token_type': payload.get('type'),
            'expires_at': payload.get('exp')
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Token validation error: {str(e)}")
        return jsonify({'valid': False, 'error': 'Token validation failed'}), 500

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

# Error handlers specific to auth blueprint
@auth_bp.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limiting errors"""
    AuditLog.log_event(
        user_id=getattr(g, 'current_user_id', None),
        event_type='rate_limit_exceeded',
        action='BLOCKED',
        details={'endpoint': request.endpoint, 'limit': str(e.description)},
        ip_address=request.remote_addr
    )
    return jsonify({
        'error': 'Rate limit exceeded',
        'message': 'Too many requests. Please try again later.'
    }), 429