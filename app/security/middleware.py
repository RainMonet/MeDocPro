"""
HIPAA Encryption Middleware for Flask
Automatic encryption/decryption of PHI data in API requests/responses

Integration with existing MeDocPro application
"""

import json
import functools
from typing import Dict, Any, Optional, List
from flask import request, g, current_app, jsonify
from werkzeug.wrappers import Response
from datetime import datetime
import logging

from .encryption import encrypt_phi_data, decrypt_phi_data, PHIClassification
from .audit_security import SecurityAuditLogger, SecurityEventType, SecurityRiskLevel

logger = logging.getLogger(__name__)

class HIPAAEncryptionMiddleware:
    """
    Flask middleware for automatic PHI encryption/decryption
    """
    
    def __init__(self, app=None):
        self.app = app
        self.audit_logger = SecurityAuditLogger()
        
        # Endpoints that should have PHI encryption
        self.encrypted_endpoints = [
            '/api/patient-census',
            '/api/daily-info',
            '/api/templates',
            '/api/generate-documents'
        ]
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize the middleware with Flask app"""
        app.config.setdefault('HIPAA_ENCRYPTION_ENABLED', True)
        app.config.setdefault('HIPAA_AUDIT_ENABLED', True)
        
        # Register middleware
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        
        # Store reference to middleware in app
        app.hipaa_middleware = self
    
    def before_request(self):
        """Process incoming requests for PHI decryption"""
        if not current_app.config.get('HIPAA_ENCRYPTION_ENABLED', True):
            return
        
        # Check if this endpoint requires PHI handling
        if not self._should_process_endpoint(request.path):
            return
        
        # Decrypt incoming PHI data in request body
        if request.is_json and request.get_json():
            try:
                original_data = request.get_json()
                
                # Decrypt PHI fields
                decrypted_data = decrypt_phi_data(original_data)
                
                # Store decrypted data in Flask g for route handlers
                g.decrypted_request_data = decrypted_data
                
                # Log PHI access
                if current_app.config.get('HIPAA_AUDIT_ENABLED', True):
                    self._audit_phi_access(
                        'request_decrypt',
                        original_data,
                        request.path,
                        request.method
                    )
                
            except Exception as e:
                logger.error(f"Failed to decrypt incoming PHI data: {e}")
                # Continue with original data if decryption fails
                g.decrypted_request_data = request.get_json()
    
    def after_request(self, response: Response) -> Response:
        """Process outgoing responses for PHI encryption"""
        if not current_app.config.get('HIPAA_ENCRYPTION_ENABLED', True):
            return response
        
        # Check if this endpoint requires PHI handling
        if not self._should_process_endpoint(request.path):
            return response
        
        # Only process JSON responses
        if not response.is_json:
            return response
        
        try:
            # Get response data
            response_data = response.get_json()
            
            if response_data:
                # Extract patient ID if available for context
                patient_id = self._extract_patient_id(response_data)
                
                # Encrypt PHI fields in response
                encrypted_data = encrypt_phi_data(response_data, patient_id)
                
                # Update response with encrypted data
                response.data = json.dumps(encrypted_data)
                response.headers['Content-Length'] = len(response.data)
                
                # Log PHI access
                if current_app.config.get('HIPAA_AUDIT_ENABLED', True):
                    self._audit_phi_access(
                        'response_encrypt',
                        response_data,
                        request.path,
                        request.method
                    )
        
        except Exception as e:
            logger.error(f"Failed to encrypt outgoing PHI data: {e}")
            # Return original response if encryption fails
        
        return response
    
    def _should_process_endpoint(self, path: str) -> bool:
        """Check if endpoint should have PHI encryption"""
        return any(path.startswith(endpoint) for endpoint in self.encrypted_endpoints)
    
    def _extract_patient_id(self, data: Dict[str, Any]) -> Optional[str]:
        """Extract patient ID from response data for encryption context"""
        if isinstance(data, dict):
            # Look for common patient ID fields
            for key in ['patient_id', 'id', 'patient', 'mrn']:
                if key in data:
                    return str(data[key])
            
            # Look in nested data
            for value in data.values():
                if isinstance(value, dict):
                    patient_id = self._extract_patient_id(value)
                    if patient_id:
                        return patient_id
                elif isinstance(value, list) and value:
                    for item in value:
                        if isinstance(item, dict):
                            patient_id = self._extract_patient_id(item)
                            if patient_id:
                                return patient_id
        
        return None
    
    def _audit_phi_access(self, operation: str, data: Dict[str, Any], endpoint: str, method: str):
        """Log PHI access for audit compliance"""
        try:
            # Identify PHI fields in the data
            phi_fields = []
            self._identify_phi_fields(data, phi_fields)
            
            if phi_fields:
                patient_id = self._extract_patient_id(data)
                user_id = g.get('current_user_id', 'system')
                ip_address = request.remote_addr
                
                self.audit_logger.log_phi_access_event(
                    access_type=operation,
                    patient_id=patient_id or 'unknown',
                    data_elements=phi_fields,
                    user_id=user_id,
                    endpoint=endpoint,
                    ip_address=ip_address,
                    success=True,
                    additional_context={
                        'method': method,
                        'operation': operation,
                        'phi_field_count': len(phi_fields)
                    }
                )
        
        except Exception as e:
            logger.error(f"Failed to audit PHI access: {e}")
    
    def _identify_phi_fields(self, data: Any, phi_fields: List[str], prefix: str = ""):
        """Recursively identify PHI fields in data structure"""
        if isinstance(data, dict):
            for key, value in data.items():
                field_path = f"{prefix}.{key}" if prefix else key
                
                if PHIClassification.is_phi_field(key):
                    phi_fields.append(field_path)
                
                # Recurse into nested structures
                self._identify_phi_fields(value, phi_fields, field_path)
        
        elif isinstance(data, list):
            for i, item in enumerate(data):
                field_path = f"{prefix}[{i}]" if prefix else f"[{i}]"
                self._identify_phi_fields(item, phi_fields, field_path)


def require_phi_encryption(f):
    """
    Decorator to enforce PHI encryption on specific routes
    """
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if encryption is enabled
        if not current_app.config.get('HIPAA_ENCRYPTION_ENABLED', True):
            logger.warning("PHI encryption is disabled - potential compliance violation")
        
        # Use decrypted data if available
        if hasattr(g, 'decrypted_request_data'):
            # Replace request.get_json() with decrypted data temporarily
            original_get_json = request.get_json
            request.get_json = lambda: g.decrypted_request_data
            
            try:
                result = f(*args, **kwargs)
                return result
            finally:
                # Restore original get_json method
                request.get_json = original_get_json
        else:
            return f(*args, **kwargs)
    
    return decorated_function


def audit_phi_access(access_type: str = 'read'):
    """
    Decorator to audit PHI access on routes
    
    Args:
        access_type: Type of access ('read', 'write', 'delete', 'export')
    """
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            audit_logger = SecurityAuditLogger()
            
            try:
                # Execute the route function
                result = f(*args, **kwargs)
                
                # Log successful PHI access
                if current_app.config.get('HIPAA_AUDIT_ENABLED', True):
                    patient_id = request.view_args.get('patient_id') or 'unknown'
                    user_id = g.get('current_user_id', 'system')
                    
                    audit_logger.log_phi_access_event(
                        access_type=access_type,
                        patient_id=str(patient_id),
                        data_elements=[f"endpoint:{request.endpoint}"],
                        user_id=user_id,
                        endpoint=request.path,
                        ip_address=request.remote_addr,
                        success=True,
                        additional_context={
                            'method': request.method,
                            'args': str(args) if args else None,
                            'kwargs': str(kwargs) if kwargs else None
                        }
                    )
                
                return result
            
            except Exception as e:
                # Log failed PHI access attempt
                if current_app.config.get('HIPAA_AUDIT_ENABLED', True):
                    patient_id = request.view_args.get('patient_id') or 'unknown'
                    user_id = g.get('current_user_id', 'system')
                    
                    audit_logger.log_phi_access_event(
                        access_type=access_type,
                        patient_id=str(patient_id),
                        data_elements=[f"endpoint:{request.endpoint}"],
                        user_id=user_id,
                        endpoint=request.path,
                        ip_address=request.remote_addr,
                        success=False,
                        additional_context={
                            'method': request.method,
                            'error': str(e),
                            'args': str(args) if args else None,
                            'kwargs': str(kwargs) if kwargs else None
                        }
                    )
                
                raise
        
        return decorated_function
    return decorator


def log_encryption_operation(operation: str):
    """
    Decorator to log encryption operations
    
    Args:
        operation: Operation type ('encrypt', 'decrypt')
    """
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            audit_logger = SecurityAuditLogger()
            
            try:
                result = f(*args, **kwargs)
                
                # Log successful encryption operation
                if current_app.config.get('HIPAA_AUDIT_ENABLED', True):
                    user_id = g.get('current_user_id', 'system')
                    
                    audit_logger.log_encryption_event(
                        operation=operation,
                        field_name=request.endpoint or 'unknown',
                        user_id=user_id,
                        success=True,
                        additional_context={
                            'endpoint': request.path,
                            'method': request.method
                        }
                    )
                
                return result
            
            except Exception as e:
                # Log failed encryption operation
                if current_app.config.get('HIPAA_AUDIT_ENABLED', True):
                    user_id = g.get('current_user_id', 'system')
                    
                    audit_logger.log_encryption_event(
                        operation=operation,
                        field_name=request.endpoint or 'unknown',
                        user_id=user_id,
                        success=False,
                        additional_context={
                            'endpoint': request.path,
                            'method': request.method,
                            'error': str(e)
                        }
                    )
                
                raise
        
        return decorated_function
    return decorator


class EncryptionStatusHandler:
    """
    Handler for encryption status and health checks
    """
    
    def __init__(self, app=None):
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize encryption status routes"""
        
        @app.route('/health/encryption', methods=['GET'])
        def encryption_health():
            """Health check endpoint for encryption status"""
            try:
                from .key_management import HIPAAKeyManager
                
                key_manager = HIPAAKeyManager()
                key_status = key_manager.get_key_status()
                
                status = {
                    'encryption_enabled': app.config.get('HIPAA_ENCRYPTION_ENABLED', True),
                    'audit_enabled': app.config.get('HIPAA_AUDIT_ENABLED', True),
                    'key_management': key_status,
                    'middleware_active': hasattr(app, 'hipaa_middleware'),
                    'timestamp': datetime.now().isoformat(),
                    'status': 'healthy'
                }
                
                return jsonify(status), 200
            
            except Exception as e:
                logger.error(f"Encryption health check failed: {e}")
                return jsonify({
                    'status': 'unhealthy',
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                }), 500