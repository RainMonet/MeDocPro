# app/routes/templates.py

from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models import Template

templates_bp = Blueprint('templates', __name__)

@templates_bp.route('/templates', methods=['GET'])
def list_templates():
    """List all templates"""
    try:
        templates = Template.query.all()
        template_list = []
        
        for template in templates:
            template_list.append({
                'id': template.id,
                'name': template.name,
                'content_preview': template.content[:200] + '...' if len(template.content) > 200 else template.content
            })
        
        return jsonify({
            'templates': template_list,
            'count': len(template_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@templates_bp.route('/templates/<int:template_id>', methods=['GET'])
def get_template(template_id):
    """Get a specific template"""
    try:
        template = Template.query.get_or_404(template_id)
        
        return jsonify({
            'id': template.id,
            'name': template.name,
            'content': template.content
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@templates_bp.route('/templates', methods=['POST'])
def create_template():
    """Create a new template"""
    try:
        data = request.get_json()
        
        if not data or not data.get('name') or not data.get('content'):
            return jsonify({'error': 'Name and content are required'}), 400
        
        template = Template(
            name=data['name'],
            content=data['content']
        )
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'id': template.id,
            'name': template.name,
            'message': 'Template created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
