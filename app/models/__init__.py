# app/models/__init__.py

from ..extensions import db
from .user import User
from .template import Template
from .audit_log import AuditLog
from .scratch_note import ScratchNote
from .patient_census import PatientCensus, PatientCensusRow
from .daily_information import DailyInformation
from .saved_document import SavedDocument
from .provider_absence import ProviderAbsence

# Make models available for import
__all__ = ['db', 'User', 'Template', 'AuditLog', 'ScratchNote', 'PatientCensus', 'PatientCensusRow', 'DailyInformation', 'SavedDocument', 'ProviderAbsence']