"""
MeDocPro Authentication Tests
Comprehensive test suite for authentication and authorization functionality
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from app import create_app, db, generate_tokens, verify_token
from models import User, AuditLog


@pytest.fixture
def app():
    """Create test application instance"""
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture
def admin_user(app):
    """Create test admin user"""
    with app.app_context():
        user = User(
            username='admin',
            email='admin@test.com',
            first_name='Admin',
            last_name='User',
            role='administrator',
            is_active=True
        )
        user.set_password('SecurePass123!')
        db.session.add(user)
        db.session.commit()
        return user


@pytest.fixture
def clinician_user(app):
    """Create test clinician user"""
    with app.app_context():
        user = User(
            username='clinician',
            email='clinician@test.com',
            first_name='Clinical',
            last_name='User',
            role='clinician',
            is_active=True
        )
        user.set_password('SecurePass123!')
        db.session.add(user)
        db.session.commit()
        return user


@pytest.fixture
def auth_headers(client, clinician_user):
    """Get authentication headers for test requests"""
    response = client.post('/api/auth/login', json={
        'username': 'clinician',
        'password': 'SecurePass123!'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    return {
        'Authorization': f"Bearer {data['access_token']}",
        'Content-Type': 'application/json'
    }


class TestAuthentication:
    """Test authentication functionality"""
    
    def test_successful_login(self, client, clinician_user):
        """Test successful user login"""
        response = client.post('/api/auth/login', json={
            'username': 'clinician',
            'password': 'SecurePass123!'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'access_token' in data
        assert 'refresh_token' in data
        assert 'user' in data
        assert data['user']['username'] == 'clinician'
        assert data['user']['role'] == 'clinician'
        assert 'expires_in' in data
        
        # Verify token is valid
        payload = verify_token(data['access_token'])
        assert payload is not None
        assert payload['user_id'] == str(clinician_user.id)
    
    def test_login_with_email(self, client, clinician_user):
        """Test login using email instead of username"""
        response = client.post('/api/auth/login', json={
            'username': 'clinician@test.com',
            'password': 'SecurePass123!'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['user']['email'] == 'clinician@test.com'
    
    def test_invalid_credentials(self, client, clinician_user):
        """Test login with invalid credentials"""
        response = client.post('/api/auth/login', json={
            'username': 'clinician',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
        assert 'access_token' not in data
    
    def test_nonexistent_user(self, client):
        """Test login with nonexistent user"""
        response = client.post('/api/auth/login', json={
            'username': 'nonexistent',
            'password': 'password'
        })
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_inactive_user_login(self, client, app):
        """Test login with inactive user account"""
        with app.app_context():
            user = User(
                username='inactive',
                email='inactive@test.com',
                first_name='Inactive',
                last_name='User',
                role='clinician',
                is_active=False
            )
            user.set_password('SecurePass123!')
            db.session.add(user)
            db.session.commit()
        
        response = client.post('/api/auth/login', json={
            'username': 'inactive',
            'password': 'SecurePass123!'
        })
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'inactive' in data['error'].lower()
    
    def test_account_lockout(self, client, clinician_user, app):
        """Test account lockout after multiple failed attempts"""
        with app.app_context():
            # Make 5 failed login attempts
            for _ in range(5):
                response = client.post('/api/auth/login', json={
                    'username': 'clinician',
                    'password': 'wrongpassword'
                })
                assert response.status_code == 401
            
            # 6th attempt should trigger lockout
            response = client.post('/api/auth/login', json={
                'username': 'clinician',
                'password': 'wrongpassword'
            })
            
            assert response.status_code == 423  # Account locked
            data = json.loads(response.data)
            assert 'locked' in data['error'].lower()
    
    def test_missing_credentials(self, client):
        """Test login with missing credentials"""
        # Missing password
        response = client.post('/api/auth/login', json={
            'username': 'clinician'
        })
        assert response.status_code == 400
        
        # Missing username
        response = client.post('/api/auth/login', json={
            'password': 'password'
        })
        assert response.status_code == 400
        
        # Empty request
        response = client.post('/api/auth/login', json={})
        assert response.status_code == 400


class TestTokenManagement:
    """Test JWT token functionality"""
    
    def test_token_refresh(self, client, clinician_user):
        """Test refreshing access token"""
        # Get initial tokens
        response = client.post('/api/auth/login', json={
            'username': 'clinician',
            'password': 'SecurePass123!'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        refresh_token = data['refresh_token']
        
        # Refresh token
        response = client.post('/api/auth/refresh', json={
            'refresh_token': refresh_token
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'access_token' in data
        assert 'expires_in' in data
    
    def test_invalid_refresh_token(self, client):
        """Test refresh with invalid token"""
        response = client.post('/api/auth/refresh', json={
            'refresh_token': 'invalid_token'
        })
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_token_validation(self, client, auth_headers):
        """Test token validation endpoint"""
        # Extract token from headers
        token = auth_headers['Authorization'].split(' ')[1]
        
        response = client.post('/api/auth/validate-token', json={
            'token': token
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['valid'] is True
        assert 'user_id' in data
        assert 'token_type' in data
    
    def test_expired_token_validation(self, client, app):
        """Test validation of expired token"""
        with app.app_context():
            # Create expired token manually
            from datetime import datetime, timedelta
            import jwt
            
            expired_payload = {
                'user_id': 'test-id',
                'type': 'access',
                'exp': datetime.utcnow() - timedelta(minutes=1),  # Expired
                'iat': datetime.utcnow() - timedelta(minutes=16)
            }
            
            expired_token = jwt.encode(
                expired_payload, 
                app.config['JWT_SECRET_KEY'], 
                algorithm='HS256'
            )
        
        response = client.post('/api/auth/validate-token', json={
            'token': expired_token
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['valid'] is False
        assert 'expired' in data['error'].lower()


class TestPasswordSecurity:
    """Test password security features"""
    
    def test_password_change_success(self, client, auth_headers):
        """Test successful password change"""
        response = client.post('/api/auth/change-password', 
            headers=auth_headers,
            json={
                'current_password': 'SecurePass123!',
                'new_password': 'NewSecurePass456!',
                'confirm_password': 'NewSecurePass456!'
            }
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'successfully' in data['message'].lower()
    
    def test_password_change_wrong_current(self, client, auth_headers):
        """Test password change with wrong current password"""
        response = client.post('/api/auth/change-password',
            headers=auth_headers,
            json={
                'current_password': 'wrongpassword',
                'new_password': 'NewSecurePass456!',
                'confirm_password': 'NewSecurePass456!'
            }
        )
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'incorrect' in data['error'].lower()
    
    def test_password_change_mismatch(self, client, auth_headers):
        """Test password change with mismatched new passwords"""
        response = client.post('/api/auth/change-password',
            headers=auth_headers,
            json={
                'current_password': 'SecurePass123!',
                'new_password': 'NewSecurePass456!',
                'confirm_password': 'DifferentPassword789!'
            }
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'match' in data['error'].lower()
    
    def test_weak_password_rejected(self, client, auth_headers):
        """Test rejection of weak passwords"""
        weak_passwords = [
            'weak',           # Too short
            'nouppercase123!', # No uppercase
            'NOLOWERCASE123!', # No lowercase  
            'NoNumbers!',      # No numbers
            'NoSpecialChars123', # No special chars
        ]
        
        for weak_password in weak_passwords:
            response = client.post('/api/auth/change-password',
                headers=auth_headers,
                json={
                    'current_password': 'SecurePass123!',
                    'new_password': weak_password,
                    'confirm_password': weak_password
                }
            )
            
            assert response.status_code == 400
            data = json.loads(response.data)
            assert 'password' in data['error'].lower()
    
    def test_password_requirements_endpoint(self, client):
        """Test password requirements endpoint"""
        response = client.get('/api/auth/password-requirements')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'requirements' in data
        assert 'policy' in data
        assert data['requirements']['min_length'] >= 12
        assert data['requirements']['require_uppercase'] is True
        assert data['requirements']['require_lowercase'] is True
        assert data['requirements']['require_numbers'] is True
        assert data['requirements']['require_special_chars'] is True


class TestAuthorization:
    """Test role-based authorization"""
    
    def test_protected_endpoint_requires_auth(self, client):
        """Test that protected endpoints require authentication"""
        response = client.get('/api/templates')
        assert response.status_code == 401
    
    def test_valid_token_grants_access(self, client, auth_headers):
        """Test that valid token grants access to protected endpoint"""
        response = client.get('/api/templates', headers=auth_headers)
        assert response.status_code == 200
    
    def test_invalid_token_denied(self, client):
        """Test that invalid token is denied access"""
        invalid_headers = {
            'Authorization': 'Bearer invalid_token',
            'Content-Type': 'application/json'
        }
        
        response = client.get('/api/templates', headers=invalid_headers)
        assert response.status_code == 401
    
    def test_admin_only_endpoint_access(self, client, admin_user):
        """Test that admin-only endpoints require administrator role"""
        # Login as admin
        response = client.post('/api/auth/login', json={
            'username': 'admin',
            'password': 'SecurePass123!'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        admin_headers = {
            'Authorization': f"Bearer {data['access_token']}",
            'Content-Type': 'application/json'
        }
        
        # Admin can access user management
        response = client.get('/api/users', headers=admin_headers)
        assert response.status_code == 200
    
    def test_non_admin_denied_admin_endpoint(self, client, auth_headers):
        """Test that non-admin users are denied admin endpoints"""
        response = client.get('/api/users', headers=auth_headers)
        assert response.status_code == 403


class TestAuditLogging:
    """Test audit logging functionality"""
    
    def test_login_audit_logging(self, client, clinician_user, app):
        """Test that login attempts are logged"""
        with app.app_context():
            initial_count = AuditLog.query.count()
            
            # Successful login
            response = client.post('/api/auth/login', json={
                'username': 'clinician',
                'password': 'SecurePass123!'
            })
            
            assert response.status_code == 200
            
            # Check audit log
            final_count = AuditLog.query.count()
            assert final_count > initial_count
            
            # Find the login log entry
            login_log = AuditLog.query.filter_by(
                event_type='login_success',
                user_id=clinician_user.id
            ).first()
            
            assert login_log is not None
            assert login_log.action == 'CREATE'
            assert login_log.ip_address is not None
    
    def test_failed_login_audit_logging(self, client, clinician_user, app):
        """Test that failed login attempts are logged"""
        with app.app_context():
            # Failed login
            response = client.post('/api/auth/login', json={
                'username': 'clinician',
                'password': 'wrongpassword'
            })
            
            assert response.status_code == 401
            
            # Check audit log
            failed_log = AuditLog.query.filter_by(
                event_type='login_attempt'
            ).first()
            
            assert failed_log is not None
            assert failed_log.action == 'FAILED'
            assert 'invalid_password' in str(failed_log.details)
    
    def test_password_change_audit_logging(self, client, auth_headers, app):
        """Test that password changes are logged"""
        with app.app_context():
            response = client.post('/api/auth/change-password',
                headers=auth_headers,
                json={
                    'current_password': 'SecurePass123!',
                    'new_password': 'NewSecurePass456!',
                    'confirm_password': 'NewSecurePass456!'
                }
            )
            
            assert response.status_code == 200
            
            # Check audit log
            password_log = AuditLog.query.filter_by(
                event_type='password_change'
            ).first()
            
            assert password_log is not None
            assert password_log.action == 'UPDATE'


class TestRateLimiting:
    """Test rate limiting functionality"""
    
    def test_login_rate_limiting(self, client, clinician_user):
        """Test rate limiting on login endpoint"""
        # Make multiple rapid login attempts
        responses = []
        for _ in range(10):  # More than the 5 per minute limit
            response = client.post('/api/auth/login', json={
                'username': 'clinician',
                'password': 'SecurePass123!'
            })
            responses.append(response.status_code)
        
        # Should get rate limited (429) after too many requests
        assert 429 in responses
    
    @pytest.mark.skipif(True, reason="Requires actual rate limiter setup")
    def test_api_rate_limiting(self, client, auth_headers):
        """Test rate limiting on API endpoints"""
        # Make rapid API requests
        responses = []
        for _ in range(50):  # Exceed rate limit
            response = client.get('/api/templates', headers=auth_headers)
            responses.append(response.status_code)
        
        # Should eventually get rate limited
        assert 429 in responses


class TestSecurityHeaders:
    """Test security headers and middleware"""
    
    def test_security_headers_present(self, client):
        """Test that security headers are present in responses"""
        response = client.get('/health')
        
        # Check for essential security headers
        assert 'X-Content-Type-Options' in response.headers
        assert 'X-Frame-Options' in response.headers
        assert 'X-XSS-Protection' in response.headers
        
        # Verify header values
        assert response.headers['X-Content-Type-Options'] == 'nosniff'
        assert response.headers['X-Frame-Options'] == 'DENY'
        assert response.headers['X-XSS-Protection'] == '1; mode=block'


# Utility functions for testing
def create_test_user(username, email, role='clinician', password='TestPass123!'):
    """Helper function to create test users"""
    user = User(
        username=username,
        email=email,
        first_name='Test',
        last_name='User',
        role=role,
        is_active=True
    )
    user.set_password(password)
    return user


def get_auth_token(client, username='clinician', password='SecurePass123!'):
    """Helper function to get authentication token"""
    response = client.post('/api/auth/login', json={
        'username': username,
        'password': password
    })
    
    if response.status_code == 200:
        data = json.loads(response.data)
        return data['access_token']
    return None


# Performance and load testing utilities
class TestPerformance:
    """Performance tests for authentication system"""
    
    @pytest.mark.performance
    def test_login_performance(self, client, clinician_user):
        """Test login endpoint performance"""
        import time
        
        start_time = time.time()
        
        response = client.post('/api/auth/login', json={
            'username': 'clinician',
            'password': 'SecurePass123!'
        })
        
        end_time = time.time()
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 1.0  # Should respond within 1 second
    
    @pytest.mark.performance  
    def test_token_validation_performance(self, client, auth_headers):
        """Test token validation performance"""
        import time
        
        token = auth_headers['Authorization'].split(' ')[1]
        
        start_time = time.time()
        
        response = client.post('/api/auth/validate-token', json={
            'token': token
        })
        
        end_time = time.time()
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 0.1  # Should be very fast