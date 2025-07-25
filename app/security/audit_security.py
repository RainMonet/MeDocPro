"""
HIPAA-Compliant Security Audit Logging
Enhanced audit logging for encryption, key management, and security events

Compliance Standards:
- HIPAA Security Rule § 164.312(b) - Audit Controls
- NIST SP 800-92 - Guide to Computer Security Log Management
- 6-year retention requirement for HIPAA audit logs
"""

import os
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from enum import Enum
import logging
from sqlalchemy import Column, String, DateTime, Text, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

logger = logging.getLogger(__name__)

class SecurityEventType(Enum):
    """Security event types for audit logging"""
    ENCRYPTION_OPERATION = "encryption_operation"
    DECRYPTION_OPERATION = "decryption_operation"
    KEY_GENERATION = "key_generation"
    KEY_ROTATION = "key_rotation"
    KEY_ACCESS = "key_access"
    AUTHENTICATION_SUCCESS = "authentication_success"
    AUTHENTICATION_FAILURE = "authentication_failure"
    AUTHORIZATION_FAILURE = "authorization_failure"
    PHI_ACCESS = "phi_access"
    PHI_MODIFICATION = "phi_modification"
    PHI_EXPORT = "phi_export"
    SYSTEM_ACCESS = "system_access"
    CONFIGURATION_CHANGE = "configuration_change"
    SECURITY_VIOLATION = "security_violation"
    DATA_BREACH_ATTEMPT = "data_breach_attempt"

class SecurityRiskLevel(Enum):
    """Risk levels for security events"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# SQLAlchemy model for security audit logs
Base = declarative_base()

class SecurityAuditLog(Base):
    """Database model for security audit logs"""
    __tablename__ = 'security_audit_logs'
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    event_type = Column(String(50), nullable=False)
    risk_level = Column(String(20), nullable=False)
    user_id = Column(String(100))
    session_id = Column(String(100))
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(String(500))
    endpoint = Column(String(200))
    method = Column(String(10))
    status_code = Column(Integer)
    patient_id = Column(String(100))
    resource_type = Column(String(50))
    resource_id = Column(String(100))
    event_details = Column(Text)
    encryption_algorithm = Column(String(50))
    key_id = Column(String(100))
    data_classification = Column(String(20))
    compliance_flags = Column(Text)  # JSON string
    integrity_hash = Column(String(64))
    retention_date = Column(DateTime(timezone=True))

class SecurityAuditLogger:
    """
    HIPAA-compliant security audit logging system
    Provides comprehensive logging for all security-related events
    """
    
    def __init__(self, database_url: Optional[str] = None):
        """
        Initialize security audit logger
        
        Args:
            database_url: Database connection string for audit logs
        """
        self.database_url = database_url or os.environ.get(
            'SECURITY_AUDIT_DB_URL',
            'sqlite:///security_audit.db'
        )
        
        # Create database engine and session
        self.engine = create_engine(
            self.database_url,
            pool_pre_ping=True,
            pool_recycle=3600
        )
        
        # Create tables if they don't exist
        Base.metadata.create_all(self.engine)
        
        # Create session factory
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        
        # Audit log retention period (6 years for HIPAA)
        self.retention_years = 6
    
    def log_encryption_event(
        self,
        operation: str,
        field_name: str,
        patient_id: Optional[str] = None,
        algorithm: str = "AES-256-GCM",
        success: bool = True,
        user_id: Optional[str] = None,
        additional_context: Optional[Dict] = None
    ):
        """
        Log encryption/decryption operations
        
        Args:
            operation: 'encrypt' or 'decrypt'
            field_name: Name of field being processed
            patient_id: Patient identifier if applicable
            algorithm: Encryption algorithm used
            success: Whether operation was successful
            user_id: User performing the operation
            additional_context: Additional context information
        """
        event_type = SecurityEventType.ENCRYPTION_OPERATION if operation == 'encrypt' else SecurityEventType.DECRYPTION_OPERATION
        risk_level = SecurityRiskLevel.MEDIUM if success else SecurityRiskLevel.HIGH
        
        details = {
            'operation': operation,
            'field_name': field_name,
            'algorithm': algorithm,
            'success': success,
            'context': additional_context or {}
        }
        
        self._create_audit_entry(
            event_type=event_type,
            risk_level=risk_level,
            user_id=user_id,
            patient_id=patient_id,
            resource_type='phi_field',
            resource_id=field_name,
            event_details=details,
            encryption_algorithm=algorithm,
            data_classification='phi'
        )
    
    def log_key_management_event(
        self,
        operation: str,
        key_type: str,
        key_id: Optional[str] = None,
        success: bool = True,
        user_id: Optional[str] = None,
        additional_context: Optional[Dict] = None
    ):
        """
        Log key management operations
        
        Args:
            operation: Key operation ('generate', 'rotate', 'access', 'delete')
            key_type: Type of key ('master', 'field', 'database', 'transit')
            key_id: Key identifier
            success: Whether operation was successful
            user_id: User performing the operation
            additional_context: Additional context information
        """
        if operation == 'generate':
            event_type = SecurityEventType.KEY_GENERATION
        elif operation == 'rotate':
            event_type = SecurityEventType.KEY_ROTATION
        else:
            event_type = SecurityEventType.KEY_ACCESS
        
        risk_level = SecurityRiskLevel.HIGH if operation in ['generate', 'rotate'] else SecurityRiskLevel.MEDIUM
        if not success:
            risk_level = SecurityRiskLevel.CRITICAL
        
        details = {
            'operation': operation,
            'key_type': key_type,
            'key_id': key_id,
            'success': success,
            'context': additional_context or {}
        }
        
        self._create_audit_entry(
            event_type=event_type,
            risk_level=risk_level,
            user_id=user_id,
            resource_type='cryptographic_key',
            resource_id=key_id,
            event_details=details,
            key_id=key_id,
            data_classification='security_critical'
        )
    
    def log_phi_access_event(
        self,
        access_type: str,
        patient_id: str,
        data_elements: List[str],
        user_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        ip_address: Optional[str] = None,
        success: bool = True,
        additional_context: Optional[Dict] = None
    ):
        """
        Log PHI data access events
        
        Args:
            access_type: Type of access ('read', 'write', 'delete', 'export')
            patient_id: Patient identifier
            data_elements: List of data elements accessed
            user_id: User accessing the data
            endpoint: API endpoint used
            ip_address: Client IP address
            success: Whether access was successful
            additional_context: Additional context information
        """
        if access_type in ['write', 'delete']:
            event_type = SecurityEventType.PHI_MODIFICATION
        elif access_type == 'export':
            event_type = SecurityEventType.PHI_EXPORT
        else:
            event_type = SecurityEventType.PHI_ACCESS
        
        risk_level = SecurityRiskLevel.MEDIUM
        if access_type in ['delete', 'export']:
            risk_level = SecurityRiskLevel.HIGH
        if not success:
            risk_level = SecurityRiskLevel.HIGH
        
        details = {
            'access_type': access_type,
            'data_elements': data_elements,
            'element_count': len(data_elements),
            'success': success,
            'context': additional_context or {}
        }
        
        self._create_audit_entry(
            event_type=event_type,
            risk_level=risk_level,
            user_id=user_id,
            patient_id=patient_id,
            endpoint=endpoint,
            ip_address=ip_address,
            resource_type='phi_record',
            resource_id=patient_id,
            event_details=details,
            data_classification='phi'
        )
    
    def log_authentication_event(
        self,
        success: bool,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        failure_reason: Optional[str] = None,
        additional_context: Optional[Dict] = None
    ):
        """
        Log authentication events
        
        Args:
            success: Whether authentication was successful
            user_id: User attempting authentication
            ip_address: Client IP address
            user_agent: Client user agent
            failure_reason: Reason for failure if applicable
            additional_context: Additional context information
        """
        event_type = SecurityEventType.AUTHENTICATION_SUCCESS if success else SecurityEventType.AUTHENTICATION_FAILURE
        risk_level = SecurityRiskLevel.LOW if success else SecurityRiskLevel.MEDIUM
        
        details = {
            'success': success,
            'failure_reason': failure_reason,
            'context': additional_context or {}
        }
        
        self._create_audit_entry(
            event_type=event_type,
            risk_level=risk_level,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_type='authentication',
            event_details=details,
            data_classification='security'
        )
    
    def log_security_violation(
        self,
        violation_type: str,
        description: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        endpoint: Optional[str] = None,
        severity: str = "HIGH",
        additional_context: Optional[Dict] = None
    ):
        """
        Log security violations and potential breach attempts
        
        Args:
            violation_type: Type of violation
            description: Description of the violation
            user_id: User associated with violation
            ip_address: Client IP address
            endpoint: Endpoint involved
            severity: Severity level
            additional_context: Additional context information
        """
        event_type = SecurityEventType.SECURITY_VIOLATION
        if 'breach' in violation_type.lower():
            event_type = SecurityEventType.DATA_BREACH_ATTEMPT
        
        risk_level = SecurityRiskLevel(severity.lower())
        
        details = {
            'violation_type': violation_type,
            'description': description,
            'severity': severity,
            'context': additional_context or {}
        }
        
        self._create_audit_entry(
            event_type=event_type,
            risk_level=risk_level,
            user_id=user_id,
            ip_address=ip_address,
            endpoint=endpoint,
            resource_type='security_event',
            event_details=details,
            data_classification='security_critical'
        )
    
    def _create_audit_entry(
        self,
        event_type: SecurityEventType,
        risk_level: SecurityRiskLevel,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        status_code: Optional[int] = None,
        patient_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        event_details: Optional[Dict] = None,
        encryption_algorithm: Optional[str] = None,
        key_id: Optional[str] = None,
        data_classification: Optional[str] = None
    ):
        """Create audit log entry"""
        try:
            timestamp = datetime.now(timezone.utc)
            
            # Create compliance flags
            compliance_flags = {
                'hipaa_security_rule': True,
                'retention_required': True,
                'phi_involved': data_classification == 'phi',
                'encryption_required': data_classification in ['phi', 'security_critical']
            }
            
            # Calculate retention date (6 years from now)
            from dateutil.relativedelta import relativedelta
            retention_date = timestamp + relativedelta(years=self.retention_years)
            
            # Create integrity hash
            integrity_data = f"{timestamp.isoformat()}{event_type.value}{user_id or ''}{patient_id or ''}"
            integrity_hash = hashlib.sha256(integrity_data.encode()).hexdigest()
            
            # Create audit log entry
            audit_entry = SecurityAuditLog(
                timestamp=timestamp,
                event_type=event_type.value,
                risk_level=risk_level.value,
                user_id=user_id,
                session_id=session_id or os.environ.get('HIPAA_SESSION_ID'),
                ip_address=ip_address,
                user_agent=user_agent,
                endpoint=endpoint,
                method=method,
                status_code=status_code,
                patient_id=patient_id,
                resource_type=resource_type,
                resource_id=resource_id,
                event_details=json.dumps(event_details) if event_details else None,
                encryption_algorithm=encryption_algorithm,
                key_id=key_id,
                data_classification=data_classification,
                compliance_flags=json.dumps(compliance_flags),
                integrity_hash=integrity_hash,
                retention_date=retention_date
            )
            
            # Save to database
            self.session.add(audit_entry)
            self.session.commit()
            self.session.flush()  # Ensure the entry is written
            
            # Also log to application logger for immediate visibility
            logger.info(
                f"Security Audit: {event_type.value} | Risk: {risk_level.value} | "
                f"User: {user_id} | Patient: {patient_id} | Hash: {integrity_hash[:8]}"
            )
            
        except Exception as e:
            logger.error(f"Failed to create security audit entry: {e}")
            self.session.rollback()
    
    def get_audit_report(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        event_types: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        risk_level: Optional[str] = None
    ) -> List[Dict]:
        """
        Generate audit report for compliance
        
        Args:
            start_date: Start date for report
            end_date: End date for report
            event_types: Filter by event types
            user_id: Filter by user ID
            patient_id: Filter by patient ID
            risk_level: Filter by risk level
            
        Returns:
            List of audit entries matching criteria
        """
        try:
            query = self.session.query(SecurityAuditLog)
            
            # Apply filters
            if start_date:
                query = query.filter(SecurityAuditLog.timestamp >= start_date)
            if end_date:
                query = query.filter(SecurityAuditLog.timestamp <= end_date)
            if event_types:
                query = query.filter(SecurityAuditLog.event_type.in_(event_types))
            if user_id:
                query = query.filter(SecurityAuditLog.user_id == user_id)
            if patient_id:
                query = query.filter(SecurityAuditLog.patient_id == patient_id)
            if risk_level:
                query = query.filter(SecurityAuditLog.risk_level == risk_level)
            
            # Order by timestamp descending
            query = query.order_by(SecurityAuditLog.timestamp.desc())
            
            # Convert to dictionaries
            results = []
            for entry in query.all():
                result = {
                    'id': entry.id,
                    'timestamp': entry.timestamp.isoformat(),
                    'event_type': entry.event_type,
                    'risk_level': entry.risk_level,
                    'user_id': entry.user_id,
                    'patient_id': entry.patient_id,
                    'resource_type': entry.resource_type,
                    'resource_id': entry.resource_id,
                    'ip_address': entry.ip_address,
                    'endpoint': entry.endpoint,
                    'encryption_algorithm': entry.encryption_algorithm,
                    'data_classification': entry.data_classification,
                    'integrity_hash': entry.integrity_hash,
                    'event_details': json.loads(entry.event_details) if entry.event_details else None,
                    'compliance_flags': json.loads(entry.compliance_flags) if entry.compliance_flags else None
                }
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to generate audit report: {e}")
            return []
    
    def cleanup_expired_logs(self) -> int:
        """
        Clean up audit logs that have exceeded retention period
        
        Returns:
            Number of logs cleaned up
        """
        try:
            current_time = datetime.now(timezone.utc)
            expired_logs = self.session.query(SecurityAuditLog).filter(
                SecurityAuditLog.retention_date < current_time
            )
            
            count = expired_logs.count()
            expired_logs.delete()
            self.session.commit()
            
            logger.info(f"Cleaned up {count} expired security audit logs")
            return count
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired audit logs: {e}")
            self.session.rollback()
            return 0
    
    def __del__(self):
        """Clean up database session"""
        if hasattr(self, 'session'):
            self.session.close()