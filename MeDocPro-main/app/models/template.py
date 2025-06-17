# app/models/template.py

from ..extensions import db

class Template(db.Model):
    """Represents a documentation template."""
    __tablename__ = 'template'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    
    def __repr__(self):
        return f'<Template {self.name}>'