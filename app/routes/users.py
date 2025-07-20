# app/routes/users.py - User management endpoints

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token
from werkzeug.security import generate_password_hash
import secrets
import string
from ..extensions import db
from ..models import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information with effective role"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 404
        
        user_data = user.to_dict()
        user_data['effective_role'] = user.get_effective_role()
        user_data['is_development_mode'] = current_app.config.get('DEVELOPMENT_MODE', False)
        
        return jsonify({
            'success': True,
            'user': user_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting current user: {str(e)}")
        return jsonify({'error': 'Failed to get user information'}), 500

@users_bp.route('/list', methods=['GET'])
@jwt_required()
def list_users():
    """List all users in the same account as current user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_active:
            return jsonify({'error': 'Current user not found or inactive'}), 404
        
        # In development mode or if user is primary, show all users in account
        if current_app.config.get('DEVELOPMENT_MODE') or current_user.is_primary:
            # Get users with same account_id or created by current user
            users_query = User.query.filter(
                db.or_(
                    User.account_id == current_user.account_id,
                    User.created_by == current_user.id,
                    User.id == current_user.id  # Include current user
                ),
                User.is_deleted == False
            )
        else:
            # Regular users can only see themselves and users they created
            users_query = User.query.filter(
                db.or_(
                    User.created_by == current_user.id,
                    User.id == current_user.id
                ),
                User.is_deleted == False
            )
        
        users = users_query.all()
        users_data = []
        
        for user in users:
            user_data = user.to_dict()
            user_data['effective_role'] = user.get_effective_role()
            users_data.append(user_data)
        
        return jsonify({
            'success': True,
            'users': users_data,
            'total': len(users_data)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error listing users: {str(e)}")
        return jsonify({'error': 'Failed to list users'}), 500

@users_bp.route('/create', methods=['POST'])
@jwt_required()
def create_user():
    """Create a new user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_active:
            return jsonify({'error': 'Current user not found or inactive'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if email already exists
        existing_user = User.query.filter_by(email=data['email'].lower().strip()).first()
        if existing_user and not existing_user.is_deleted:
            return jsonify({'error': 'Email already exists'}), 400
        
        # Generate username from email if not provided
        username = data.get('username', data['email'].split('@')[0])
        
        # Check if username already exists
        existing_username = User.query.filter_by(username=username).first()
        if existing_username and not existing_username.is_deleted:
            # Generate unique username
            base_username = username
            counter = 1
            while existing_username:
                username = f"{base_username}{counter}"
                existing_username = User.query.filter_by(username=username).first()
                counter += 1
        
        # Generate random password for development
        password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        
        # Create new user
        new_user = User(
            username=username,
            email=data['email'].lower().strip(),
            first_name=data['first_name'].strip(),
            last_name=data['last_name'].strip(),
            role=data.get('role', 'clinician'),
            account_id=current_user.account_id or current_user.id,  # Use current user's account or ID
            created_by=current_user.id,
            is_primary=False
        )
        
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        user_data = new_user.to_dict()
        user_data['effective_role'] = new_user.get_effective_role()
        
        # In development mode, return the generated password
        response_data = {
            'success': True,
            'user': user_data,
            'message': 'User created successfully'
        }
        
        if current_app.config.get('DEVELOPMENT_MODE'):
            response_data['generated_password'] = password
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating user: {str(e)}")
        return jsonify({'error': 'Failed to create user'}), 500

@users_bp.route('/switch', methods=['POST'])
@jwt_required()
def switch_user():
    """Switch to a different user (re-authenticate as that user)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_active:
            return jsonify({'error': 'Current user not found or inactive'}), 404
        
        data = request.get_json()
        if not data or not data.get('user_id'):
            return jsonify({'error': 'user_id is required'}), 400
        
        target_user_id = data['user_id']
        target_user = User.query.get(target_user_id)
        
        if not target_user or not target_user.is_active or target_user.is_deleted:
            return jsonify({'error': 'Target user not found or inactive'}), 404
        
        # Check if current user can switch to target user
        can_switch = False
        
        # In development mode, allow switching between any users in same account
        if current_app.config.get('DEVELOPMENT_MODE'):
            if (target_user.account_id == current_user.account_id or 
                target_user.created_by == current_user.id or
                target_user.id == current_user.id):
                can_switch = True
        
        # Primary users can switch to users they created
        if current_user.is_primary and target_user.created_by == current_user.id:
            can_switch = True
        
        # Users can always switch back to themselves
        if target_user.id == current_user.id:
            can_switch = True
        
        if not can_switch:
            return jsonify({'error': 'Not authorized to switch to this user'}), 403
        
        # Generate new tokens for the target user
        additional_claims = {
            'username': target_user.username,
            'email': target_user.email,
            'role': target_user.get_effective_role()
        }
        
        access_token = create_access_token(
            identity=str(target_user.id),
            additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(identity=str(target_user.id))
        
        # Update last login for target user
        target_user.last_login = db.func.now()
        db.session.commit()
        
        user_data = target_user.to_dict()
        user_data['effective_role'] = target_user.get_effective_role()
        
        return jsonify({
            'success': True,
            'message': f'Switched to user {target_user.username}',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error switching user: {str(e)}")
        return jsonify({'error': 'Failed to switch user'}), 500

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user information"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_active:
            return jsonify({'error': 'Current user not found or inactive'}), 404
        
        target_user = User.query.get(user_id)
        if not target_user or target_user.is_deleted:
            return jsonify({'error': 'User not found'}), 404
        
        # Check permissions
        can_update = (current_user.id == target_user.id or  # Self update
                     target_user.created_by == current_user.id or  # Created by current user
                     (current_app.config.get('DEVELOPMENT_MODE') and 
                      target_user.account_id == current_user.account_id))  # Same account in dev mode
        
        if not can_update:
            return jsonify({'error': 'Not authorized to update this user'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update allowed fields
        updatable_fields = ['first_name', 'last_name', 'email', 'role']
        updated = False
        
        for field in updatable_fields:
            if field in data and data[field] is not None:
                if field == 'email':
                    # Check for email conflicts
                    email = data[field].lower().strip()
                    existing = User.query.filter(User.email == email, User.id != user_id).first()
                    if existing and not existing.is_deleted:
                        return jsonify({'error': 'Email already exists'}), 400
                    setattr(target_user, field, email)
                else:
                    setattr(target_user, field, data[field])
                updated = True
        
        if updated:
            target_user.updated_at = db.func.now()
            db.session.commit()
        
        user_data = target_user.to_dict()
        user_data['effective_role'] = target_user.get_effective_role()
        
        return jsonify({
            'success': True,
            'user': user_data,
            'message': 'User updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating user: {str(e)}")
        return jsonify({'error': 'Failed to update user'}), 500