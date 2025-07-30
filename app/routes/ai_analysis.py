"""
AI Analysis API Routes - MeDocPro Backend
Provides endpoints for clinical AI analysis functionality
"""

import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.ai_analysis import AIAnalysisEngine
from app.models.audit_log import AuditLog
from collections import defaultdict, deque

logger = logging.getLogger(__name__)

# In-memory storage for recent analysis results (for demo purposes)
# In production, this would be stored in database
recent_analyses = deque(maxlen=100)  # Keep last 100 analyses
analysis_stats = defaultdict(list)  # Stats by category

def store_analysis_result(analysis_type, result_data, user_id, patient_id=None, content_snippet=None):
    """Store analysis result for dashboard metrics"""
    timestamp = datetime.now()
    
    analysis_record = {
        'timestamp': timestamp,
        'type': analysis_type,
        'user_id': user_id,
        'patient_id': patient_id,
        'content_snippet': content_snippet[:100] + '...' if content_snippet and len(content_snippet) > 100 else content_snippet,
        'data': result_data
    }
    
    recent_analyses.append(analysis_record)
    
    # Store specific metrics
    if analysis_type == 'completeness':
        score = result_data.get('completeness_score', 0)
        analysis_stats['completeness_scores'].append({
            'score': score,
            'timestamp': timestamp
        })
        
        # Limit to recent scores (last 24 hours)
        cutoff = timestamp - timedelta(hours=24)
        analysis_stats['completeness_scores'] = [
            s for s in analysis_stats['completeness_scores'] 
            if s['timestamp'] > cutoff
        ]
    
    elif analysis_type == 'risks':
        risk_level = result_data.get('overall_risk_level', 'UNKNOWN')
        if risk_level in ['HIGH', 'MODERATE']:
            analysis_stats['risk_flags'].append({
                'level': risk_level,
                'timestamp': timestamp
            })
            
        # Limit to recent flags (last 24 hours)
        cutoff = timestamp - timedelta(hours=24)
        analysis_stats['risk_flags'] = [
            r for r in analysis_stats['risk_flags'] 
            if r['timestamp'] > cutoff
        ]

def calculate_dashboard_metrics():
    """Calculate real-time dashboard metrics from stored analyses"""
    metrics = {
        'avgCompleteness': None,
        'riskFlags': 0,
        'trendsDetected': 0,
        'careGaps': 0
    }
    
    # Calculate average completeness from recent analyses
    completeness_scores = analysis_stats.get('completeness_scores', [])
    if completeness_scores:
        scores = [s['score'] for s in completeness_scores]
        avg_score = sum(scores) / len(scores)
        metrics['avgCompleteness'] = round(avg_score * 100, 1)  # Convert to percentage
    
    # Count recent risk flags
    risk_flags = analysis_stats.get('risk_flags', [])
    metrics['riskFlags'] = len(risk_flags)
    
    # For now, trends and care gaps remain at 0 (features not fully implemented)
    metrics['trendsDetected'] = len([a for a in recent_analyses if a['type'] == 'trends'])
    metrics['careGaps'] = 0  # Would be calculated from pattern analysis
    
    return metrics

# Create blueprint for AI analysis routes
ai_analysis_bp = Blueprint('ai_analysis', __name__, url_prefix='/api/ai-analysis')

# Initialize AI analysis engine (will be configured based on environment)
_analysis_engine = None

def get_analysis_engine():
    """Get or initialize the AI analysis engine"""
    global _analysis_engine
    if _analysis_engine is None:
        ollama_url = current_app.config.get('OLLAMA_URL', 'http://localhost:11434')
        _analysis_engine = AIAnalysisEngine(ollama_url=ollama_url)
    return _analysis_engine

@ai_analysis_bp.route('/status', methods=['GET'])
@jwt_required()
def check_analysis_status():
    """
    Check the status of AI analysis services
    Returns Ollama connection status and available models
    """
    try:
        user_id = get_jwt_identity()
        engine = get_analysis_engine()
        
        # Check Ollama status
        status = engine.check_ollama_status()
        
        # Log the status check
        AuditLog.log_action(
            user_id=user_id,
            action='ai_analysis_status_check',
            resource_type='ai_service',
            details={'ollama_status': status}
        )
        
        return jsonify({
            'success': True,
            'status': status,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error checking AI analysis status: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to check AI analysis status',
            'details': str(e)
        }), 500

@ai_analysis_bp.route('/analyze-document', methods=['POST'])
@jwt_required()
def analyze_document():
    """
    Analyze a clinical document using AI analysis engine
    
    Expected JSON payload:
    {
        "content": "Clinical documentation text",
        "patient_id": "optional patient identifier",
        "analysis_types": ["completeness", "patterns", "risks"],  // optional
        "metadata": {  // optional
            "document_type": "progress_note",
            "template_id": "123"
        }
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: content'
            }), 400
        
        content = data['content']
        patient_id = data.get('patient_id')
        analysis_types = data.get('analysis_types', ['completeness', 'patterns', 'risks'])
        metadata = data.get('metadata', {})
        
        # Validate content
        if not content or not content.strip():
            return jsonify({
                'success': False,
                'error': 'Content cannot be empty'
            }), 400
        
        # Validate analysis types
        valid_types = ['completeness', 'patterns', 'risks', 'trends']
        invalid_types = [t for t in analysis_types if t not in valid_types]
        if invalid_types:
            return jsonify({
                'success': False,
                'error': f'Invalid analysis types: {invalid_types}',
                'valid_types': valid_types
            }), 400
        
        # Get analysis engine and perform analysis
        engine = get_analysis_engine()
        
        # Check if engine is ready
        status = engine.check_ollama_status()
        if not status.get('analysis_ready', False):
            return jsonify({
                'success': False,
                'error': 'AI analysis service not available',
                'service_status': status
            }), 503
        
        # Perform analysis
        start_time = datetime.now()
        results = engine.analyze_documentation(
            content=content,
            patient_id=patient_id,
            analysis_types=analysis_types
        )
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Log the analysis
        AuditLog.log_action(
            user_id=user_id,
            action='ai_document_analysis',
            resource_type='clinical_document',
            resource_id=patient_id,
            details={
                'analysis_types': analysis_types,
                'content_length': len(content),
                'processing_time_ms': processing_time,
                'metadata': metadata
            }
        )
        
        # Format response
        response_data = {
            'success': True,
            'analysis_results': {},
            'metadata': {
                'analysis_types': analysis_types,
                'processing_time_ms': processing_time,
                'timestamp': datetime.now().isoformat(),
                'patient_id': patient_id
            }
        }
        
        # Convert AnalysisResult objects to dictionaries
        for analysis_type, result in results.items():
            response_data['analysis_results'][analysis_type] = {
                'analysis_type': result.analysis_type,
                'patient_id': result.patient_id,
                'content_id': result.content_id,
                'results': result.results,
                'confidence': result.confidence,
                'timestamp': result.timestamp.isoformat(),
                'processing_time_ms': result.processing_time_ms
            }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in document analysis: {e}")
        return jsonify({
            'success': False,
            'error': 'Analysis failed',
            'details': str(e)
        }), 500

@ai_analysis_bp.route('/analyze-completeness', methods=['POST'])
@jwt_required()
def analyze_completeness():
    """
    Specialized endpoint for documentation completeness analysis
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: content'
            }), 400
        
        content = data['content']
        patient_id = data.get('patient_id')
        
        # Perform completeness analysis only
        engine = get_analysis_engine()
        results = engine.analyze_documentation(
            content=content,
            patient_id=patient_id,
            analysis_types=['completeness']
        )
        
        completeness_result = results.get('completeness')
        if not completeness_result:
            return jsonify({
                'success': False,
                'error': 'Completeness analysis failed'
            }), 500
        
        # Log the analysis
        AuditLog.log_action(
            user_id=user_id,
            action='ai_completeness_analysis',
            resource_type='clinical_document',
            resource_id=patient_id,
            details={'content_length': len(content)}
        )
        
        # Store analysis result for dashboard metrics
        response_data = {
            'completeness_score': completeness_result.results.get('overall_score', 0.0),
            'quality_level': completeness_result.results.get('documentation_quality', 'Unknown'),
            'missing_elements': completeness_result.results.get('missing_elements', []),
            'recommendations': completeness_result.results.get('recommendations', []),
            'confidence': completeness_result.confidence,
            'timestamp': completeness_result.timestamp.isoformat()
        }
        
        store_analysis_result('completeness', response_data, user_id, patient_id, content)
        
        # Return focused completeness response
        return jsonify({
            'success': True,
            **response_data
        })
        
    except Exception as e:
        logger.error(f"Error in completeness analysis: {e}")
        return jsonify({
            'success': False,
            'error': 'Completeness analysis failed',
            'details': str(e)
        }), 500

@ai_analysis_bp.route('/analyze-risks', methods=['POST'])
@jwt_required()
def analyze_risks():
    """
    Specialized endpoint for clinical risk analysis
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: content'
            }), 400
        
        content = data['content']
        patient_id = data.get('patient_id')
        
        # Perform risk analysis only
        engine = get_analysis_engine()
        results = engine.analyze_documentation(
            content=content,
            patient_id=patient_id,
            analysis_types=['risks']
        )
        
        risk_result = results.get('risks')
        if not risk_result:
            return jsonify({
                'success': False,
                'error': 'Risk analysis failed'
            }), 500
        
        # Log the analysis
        AuditLog.log_action(
            user_id=user_id,
            action='ai_risk_analysis',
            resource_type='clinical_document',
            resource_id=patient_id,
            details={'content_length': len(content)}
        )
        
        # Return focused risk response
        risk_summary = risk_result.results.get('risk_summary', {})
        return jsonify({
            'success': True,
            'overall_risk_level': risk_summary.get('overall_risk_level', 'UNKNOWN'),
            'overall_risk_score': risk_summary.get('overall_risk_score', 0.0),
            'immediate_concerns': risk_result.results.get('immediate_concerns', []),
            'safety_recommendations': risk_result.results.get('safety_recommendations', []),
            'protective_factors': risk_result.results.get('protective_factors', []),
            'confidence': risk_result.confidence,
            'timestamp': risk_result.timestamp.isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in risk analysis: {e}")
        return jsonify({
            'success': False,
            'error': 'Risk analysis failed',
            'details': str(e)
        }), 500

@ai_analysis_bp.route('/dashboard-metrics', methods=['GET'])
@jwt_required()
def get_dashboard_metrics():
    """
    Get AI analysis metrics for dashboard display
    This would typically aggregate recent analysis results
    """
    try:
        user_id = get_jwt_identity()
        
        # For now, return mock data structure that matches frontend expectations
        # In a full implementation, this would query a database of analysis results
        
        engine = get_analysis_engine()
        status = engine.check_ollama_status()
        
        # Get real metrics from stored analysis results
        if status.get('analysis_ready', False):
            metrics = calculate_dashboard_metrics()
            metrics['analysisSystemStatus'] = {
                'ollamaConnected': status.get('ollama_connected', False),
                'modelsLoaded': status.get('models_loaded', False),
                'analysisReady': status.get('analysis_ready', False),
                'lastCheck': datetime.now().isoformat()
            }
        else:
            # Service not available
            metrics = {
                'avgCompleteness': None,
                'riskFlags': 0,
                'trendsDetected': 0,
                'careGaps': 0,
                'analysisSystemStatus': {
                    'ollamaConnected': False,
                    'modelsLoaded': False,
                    'analysisReady': False,
                    'lastCheck': datetime.now().isoformat(),
                    'error': status.get('error', 'Service unavailable')
                }
            }
        
        # Log metrics request
        AuditLog.log_action(
            user_id=user_id,
            action='ai_dashboard_metrics',
            resource_type='dashboard',
            details={'metrics_requested': True}
        )
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting dashboard metrics: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get dashboard metrics',
            'details': str(e)
        }), 500

@ai_analysis_bp.route('/models', methods=['GET'])
@jwt_required()
def list_available_models():
    """
    List available AI models and their status
    """
    try:
        user_id = get_jwt_identity()
        engine = get_analysis_engine()
        
        status = engine.check_ollama_status()
        
        # Log model list request
        AuditLog.log_action(
            user_id=user_id,
            action='ai_models_list',
            resource_type='ai_service',
            details={'models_requested': True}
        )
        
        return jsonify({
            'success': True,
            'ollama_connected': status.get('ollama_connected', False),
            'available_models': status.get('available_models', []),
            'preferred_models': engine.preferred_models,
            'fallback_models': engine.fallback_models,
            'current_model': status.get('current_model'),
            'recommended_model': status.get('recommended_model'),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to list models',
            'details': str(e)
        }), 500

@ai_analysis_bp.route('/recent-recommendations', methods=['GET'])
@jwt_required()
def get_recent_recommendations():
    """
    Get recent AI analysis recommendations for display
    """
    try:
        user_id = get_jwt_identity()
        
        # Extract recommendations from recent analyses
        recommendations = []
        
        # Get recent analyses (last 24 hours)
        cutoff = datetime.now() - timedelta(hours=24)
        recent = [a for a in recent_analyses if a['timestamp'] > cutoff]
        
        # Extract recommendations from completeness analyses with context
        for analysis in recent:
            if analysis['type'] == 'completeness':
                analysis_recs = analysis['data'].get('recommendations', [])
                patient_id = analysis.get('patient_id', 'Unknown Patient')
                content_snippet = analysis.get('content_snippet', 'No content preview')
                timestamp = analysis['timestamp']
                
                for rec in analysis_recs:
                    # Create enriched recommendation with context
                    enriched_rec = {
                        'recommendation': rec,
                        'patient_id': patient_id,
                        'content_snippet': content_snippet,
                        'timestamp': timestamp.isoformat(),
                        'analysis_type': 'completeness',
                        'score': analysis['data'].get('completeness_score', 0)
                    }
                    
                    # Check if we already have this exact recommendation for this patient
                    existing = next((r for r in recommendations 
                                   if r['recommendation'] == rec and r['patient_id'] == patient_id), None)
                    if not existing:
                        recommendations.append(enriched_rec)
        
        # Limit to most recent 10 recommendations
        recommendations = recommendations[-10:]
        
        # Log the request
        AuditLog.log_action(
            user_id=user_id,
            action='ai_recommendations_viewed',
            resource_type='ai_recommendations',
            details={'recommendations_count': len(recommendations)}
        )
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'count': len(recommendations),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting recent recommendations: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get recent recommendations',
            'details': str(e)
        }), 500

@ai_analysis_bp.route('/demo-populate', methods=['POST'])
@jwt_required()
def populate_demo_metrics():
    """
    Populate dashboard with demo analysis results for testing
    This would not exist in production
    """
    try:
        user_id = get_jwt_identity()
        
        # Create sample completeness analyses
        sample_analyses = [
            {'score': 0.85, 'quality': 'Good'},
            {'score': 0.65, 'quality': 'Fair'},
            {'score': 0.45, 'quality': 'Poor'},
            {'score': 0.92, 'quality': 'Excellent'},
            {'score': 0.78, 'quality': 'Good'}
        ]
        
        for i, sample in enumerate(sample_analyses):
            response_data = {
                'completeness_score': sample['score'],
                'quality_level': sample['quality'],
                'missing_elements': [],
                'recommendations': [f"Demo recommendation {i+1} for improving documentation"],
                'confidence': 0.8,
                'timestamp': datetime.now().isoformat()
            }
            demo_patient_id = f"demo_patient_{i+1}"
            demo_content = f"Demo clinical note {i+1}: Patient presents with various symptoms requiring documentation improvement."
            store_analysis_result('completeness', response_data, user_id, demo_patient_id, demo_content)
        
        # Add a sample high-risk flag
        risk_data = {
            'overall_risk_level': 'HIGH',
            'overall_risk_score': 0.8,
            'immediate_concerns': ['HIGH SUICIDE RISK'],
            'safety_recommendations': ['Immediate safety assessment required'],
            'confidence': 0.9
        }
        store_analysis_result('risks', risk_data, user_id)
        
        return jsonify({
            'success': True,
            'message': 'Demo metrics populated',
            'analyses_added': len(sample_analyses),
            'risk_flags_added': 1
        })
        
    except Exception as e:
        logger.error(f"Error populating demo metrics: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to populate demo metrics',
            'details': str(e)
        }), 500

# Error handlers for the blueprint
@ai_analysis_bp.errorhandler(400)
def bad_request(error):
    return jsonify({
        'success': False,
        'error': 'Bad request',
        'message': 'Invalid request data'
    }), 400

@ai_analysis_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'success': False,
        'error': 'Unauthorized',
        'message': 'Authentication required'
    }), 401

@ai_analysis_bp.errorhandler(403)
def forbidden(error):
    return jsonify({
        'success': False,
        'error': 'Forbidden',
        'message': 'Insufficient permissions'
    }), 403

@ai_analysis_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500