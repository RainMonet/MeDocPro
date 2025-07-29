# app/models/saved_document.py

from ..extensions import db
from datetime import datetime, date, timedelta
import json

class SavedDocument(db.Model):
    """
    Stores finalized clinical documents with 7-day retention policy.
    Only finalized documents are saved and can be downloaded for backup.
    """
    __tablename__ = 'saved_document'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign key relationships
    patient_census_row_id = db.Column(db.Integer, db.ForeignKey('patient_census_row.id'), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('template.id'), nullable=True)  # Optional - some documents may not use templates
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Who finalized the document
    
    # Document metadata
    patient_name = db.Column(db.String(200), nullable=False, index=True)  # Denormalized for easier sorting
    patient_id = db.Column(db.String(50), nullable=True, index=True)  # Patient identifier
    room_number = db.Column(db.String(10), nullable=True)  # Room at time of document creation
    
    # Document content and classification
    document_title = db.Column(db.String(500), nullable=False)
    document_content = db.Column(db.Text, nullable=False)  # The finalized document content
    document_type = db.Column(db.String(50), nullable=False, index=True)  # follow-up, admission, discharge
    document_format = db.Column(db.String(20), default='text', nullable=False)  # text, html, markdown
    
    # Template information (if applicable)
    template_name = db.Column(db.String(200), nullable=True)  # Denormalized template name
    
    # Timestamps
    document_date = db.Column(db.Date, nullable=False, index=True)  # Date the document represents
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    finalized_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)  # When document was finalized
    expires_at = db.Column(db.DateTime, nullable=False, index=True)  # Auto-calculated as finalized_at + 7 days
    
    # Document status and metadata
    status = db.Column(db.String(20), default='finalized', nullable=False)  # finalized, archived, deleted
    file_size = db.Column(db.Integer, nullable=True)  # Document size in characters
    checksum = db.Column(db.String(64), nullable=True)  # For integrity verification
    
    # Additional metadata stored as JSON
    _metadata = db.Column('metadata', db.Text, nullable=True)
    
    # Soft delete and audit fields
    is_deleted = db.Column(db.Boolean, default=False, nullable=False, index=True)
    deleted_at = db.Column(db.DateTime, nullable=True)
    deleted_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Relationships
    patient_census_row = db.relationship('PatientCensusRow', backref=db.backref('saved_documents', lazy=True))
    template = db.relationship('Template', backref=db.backref('saved_documents', lazy=True))
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('created_saved_documents', lazy=True))
    deleted_by_user = db.relationship('User', foreign_keys=[deleted_by], backref=db.backref('deleted_saved_documents', lazy=True))
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Auto-calculate expiration date (7 days from finalization)
        if not self.expires_at and self.finalized_at:
            self.expires_at = self.finalized_at + timedelta(days=7)
        elif not self.expires_at:
            self.expires_at = datetime.utcnow() + timedelta(days=7)
        
        # Calculate file size
        if self.document_content:
            self.file_size = len(self.document_content)
    
    @property
    def document_metadata(self):
        """Get metadata as dictionary"""
        if self._metadata:
            try:
                return json.loads(self._metadata)
            except (ValueError, TypeError):
                return {}
        return {}
    
    @document_metadata.setter
    def document_metadata(self, value):
        """Set metadata from dictionary"""
        if value is None:
            self._metadata = None
        else:
            self._metadata = json.dumps(value)
    
    @property
    def is_expired(self):
        """Check if document has passed its 7-day retention period"""
        return datetime.utcnow() > self.expires_at
    
    @property
    def days_remaining(self):
        """Get number of days remaining before expiration"""
        if self.is_expired:
            return 0
        delta = self.expires_at - datetime.utcnow()
        return max(0, delta.days)
    
    @property
    def patient_last_name(self):
        """Extract last name for sorting purposes"""
        if not self.patient_name:
            return ""
        # Handle formats like "Smith, John" or "John Smith"
        if ',' in self.patient_name:
            return self.patient_name.split(',')[0].strip()
        else:
            parts = self.patient_name.strip().split()
            return parts[-1] if parts else ""
    
    def extend_retention(self, additional_days=7):
        """Extend the retention period by additional days"""
        self.expires_at = self.expires_at + timedelta(days=additional_days)
        db.session.commit()
    
    def soft_delete(self, user_id):
        """Soft delete the document"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        self.deleted_by = user_id
        self.status = 'deleted'
    
    def to_dict(self, include_content=False):
        """Convert to dictionary for API responses"""
        data = {
            'id': self.id,
            'patient_name': self.patient_name,
            'patient_id': self.patient_id,
            'room_number': self.room_number,
            'document_title': self.document_title,
            'document_type': self.document_type,
            'template_name': self.template_name,
            'document_date': self.document_date.isoformat() if self.document_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'finalized_at': self.finalized_at.isoformat() if self.finalized_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'status': self.status,
            'file_size': self.file_size,
            'is_expired': self.is_expired,
            'days_remaining': self.days_remaining,
            'patient_last_name': self.patient_last_name,
            'metadata': self.document_metadata
        }
        
        if include_content:
            data['document_content'] = self.document_content
        
        return data
    
    @classmethod
    def get_active_documents(cls, user_id=None, limit=None):
        """Get all active (non-deleted, non-expired) documents"""
        query = cls.query.filter(
            cls.is_deleted == False,
            cls.expires_at > datetime.utcnow()
        )
        
        if user_id:
            query = query.filter(cls.user_id == user_id)
        
        query = query.order_by(cls.finalized_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    @classmethod
    def get_expired_documents(cls, user_id=None):
        """Get documents that have exceeded the 7-day retention period"""
        query = cls.query.filter(
            cls.is_deleted == False,
            cls.expires_at <= datetime.utcnow()
        )
        
        if user_id:
            query = query.filter(cls.user_id == user_id)
        
        return query.all()
    
    @classmethod
    def cleanup_expired_documents(cls, user_id=None, force=False):
        """
        Delete expired documents (with user permission if force=False)
        
        Args:
            user_id: Optional user ID to limit cleanup to specific user
            force: If True, delete without user permission
            
        Returns:
            dict: Statistics about deleted documents
        """
        expired_docs = cls.get_expired_documents(user_id)
        
        if not expired_docs:
            return {
                'deleted_count': 0,
                'message': 'No expired documents found'
            }
        
        deleted_count = 0
        for doc in expired_docs:
            if force:
                db.session.delete(doc)
                deleted_count += 1
            else:
                # Soft delete for user review
                doc.soft_delete(user_id)
                deleted_count += 1
        
        db.session.commit()
        
        return {
            'deleted_count': deleted_count,
            'force_deleted': force,
            'message': f'{"Hard" if force else "Soft"} deleted {deleted_count} expired documents'
        }
    
    @classmethod
    def search_documents(cls, query, user_id=None, document_type=None, start_date=None, end_date=None):
        """Search documents by various criteria"""
        search = cls.query.filter(cls.is_deleted == False)
        
        if user_id:
            search = search.filter(cls.user_id == user_id)
        
        if document_type:
            search = search.filter(cls.document_type == document_type)
        
        if start_date:
            search = search.filter(cls.document_date >= start_date)
        
        if end_date:
            search = search.filter(cls.document_date <= end_date)
        
        if query:
            search_term = f"%{query}%"
            search = search.filter(
                db.or_(
                    cls.patient_name.ilike(search_term),
                    cls.document_title.ilike(search_term),
                    cls.document_content.ilike(search_term)
                )
            )
        
        return search.order_by(cls.finalized_at.desc()).all()
    
    @classmethod
    def get_documents_for_backup(cls, user_id=None, start_date=None, end_date=None):
        """Get documents for backup download (within retention period)"""
        query = cls.query.filter(
            cls.is_deleted == False,
            cls.status == 'finalized'
        )
        
        if user_id:
            query = query.filter(cls.user_id == user_id)
        
        if start_date:
            query = query.filter(cls.document_date >= start_date)
        
        if end_date:
            query = query.filter(cls.document_date <= end_date)
        else:
            # Default to last 7 days
            query = query.filter(cls.document_date >= date.today() - timedelta(days=7))
        
        return query.order_by(cls.document_date.desc(), cls.patient_name).all()
    
    def __repr__(self):
        return f'<SavedDocument {self.document_title} - {self.patient_name} ({self.document_type})>'