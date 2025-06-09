"""
AI Enhancement API Blueprint
Handles AI-assisted text enhancement with PHI protection and Ollama integration

Endpoints:
- POST /api/ai/enhance - Enhance clinical text
- POST /api/ai/deidentify - De-identify PHI in text
- GET /api/ai/models - List available AI models
- POST /api/ai/test-connection - Test Ollama connection
- GET /api/ai/usage-stats - Get AI usage statistics
"""

from flask import Blueprint, request, jsonify, g, current_app
import requests
import re
import hashlib
import time
from datetime import datetime, timedelta
import json
from collections import defaultdict

from models import db, AIInteraction, User, AuditLog, SystemConfiguration
from app import require_auth, limiter

ai_bp = Blueprint('ai', __name__)

# PHI detection patterns (Safe Harbor method)
PHI_PATTERNS = {
    'names': [
        r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',  # Full names
        r'\b[A-Z][a-z]+, [A-Z][a-z]+\b',  # Last, First format
    ],
    'dates': [
        r'\b\d{1,2}\/\d{1,2}\/\d{4}\b',  # MM/DD/YYYY
        r'\b\d{4}-\d{2}-\d{2}\b',  # YYYY-MM-DD
        r'\b\d{1,2}-\d{1,2}-\d{4}\b',  # MM-DD-YYYY
    ],
    'identifiers': [
        r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
        r'\b\d{9}\b',  # 9-digit ID
        r'\b[A-Z]{2}\d{6,8}\b',  # License numbers
    ],
    'contact': [
        r'\b\d{3}-\d{3}-\d{4}\b',  # Phone numbers
        r'\(\d{3}\)\s?\d{3}-\d{4}\b',  # Phone with area code
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
    ],
    'addresses': [
        r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)\b',
        r'\b[A-Z][a-z]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b',  # City, State ZIP
    ]
}

def detect_phi_patterns(text):
    """Detect potential PHI patterns in text"""
    detected_phi = []
    
    for category, patterns in PHI_PATTERNS.items():
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                detected_phi.append({
                    'category': category,
                    'pattern': pattern,
                    'match': match.group(),
                    'start': match.start(),
                    'end': match.end()
                })
    
    return detected_phi

def deidentify_text(text, replacement_method='placeholder'):
    """De-identify text by replacing PHI with placeholders"""
    deidentified = text
    replacements = []
    
    # Sort by position (reverse order) to maintain positions during replacement
    phi_detections = detect_phi_patterns(text)
    phi_detections.sort(key=lambda x: x['start'], reverse=True)
    
    replacement_counters = defaultdict(int)
    
    for detection in phi_detections:
        category = detection['category']
        start = detection['start']
        end = detection['end']
        original_text = detection['match']
        
        # Generate replacement based on method
        if replacement_method == 'placeholder':
            replacement_counters[category] += 1
            if category == 'names':
                replacement = f"[PATIENT_NAME_{replacement_counters[category]}]"
            elif category == 'dates':
                replacement = f"[DATE_{replacement_counters[category]}]"
            elif category == 'identifiers':
                replacement = f"[ID_{replacement_counters[category]}]"
            elif category == 'contact':
                replacement = f"[CONTACT_{replacement_counters[category]}]"
            elif category == 'addresses':
                replacement = f"[ADDRESS_{replacement_counters[category]}]"
            else:
                replacement = f"[{category.upper()}_{replacement_counters[category]}]"
        elif replacement_method == 'mask':
            # Keep structure but mask characters
            if category in ['identifiers', 'contact']:
                replacement = re.sub(r'\d', 'X', original_text)
            else:
                replacement = 'X' * len(original_text)
        else:
            replacement = '[REDACTED]'
        
        # Replace in text
        deidentified = deidentified[:start] + replacement + deidentified[end:]
        
        replacements.append({
            'original': original_text,
            'replacement': replacement,
            'category': category,
            'position': (start, end)
        })
    
    return deidentified, replacements

def get_ollama_config():
    """Get Ollama configuration from system settings"""
    base_url = current_app.config.get('OLLAMA_BASE_URL', 'http://localhost:11434')
    model = current_app.config.get('OLLAMA_MODEL', 'llama2')
    
    # Try to get from database configuration
    try:
        url_config = SystemConfiguration.query.filter_by(key='OLLAMA_BASE_URL').first()
        if url_config:
            base_url = url_config.get_value()
        
        model_config = SystemConfiguration.query.filter_by(key='OLLAMA_MODEL').first()
        if model_config:
            model = model_config.get_value()
    except Exception:
        pass  # Fall back to config defaults
    
    return base_url, model

def call_ollama_api(prompt, model, temperature=0.7, max_tokens=500):
    """Call Ollama API with error handling and monitoring"""
    base_url, default_model = get_ollama_config()
    model = model or default_model
    
    start_time = time.time()
    
    try:
        response = requests.post(
            f"{base_url}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens,
                    "top_p": 0.9,
                    "stop": ["</s>", "\n\n---", "\n\nUser:", "\n\nHuman:"]
                }
            },
            timeout=30
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        if response.status_code == 200:
            result = response.json()
            return {
                'success': True,
                'response': result.get('response', '').strip(),
                'processing_time_ms': processing_time,
                'model_used': model
            }
        else:
            return {
                'success': False,
                'error': f"Ollama API error: {response.status_code}",
                'processing_time_ms': processing_time
            }
    
    except requests.exceptions.Timeout:
        return {
            'success': False,
            'error': 'Ollama API timeout',
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }
    except requests.exceptions.ConnectionError:
        return {
            'success': False,
            'error': 'Cannot connect to Ollama service',
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }
    except Exception as e:
        return {
            'success': False,
            'error': f"Unexpected error: {str(e)}",
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }

def generate_enhancement_prompt(text, enhancement_type, intensity, style):
    """Generate clinical enhancement prompt"""
    
    # Base instruction based on enhancement type
    type_instructions = {
        'clinical': "Enhance this clinical text with professional medical terminology and standard clinical language.",
        'narrative': "Improve the narrative flow and readability while maintaining clinical accuracy and professional tone.",
        'diagnostic': "Focus on diagnostic criteria, clinical reasoning, and medical decision-making processes."
    }
    
    # Style-specific instructions
    style_instructions = {
        'professional': "Use formal, professional medical language appropriate for clinical documentation.",
        'concise': "Be brief and direct while maintaining clarity and clinical accuracy.",
        'detailed': "Provide comprehensive, thorough documentation with specific clinical details.",
        'empathetic': "Use patient-centered, compassionate language while maintaining professionalism.",
        'objective': "Focus on objective, measurable observations and clinical facts."
    }
    
    # Intensity guidance
    if intensity <= 25:
        intensity_instruction = "Make minimal changes, focusing only on grammar and clarity."
    elif intensity <= 50:
        intensity_instruction = "Make moderate improvements to terminology and structure."
    elif intensity <= 75:
        intensity_instruction = "Significantly enhance the clinical language and professional tone."
    else:
        intensity_instruction = "Comprehensively rewrite with advanced medical terminology and optimal clinical structure."
    
    prompt = f"""You are a medical documentation assistant specializing in psychiatric clinical notes. Your task is to enhance the following clinical text.

Enhancement Guidelines:
- {type_instructions.get(enhancement_type, type_instructions['clinical'])}
- {style_instructions.get(style, style_instructions['professional'])}
- {intensity_instruction}
- Maintain all clinical facts and patient information exactly as provided
- Use appropriate psychiatric and medical terminology
- Ensure compliance with clinical documentation standards
- Do not add new clinical information not present in the original text
- Preserve the original meaning and intent

Original Text:
{text}

Enhanced Text:"""

    return prompt

@ai_bp.route('/enhance', methods=['POST'])
@require_auth
@limiter.limit("30 per hour")
def enhance_text():
    """
    Enhance clinical text using AI
    
    Request body:
    {
        "text": "Clinical text to enhance",
        "enhancement_type": "clinical",
        "intensity": 75,
        "style": "professional",
        "model": "llama2",
        "deidentify_first": true,
        "preserve_structure": true
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        text = data.get('text', '').strip()
        enhancement_type = data.get('enhancement_type', 'clinical')
        intensity = data.get('intensity', 50)
        style = data.get('style', 'professional')
        model = data.get('model')
        deidentify_first = data.get('deidentify_first', True)
        preserve_structure = data.get('preserve_structure', True)
        
        # Validate input
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        if len(text) > 5000:
            return jsonify({'error': 'Text too long (max 5000 characters)'}), 400
        
        if enhancement_type not in ['clinical', 'narrative', 'diagnostic']:
            return jsonify({'error': 'Invalid enhancement type'}), 400
        
        if not isinstance(intensity, int) or intensity < 0 or intensity > 100:
            return jsonify({'error': 'Intensity must be between 0 and 100'}), 400
        
        if style not in ['professional', 'concise', 'detailed', 'empathetic', 'objective']:
            return jsonify({'error': 'Invalid style'}), 400
        
        # Get current user
        current_user = User.query.get(g.current_user_id)
        
        # Detect PHI in original text
        phi_detected = detect_phi_patterns(text)
        phi_found = len(phi_detected) > 0
        
        # Prepare text for AI processing
        processed_text = text
        deidentification_info = None
        
        if deidentify_first and phi_found:
            processed_text, replacements = deidentify_text(text, 'placeholder')
            deidentification_info = {
                'phi_detected': len(phi_detected),
                'replacements_made': len(replacements),
                'categories_found': list(set(p['category'] for p in phi_detected))
            }
        
        # Generate enhancement prompt
        prompt = generate_enhancement_prompt(
            processed_text, enhancement_type, intensity, style
        )
        
        # Call Ollama API
        ai_result = call_ollama_api(
            prompt=prompt,
            model=model,
            temperature=min(0.9, intensity / 100),
            max_tokens=min(1000, len(text) * 2)
        )
        
        # Check for PHI in AI response
        enhanced_text = ai_result.get('response', '')
        response_phi_detected = detect_phi_patterns(enhanced_text) if enhanced_text else []
        
        # Log AI interaction
        interaction = AIInteraction.log_interaction(
            user_id=current_user.id,
            input_text=text,
            output_text=enhanced_text,
            ai_service='ollama',
            model_name=ai_result.get('model_used', model),
            enhancement_type=enhancement_type,
            enhancement_intensity=intensity,
            processing_time_ms=ai_result.get('processing_time_ms', 0),
            success=ai_result.get('success', False),
            error_message=ai_result.get('error') if not ai_result.get('success') else None,
            phi_detected_input=phi_found,
            phi_detected_output=len(response_phi_detected) > 0,
            deidentification_applied=deidentify_first and phi_found
        )
        
        # Log audit event
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='ai_enhancement_request',
            action='CREATE',
            details={
                'enhancement_type': enhancement_type,
                'intensity': intensity,
                'style': style,
                'text_length': len(text),
                'phi_detected': phi_found,
                'deidentification_applied': deidentify_first and phi_found,
                'success': ai_result.get('success', False)
            },
            phi_accessed=phi_found,
            ip_address=request.remote_addr
        )
        
        if not ai_result.get('success'):
            return jsonify({
                'error': 'AI enhancement failed',
                'details': ai_result.get('error'),
                'processing_time_ms': ai_result.get('processing_time_ms', 0)
            }), 500
        
        response_data = {
            'enhanced_text': enhanced_text,
            'original_length': len(text),
            'enhanced_length': len(enhanced_text),
            'processing_time_ms': ai_result.get('processing_time_ms', 0),
            'model_used': ai_result.get('model_used', model),
            'enhancement_applied': {
                'type': enhancement_type,
                'intensity': intensity,
                'style': style
            },
            'phi_analysis': {
                'input_phi_detected': phi_found,
                'input_phi_count': len(phi_detected),
                'output_phi_detected': len(response_phi_detected) > 0,
                'output_phi_count': len(response_phi_detected),
                'deidentification_applied': deidentify_first and phi_found
            },
            'interaction_id': str(interaction.id)
        }
        
        if deidentification_info:
            response_data['deidentification_info'] = deidentification_info
        
        # Warning if PHI detected in output
        if len(response_phi_detected) > 0:
            response_data['warning'] = 'PHI patterns detected in AI response. Review before use.'
        
        return jsonify(response_data), 200
        
    except Exception as e:
        current_app.logger.error(f"AI enhancement error: {str(e)}")
        return jsonify({'error': 'An error occurred during AI enhancement'}), 500

@ai_bp.route('/deidentify', methods=['POST'])
@require_auth
@limiter.limit("50 per hour")
def deidentify_text_endpoint():
    """
    De-identify PHI in clinical text
    
    Request body:
    {
        "text": "Clinical text with PHI",
        "method": "placeholder",
        "return_mapping": false
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        text = data.get('text', '').strip()
        method = data.get('method', 'placeholder')
        return_mapping = data.get('return_mapping', False)
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        if len(text) > 10000:
            return jsonify({'error': 'Text too long (max 10000 characters)'}), 400
        
        if method not in ['placeholder', 'mask', 'redact']:
            return jsonify({'error': 'Invalid deidentification method'}), 400
        
        # Detect and de-identify PHI
        phi_detected = detect_phi_patterns(text)
        deidentified_text, replacements = deidentify_text(text, method)
        
        # Get current user for audit logging
        current_user = User.query.get(g.current_user_id)
        
        # Log de-identification request
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='phi_deidentification',
            action='CREATE',
            details={
                'method': method,
                'text_length': len(text),
                'phi_detected_count': len(phi_detected),
                'replacements_made': len(replacements),
                'return_mapping': return_mapping
            },
            phi_accessed=len(phi_detected) > 0,
            ip_address=request.remote_addr
        )
        
        response_data = {
            'deidentified_text': deidentified_text,
            'phi_detected': len(phi_detected),
            'replacements_made': len(replacements),
            'method_used': method,
            'categories_found': list(set(p['category'] for p in phi_detected))
        }
        
        if return_mapping and current_user.role == 'administrator':
            # Only return mapping for administrators
            response_data['replacement_mapping'] = replacements
        
        return jsonify(response_data), 200
        
    except Exception as e:
        current_app.logger.error(f"De-identification error: {str(e)}")
        return jsonify({'error': 'An error occurred during de-identification'}), 500

@ai_bp.route('/models', methods=['GET'])
@require_auth
def list_available_models():
    """List available AI models from Ollama"""
    try:
        base_url, _ = get_ollama_config()
        
        response = requests.get(f"{base_url}/api/tags", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            models = data.get('models', [])
            
            # Format model information
            formatted_models = []
            for model in models:
                formatted_models.append({
                    'name': model.get('name', ''),
                    'size': model.get('size', 0),
                    'modified_at': model.get('modified_at', ''),
                    'details': model.get('details', {})
                })
            
            return jsonify({
                'models': formatted_models,
                'total_models': len(formatted_models),
                'ollama_url': base_url
            }), 200
        
        else:
            return jsonify({
                'error': 'Failed to connect to Ollama service',
                'status_code': response.status_code
            }), 500
        
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Cannot connect to Ollama service'}), 503
    except Exception as e:
        current_app.logger.error(f"List models error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching models'}), 500

@ai_bp.route('/test-connection', methods=['POST'])
@require_auth
@limiter.limit("10 per hour")
def test_ollama_connection():
    """Test connection to Ollama service"""
    try:
        data = request.get_json() or {}
        test_url = data.get('url')
        test_model = data.get('model')
        
        # Use provided URL or default
        base_url, default_model = get_ollama_config()
        test_url = test_url or base_url
        test_model = test_model or default_model
        
        # Test basic connectivity
        start_time = time.time()
        
        try:
            # Test /api/tags endpoint
            response = requests.get(f"{test_url}/api/tags", timeout=5)
            connectivity_time = int((time.time() - start_time) * 1000)
            
            if response.status_code != 200:
                return jsonify({
                    'connected': False,
                    'error': f'Ollama service returned status {response.status_code}',
                    'response_time_ms': connectivity_time
                }), 200
            
            # Check if specific model is available
            models_data = response.json()
            available_models = [m.get('name', '') for m in models_data.get('models', [])]
            model_available = any(test_model in model_name for model_name in available_models)
            
            # Test model generation if model is available
            generation_test = None
            if model_available:
                test_start = time.time()
                gen_response = requests.post(
                    f"{test_url}/api/generate",
                    json={
                        "model": test_model,
                        "prompt": "Test prompt for connectivity. Respond with 'Connection successful.'",
                        "stream": False,
                        "options": {"num_predict": 10}
                    },
                    timeout=15
                )
                generation_time = int((time.time() - test_start) * 1000)
                
                if gen_response.status_code == 200:
                    gen_data = gen_response.json()
                    generation_test = {
                        'success': True,
                        'response_time_ms': generation_time,
                        'response_preview': gen_data.get('response', '')[:100]
                    }
                else:
                    generation_test = {
                        'success': False,
                        'error': f'Generation test failed with status {gen_response.status_code}',
                        'response_time_ms': generation_time
                    }
            
            # Log connection test
            current_user = User.query.get(g.current_user_id)
            AuditLog.log_event(
                user_id=str(current_user.id),
                event_type='ollama_connection_test',
                action='READ',
                details={
                    'test_url': test_url,
                    'test_model': test_model,
                    'connectivity_success': True,
                    'model_available': model_available,
                    'generation_test_success': generation_test.get('success') if generation_test else None
                },
                ip_address=request.remote_addr
            )
            
            return jsonify({
                'connected': True,
                'url': test_url,
                'model': test_model,
                'model_available': model_available,
                'available_models': available_models,
                'connectivity_time_ms': connectivity_time,
                'generation_test': generation_test,
                'timestamp': datetime.utcnow().isoformat()
            }), 200
            
        except requests.exceptions.Timeout:
            return jsonify({
                'connected': False,
                'error': 'Connection timeout',
                'response_time_ms': int((time.time() - start_time) * 1000)
            }), 200
            
        except requests.exceptions.ConnectionError:
            return jsonify({
                'connected': False,
                'error': 'Cannot connect to Ollama service',
                'response_time_ms': int((time.time() - start_time) * 1000)
            }), 200
        
    except Exception as e:
        current_app.logger.error(f"Test connection error: {str(e)}")
        return jsonify({'error': 'An error occurred while testing connection'}), 500

@ai_bp.route('/usage-stats', methods=['GET'])
@require_auth
def get_ai_usage_statistics():
    """Get AI usage statistics"""
    try:
        # Parse query parameters
        days = int(request.args.get('days', 30))
        user_id_str = request.args.get('user_id')
        
        if days > 365:
            return jsonify({'error': 'Maximum 365 days allowed'}), 400
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Build query
        query = AIInteraction.query.filter(
            AIInteraction.created_at >= start_date,
            AIInteraction.created_at <= end_date
        )
        
        # Filter by user if specified and user has permission
        current_user = User.query.get(g.current_user_id)
        
        if user_id_str:
            if current_user.role != 'administrator' and str(current_user.id) != user_id_str:
                return jsonify({'error': 'Access denied'}), 403
            
            try:
                user_uuid = uuid.UUID(user_id_str)
                query = query.filter(AIInteraction.user_id == user_uuid)
            except ValueError:
                return jsonify({'error': 'Invalid user ID format'}), 400
        elif current_user.role != 'administrator':
            # Non-admins can only see their own stats
            query = query.filter(AIInteraction.user_id == current_user.id)
        
        interactions = query.all()
        
        # Calculate statistics
        total_interactions = len(interactions)
        successful_interactions = sum(1 for i in interactions if i.success)
        failed_interactions = total_interactions - successful_interactions
        
        # Processing time statistics
        processing_times = [i.processing_time_ms for i in interactions if i.processing_time_ms]
        avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
        
        # Enhancement type breakdown
        enhancement_types = defaultdict(int)
        for interaction in interactions:
            if interaction.enhancement_type:
                enhancement_types[interaction.enhancement_type] += 1
        
        # Model usage
        model_usage = defaultdict(int)
        for interaction in interactions:
            if interaction.model_name:
                model_usage[interaction.model_name] += 1
        
        # PHI detection statistics
        phi_input_detections = sum(1 for i in interactions if i.phi_detected_input)
        phi_output_detections = sum(1 for i in interactions if i.phi_detected_output)
        deidentification_applied = sum(1 for i in interactions if i.deidentification_applied)
        
        # Daily usage (last 7 days)
        daily_usage = defaultdict(int)
        for interaction in interactions:
            date_key = interaction.created_at.date().isoformat()
            daily_usage[date_key] += 1
        
        # Sort daily usage
        sorted_daily = dict(sorted(daily_usage.items()))
        
        statistics = {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            },
            'summary': {
                'total_interactions': total_interactions,
                'successful_interactions': successful_interactions,
                'failed_interactions': failed_interactions,
                'success_rate': (successful_interactions / total_interactions * 100) if total_interactions > 0 else 0,
                'average_processing_time_ms': round(avg_processing_time, 2)
            },
            'enhancement_types': dict(enhancement_types),
            'model_usage': dict(model_usage),
            'phi_safety': {
                'phi_detected_in_input': phi_input_detections,
                'phi_detected_in_output': phi_output_detections,
                'deidentification_applied': deidentification_applied,
                'phi_safety_rate': ((total_interactions - phi_output_detections) / total_interactions * 100) if total_interactions > 0 else 100
            },
            'daily_usage': sorted_daily
        }
        
        # Log statistics access
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='ai_usage_statistics_access',
            action='READ',
            details={
                'period_days': days,
                'filtered_by_user': user_id_str is not None,
                'total_interactions': total_interactions
            },
            ip_address=request.remote_addr
        )
        
        return jsonify(statistics), 200
        
    except Exception as e:
        current_app.logger.error(f"AI usage statistics error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching AI usage statistics'}), 500