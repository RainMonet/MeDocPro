# app/routes/audit_logs.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.audit_log import AuditLog
from datetime import datetime, date

audit_logs_bp = Blueprint('audit_logs', __name__)

@audit_logs_bp.route('/audit-logs', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_audit_logs():
    """Get audit logs with date range filtering"""
    
    # Handle preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        from flask import Response
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    try:
        # Get query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        # Build base query
        query = AuditLog.query.order_by(AuditLog.timestamp.desc())
        
        # Apply date filters if provided
        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str.replace('Z', ''))
                query = query.filter(AuditLog.timestamp >= start_date)
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid start_date format. Use YYYY-MM-DD format.'
                }), 400
        
        if end_date_str:
            try:
                # Add 23:59:59 to end date to include the entire day
                end_date = datetime.fromisoformat(end_date_str.replace('Z', ''))
                end_date = end_date.replace(hour=23, minute=59, second=59)
                query = query.filter(AuditLog.timestamp <= end_date)
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid end_date format. Use YYYY-MM-DD format.'
                }), 400
        
        # Limit results to prevent performance issues
        logs = query.limit(1000).all()
        
        # Convert to dictionary format
        logs_data = [log.to_dict() for log in logs]
        
        return jsonify({
            'success': True,
            'logs': logs_data,
            'count': len(logs_data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error fetching audit logs: {str(e)}'
        }), 500