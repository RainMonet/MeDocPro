"""
Templates API Blueprint
Handles clinical documentation templates with AI enhancement capabilities

Endpoints:
- GET /api/templates - List templates with filtering and pagination
- POST /api/templates - Create new template
- GET /api/templates/{id} - Get specific template
- PUT /api/templates/{id} - Update template
- DELETE /api/templates/{id} - Delete template (soft delete)
- POST /api/templates/{id}/populate - Populate template with data
- GET /api/templates/categories - Get available template categories
"""

from flask import Blueprint, request, jsonify, g, current_app
from sqlalchemy import and_, or_
from datetime import datetime
import uuid
import json
import re

from models import db, Template, TemplateInstance, User, AuditLog
from app import require_auth, require_role, limiter

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

def validate_template_data(data, is_update=False):
    """Validate template data with clinical requirements"""
    errors = []
    
    if not is_update or 'name' in data:
        name = data.get('name', '').strip()
        if not name:
            errors.append('Template name is required')
        elif len(name) > 200:
            errors.append('Template name must be 200 characters or less')
    
    if not is_update or 'category' in data:
        category = data.get('category', '')
        if not category:
            errors.append('Template category is required')
        elif category not in TEMPLATE_CATEGORIES:
            errors.append(f'Invalid category. Must be one of: {", ".join(TEMPLATE_CATEGORIES.keys())}')
    
    if not is_update or 'content' in data:
        content = data.get('content', '').strip()
        if not content:
            errors.append('Template content is required')
        elif len(content) > 50000:  # 50KB limit
            errors.append('Template content must be 50,000 characters or less')
        
        # Validate for potential PHI in template content
        phi_patterns = [
            r'\d{3}-\d{2}-\d{4}',  # SSN pattern
            r'\(\d{3}\)\s?\d{3}-\d{4}',  # Phone pattern
            r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'  # Email pattern
        ]
        
        for pattern in phi_patterns:
            if re.search(pattern, content):
                errors.append('Template content appears to contain PHI data. Use placeholders instead.')
                break
    
    if 'placeholders' in data:
        placeholders = data.get('placeholders', [])
        if not isinstance(placeholders, list):
            errors.append('Placeholders must be a list')
        else:
            placeholder_keys = set()
            for i, placeholder in enumerate(placeholders):
                if not isinstance(placeholder, dict):
                    errors.append(f'Placeholder {i+1} must be an object')
                    continue
                
                key = placeholder.get('key', '')
                if not key:
                    errors.append(f'Placeholder {i+1} must have a key')
                elif key in placeholder_keys:
                    errors.append(f'Duplicate placeholder key: {key}')
                else:
                    placeholder_keys.add(key)
                
                if not placeholder.get('description'):
                    errors.append(f'Placeholder {i+1} must have a description')
                
                if placeholder.get('type') not in ['text', 'date', 'number', 'phi']:
                    errors.append(f'Placeholder {i+1} must have a valid type (text, date, number, phi)')
    
    if 'ai_enhancement_zones' in data:
        zones = data.get('ai_enhancement_zones', [])
        if not isinstance(zones, list):
            errors.append('AI enhancement zones must be a list')
        else:
            for i, zone in enumerate(zones):
                if not isinstance(zone, dict):
                    errors.append(f'AI zone {i+1} must be an object')
                    continue
                
                required_fields = ['start', 'end', 'type', 'intensity']
                for field in required_fields:
                    if field not in zone:
                        errors.append(f'AI zone {i+1} missing required field: {field}')
                
                if zone.get('type') not in ['clinical', 'narrative', 'diagnostic']:
                    errors.append(f'AI zone {i+1} must have valid type (clinical, narrative, diagnostic)')
                
                intensity = zone.get('intensity')
                if intensity is not None and (not isinstance(intensity, int) or intensity < 0 or intensity > 100):
                    errors.append(f'AI zone {i+1} intensity must be an integer between 0 and 100')
    
    return errors

@templates_bp.route('', methods=['GET'])
@require_auth
def list_templates():
    """
    List templates with filtering, sorting, and pagination
    
    Query parameters:
    - category: Filter by category
    - search: Search in name and description
    - is_public: Filter by public/private templates
    - created_by: Filter by creator
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - sort_by: Sort field (name, created_at, updated_at, usage_count)
    - sort_order: Sort order (asc, desc)
    """
    try:
        # Parse query parameters
        category = request.args.get('category')
        search = request.args.get('search', '').strip()
        is_public = request.args.get('is_public')
        created_by = request.args.get('created_by')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build query
        query = Template.query.filter(Template.is_deleted == False)
        
        # Apply filters
        if category and category in TEMPLATE_CATEGORIES:
            query = query.filter(Template.category == category)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Template.name.ilike(search_term),
                    Template.description.ilike(search_term)
                )
            )
        
        if is_public is not None:
            is_public_bool = is_public.lower() in ['true', '1', 'yes']
            query = query.filter(Template.is_public == is_public_bool)
        
        if created_by:
            try:
                creator_uuid = uuid.UUID(created_by)
                query = query.filter(Template.created_by == creator_uuid)
            except ValueError:
                return jsonify({'error': 'Invalid created_by UUID format'}), 400
        
        # Apply sorting
        sort_column = getattr(Template, sort_by, None)
        if sort_column is None:
            return jsonify({'error': f'Invalid sort field: {sort_by}'}), 400
        
        if sort_order.lower() == 'desc':
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Get current user for access control
        current_user = User.query.get(g.current_user_id)
        
        # Apply access control (non-public templates)
        if current_user.role not in ['administrator']:
            query = query.filter(
                or_(
                    Template.is_public == True,
                    Template.created_by == current_user.id
                )
            )
        
        # Paginate
        paginated = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Convert to JSON
        templates = []
        for template in paginated.items:
            template_data = template.to_dict(include_content=False)
            templates.append(template_data)
        
        # Log template list access
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='templates_list',
            action='READ',
            details={
                'filters': {
                    'category': category,
                    'search': bool(search),
                    'is_public': is_public
                },
                'page': page,
                'per_page': per_page,
                'total_results': paginated.total
            },
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'templates': templates,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated.total,
                'pages': paginated.pages,
                'has_next': paginated.has_next,
                'has_prev': paginated.has_prev
            },
            'categories': TEMPLATE_CATEGORIES
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"List templates error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching templates'}), 500

@templates_bp.route('', methods=['POST'])
@require_auth
@limiter.limit("10 per hour")
def create_template():
    """
    Create a new clinical documentation template
    
    Request body:
    {
        "name": "Template name",
        "category": "progress",
        "description": "Template description",
        "content": "Template content with {{placeholders}}",
        "placeholders": [...],
        "ai_enhancement_zones": [...],
        "is_public": false
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate template data
        errors = validate_template_data(data)
        if errors:
            return jsonify({'error': 'Validation failed', 'details': errors}), 400
        
        # Get current user
        current_user = User.query.get(g.current_user_id)
        
        # Create template
        template = Template(
            name=data['name'].strip(),
            category=data['category'],
            description=data.get('description', '').strip(),
            content=data['content'].strip(),
            placeholders=data.get('placeholders', []),
            ai_enhancement_zones=data.get('ai_enhancement_zones', []),
            version=data.get('version', '1.0'),
            is_public=data.get('is_public', False),
            created_by=current_user.id
        )
        
        # Only administrators can create public templates
        if template.is_public and current_user.role != 'administrator':
            template.is_public = False
        
        db.session.add(template)
        db.session.commit()
        
        # Log template creation
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='template_create',
            resource_type='template',
            resource_id=str(template.id),
            action='CREATE',
            details={
                'template_name': template.name,
                'category': template.category,
                'is_public': template.is_public,
                'placeholder_count': len(template.placeholders),
                'ai_zone_count': len(template.ai_enhancement_zones)
            },
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'message': 'Template created successfully',
            'template': template.to_dict()
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Create template error: {str(e)}")
        return jsonify({'error': 'An error occurred while creating template'}), 500

@templates_bp.route('/<template_id>', methods=['GET'])
@require_auth
def get_template(template_id):
    """Get a specific template by ID"""
    try:
        # Validate UUID
        try:
            template_uuid = uuid.UUID(template_id)
        except ValueError:
            return jsonify({'error': 'Invalid template ID format'}), 400
        
        # Get template
        template = Template.query.filter(
            Template.id == template_uuid,
            Template.is_deleted == False
        ).first()
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check access permissions
        current_user = User.query.get(g.current_user_id)
        if not template.is_public and template.created_by != current_user.id and current_user.role != 'administrator':
            return jsonify({'error': 'Access denied'}), 403
        
        # Log template access
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='template_access',
            resource_type='template',
            resource_id=str(template.id),
            action='READ',
            details={'template_name': template.name},
            ip_address=request.remote_addr
        )
        
        return jsonify({'template': template.to_dict()}), 200
        
    except Exception as e:
        current_app.logger.error(f"Get template error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching template'}), 500

@templates_bp.route('/<template_id>', methods=['PUT'])
@require_auth
@limiter.limit("20 per hour")
def update_template(template_id):
    """Update a template"""
    try:
        # Validate UUID
        try:
            template_uuid = uuid.UUID(template_id)
        except ValueError:
            return jsonify({'error': 'Invalid template ID format'}), 400
        
        # Get template
        template = Template.query.filter(
            Template.id == template_uuid,
            Template.is_deleted == False
        ).first()
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check permissions
        current_user = User.query.get(g.current_user_id)
        if template.created_by != current_user.id and current_user.role != 'administrator':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate update data
        errors = validate_template_data(data, is_update=True)
        if errors:
            return jsonify({'error': 'Validation failed', 'details': errors}), 400
        
        # Track changes
        changes = []
        
        # Update fields
        updateable_fields = ['name', 'category', 'description', 'content', 'version', 'is_public']
        for field in updateable_fields:
            if field in data:
                old_value = getattr(template, field)
                new_value = data[field]
                
                if field in ['name', 'description', 'content'] and isinstance(new_value, str):
                    new_value = new_value.strip()
                
                if old_value != new_value:
                    setattr(template, field, new_value)
                    changes.append(field)
        
        # Handle complex fields
        if 'placeholders' in data:
            old_placeholders = template.placeholders or []
            new_placeholders = data['placeholders']
            if old_placeholders != new_placeholders:
                template.placeholders = new_placeholders
                changes.append('placeholders')
        
        if 'ai_enhancement_zones' in data:
            old_zones = template.ai_enhancement_zones or []
            new_zones = data['ai_enhancement_zones']
            if old_zones != new_zones:
                template.ai_enhancement_zones = new_zones
                changes.append('ai_enhancement_zones')
        
        # Only administrators can change public status
        if 'is_public' in data and current_user.role != 'administrator':
            if template.is_public != data['is_public']:
                return jsonify({'error': 'Only administrators can change public status'}), 403
        
        if not changes:
            return jsonify({'message': 'No changes detected', 'template': template.to_dict()}), 200
        
        # Update timestamp
        template.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log template update
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='template_update',
            resource_type='template',
            resource_id=str(template.id),
            action='UPDATE',
            details={
                'template_name': template.name,
                'changed_fields': changes
            },
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'message': 'Template updated successfully',
            'changes': changes,
            'template': template.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Update template error: {str(e)}")
        return jsonify({'error': 'An error occurred while updating template'}), 500

@templates_bp.route('/<template_id>', methods=['DELETE'])
@require_auth
@limiter.limit("10 per hour")
def delete_template(template_id):
    """Soft delete a template"""
    try:
        # Validate UUID
        try:
            template_uuid = uuid.UUID(template_id)
        except ValueError:
            return jsonify({'error': 'Invalid template ID format'}), 400
        
        # Get template
        template = Template.query.filter(
            Template.id == template_uuid,
            Template.is_deleted == False
        ).first()
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Check permissions
        current_user = User.query.get(g.current_user_id)
        if template.created_by != current_user.id and current_user.role != 'administrator':
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if template has instances
        instance_count = TemplateInstance.query.filter(
            TemplateInstance.template_id == template.id,
            TemplateInstance.is_deleted == False
        ).count()
        
        if instance_count > 0:
            return jsonify({
                'error': 'Cannot delete template with existing instances',
                'instance_count': instance_count
            }), 409
        
        # Soft delete
        template.soft_delete()
        
        # Log template deletion
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='template_delete',
            resource_type='template',
            resource_id=str(template.id),
            action='DELETE',
            details={'template_name': template.name},
            ip_address=request.remote_addr
        )
        
        return jsonify({'message': 'Template deleted successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Delete template error: {str(e)}")
        return jsonify({'error': 'An error occurred while deleting template'}), 500

@templates_bp.route('/<template_id>/populate', methods=['POST'])
@require_auth
@limiter.limit("30 per hour")
def populate_template(template_id):
    """
    Populate a template with patient data
    
    Request body:
    {
        "patient_identifier": "encrypted_patient_id",
        "placeholder_values": {
            "patient_name": "Doe, John",
            "date_of_service": "2025-06-09",
            ...
        },
        "ai_enhance": true,
        "encounter_date": "2025-06-09T10:30:00Z"
    }
    """
    try:
        # Validate UUID
        try:
            template_uuid = uuid.UUID(template_id)
        except ValueError:
            return jsonify({'error': 'Invalid template ID format'}), 400
        
        # Get template
        template = Template.query.filter(
            Template.id == template_uuid,
            Template.is_deleted == False,
            Template.is_active == True
        ).first()
        
        if not template:
            return jsonify({'error': 'Template not found or inactive'}), 404
        
        # Check access permissions
        current_user = User.query.get(g.current_user_id)
        if not template.is_public and template.created_by != current_user.id and current_user.role != 'administrator':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        patient_identifier = data.get('patient_identifier', '').strip()
        placeholder_values = data.get('placeholder_values', {})
        ai_enhance = data.get('ai_enhance', False)
        encounter_date = data.get('encounter_date')
        
        if not patient_identifier:
            return jsonify({'error': 'Patient identifier is required'}), 400
        
        if not isinstance(placeholder_values, dict):
            return jsonify({'error': 'Placeholder values must be an object'}), 400
        
        # Parse encounter date
        encounter_datetime = None
        if encounter_date:
            try:
                encounter_datetime = datetime.fromisoformat(encounter_date.replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid encounter date format'}), 400
        
        # Populate template content
        populated_content = template.content
        
        # Replace placeholders
        for placeholder in template.placeholders or []:
            placeholder_key = placeholder.get('key')
            if placeholder_key in placeholder_values:
                value = placeholder_values[placeholder_key]
                populated_content = populated_content.replace(
                    f"{{{{{placeholder_key}}}}}",
                    str(value)
                )
        
        # Create template instance
        instance = TemplateInstance(
            template_id=template.id,
            patient_identifier=patient_identifier,  # Will be encrypted in model
            populated_content=populated_content,
            placeholder_values=placeholder_values,
            encounter_date=encounter_datetime,
            created_by=current_user.id,
            status='draft'
        )
        
        db.session.add(instance)
        
        # Increment template usage
        template.increment_usage()
        
        db.session.commit()
        
        # Log template population (PHI access)
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='template_populate',
            resource_type='template',
            resource_id=str(template.id),
            action='CREATE',
            details={
                'template_name': template.name,
                'instance_id': str(instance.id),
                'ai_enhance_requested': ai_enhance,
                'placeholder_count': len(placeholder_values)
            },
            phi_accessed=True,
            ip_address=request.remote_addr
        )
        
        response_data = {
            'message': 'Template populated successfully',
            'instance_id': str(instance.id),
            'populated_content': populated_content,
            'status': instance.status
        }
        
        # Handle AI enhancement if requested
        if ai_enhance and template.ai_enhancement_zones:
            # This would integrate with the AI blueprint for enhancement
            response_data['ai_enhancement_available'] = True
            response_data['ai_zones_count'] = len(template.ai_enhancement_zones)
        
        return jsonify(response_data), 201
        
    except Exception as e:
        current_app.logger.error(f"Populate template error: {str(e)}")
        return jsonify({'error': 'An error occurred while populating template'}), 500

@templates_bp.route('/categories', methods=['GET'])
@require_auth
def get_categories():
    """Get available template categories with metadata"""
    return jsonify({'categories': TEMPLATE_CATEGORIES}), 200

@templates_bp.route('/statistics', methods=['GET'])
@require_auth
def get_template_statistics():
    """Get template usage statistics"""
    try:
        current_user = User.query.get(g.current_user_id)
        
        # Base query for user's accessible templates
        base_query = Template.query.filter(Template.is_deleted == False)
        
        if current_user.role != 'administrator':
            base_query = base_query.filter(
                or_(
                    Template.is_public == True,
                    Template.created_by == current_user.id
                )
            )
        
        # Calculate statistics
        stats = {
            'total_templates': base_query.count(),
            'public_templates': base_query.filter(Template.is_public == True).count(),
            'private_templates': base_query.filter(
                Template.is_public == False,
                Template.created_by == current_user.id
            ).count(),
            'categories': {},
            'most_used': []
        }
        
        # Category breakdown
        for category in TEMPLATE_CATEGORIES.keys():
            count = base_query.filter(Template.category == category).count()
            stats['categories'][category] = count
        
        # Most used templates
        most_used = base_query.order_by(Template.usage_count.desc()).limit(5).all()
        stats['most_used'] = [
            {
                'id': str(t.id),
                'name': t.name,
                'category': t.category,
                'usage_count': t.usage_count
            }
            for t in most_used
        ]
        
        return jsonify(stats), 200
        
    except Exception as e:
        current_app.logger.error(f"Template statistics error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching statistics'}), 500