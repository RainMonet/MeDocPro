# app/routes/templates.py - Updated with missing endpoints

from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models import Template

templates_bp = Blueprint('templates', __name__)

# Template categories with metadata
TEMPLATE_CATEGORIES = {
    'progress': {
        'name': 'Progress Notes',
        'description': 'Documentation of patient progress during treatment',
        'color': '#10b981',
        'icon': 'file-text'
    },
    'assessment': {
        'name': 'Psychiatric Assessment',
        'description': 'Comprehensive psychiatric evaluations and assessments',
        'color': '#0066cc',
        'icon': 'clipboard'
    },
    'treatment': {
        'name': 'Treatment Plans',
        'description': 'Treatment planning and intervention strategies',
        'color': '#8b5cf6',
        'icon': 'target'
    },
    'intake': {
        'name': 'Intake Forms',
        'description': 'Initial patient intake and screening forms',
        'color': '#f59e0b',
        'icon': 'user-plus'
    },
    'discharge': {
        'name': 'Discharge Summaries',
        'description': 'Patient discharge documentation and planning',
        'color': '#ef4444',
        'icon': 'log-out'
    },
    'custom': {
        'name': 'Custom Documentation',
        'description': 'Custom clinical documentation templates',
        'color': '#64748b',
        'icon': 'edit'
    }
}

@templates_bp.route('/templates', methods=['GET'])
def list_templates():
    """List all templates with full information including placeholders"""
    try:
        templates = Template.query.all()
        template_list = []
        
        for template in templates:
            template_dict = template.to_dict(include_placeholders=True)
            # Add content preview for backward compatibility
            template_dict['content_preview'] = template.content[:200] + '...' if len(template.content) > 200 else template.content
            template_list.append(template_dict)
        
        return jsonify({
            'templates': template_list,
            'count': len(template_list),
            'categories': TEMPLATE_CATEGORIES
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@templates_bp.route('/templates/<int:template_id>', methods=['GET'])
def get_template(template_id):
    """Get a specific template"""
    try:
        template = Template.query.get_or_404(template_id)
        
        return jsonify({
            'template': template.to_dict(include_placeholders=True)
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
            content=data['content'],
            category=data.get('category', 'custom'),
            description=data.get('description', '')
        )
        
        # Handle placeholders if provided
        if 'placeholders' in data:
            template.placeholders = data['placeholders']
        
        # Handle AI enhancement zones if provided
        if 'aiEnhancementZones' in data:
            template.aiEnhancementZones = data['aiEnhancementZones']
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'template': template.to_dict(include_placeholders=True),
            'message': 'Template created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@templates_bp.route('/templates/<int:template_id>', methods=['PUT'])
def update_template(template_id):
    """Update an existing template"""
    try:
        template = Template.query.get_or_404(template_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update template fields
        if 'name' in data:
            template.name = data['name']
        if 'content' in data:
            template.content = data['content']
        if 'category' in data:
            template.category = data['category']
        if 'description' in data:
            template.description = data['description']
        
        # Handle placeholders if provided
        if 'placeholders' in data:
            template.placeholders = data['placeholders']
        
        # Handle AI enhancement zones if provided
        if 'aiEnhancementZones' in data:
            template.aiEnhancementZones = data['aiEnhancementZones']
        
        db.session.commit()
        
        return jsonify({
            'template': template.to_dict(include_placeholders=True),
            'message': 'Template updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@templates_bp.route('/templates/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    """Delete a template"""
    try:
        template = Template.query.get_or_404(template_id)
        
        # Check if template is a system template
        if template.is_system:
            return jsonify({'error': 'System templates cannot be deleted'}), 403
        
        db.session.delete(template)
        db.session.commit()
        
        return jsonify({
            'message': 'Template deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@templates_bp.route('/templates/categories', methods=['GET'])
def get_template_categories():
    """Get available template categories with metadata"""
    return jsonify({
        'categories': TEMPLATE_CATEGORIES,
        'count': len(TEMPLATE_CATEGORIES)
    }), 200

@templates_bp.route('/templates/statistics', methods=['GET'])
def get_template_statistics():
    """Get template usage statistics"""
    try:
        total_templates = Template.query.count()
        
        # Count by category (mock data since we don't have category field yet)
        category_stats = {}
        for category_key in TEMPLATE_CATEGORIES.keys():
            category_stats[category_key] = 0
        
        # Add some mock data for demo
        category_stats['progress'] = max(1, total_templates // 3)
        category_stats['assessment'] = max(1, total_templates // 4)
        category_stats['treatment'] = max(1, total_templates // 5)
        
        stats = {
            'total_templates': total_templates,
            'active_templates': total_templates,
            'categories': category_stats,
            'most_used': []
        }
        
        # Add mock most used templates
        templates = Template.query.limit(3).all()
        for template in templates:
            stats['most_used'].append({
                'id': template.id,
                'name': template.name,
                'category': 'progress',
                'usage_count': 5
            })
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@templates_bp.route('/templates/top-used', methods=['GET'])
def get_top_used_templates():
    """Get user's most frequently used templates (frontend compatibility endpoint)"""
    try:
        # Get all templates with full data including placeholders
        templates = Template.query.order_by(Template.created_at.desc()).all()
        
        user_templates = []
        base_usage_counts = [47, 34, 29, 18, 15, 12, 10, 8]  # Mock usage data
        
        for i, template in enumerate(templates):
            template_dict = template.to_dict(include_placeholders=True)
            template_dict.update({
                'usage_count': base_usage_counts[i] if i < len(base_usage_counts) else max(1, 10 - i),
                'last_used': '2024-07-07T14:30:00Z',  # Mock last used date
                'created_by': 'Dr. Jane Smith'  # Mock creator
            })
            user_templates.append(template_dict)
        
        return jsonify({
            'success': True,
            'templates': user_templates,
            'total_templates': len(user_templates)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'templates': []
        }), 500