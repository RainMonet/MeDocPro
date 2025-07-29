# app/models/template.py

from ..extensions import db
from datetime import datetime
import json
import re

class Template(db.Model):
    """Represents a documentation template with placeholder metadata."""
    __tablename__ = 'template'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    
    # Enhanced metadata fields
    category = db.Column(db.String(50), default='custom', nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Usage tracking
    usage_count = db.Column(db.Integer, default=0, nullable=False)
    last_used = db.Column(db.DateTime, nullable=True)
    
    # Placeholder definitions stored as JSON
    _placeholders = db.Column('placeholders', db.Text, nullable=True)
    
    # AI Enhancement zones stored as JSON
    _ai_enhancement_zones = db.Column('ai_enhancement_zones', db.Text, nullable=True)
    
    # Template status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_system = db.Column(db.Boolean, default=False, nullable=False)  # System templates cannot be deleted
    
    # Relationships
    creator = db.relationship('User', backref=db.backref('created_templates', lazy=True))
    
    @property
    def placeholders(self):
        """Get placeholder definitions as list of dictionaries"""
        if self._placeholders:
            try:
                return json.loads(self._placeholders)
            except (ValueError, TypeError):
                return []
        return []
    
    @placeholders.setter
    def placeholders(self, value):
        """Set placeholder definitions from list of dictionaries"""
        if value is None:
            self._placeholders = None
        else:
            self._placeholders = json.dumps(value)
            self.updated_at = datetime.utcnow()
    
    @property
    def aiEnhancementZones(self):
        """Get AI enhancement zones as list of dictionaries"""
        if self._ai_enhancement_zones:
            try:
                return json.loads(self._ai_enhancement_zones)
            except (ValueError, TypeError):
                return []
        return []
    
    @aiEnhancementZones.setter
    def aiEnhancementZones(self, value):
        """Set AI enhancement zones from list of dictionaries"""
        if value is None:
            self._ai_enhancement_zones = None
        else:
            self._ai_enhancement_zones = json.dumps(value)
            self.updated_at = datetime.utcnow()
    
    def extract_placeholders_from_content(self):
        """Extract placeholder names from template content and create basic definitions"""
        # Find all {{placeholder}} patterns in content
        placeholder_pattern = r'\{\{([^}]+)\}\}'
        matches = re.findall(placeholder_pattern, self.content)
        
        # Get unique placeholder names
        unique_placeholders = list(set([match.strip() for match in matches]))
        
        # Create placeholder definitions if they don't exist
        existing_placeholders = {p.get('key'): p for p in self.placeholders}
        new_placeholders = []
        
        for placeholder_name in unique_placeholders:
            if placeholder_name not in existing_placeholders:
                # Determine field type based on name
                field_type = self._guess_field_type(placeholder_name)
                
                new_placeholders.append({
                    'key': placeholder_name,
                    'description': self._generate_description(placeholder_name),
                    'type': field_type,
                    'example': self._generate_example(placeholder_name, field_type),
                    'required': True
                })
            else:
                new_placeholders.append(existing_placeholders[placeholder_name])
        
        self.placeholders = new_placeholders
        return new_placeholders
    
    def _guess_field_type(self, placeholder_name):
        """Guess the appropriate field type based on placeholder name"""
        name_lower = placeholder_name.lower()
        
        if 'date' in name_lower:
            return 'date'
        elif any(word in name_lower for word in ['age', 'count', 'number', 'score']):
            return 'number'
        elif any(word in name_lower for word in ['assessment', 'plan', 'content', 'notes', 'description', 'summary']):
            return 'textarea'
        elif any(word in name_lower for word in ['active', 'is_', 'has_', 'enabled']):
            return 'boolean'
        else:
            return 'text'
    
    def _generate_description(self, placeholder_name):
        """Generate a human-readable description for a placeholder"""
        # Convert snake_case or camelCase to readable format
        readable = re.sub(r'[_-]', ' ', placeholder_name)
        readable = re.sub(r'([a-z])([A-Z])', r'\1 \2', readable)
        return readable.title()
    
    def _generate_example(self, placeholder_name, field_type):
        """Generate example values based on placeholder name and type"""
        name_lower = placeholder_name.lower()
        
        if field_type == 'date':
            return '2024-07-13'
        elif field_type == 'number':
            if 'age' in name_lower:
                return '45'
            elif 'score' in name_lower:
                return '8'
            else:
                return '10'
        elif field_type == 'boolean':
            return 'true'
        elif field_type == 'textarea':
            if 'assessment' in name_lower:
                return 'Patient shows improvement in mood and cognitive function'
            elif 'plan' in name_lower:
                return 'Continue current medication regimen and weekly therapy sessions'
            else:
                return 'Detailed clinical notes and observations'
        else:
            # text field examples
            if 'name' in name_lower:
                return 'Smith, John M.'
            elif 'provider' in name_lower:
                return 'Dr. Jane Smith'
            elif 'mood' in name_lower:
                return 'stable'
            elif 'affect' in name_lower:
                return 'appropriate'
            else:
                return f'Enter {placeholder_name.replace("_", " ")}'
    
    def increment_usage(self):
        """Increment usage count and update last used timestamp"""
        self.usage_count += 1
        self.last_used = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def add_placeholder(self, key, description, field_type='text', example=None, required=True):
        """Add a new placeholder definition"""
        current_placeholders = self.placeholders
        
        # Check if placeholder already exists
        for placeholder in current_placeholders:
            if placeholder.get('key') == key:
                # Update existing placeholder
                placeholder.update({
                    'description': description,
                    'type': field_type,
                    'example': example,
                    'required': required
                })
                break
        else:
            # Add new placeholder
            current_placeholders.append({
                'key': key,
                'description': description,
                'type': field_type,
                'example': example,
                'required': required
            })
        
        self.placeholders = current_placeholders
    
    def remove_placeholder(self, key):
        """Remove a placeholder definition"""
        current_placeholders = self.placeholders
        self.placeholders = [p for p in current_placeholders if p.get('key') != key]
    
    def get_placeholder_keys(self):
        """Get list of placeholder keys"""
        return [p.get('key') for p in self.placeholders if p.get('key')]
    
    def validate_content_placeholders(self):
        """Validate that all placeholders in content have definitions"""
        content_placeholders = set(re.findall(r'\{\{([^}]+)\}\}', self.content))
        defined_placeholders = set(self.get_placeholder_keys())
        
        missing = content_placeholders - defined_placeholders
        unused = defined_placeholders - content_placeholders
        
        return {
            'valid': len(missing) == 0,
            'missing_definitions': list(missing),
            'unused_definitions': list(unused)
        }
    
    def to_dict(self, include_usage=False, include_placeholders=True):
        """Convert to dictionary for API responses"""
        data = {
            'id': self.id,
            'name': self.name,
            'content': self.content,
            'category': self.category,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active,
            'is_system': self.is_system
        }
        
        if include_placeholders:
            data['placeholders'] = self.placeholders
            data['placeholder_count'] = len(self.placeholders)
            data['aiEnhancementZones'] = self.aiEnhancementZones
        
        if include_usage:
            data['usage_count'] = self.usage_count
            data['last_used'] = self.last_used.isoformat() if self.last_used else None
        
        return data
    
    @classmethod
    def get_by_category(cls, category):
        """Get all active templates in a category"""
        return cls.query.filter_by(category=category, is_active=True).order_by(cls.name).all()
    
    @classmethod
    def get_most_used(cls, limit=10):
        """Get most frequently used templates"""
        return cls.query.filter_by(is_active=True).order_by(cls.usage_count.desc()).limit(limit).all()
    
    @classmethod
    def search(cls, query):
        """Search templates by name, description, or content"""
        search_term = f"%{query}%"
        return cls.query.filter(
            db.or_(
                cls.name.ilike(search_term),
                cls.description.ilike(search_term),
                cls.content.ilike(search_term)
            ),
            cls.is_active == True
        ).order_by(cls.name).all()
    
    def __repr__(self):
        return f'<Template {self.name} ({self.category})>'