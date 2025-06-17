"""
Audit API Blueprint
Handles audit logging and compliance reporting for HIPAA requirements

Endpoints:
- GET /api/audit/logs - List audit logs with filtering
- GET /api/audit/logs/{id} - Get specific audit log
- GET /api/audit/reports/access - PHI access reports
- GET /api/audit/reports/security - Security events report
- GET /api/audit/reports/user-activity - User activity report
- POST /api/audit/export - Export audit logs
- GET /api/audit/integrity - Verify log integrity
"""

from flask import Blueprint, request, jsonify, g, current_app, send_file
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta
import uuid
import csv
import io
import hashlib
from collections import defaultdict

from models import db, AuditLog, User, Template
from app import require_auth, require_role, limiter

audit_bp = Blueprint('audit', __name__)

# Event type categorization for reporting
EVENT_CATEGORIES = {
    'authentication': [
        'login_attempt', 'login_success', 'logout', 'token_refresh',
        'password_change', 'password_reset_admin', 'mfa_enable', 'mfa_disable'
    ],
    'data_access': [
        'template_access', 'template_populate', 'profile_access', 'user_access',
        'templates_list', 'users_list'
    ],
    'data_modification': [
        'template_create', 'template_update', 'template_delete',
        'user_create', 'user_update', 'user_delete', 'profile_update'
    ],
    'system_events': [
        'user_activation_change', 'rate_limit_exceeded', 'api_request',
        'system_configuration_change'
    ],
    'ai_interactions': [
        'ai_enhancement_request', 'ai_response_received', 'phi_detection'
    ]
}

def get_date_range_filter(start_date_str, end_date_str, default_days=30):
    """Parse date range parameters with validation"""
    try:
        if start_date_str:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        else:
            start_date = datetime.utcnow() - timedelta(days=default_days)
        
        if end_date_str:
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        else:
            end_date = datetime.utcnow()
        
        # Validate date range
        if start_date > end_date:
            raise ValueError("Start date cannot be after end date")
        
        # Limit range to prevent performance issues
        if (end_date - start_date).days > 365:
            raise ValueError("Date range cannot exceed 365 days")
        
        return start_date, end_date
    
    except ValueError as e:
        raise ValueError(f"Invalid date format: {str(e)}")

@audit_bp.route('/logs', methods=['GET'])
@require_auth
@require_role('administrator')
def list_audit_logs():
    """
    List audit logs with comprehensive filtering
    
    Query parameters:
    - start_date: Start date (ISO format)
    - end_date: End date (ISO format)
    - event_type: Filter by event type
    - event_category: Filter by event category
    - user_id: Filter by user ID
    - resource_type: Filter by resource type
    - phi_accessed: Filter by PHI access (true/false)
    - ip_address: Filter by IP address
    - page: Page number (default: 1)
    - per_page: Items per page (default: 50, max: 1000)
    - sort_order: Sort order (asc, desc)
    """
    try:
        # Parse query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        event_type = request.args.get('event_type')
        event_category = request.args.get('event_category')
        user_id_str = request.args.get('user_id')
        resource_type = request.args.get('resource_type')
        phi_accessed = request.args.get('phi_accessed')
        ip_address = request.args.get('ip_address')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 1000)
        sort_order = request.args.get('sort_order', 'desc')
        
        # Parse date range
        try:
            start_date, end_date = get_date_range_filter(start_date_str, end_date_str)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Build query
        query = AuditLog.query.filter(
            AuditLog.timestamp >= start_date,
            AuditLog.timestamp <= end_date
        )
        
        # Apply filters
        if event_type:
            query = query.filter(AuditLog.event_type == event_type)
        
        if event_category and event_category in EVENT_CATEGORIES:
            category_events = EVENT_CATEGORIES[event_category]
            query = query.filter(AuditLog.event_type.in_(category_events))
        
        if user_id_str:
            try:
                user_uuid = uuid.UUID(user_id_str)
                query = query.filter(AuditLog.user_id == user_uuid)
            except ValueError:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        
        if phi_accessed is not None:
            phi_bool = phi_accessed.lower() in ['true', '1', 'yes']
            query = query.filter(AuditLog.phi_accessed == phi_bool)
        
        if ip_address:
            query = query.filter(AuditLog.ip_address == ip_address)
        
        # Apply sorting
        if sort_order.lower() == 'asc':
            query = query.order_by(AuditLog.timestamp.asc())
        else:
            query = query.order_by(AuditLog.timestamp.desc())
        
        # Paginate
        paginated = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Convert to JSON with user information
        logs = []
        for log in paginated.items:
            log_data = log.to_dict()
            
            # Add user information if available
            if log.user:
                log_data['user_info'] = {
                    'username': log.user.username,
                    'email': log.user.email,
                    'role': log.user.role
                }
            
            logs.append(log_data)
        
        # Log audit access
        current_user = User.query.get(g.current_user_id)
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='audit_logs_access',
            action='READ',
            details={
                'filters_applied': {
                    'date_range': f"{start_date.isoformat()} to {end_date.isoformat()}",
                    'event_type': event_type,
                    'event_category': event_category,
                    'phi_accessed': phi_accessed
                },
                'results_count': paginated.total
            },
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'logs': logs,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated.total,
                'pages': paginated.pages,
                'has_next': paginated.has_next,
                'has_prev': paginated.has_prev
            },
            'filters': {
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'available_categories': list(EVENT_CATEGORIES.keys())
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"List audit logs error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching audit logs'}), 500

@audit_bp.route('/logs/<log_id>', methods=['GET'])
@require_auth
@require_role('administrator')
def get_audit_log(log_id):
    """Get a specific audit log by ID"""
    try:
        # Validate UUID
        try:
            log_uuid = uuid.UUID(log_id)
        except ValueError:
            return jsonify({'error': 'Invalid log ID format'}), 400
        
        # Get audit log
        audit_log = AuditLog.query.get(log_uuid)
        
        if not audit_log:
            return jsonify({'error': 'Audit log not found'}), 404
        
        # Convert to JSON with detailed information
        log_data = audit_log.to_dict()
        
        # Add user information
        if audit_log.user:
            log_data['user_info'] = {
                'id': str(audit_log.user.id),
                'username': audit_log.user.username,
                'email': audit_log.user.email,
                'role': audit_log.user.role,
                'first_name': audit_log.user.first_name,
                'last_name': audit_log.user.last_name
            }
        
        # Add related resource information if available
        if audit_log.resource_type == 'template' and audit_log.resource_id:
            try:
                resource_uuid = uuid.UUID(audit_log.resource_id)
                template = Template.query.get(resource_uuid)
                if template:
                    log_data['resource_info'] = {
                        'name': template.name,
                        'category': template.category,
                        'is_active': template.is_active
                    }
            except ValueError:
                pass
        
        # Log audit log access
        current_user = User.query.get(g.current_user_id)
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='audit_log_detail_access',
            resource_type='audit_log',
            resource_id=str(audit_log.id),
            action='READ',
            details={'accessed_log_event': audit_log.event_type},
            ip_address=request.remote_addr
        )
        
        return jsonify({'log': log_data}), 200
        
    except Exception as e:
        current_app.logger.error(f"Get audit log error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching audit log'}), 500

@audit_bp.route('/reports/access', methods=['GET'])
@require_auth
@require_role('administrator')
def phi_access_report():
    """
    Generate PHI access report for compliance
    
    Query parameters:
    - start_date: Start date (ISO format)
    - end_date: End date (ISO format)
    - user_id: Filter by specific user
    """
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        user_id_str = request.args.get('user_id')
        
        # Parse date range
        try:
            start_date, end_date = get_date_range_filter(start_date_str, end_date_str)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Build base query for PHI access events
        query = AuditLog.query.filter(
            AuditLog.timestamp >= start_date,
            AuditLog.timestamp <= end_date,
            AuditLog.phi_accessed == True
        )
        
        if user_id_str:
            try:
                user_uuid = uuid.UUID(user_id_str)
                query = query.filter(AuditLog.user_id == user_uuid)
            except ValueError:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        # Get PHI access events
        phi_events = query.order_by(AuditLog.timestamp.desc()).all()
        
        # Aggregate data for report
        user_access_summary = defaultdict(lambda: {
            'access_count': 0,
            'last_access': None,
            'event_types': set(),
            'user_info': None
        })
        
        daily_access_counts = defaultdict(int)
        resource_access_counts = defaultdict(int)
        
        for event in phi_events:
            user_id = str(event.user_id) if event.user_id else 'unknown'
            
            # User summary
            user_access_summary[user_id]['access_count'] += 1
            user_access_summary[user_id]['event_types'].add(event.event_type)
            
            if not user_access_summary[user_id]['last_access'] or event.timestamp > user_access_summary[user_id]['last_access']:
                user_access_summary[user_id]['last_access'] = event.timestamp
            
            if event.user and not user_access_summary[user_id]['user_info']:
                user_access_summary[user_id]['user_info'] = {
                    'username': event.user.username,
                    'email': event.user.email,
                    'role': event.user.role
                }
            
            # Daily counts
            date_key = event.timestamp.date().isoformat()
            daily_access_counts[date_key] += 1
            
            # Resource counts
            if event.resource_type:
                resource_access_counts[event.resource_type] += 1
        
        # Convert to serializable format
        user_summary = []
        for user_id, data in user_access_summary.items():
            summary = {
                'user_id': user_id,
                'access_count': data['access_count'],
                'last_access': data['last_access'].isoformat() if data['last_access'] else None,
                'event_types': list(data['event_types']),
                'user_info': data['user_info']
            }
            user_summary.append(summary)
        
        # Sort by access count (descending)
        user_summary.sort(key=lambda x: x['access_count'], reverse=True)
        
        report_data = {
            'report_period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'summary_statistics': {
                'total_phi_access_events': len(phi_events),
                'unique_users_accessing_phi': len(user_access_summary),
                'most_active_day': max(daily_access_counts.items(), key=lambda x: x[1]) if daily_access_counts else None,
                'most_accessed_resource_type': max(resource_access_counts.items(), key=lambda x: x[1]) if resource_access_counts else None
            },
            'user_access_summary': user_summary,
            'daily_access_counts': dict(daily_access_counts),
            'resource_type_breakdown': dict(resource_access_counts)
        }
        
        # Log report generation
        current_user = User.query.get(g.current_user_id)
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='phi_access_report_generated',
            action='READ',
            details={
                'report_period': f"{start_date.isoformat()} to {end_date.isoformat()}",
                'total_events': len(phi_events),
                'filtered_by_user': user_id_str is not None
            },
            ip_address=request.remote_addr
        )
        
        return jsonify(report_data), 200
        
    except Exception as e:
        current_app.logger.error(f"PHI access report error: {str(e)}")
        return jsonify({'error': 'An error occurred while generating PHI access report'}), 500

@audit_bp.route('/reports/security', methods=['GET'])
@require_auth
@require_role('administrator')
def security_events_report():
    """Generate security events report"""
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        # Parse date range
        try:
            start_date, end_date = get_date_range_filter(start_date_str, end_date_str)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Security event types
        security_events = [
            'login_attempt', 'password_change', 'password_reset_admin',
            'user_activation_change', 'rate_limit_exceeded', 'user_create',
            'user_delete', 'mfa_enable', 'mfa_disable'
        ]
        
        # Get security events
        query = AuditLog.query.filter(
            AuditLog.timestamp >= start_date,
            AuditLog.timestamp <= end_date,
            AuditLog.event_type.in_(security_events)
        ).order_by(AuditLog.timestamp.desc())
        
        events = query.all()
        
        # Analyze security patterns
        failed_logins = defaultdict(list)
        password_changes = []
        account_lockouts = []
        rate_limit_violations = []
        
        for event in events:
            if event.event_type == 'login_attempt':
                details = event.details or {}
                if details.get('reason') in ['invalid_password', 'user_not_found', 'account_locked']:
                    failed_logins[event.ip_address].append({
                        'timestamp': event.timestamp.isoformat(),
                        'reason': details.get('reason'),
                        'username': details.get('username')
                    })
            
            elif event.event_type == 'password_change':
                password_changes.append({
                    'timestamp': event.timestamp.isoformat(),
                    'user_id': str(event.user_id) if event.user_id else None,
                    'user_info': {
                        'username': event.user.username,
                        'role': event.user.role
                    } if event.user else None
                })
            
            elif event.event_type == 'rate_limit_exceeded':
                rate_limit_violations.append({
                    'timestamp': event.timestamp.isoformat(),
                    'ip_address': str(event.ip_address),
                    'endpoint': event.details.get('endpoint') if event.details else None
                })
        
        # Identify suspicious patterns
        suspicious_ips = []
        for ip, attempts in failed_logins.items():
            if len(attempts) >= 5:  # 5 or more failed attempts
                suspicious_ips.append({
                    'ip_address': str(ip),
                    'failed_attempts': len(attempts),
                    'time_range': {
                        'first': min(a['timestamp'] for a in attempts),
                        'last': max(a['timestamp'] for a in attempts)
                    },
                    'targeted_usernames': list(set(a['username'] for a in attempts if a['username']))
                })
        
        report_data = {
            'report_period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'summary_statistics': {
                'total_security_events': len(events),
                'failed_login_attempts': sum(len(attempts) for attempts in failed_logins.values()),
                'password_changes': len(password_changes),
                'rate_limit_violations': len(rate_limit_violations),
                'suspicious_ip_addresses': len(suspicious_ips)
            },
            'suspicious_activities': {
                'suspicious_ip_addresses': suspicious_ips,
                'recent_password_changes': password_changes[-10:],  # Last 10
                'rate_limit_violations': rate_limit_violations[-20:]  # Last 20
            },
            'security_recommendations': []
        }
        
        # Generate recommendations
        if len(suspicious_ips) > 0:
            report_data['security_recommendations'].append(
                "Consider implementing IP-based rate limiting or blocking for suspicious addresses"
            )
        
        if len(rate_limit_violations) > 50:
            report_data['security_recommendations'].append(
                "High number of rate limit violations detected. Review rate limiting policies"
            )
        
        # Log report generation
        current_user = User.query.get(g.current_user_id)
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='security_report_generated',
            action='READ',
            details={
                'report_period': f"{start_date.isoformat()} to {end_date.isoformat()}",
                'total_events': len(events),
                'suspicious_ips_found': len(suspicious_ips)
            },
            ip_address=request.remote_addr
        )
        
        return jsonify(report_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Security events report error: {str(e)}")
        return jsonify({'error': 'An error occurred while generating security report'}), 500

@audit_bp.route('/reports/user-activity', methods=['GET'])
@require_auth
@require_role('administrator')
def user_activity_report():
    """Generate user activity report"""
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        user_id_str = request.args.get('user_id')
        
        # Parse date range
        try:
            start_date, end_date = get_date_range_filter(start_date_str, end_date_str)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Build query
        query = AuditLog.query.filter(
            AuditLog.timestamp >= start_date,
            AuditLog.timestamp <= end_date
        )
        
        if user_id_str:
            try:
                user_uuid = uuid.UUID(user_id_str)
                query = query.filter(AuditLog.user_id == user_uuid)
            except ValueError:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        events = query.all()
        
        # Aggregate user activity
        user_activities = defaultdict(lambda: {
            'total_events': 0,
            'login_count': 0,
            'template_interactions': 0,
            'phi_access_count': 0,
            'last_activity': None,
            'event_types': defaultdict(int),
            'user_info': None
        })
        
        for event in events:
            if not event.user_id:
                continue
                
            user_id = str(event.user_id)
            activity = user_activities[user_id]
            
            activity['total_events'] += 1
            activity['event_types'][event.event_type] += 1
            
            if event.event_type == 'login_success':
                activity['login_count'] += 1
            
            if event.event_type in ['template_create', 'template_update', 'template_access', 'template_populate']:
                activity['template_interactions'] += 1
            
            if event.phi_accessed:
                activity['phi_access_count'] += 1
            
            if not activity['last_activity'] or event.timestamp > activity['last_activity']:
                activity['last_activity'] = event.timestamp
            
            if event.user and not activity['user_info']:
                activity['user_info'] = {
                    'username': event.user.username,
                    'email': event.user.email,
                    'role': event.user.role,
                    'first_name': event.user.first_name,
                    'last_name': event.user.last_name
                }
        
        # Convert to list and sort by activity
        activity_list = []
        for user_id, activity in user_activities.items():
            activity_data = {
                'user_id': user_id,
                'user_info': activity['user_info'],
                'total_events': activity['total_events'],
                'login_count': activity['login_count'],
                'template_interactions': activity['template_interactions'],
                'phi_access_count': activity['phi_access_count'],
                'last_activity': activity['last_activity'].isoformat() if activity['last_activity'] else None,
                'top_event_types': dict(sorted(activity['event_types'].items(), key=lambda x: x[1], reverse=True)[:5])
            }
            activity_list.append(activity_data)
        
        # Sort by total events (most active first)
        activity_list.sort(key=lambda x: x['total_events'], reverse=True)
        
        report_data = {
            'report_period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'summary_statistics': {
                'total_events_analyzed': len(events),
                'unique_active_users': len(user_activities),
                'total_logins': sum(a['login_count'] for a in user_activities.values()),
                'total_phi_access_events': sum(a['phi_access_count'] for a in user_activities.values())
            },
            'user_activities': activity_list
        }
        
        # Log report generation
        current_user = User.query.get(g.current_user_id)
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='user_activity_report_generated',
            action='READ',
            details={
                'report_period': f"{start_date.isoformat()} to {end_date.isoformat()}",
                'total_events': len(events),
                'filtered_by_user': user_id_str is not None
            },
            ip_address=request.remote_addr
        )
        
        return jsonify(report_data), 200
        
    except Exception as e:
        current_app.logger.error(f"User activity report error: {str(e)}")
        return jsonify({'error': 'An error occurred while generating user activity report'}), 500

@audit_bp.route('/export', methods=['POST'])
@require_auth
@require_role('administrator')
@limiter.limit("3 per hour")
def export_audit_logs():
    """
    Export audit logs to CSV format
    
    Request body:
    {
        "start_date": "2025-01-01T00:00:00Z",
        "end_date": "2025-06-09T23:59:59Z",
        "event_types": ["login_success", "template_access"],
        "format": "csv",
        "include_phi_events": false
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No export parameters provided'}), 400
        
        start_date_str = data.get('start_date')
        end_date_str = data.get('end_date')
        event_types = data.get('event_types', [])
        export_format = data.get('format', 'csv')
        include_phi_events = data.get('include_phi_events', False)
        
        # Parse date range
        try:
            start_date, end_date = get_date_range_filter(start_date_str, end_date_str)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Limit export range for performance
        if (end_date - start_date).days > 90:
            return jsonify({'error': 'Export range cannot exceed 90 days'}), 400
        
        # Build query
        query = AuditLog.query.filter(
            AuditLog.timestamp >= start_date,
            AuditLog.timestamp <= end_date
        )
        
        if event_types:
            query = query.filter(AuditLog.event_type.in_(event_types))
        
        if not include_phi_events:
            query = query.filter(AuditLog.phi_accessed == False)
        
        # Limit number of records
        query = query.order_by(AuditLog.timestamp.desc()).limit(10000)
        
        logs = query.all()
        
        if export_format.lower() == 'csv':
            # Create CSV in memory
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            headers = [
                'Timestamp', 'Event Type', 'User ID', 'Username', 'Action',
                'Resource Type', 'Resource ID', 'IP Address', 'PHI Accessed', 'Details'
            ]
            writer.writerow(headers)
            
            # Write data
            for log in logs:
                row = [
                    log.timestamp.isoformat(),
                    log.event_type,
                    str(log.user_id) if log.user_id else '',
                    log.user.username if log.user else '',
                    log.action,
                    log.resource_type or '',
                    log.resource_id or '',
                    str(log.ip_address) if log.ip_address else '',
                    'Yes' if log.phi_accessed else 'No',
                    str(log.details) if log.details else ''
                ]
                writer.writerow(row)
            
            output.seek(0)
            
            # Create response
            response_data = output.getvalue()
            output.close()
            
            # Log export
            current_user = User.query.get(g.current_user_id)
            AuditLog.log_event(
                user_id=str(current_user.id),
                event_type='audit_logs_export',
                action='READ',
                details={
                    'export_period': f"{start_date.isoformat()} to {end_date.isoformat()}",
                    'total_records': len(logs),
                    'format': export_format,
                    'include_phi_events': include_phi_events
                },
                phi_accessed=include_phi_events and any(log.phi_accessed for log in logs),
                ip_address=request.remote_addr
            )
            
            # Return CSV data
            return jsonify({
                'export_data': response_data,
                'format': 'csv',
                'record_count': len(logs),
                'export_timestamp': datetime.utcnow().isoformat()
            }), 200
        
        else:
            return jsonify({'error': f'Unsupported export format: {export_format}'}), 400
        
    except Exception as e:
        current_app.logger.error(f"Export audit logs error: {str(e)}")
        return jsonify({'error': 'An error occurred while exporting audit logs'}), 500

@audit_bp.route('/integrity', methods=['GET'])
@require_auth
@require_role('administrator')
def verify_log_integrity():
    """Verify audit log integrity using hash chains"""
    try:
        # Get recent logs for integrity check
        logs = AuditLog.query.order_by(AuditLog.timestamp.asc()).limit(1000).all()
        
        if not logs:
            return jsonify({
                'integrity_status': 'no_logs',
                'message': 'No audit logs found'
            }), 200
        
        integrity_violations = []
        previous_hash = '0'  # Initial hash for first log
        
        for i, log in enumerate(logs):
            # Check if previous hash matches
            if log.previous_log_hash != previous_hash:
                integrity_violations.append({
                    'log_id': str(log.id),
                    'timestamp': log.timestamp.isoformat(),
                    'expected_previous_hash': previous_hash,
                    'actual_previous_hash': log.previous_log_hash,
                    'position': i
                })
            
            # Verify current log's hash
            expected_hash = hashlib.sha256(
                f"{log.user_id}{log.event_type}{log.timestamp}{log.details}".encode()
            ).hexdigest()
            
            if log.log_hash != expected_hash:
                integrity_violations.append({
                    'log_id': str(log.id),
                    'timestamp': log.timestamp.isoformat(),
                    'hash_type': 'current_log_hash',
                    'expected_hash': expected_hash,
                    'actual_hash': log.log_hash,
                    'position': i
                })
            
            previous_hash = log.log_hash
        
        integrity_status = 'intact' if not integrity_violations else 'compromised'
        
        # Log integrity check
        current_user = User.query.get(g.current_user_id)
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='audit_integrity_check',
            action='READ',
            details={
                'logs_checked': len(logs),
                'integrity_status': integrity_status,
                'violations_found': len(integrity_violations)
            },
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'integrity_status': integrity_status,
            'logs_checked': len(logs),
            'violations_found': len(integrity_violations),
            'violations': integrity_violations[:10],  # Limit to first 10 violations
            'check_timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Verify log integrity error: {str(e)}")
        return jsonify({'error': 'An error occurred while verifying log integrity'}), 500