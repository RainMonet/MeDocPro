# app/routes/monitoring.py - Health monitoring and metrics endpoints

from flask import Blueprint, jsonify, request
import time
import psutil
import os
from datetime import datetime, timedelta
from ..extensions import db
from ..models import User, Template, PatientCensus, DailyInformation
import logging

monitoring_bp = Blueprint('monitoring', __name__)
logger = logging.getLogger(__name__)

@monitoring_bp.route('/health', methods=['GET'])
def health_check():
    """Basic health check endpoint"""
    try:
        # Test database connection
        db.session.execute(db.text('SELECT 1')).scalar()
        db_status = 'healthy'
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        db_status = 'unhealthy'
    
    return jsonify({
        'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'medocpro-api',
        'version': '1.0.0',
        'database': db_status
    }), 200 if db_status == 'healthy' else 503

@monitoring_bp.route('/health/detailed', methods=['GET'])
def detailed_health_check():
    """Detailed health check with component status"""
    health_data = {
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'medocpro-api',
        'version': '1.0.0',
        'overall_status': 'healthy',
        'components': {}
    }
    
    # Database health
    try:
        start_time = time.time()
        db.session.execute(db.text('SELECT 1')).scalar()
        db_latency = round((time.time() - start_time) * 1000, 2)
        
        health_data['components']['database'] = {
            'status': 'healthy',
            'latency_ms': db_latency,
            'type': str(db.engine.url).split('://')[0]
        }
    except Exception as e:
        health_data['components']['database'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
        health_data['overall_status'] = 'unhealthy'
    
    # Redis health (if configured)
    redis_url = os.getenv('REDIS_URL')
    if redis_url:
        try:
            import redis
            r = redis.from_url(redis_url)
            start_time = time.time()
            r.ping()
            redis_latency = round((time.time() - start_time) * 1000, 2)
            
            health_data['components']['redis'] = {
                'status': 'healthy',
                'latency_ms': redis_latency
            }
        except Exception as e:
            health_data['components']['redis'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
    
    # AI Service health (Ollama)
    ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
    try:
        import requests
        start_time = time.time()
        response = requests.get(f"{ollama_url}/api/tags", timeout=5)
        ollama_latency = round((time.time() - start_time) * 1000, 2)
        
        if response.status_code == 200:
            models = response.json().get('models', [])
            health_data['components']['ai_service'] = {
                'status': 'healthy',
                'latency_ms': ollama_latency,
                'models_available': len(models)
            }
        else:
            health_data['components']['ai_service'] = {
                'status': 'degraded',
                'latency_ms': ollama_latency,
                'http_status': response.status_code
            }
    except Exception as e:
        health_data['components']['ai_service'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
    
    return jsonify(health_data), 200 if health_data['overall_status'] == 'healthy' else 503

@monitoring_bp.route('/metrics', methods=['GET'])
def system_metrics():
    """System performance metrics"""
    try:
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Process-specific metrics
        process = psutil.Process(os.getpid())
        process_memory = process.memory_info()
        
        # Database metrics
        try:
            user_count = User.query.count()
            template_count = Template.query.count()
            census_count = PatientCensus.query.count()
            daily_info_count = DailyInformation.query.count()
            
            # Recent activity (last 24 hours)
            yesterday = datetime.utcnow() - timedelta(days=1)
            recent_censuses = PatientCensus.query.filter(
                PatientCensus.created_at >= yesterday
            ).count()
            recent_daily_info = DailyInformation.query.filter(
                DailyInformation.created_at >= yesterday
            ).count()
            
            db_metrics = {
                'users': user_count,
                'templates': template_count,
                'patient_censuses': census_count,
                'daily_information_entries': daily_info_count,
                'recent_activity': {
                    'new_censuses_24h': recent_censuses,
                    'new_daily_info_24h': recent_daily_info
                }
            }
        except Exception as e:
            logger.error(f"Error getting database metrics: {str(e)}")
            db_metrics = {'error': 'Unable to fetch database metrics'}
        
        metrics = {
            'timestamp': datetime.utcnow().isoformat(),
            'system': {
                'cpu_percent': cpu_percent,
                'memory': {
                    'total_mb': round(memory.total / 1024 / 1024, 2),
                    'available_mb': round(memory.available / 1024 / 1024, 2),
                    'used_percent': memory.percent
                },
                'disk': {
                    'total_gb': round(disk.total / 1024 / 1024 / 1024, 2),
                    'free_gb': round(disk.free / 1024 / 1024 / 1024, 2),
                    'used_percent': round((disk.used / disk.total) * 100, 2)
                }
            },
            'process': {
                'memory_mb': round(process_memory.rss / 1024 / 1024, 2),
                'cpu_percent': process.cpu_percent(),
                'threads': process.num_threads()
            },
            'database': db_metrics
        }
        
        return jsonify(metrics), 200
        
    except Exception as e:
        logger.error(f"Error getting system metrics: {str(e)}")
        return jsonify({'error': 'Unable to fetch metrics'}), 500

@monitoring_bp.route('/metrics/database', methods=['GET'])
def database_metrics():
    """Detailed database metrics"""
    try:
        metrics = {
            'timestamp': datetime.utcnow().isoformat(),
            'tables': {}
        }
        
        # Table sizes and row counts
        tables = [
            ('users', User),
            ('templates', Template),
            ('patient_censuses', PatientCensus),
            ('daily_information', DailyInformation)
        ]
        
        for table_name, model in tables:
            try:
                count = model.query.count()
                
                # Get table size (PostgreSQL specific)
                try:
                    if 'postgresql' in str(db.engine.url):
                        size_result = db.session.execute(db.text(
                            f"SELECT pg_total_relation_size('{model.__tablename__}') as size"
                        )).scalar()
                        size_mb = round(size_result / 1024 / 1024, 2) if size_result else 0
                    else:
                        size_mb = None
                except:
                    size_mb = None
                
                metrics['tables'][table_name] = {
                    'row_count': count,
                    'size_mb': size_mb
                }
                
                # Add recent activity for relevant tables
                if hasattr(model, 'created_at'):
                    yesterday = datetime.utcnow() - timedelta(days=1)
                    week_ago = datetime.utcnow() - timedelta(days=7)
                    
                    recent_24h = model.query.filter(model.created_at >= yesterday).count()
                    recent_7d = model.query.filter(model.created_at >= week_ago).count()
                    
                    metrics['tables'][table_name]['activity'] = {
                        'new_24h': recent_24h,
                        'new_7d': recent_7d
                    }
                    
            except Exception as e:
                logger.error(f"Error getting metrics for {table_name}: {str(e)}")
                metrics['tables'][table_name] = {'error': str(e)}
        
        return jsonify(metrics), 200
        
    except Exception as e:
        logger.error(f"Error getting database metrics: {str(e)}")
        return jsonify({'error': 'Unable to fetch database metrics'}), 500

@monitoring_bp.route('/status', methods=['GET'])
def service_status():
    """Service status and uptime information"""
    try:
        # Get process start time
        process = psutil.Process(os.getpid())
        start_time = datetime.fromtimestamp(process.create_time())
        uptime = datetime.utcnow() - start_time
        
        status_data = {
            'service': 'medocpro-api',
            'version': '1.0.0',
            'environment': os.getenv('FLASK_ENV', 'production'),
            'debug_mode': os.getenv('DEBUG', 'False').lower() == 'true',
            'timestamp': datetime.utcnow().isoformat(),
            'uptime': {
                'started_at': start_time.isoformat(),
                'uptime_seconds': int(uptime.total_seconds()),
                'uptime_human': str(uptime).split('.')[0]  # Remove microseconds
            },
            'configuration': {
                'database_type': str(db.engine.url).split('://')[0],
                'redis_configured': bool(os.getenv('REDIS_URL')),
                'ai_service_configured': bool(os.getenv('OLLAMA_URL')),
                'cors_origins': os.getenv('CORS_ORIGINS', 'not_set')
            }
        }
        
        return jsonify(status_data), 200
        
    except Exception as e:
        logger.error(f"Error getting service status: {str(e)}")
        return jsonify({'error': 'Unable to fetch service status'}), 500

@monitoring_bp.route('/ping', methods=['GET'])
def ping():
    """Simple ping endpoint for load balancers"""
    return 'pong', 200

# Health check for specific components
@monitoring_bp.route('/health/database', methods=['GET'])
def database_health():
    """Database-specific health check"""
    try:
        start_time = time.time()
        
        # Test basic connectivity
        db.session.execute(db.text('SELECT 1')).scalar()
        
        # Test a simple query
        user_count = User.query.count()
        
        latency = round((time.time() - start_time) * 1000, 2)
        
        return jsonify({
            'status': 'healthy',
            'latency_ms': latency,
            'user_count': user_count,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 503

@monitoring_bp.route('/health/ai', methods=['GET'])
def ai_service_health():
    """AI service (Ollama) health check"""
    ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
    
    try:
        import requests
        start_time = time.time()
        
        response = requests.get(f"{ollama_url}/api/tags", timeout=10)
        latency = round((time.time() - start_time) * 1000, 2)
        
        if response.status_code == 200:
            models = response.json().get('models', [])
            return jsonify({
                'status': 'healthy',
                'latency_ms': latency,
                'models_available': len(models),
                'models': [model.get('name') for model in models[:5]],  # First 5 models
                'timestamp': datetime.utcnow().isoformat()
            }), 200
        else:
            return jsonify({
                'status': 'degraded',
                'latency_ms': latency,
                'http_status': response.status_code,
                'timestamp': datetime.utcnow().isoformat()
            }), 200
            
    except Exception as e:
        logger.error(f"AI service health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 503