# app/routes/health.py

from flask import Blueprint, jsonify
from datetime import datetime
from ..extensions import db

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Basic health check endpoint"""
    try:
        # Test database connectivity
        db.session.execute(db.text('SELECT 1')).scalar()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'database': 'connected',
            'service': 'medocpro-api'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'database': 'disconnected',
            'error': str(e),
            'service': 'medocpro-api'
        }), 503

@health_bp.route('/ready', methods=['GET'])
def readiness_check():
    """Readiness check for Kubernetes/container orchestration"""
    try:
        # More comprehensive checks
        db.session.execute(db.text('SELECT 1')).scalar()
        
        # Check if we can query our main tables
        from ..models import User, Template
        User.query.count()
        Template.query.count()
        
        return jsonify({
            'status': 'ready',
            'timestamp': datetime.utcnow().isoformat(),
            'checks': {
                'database': 'ok',
                'models': 'ok'
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'not_ready',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e),
            'checks': {
                'database': 'failed',
                'models': 'failed'
            }
        }), 503

@health_bp.route('/status', methods=['GET'])
def status_check():
    """Detailed status information"""
    try:
        from ..models import User, Template, AuditLog
        
        # Get counts
        user_count = User.query.count()
        template_count = Template.query.count()
        audit_count = AuditLog.query.count()
        
        return jsonify({
            'status': 'operational',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'uptime': 'healthy',
            'database': {
                'status': 'connected',
                'users': user_count,
                'templates': template_count,
                'audit_logs': audit_count
            },
            'features': {
                'authentication': 'enabled',
                'templates': 'enabled',
                'audit_logging': 'enabled'
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'degraded',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        }), 503
