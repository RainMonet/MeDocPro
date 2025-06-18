# app/models/__init__.py

from ..extensions import db
from .user import User
from .template import Template
from .audit_log import AuditLog
from .patient_data import PatientData

# Make models available for import
__all__ = ['db', 'User', 'Template', 'AuditLog']