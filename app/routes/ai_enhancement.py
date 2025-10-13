"""
Enhanced AI Enhancement API Blueprint
Adds spell check, grammar check, and improved text enhancement capabilities
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import re
import time
from datetime import datetime, timedelta
import json
from collections import defaultdict
import threading
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import concurrent.futures
import queue

from ..extensions import db
from ..models.user import User
from ..models.audit_log import AuditLog

ai_bp = Blueprint('ai', __name__)

def get_ai_session():
    """Get or create a persistent session with connection pooling"""
    global _ai_session, _session_last_used
    
    with _session_lock:
        # Create new session if needed or if it's been idle too long
        now = datetime.now()
        if (_ai_session is None or 
            (_session_last_used and now - _session_last_used > timedelta(minutes=5))):
            
            if _ai_session:
                _ai_session.close()
            
            # Create new session with connection pooling and retry strategy
            _ai_session = requests.Session()
            
            # Configure retry strategy
            retry_strategy = Retry(
                total=2,
                backoff_factor=1,
                status_forcelist=[429, 500, 502, 503, 504],
                allowed_methods=["POST"]  # Updated from deprecated method_whitelist
            )
            
            # Configure connection pooling
            adapter = HTTPAdapter(
                max_retries=retry_strategy,
                pool_connections=5,
                pool_maxsize=10
            )
            
            _ai_session.mount("http://", adapter)
            _ai_session.mount("https://", adapter)
            
            # Set reasonable default timeout
            _ai_session.timeout = (5, 30)  # (connect, read)
        
        _session_last_used = now
        return _ai_session

# llama-server status endpoint
@ai_bp.route('/llama-server/status', methods=['GET'])
@jwt_required()
def get_llama_server_status():
    """Get detailed llama-server status including model info and processing mode"""
    try:
        base_url = current_app.config.get('OLLAMA_BASE_URL') or current_app.config.get('LLAMA_SERVER_URL', 'http://localhost:11434')
        model_path = current_app.config.get('LLAMA_MODEL_PATH', '')
        threads = current_app.config.get('LLAMA_THREADS', 4)
        context_size = current_app.config.get('LLAMA_CONTEXT_SIZE', 4096)
        
        # Get persistent session
        session = get_ai_session()
        
        try:
            # Test basic connectivity - try Ollama endpoints first, then llama-server endpoints
            ollama_endpoints = ["/api/tags", "/"]
            llama_server_endpoints = ["/v1/models", "/props", "/slots"]
            endpoints_to_try = ollama_endpoints + llama_server_endpoints
            
            server_online = False
            health_data = {}
            
            for endpoint in endpoints_to_try:
                try:
                    response = session.get(f"{base_url}{endpoint}", timeout=5)
                    if response.status_code == 200:
                        server_online = True
                        try:
                            health_data = response.json()
                            # Add endpoint info to identify which service responded
                            health_data["responding_endpoint"] = endpoint
                        except:
                            health_data = {"endpoint": endpoint, "status": "ok"}
                        break
                except Exception:
                    continue
                    
        except Exception:
            server_online = False
            health_data = {}
        
        # Extract model name from path
        model_name = "Unknown"
        if model_path:
            model_name = model_path.split('/')[-1].replace('.gguf', '')
        
        # Determine processing mode and GPU availability
        processing_mode = "CPU"
        gpu_available = False
        gpu_info = {}
        
        # Check if GPU acceleration is available through multiple methods
        try:
            # Method 1: Check llama-server health endpoint for GPU info
            if server_online:
                if 'gpu' in str(health_data).lower() or 'cuda' in str(health_data).lower():
                    gpu_available = True
                    processing_mode = "GPU"
            
            # Method 2: Try to get server props/info endpoint
            try:
                response = session.get(f"{base_url}/props", timeout=3)
                if response.status_code == 200:
                    props_data = response.json()
                    # Look for GPU-related properties
                    if any(key.lower().find('gpu') != -1 or key.lower().find('cuda') != -1 
                           for key in str(props_data).lower()):
                        gpu_available = True
                        processing_mode = "GPU"
                    gpu_info['props'] = props_data
            except Exception:
                pass
            
            # Method 3: Check if the binary was compiled with GPU support
            # Look for GPU libraries in the model loading logs
            if 'offload' in str(health_data).lower() or 'gpu' in str(health_data).lower():
                gpu_available = True
            
            # Method 4: Assume GPU is available if user explicitly configured it
            # This allows manual override through frontend settings
            compute_mode_setting = current_app.config.get('COMPUTE_MODE', 'cpu').lower()
            if compute_mode_setting == 'gpu':
                gpu_available = True
                processing_mode = "GPU"
                
        except Exception as e:
            current_app.logger.debug(f"GPU detection error: {e}")
            pass
        
        # Get circuit breaker status
        circuit_status = check_ai_circuit_breaker()
        
        return jsonify({
            'success': True,
            'server_online': server_online,
            'server_url': base_url,
            'model_name': model_name,
            'model_path': model_path,
            'processing_mode': processing_mode,
            'gpu_available': gpu_available,
            'threads': threads,
            'context_size': context_size,
            'circuit_breaker': {
                'available': circuit_status[0],
                'reason': circuit_status[1],
                'failures': _ai_failures,
                'max_failures': _max_failures
            },
            'health_data': health_data,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting llama-server status: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get server status: {str(e)}',
            'server_online': False,
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@ai_bp.route('/llama-server/set-compute-mode', methods=['POST'])
@jwt_required()
def set_compute_mode():
    """Set the compute mode (CPU/GPU) for AI processing"""
    try:
        data = request.get_json()
        compute_mode = data.get('compute_mode', 'cpu').lower()
        
        if compute_mode not in ['cpu', 'gpu']:
            return jsonify({
                'success': False,
                'error': 'Invalid compute mode. Must be "cpu" or "gpu"'
            }), 400
        
        # Store the setting in app config (temporary for this session)
        current_app.config['COMPUTE_MODE'] = compute_mode
        
        # You could also store this in a database or config file for persistence
        # For now, we'll just acknowledge the setting
        
        return jsonify({
            'success': True,
            'compute_mode': compute_mode,
            'message': f'Compute mode set to {compute_mode.upper()}',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error setting compute mode: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to set compute mode: {str(e)}'
        }), 500

# Global session pool for connection reuse
_ai_session = None
_session_lock = threading.Lock()
_session_last_used = None

# AI service circuit breaker - More lenient settings with startup awareness
_ai_failures = 0
_ai_disabled_until = None
_max_failures = 6  # Increased from 3 to 6 - less aggressive
_failure_window = timedelta(minutes=5)  # Reduced from 10 to 5 minutes
_circuit_breaker_lock = threading.Lock()  # Add proper locking

# Startup detection variables
_backend_start_time = None  # Will be set on first status check
_startup_grace_period = timedelta(minutes=3)  # 3-minute grace period for startup
_ollama_verified_ready = False
_ollama_warmup_check_time = None
_startup_lock = threading.Lock()
_startup_initialized = False

# AI request queue and thread pool for async processing
_ai_thread_pool = None
_ai_queue_size = 10
_max_workers = 2  # Limit concurrent AI requests

def get_ai_thread_pool():
    """Get or create thread pool for AI processing"""
    global _ai_thread_pool
    
    if _ai_thread_pool is None:
        _ai_thread_pool = concurrent.futures.ThreadPoolExecutor(
            max_workers=_max_workers,
            thread_name_prefix="ai_worker"
        )
    
    return _ai_thread_pool

def check_ai_circuit_breaker():
    """Check if AI service is available or if circuit breaker is active"""
    global _ai_failures, _ai_disabled_until
    
    with _circuit_breaker_lock:  # Add proper locking
        now = datetime.now()
        
        # Reset circuit breaker if timeout has passed
        if _ai_disabled_until and now > _ai_disabled_until:
            _ai_failures = 0
            _ai_disabled_until = None
            current_app.logger.info("AI circuit breaker reset - service available again")
        
        # Check if circuit breaker is active
        if _ai_disabled_until and now < _ai_disabled_until:
            minutes_remaining = (_ai_disabled_until - now).total_seconds() / 60
            return False, f"AI service disabled for {minutes_remaining:.1f} more minutes (failures: {_ai_failures})"
        
        return True, None

def record_ai_failure():
    """Record an AI service failure with startup awareness"""
    record_ai_failure_with_startup_awareness()

def record_ai_success():
    """Record successful AI interaction"""
    global _ai_failures, _ai_disabled_until, _ollama_verified_ready, _ollama_warmup_check_time
    
    with _circuit_breaker_lock:  # Add proper locking
        # Only reset if we had failures - don't spam logs
        if _ai_failures > 0 or _ai_disabled_until:
            previous_failures = _ai_failures
            _ai_failures = 0
            _ai_disabled_until = None
            current_app.logger.info(f"AI service recovered - reset {previous_failures} failures")
    
    # Mark Ollama as verified ready on first success
    with _startup_lock:
        if not _ollama_verified_ready:
            _ollama_verified_ready = True
            _ollama_warmup_check_time = datetime.now()
            startup_duration = (_ollama_warmup_check_time - _backend_start_time).total_seconds()
            current_app.logger.info(f"Ollama verified ready after {startup_duration:.1f} seconds")

def initialize_startup_time():
    """Initialize the startup time on first call"""
    global _backend_start_time, _startup_initialized
    with _startup_lock:
        if not _startup_initialized:
            _backend_start_time = datetime.now()
            _startup_initialized = True
            current_app.logger.info(f"AI startup timer initialized at {_backend_start_time.strftime('%H:%M:%S')}")

def is_startup_phase():
    """Check if we're still in the startup grace period"""
    initialize_startup_time()  # Ensure startup time is set
    
    with _startup_lock:
        if _backend_start_time is None:
            return True  # If somehow not initialized, assume startup phase
        
        now = datetime.now()
        time_since_start = now - _backend_start_time
        in_startup = time_since_start < _startup_grace_period
        
        if in_startup:
            remaining = (_startup_grace_period - time_since_start).total_seconds()
            current_app.logger.debug(f"Still in startup grace period: {remaining:.1f}s remaining")
        
        return in_startup

def is_ollama_verified_ready():
    """Check if Ollama has been verified as fully ready"""
    with _startup_lock:
        return _ollama_verified_ready

def verify_ollama_warmup(session, ollama_url, timeout=30):
    """
    Verify that Ollama is not just running but fully warmed up and ready.
    This includes checking that models are loaded and can respond to requests.
    """
    try:
        # Step 1: Check if models are available
        response = session.get(f"{ollama_url}/api/tags", timeout=timeout)
        if response.status_code != 200:
            return False, f"Models endpoint failed: {response.status_code}"
        
        models_data = response.json()
        models = models_data.get('models', [])
        if not models:
            return False, "No models available"
        
        # Step 2: Try to ping a model to ensure it's loaded and responsive
        # Use the first available model for a simple test
        test_model = models[0].get('name', 'mistral:latest')
        
        # Send a minimal generation request to verify model is loaded
        ping_request = {
            "model": test_model,
            "prompt": "Hi",
            "stream": False,
            "options": {
                "num_predict": 1,  # Generate only 1 token
                "temperature": 0.1
            }
        }
        
        response = session.post(
            f"{ollama_url}/api/generate", 
            json=ping_request, 
            timeout=timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            # Check if we got a proper response (not an error)
            if 'response' in result or 'message' in result:
                return True, f"Model {test_model} ready and responsive"
            else:
                return False, f"Model {test_model} returned invalid response format"
        else:
            return False, f"Model ping failed: {response.status_code} - {response.text[:100]}"
            
    except requests.exceptions.Timeout:
        return False, f"Warmup verification timeout ({timeout}s)"
    except Exception as e:
        return False, f"Warmup verification error: {str(e)[:100]}"

def record_ai_failure_with_startup_awareness():
    """Record AI failure with startup phase awareness"""
    global _ai_failures, _ai_disabled_until
    
    # Initialize startup time if needed
    initialize_startup_time()
    
    # During startup phase, be more lenient with failures
    if is_startup_phase():
        current_app.logger.info(f"AI connection failed during startup grace period (not recording failure) - grace period active")
        return
    
    # Normal failure recording
    with _circuit_breaker_lock:
        _ai_failures += 1
        current_app.logger.warning(f"AI service failure #{_ai_failures} (max: {_max_failures}) - startup grace period expired")
        
        # Activate circuit breaker if too many failures
        if _ai_failures >= _max_failures:
            _ai_disabled_until = datetime.now() + _failure_window
            current_app.logger.error(f"AI circuit breaker activated until {_ai_disabled_until.strftime('%H:%M:%S')} ({_failure_window.total_seconds()/60:.1f} minutes)")

# Enhanced PHI detection patterns
PHI_PATTERNS = {
    'names': [
        r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',
        r'\b[A-Z][a-z]+, [A-Z][a-z]+\b',
        r'\bDr\.\s+[A-Z][a-z]+\b',
    ],
    'dates': [
        r'\b\d{1,2}\/\d{1,2}\/\d{4}\b',
        r'\b\d{4}-\d{2}-\d{2}\b',
        r'\b\d{1,2}-\d{1,2}-\d{4}\b',
    ],
    'identifiers': [
        r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
        r'\b\d{9}\b',  # 9-digit ID
        r'\b[A-Z]{2}\d{6,8}\b',  # License numbers
        r'\bMRN\s*:?\s*\d+\b',  # Medical record numbers
    ],
    'contact': [
        r'\b\d{3}-\d{3}-\d{4}\b',
        r'\(\d{3}\)\s?\d{3}-\d{4}\b',
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    ],
    'addresses': [
        r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)\b',
        r'\b[A-Z][a-z]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b',
    ]
}

def detect_phi_patterns(text):
    """Enhanced PHI detection with medical terminology awareness"""
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

def check_spelling_and_grammar(text):
    """Basic spell check and grammar validation for clinical text"""
    issues = []
    
    # Common medical spelling errors
    medical_corrections = {
        'diesease': 'disease',
        'symtom': 'symptom',
        'symtoms': 'symptoms',
        'paitent': 'patient',
        'medicaiton': 'medication',
        'assesment': 'assessment',
        'treatement': 'treatment',
        'diagnisis': 'diagnosis',
        'perscription': 'prescription',
        'theraphy': 'therapy'
    }
    
    # Check for common misspellings
    words = re.findall(r'\b\w+\b', text.lower())
    for word in words:
        if word in medical_corrections:
            issues.append({
                'type': 'spelling',
                'word': word,
                'suggestion': medical_corrections[word],
                'severity': 'medium'
            })
    
    # Basic grammar checks
    sentences = re.split(r'[.!?]+', text)
    for sentence in sentences:
        sentence = sentence.strip()
        if sentence:
            # Check for incomplete sentences in clinical context
            if len(sentence.split()) > 3 and not re.search(r'\b(is|are|was|were|has|have|had|will|would|can|could|should|may|might)\b', sentence.lower()):
                issues.append({
                    'type': 'grammar',
                    'text': sentence[:50] + '...' if len(sentence) > 50 else sentence,
                    'suggestion': 'Consider adding a verb to make this a complete sentence',
                    'severity': 'low'
                })
    
    return issues

@ai_bp.route('/enhance', methods=['POST'])
@jwt_required()
def enhance_text():
    """
    Enhanced text improvement with spell check and grammar validation
    
    Request body:
    {
        "text": "Clinical text to enhance",
        "enhancement_type": "clinical",
        "intensity": 75,
        "style": "professional",
        "model": "llama2",
        "include_spell_check": true,
        "include_grammar_check": true,
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
        compute_mode = data.get('compute_mode', 'cpu')  # New: CPU or GPU mode
        include_spell_check = data.get('include_spell_check', True)
        include_grammar_check = data.get('include_grammar_check', True)
        preserve_structure = data.get('preserve_structure', True)
        
        # Validate input
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        if len(text) > 5000:
            return jsonify({'error': 'Text too long (max 5000 characters)'}), 400
        
        if enhancement_type not in ['clinical', 'narrative', 'diagnostic', 'spell_check', 'grammar_check']:
            return jsonify({'error': 'Invalid enhancement type'}), 400
        
        if not isinstance(intensity, int) or intensity < 0 or intensity > 100:
            return jsonify({'error': 'Intensity must be between 0 and 100'}), 400
        
        # Get current user
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Log the enhancement request with compute mode
        current_app.logger.info(f"AI Enhancement Request - User: {current_user.id}, "
                              f"Mode: {compute_mode.upper()}, Model: {model}, "
                              f"Style: {style}, Intensity: {intensity}%, "
                              f"Text Length: {len(text)} chars")
        
        # Detect PHI in original text
        phi_detected = detect_phi_patterns(text)
        phi_found = len(phi_detected) > 0
        
        # Perform spell and grammar check if requested
        spelling_issues = []
        grammar_issues = []
        
        if include_spell_check or include_grammar_check:
            issues = check_spelling_and_grammar(text)
            spelling_issues = [i for i in issues if i['type'] == 'spelling']
            grammar_issues = [i for i in issues if i['type'] == 'grammar']
        
        # If only spell/grammar check requested, return early
        if enhancement_type in ['spell_check', 'grammar_check']:
            return jsonify({
                'original_text': text,
                'spelling_issues': spelling_issues,
                'grammar_issues': grammar_issues,
                'total_issues': len(spelling_issues) + len(grammar_issues),
                'phi_analysis': {
                    'input_phi_detected': phi_found,
                    'input_phi_count': len(phi_detected)
                }
            }), 200
        
        # Prepare text for AI processing (de-identify if PHI found)
        processed_text = text
        deidentification_info = None
        
        if phi_found:
            processed_text, replacements = deidentify_text(text, 'placeholder')
            deidentification_info = {
                'phi_detected': len(phi_detected),
                'replacements_made': len(replacements),
                'categories_found': list(set(p['category'] for p in phi_detected))
            }
        
        # Generate enhancement prompt
        prompt = generate_enhancement_prompt(
            processed_text, enhancement_type, intensity, style, 
            include_spell_check, include_grammar_check
        )
        
        # Call llama-server API (replaces Ollama)
        ai_result = call_ollama_api(
            prompt=prompt,
            model=model,
            compute_mode=compute_mode,
            temperature=min(0.9, intensity / 100),
            max_tokens=min(1000, len(text) * 2)
        )
        
        # Check for PHI in AI response
        enhanced_text = ai_result.get('response', '')
        response_phi_detected = detect_phi_patterns(enhanced_text) if enhanced_text else []
        
        # Log the AI processing results
        processing_time = ai_result.get('processing_time_ms', 0)
        success = ai_result.get('success', False)
        current_app.logger.info(f"AI Enhancement Result - "
                              f"Success: {success}, "
                              f"Mode Used: {compute_mode.upper()}, "
                              f"Processing Time: {processing_time}ms, "
                              f"Input: {len(text)} chars, "
                              f"Output: {len(enhanced_text)} chars")
        
        # Log AI interaction (temporarily disabled - need to create AIInteraction model)
        # interaction = AIInteraction.log_interaction(...)
        interaction_id = "temp_interaction_id"
        
        # Log audit event
        AuditLog.log_action(
            user_id=str(current_user.id),
            action='CREATE',
            details={
                'enhancement_type': enhancement_type,
                'intensity': intensity,
                'style': style,
                'compute_mode': compute_mode,
                'text_length': len(text),
                'phi_detected': phi_found,
                'spell_check_included': include_spell_check,
                'grammar_check_included': include_grammar_check,
                'success': ai_result.get('success', False)
            },
        )
        
        if not ai_result.get('success'):
            return jsonify({
                'error': 'AI enhancement failed',
                'details': ai_result.get('error'),
                'processing_time_ms': ai_result.get('processing_time_ms', 0),
                'spelling_issues': spelling_issues,
                'grammar_issues': grammar_issues
            }), 500
        
        response_data = {
            'enhanced_text': enhanced_text,
            'original_length': len(text),
            'enhanced_length': len(enhanced_text),
            'processing_time_ms': ai_result.get('processing_time_ms', 0),
            'model_used': ai_result.get('model_used', model),
            'compute_mode_used': ai_result.get('compute_mode_used', compute_mode),
            'timeout_used': ai_result.get('timeout_used', 0),
            'enhancement_applied': {
                'type': enhancement_type,
                'intensity': intensity,
                'style': style
            },
            'spelling_issues': spelling_issues,
            'grammar_issues': grammar_issues,
            'total_issues_found': len(spelling_issues) + len(grammar_issues),
            'phi_analysis': {
                'input_phi_detected': phi_found,
                'input_phi_count': len(phi_detected),
                'output_phi_detected': len(response_phi_detected) > 0,
                'output_phi_count': len(response_phi_detected),
                'deidentification_applied': phi_found
            },
            'interaction_id': interaction_id
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

def generate_enhancement_prompt(text, enhancement_type, intensity, style, 
                               include_spell_check=True, include_grammar_check=True):
    """Generate clinical enhancement prompt with spell/grammar check"""
    
    # Base instruction based on enhancement type
    type_instructions = {
        'clinical': "Enhance this clinical text with professional medical terminology and standard clinical language.",
        'narrative': "Improve the narrative flow and readability while maintaining clinical accuracy and professional tone.",
        'diagnostic': "Focus on diagnostic criteria, clinical reasoning, and medical decision-making processes."
    }
    
    # Style-specific instructions
    style_instructions = {
        'professional': "Use formal, professional medical language appropriate for clinical documentation.",
        'formal': "Use highly structured, academic medical writing with precise terminology and formal grammar.",
        'empathetic': "Use patient-centered, compassionate language that demonstrates understanding while maintaining professionalism.",
        'educational': "Write in a way that would educate and inform other healthcare professionals, with explanatory context.",
        'verbose': "Provide comprehensive, detailed explanations with extensive clinical context and thorough documentation.",
        'concise': "Be brief and direct while maintaining clarity and clinical accuracy, using minimal but precise language.",
        'objective': "Focus strictly on objective, measurable observations and clinical facts without subjective interpretation.",
        'detailed': "Provide thorough documentation with specific clinical details, measurements, and comprehensive observations."
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
    
    spell_grammar_instruction = ""
    if include_spell_check or include_grammar_check:
        spell_grammar_instruction = "\n- Correct any spelling errors, especially medical terminology"
        if include_grammar_check:
            spell_grammar_instruction += "\n- Fix grammar issues while preserving medical accuracy"
    
    # Calculate alteration percentage from intensity
    alteration_percentage = {
        'light': 25,
        'moderate': 50, 
        'comprehensive': 75
    }.get(intensity, 50)
    
    prompt = f"""Rephrase the following psychiatric clinical text to be {alteration_percentage}% different while preserving all medical meaning and content.

CRITICAL REQUIREMENTS:
1. Preserve all mood states (neutral, depressed, anxious, etc.) - can use synonyms like "stable" for "neutral"
2. Preserve all safety assessments (SI, HI, perceptual disturbances) - exact wording required
3. Preserve all clinical information (sleep, energy, compliance, side effects)
4. Preserve all placeholders exactly: [Sleep], [Energy], [Observation] etc.
5. Return ONLY the enhanced text, no explanations

Style: {style_instructions.get(style, style_instructions['professional'])} tone{spell_grammar_instruction}

You can:
- Use medical synonyms (neutral → stable, depressed → dysthymic)
- Rearrange sentence structure
- Improve clinical terminology
- Change word choice while keeping meaning identical

Text to enhance:

{text}"""

    return prompt

def call_ollama_api(prompt, model=None, compute_mode='cpu', temperature=0.7, max_tokens=500):
    """Call llama-server API with OpenAI-compatible endpoints"""
    
    # Check circuit breaker first
    available, reason = check_ai_circuit_breaker()
    if not available:
        return {
            'success': False,
            'error': f'AI service temporarily unavailable: {reason}',
            'processing_time_ms': 0,
            'circuit_breaker_active': True
        }
    
    base_url = current_app.config.get('OLLAMA_BASE_URL') or current_app.config.get('LLAMA_SERVER_URL', 'http://localhost:11434')
    
    start_time = time.time()
    
    try:
        # Get persistent session with connection pooling
        session = get_ai_session()
        
        # Improved timeout calculation - more generous for longer texts
        timeout = min(90, max(20, len(prompt) // 80 + 20))
        
        # Use OpenAI-compatible completions endpoint
        response = session.post(
            f"{base_url}/v1/completions",
            json={
                "prompt": prompt,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stop": ["</s>", "\n\n---", "\n\nUser:", "\n\nHuman:"],
                "stream": False
            },
            timeout=timeout,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer dummy"  # llama-server doesn't require real auth
            }
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        if response.status_code == 200:
            result = response.json()
            # Record successful interaction
            record_ai_success()
            
            # Extract response from OpenAI-compatible format
            if 'choices' in result and len(result['choices']) > 0:
                raw_response = result['choices'][0].get('text', '').strip()
                cleaned_response = clean_ai_response(raw_response)
                
                return {
                    'success': True,
                    'response': cleaned_response,
                    'processing_time_ms': processing_time,
                    'model_used': 'llama-server',
                    'compute_mode_used': compute_mode,
                    'timeout_used': timeout
                }
            else:
                # Record failure
                record_ai_failure()
                return {
                    'success': False,
                    'error': 'Invalid response format from llama-server',
                    'processing_time_ms': processing_time,
                    'circuit_breaker_active': False
                }
        else:
            # Record failure and activate circuit breaker if needed
            record_ai_failure()
            
            return {
                'success': False,
                'error': f"llama-server API error: {response.status_code} - {response.text[:200]}",
                'processing_time_ms': processing_time,
                'circuit_breaker_active': False
            }
    
    except requests.exceptions.Timeout:
        # Record failure for timeout
        record_ai_failure()
        
        return {
            'success': False,
            'error': f'llama-server API timeout after {timeout}s',
            'processing_time_ms': int((time.time() - start_time) * 1000),
            'circuit_breaker_active': False
        }
    
    except Exception as e:
        # Record failure for any other error
        record_ai_failure()
        
        return {
            'success': False,
            'error': f'llama-server connection error: {str(e)}',
            'processing_time_ms': int((time.time() - start_time) * 1000),
            'circuit_breaker_active': False
        }

def call_ollama_api(prompt, model, compute_mode='cpu', temperature=0.7, max_tokens=500):
    """Call Ollama API with connection pooling, circuit breaker, and error handling"""
    
    # Check circuit breaker first
    available, reason = check_ai_circuit_breaker()
    if not available:
        return {
            'success': False,
            'error': f'AI service temporarily unavailable: {reason}',
            'processing_time_ms': 0,
            'circuit_breaker_active': True
        }
    
    base_url = current_app.config.get('OLLAMA_BASE_URL', 'http://localhost:11434')
    model = model or current_app.config.get('OLLAMA_MODEL', 'mistral:latest')
    
    start_time = time.time()
    
    try:
        # Get persistent session with connection pooling
        session = get_ai_session()
        
        # Improved timeout calculation - more generous for longer texts
        timeout = min(90, max(20, len(prompt) // 80 + 20))  # Increased base timeout from 15 to 20 seconds
        
        # Configure compute options based on mode
        options = {
            "temperature": temperature,
            "num_predict": max_tokens,
            "top_p": 0.9,
            "stop": ["</s>", "\n\n---", "\n\nUser:", "\n\nHuman:"]
        }
        
        # Add GPU/CPU specific options
        if compute_mode == 'gpu':
            options.update({
                "num_gpu": -1,  # Use all available GPUs
                "num_thread": 1,  # Fewer CPU threads when using GPU
                "use_mlock": True,  # Lock memory for GPU efficiency
                "f16_kv": True,  # Use half precision for key-value cache (GPU optimization)
            })
        else:  # CPU mode
            options.update({
                "num_gpu": 0,  # Don't use GPU
                "num_thread": -1,  # Use all CPU threads
                "use_mlock": False,  # Don't need memory locking for CPU
                "f16_kv": False,  # Use full precision for CPU
            })
        
        response = session.post(
            f"{base_url}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": options
            },
            timeout=timeout
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        if response.status_code == 200:
            result = response.json()
            # Record successful interaction
            record_ai_success()
            
            # Clean the response to remove explanations and metadata
            raw_response = result.get('response', '').strip()
            cleaned_response = clean_ai_response(raw_response)
            
            return {
                'success': True,
                'response': cleaned_response,
                'processing_time_ms': processing_time,
                'model_used': model,
                'compute_mode_used': compute_mode,
                'timeout_used': timeout
            }
        else:
            # Record failure and activate circuit breaker if needed
            record_ai_failure()
            
            return {
                'success': False,
                'error': f"Ollama API error: {response.status_code} - {response.text[:200]}",
                'processing_time_ms': processing_time
            }
    
    except requests.exceptions.Timeout:
        record_ai_failure()
        return {
            'success': False,
            'error': f'Ollama API timeout after {timeout}s',
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }
    except requests.exceptions.ConnectionError as e:
        record_ai_failure()
        return {
            'success': False,
            'error': f'Cannot connect to Ollama service: {str(e)[:100]}',
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }
    except Exception as e:
        record_ai_failure()
        current_app.logger.error(f"Unexpected AI API error: {str(e)}")
        return {
            'success': False,
            'error': f"Unexpected error: {str(e)[:100]}",
            'processing_time_ms': int((time.time() - start_time) * 1000)
        }

def call_llama_server_api_async(prompt, model=None, temperature=0.7, max_tokens=500):
    """Async wrapper for llama-server API calls using thread pool"""
    
    # Check if we can process async requests
    available, reason = check_ai_circuit_breaker()
    if not available:
        return {
            'success': False,
            'error': f'AI service temporarily unavailable: {reason}',
            'processing_time_ms': 0,
            'circuit_breaker_active': True
        }
    
    try:
        # Get thread pool for async processing
        thread_pool = get_ai_thread_pool()
        
        # Submit AI request to thread pool with timeout
        future = thread_pool.submit(call_llama_server_api, prompt, model, 'cpu', temperature, max_tokens)
        
        # Wait for result with timeout to prevent hanging
        result = future.result(timeout=90)  # Longer timeout for async processing
        
        return result
        
    except concurrent.futures.TimeoutError:
        record_ai_failure()
        current_app.logger.error("AI async processing timed out")
        return {
            'success': False,
            'error': 'AI processing timed out (async)',
            'processing_time_ms': 90000
        }
    except Exception as e:
        record_ai_failure()
        current_app.logger.error(f"AI async processing error: {str(e)}")
        return {
            'success': False,
            'error': f'AI async processing failed: {str(e)[:100]}',
            'processing_time_ms': 0
        }

def clean_ai_response(response_text):
    """Remove explanations and metadata from AI response"""
    if not response_text:
        return response_text
    
    cleaned_text = response_text.strip()
    
    # Remove explanations and metadata that AI might add
    explanation_patterns = [
        # Remove common explanation starters
        r'Here,?\s*I[\'\"]*ve\s+(?:made|changed|improved|enhanced).*?(?=\n\n|\Z)',
        r'I\s*have\s+(?:made|changed|improved|enhanced).*?(?=\n\n|\Z)',
        r'The\s+(?:text|content|language)\s+has\s+been\s+(?:made|changed|improved|enhanced).*?(?=\n\n|\Z)',
        r'This\s+(?:text|content|version)\s+(?:is|has been)\s+(?:made|changed|improved|enhanced).*?(?=\n\n|\Z)',
        
        # Remove explanation sections
        r'Explanation:.*?(?=\n\n|\Z)',
        r'Changes\s+made:.*?(?=\n\n|\Z)', 
        r'Modifications:.*?(?=\n\n|\Z)',
        r'Summary\s+of\s+changes:.*?(?=\n\n|\Z)',
        r'Enhancement\s+(?:details|summary):.*?(?=\n\n|\Z)',
        
        # Remove specific patterns from user's example
        r'(?:Here,?\s*)?I[\'\"]*ve\s+made\s+the\s+text\s+more\s+professional.*?(?=\n\n|\Z)',
        r'(?:Here,?\s*)?I[\'\"]*ve\s+also\s+ensured.*?(?=\n\n|\Z)',
        r'.*?(?:compliance\s+with\s+clinical\s+documentation\s+standards).*?(?=\n\n|\Z)',
        r'.*?(?:without\s+adding\s+new\s+clinical\s+information).*?(?=\n\n|\Z)',
        r'.*?(?:appropriate\s+psychiatric\s+and\s+medical\s+terminology).*?(?=\n\n|\Z)',
        
        # Remove bullet point explanations
        r'- ".*?" is (?:maintained|changed|replaced).*?(?=\n-|\n\n|\Z)',
        r'• ".*?" is (?:maintained|changed|replaced).*?(?=\n•|\n\n|\Z)',
        
        # Remove metadata in parentheses
        r'\(Medical terms used:.*?\)',
        r'\(Enhancement level:.*?\)',
        r'\(Clinical documentation standards followed\)',
        r'\(.*?enhancement.*?\)',
        r'\(.*?clinical.*?standards.*?\)',
        r'\(.*?medical terms.*?\)',
        
        # Remove line-by-line explanations
        r'\n\s*-\s*"[^"]*"\s+(?:is|was)\s+(?:maintained|changed|replaced).*?(?=\n|\Z)',
        
        # Remove any remaining explanation headers
        r'\n\s*(?:Explanation|Changes|Modifications|Summary):\s*\n',
        
        # Remove sentences that start with explanatory phrases
        r'\n\s*(?:Here|I\'ve|This|The text|The content).*?(?:professional|enhanced|improved|clinical).*?\.(?=\s*\n|\s*\Z)',
    ]
    
    for pattern in explanation_patterns:
        cleaned_text = re.sub(pattern, '', cleaned_text, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove any text after common explanation markers
    explanation_markers = [
        'Explanation:', 'Changes made:', 'Modifications:', 'Summary of changes:',
        'Here, I\'ve made', 'I\'ve made the text', 'I\'ve also ensured',
        'Here I\'ve made', 'This text has been', 'The text has been'
    ]
    for marker in explanation_markers:
        marker_pos = cleaned_text.lower().find(marker.lower())
        if marker_pos != -1:
            cleaned_text = cleaned_text[:marker_pos]
    
    # Aggressive cleanup: Remove any sentence that mentions making changes
    sentences = re.split(r'(?<=[.!?])\s+', cleaned_text)
    filtered_sentences = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if sentence:
            # Skip sentences that mention making changes, improvements, etc.
            if not re.search(r'\b(?:made|changed|improved|enhanced|ensured|compliance|professional|terminology)\b.*\b(?:text|professional|clinical|standards|information)\b', sentence.lower()):
                filtered_sentences.append(sentence)
    
    cleaned_text = ' '.join(filtered_sentences)
    
    # Final safeguard to remove any lingering instructions (similar to Google Apps Script)
    cleaned_text = re.sub(r'^(Here is|Here\'s|I\'ve rephrased|The psychiatric|I have rephrased).*?\n', '', cleaned_text, flags=re.IGNORECASE)
    
    # Clean up extra whitespace and newlines
    cleaned_text = re.sub(r'\n\s*\n\s*\n+', '\n\n', cleaned_text)
    cleaned_text = re.sub(r'^\s*\n+', '', cleaned_text)  # Remove leading newlines
    cleaned_text = cleaned_text.strip()
    
    return cleaned_text

def verify_psychiatric_content(original_text, enhanced_text):
    """
    Ultra-lenient verification focused only on absolutely critical safety elements.
    Uses semantic equivalence checks and allows for significant variation.
    Returns (is_valid, missing_elements) tuple.
    """
    missing_elements = []
    
    # ONLY check for critical safety assessments - be extremely permissive on everything else
    critical_safety_patterns = [
        # Suicidal ideation - only flag if completely absent when present in original
        (r'\b(SI|suicidal|self-harm|ideation)\b', r'\b(SI|suicidal|self-harm|ideation|denies.*harm|no.*SI|negative.*SI)\b', 'suicidal ideation'),
        # Homicidal ideation - only flag if completely absent when present in original  
        (r'\b(HI|homicidal|harm.*others)\b', r'\b(HI|homicidal|harm.*others|denies.*harm|no.*HI|negative.*HI)\b', 'homicidal ideation'),
        # Perceptual disturbances - only flag if completely absent when present in original
        (r'\bperceptual disturbances\b', r'\b(perceptual\s*disturbances|hallucinations|delusions|psychotic|no.*halluc|denies.*halluc)\b', 'perceptual disturbances'),
    ]
    
    # For mood states, be EXTREMELY lenient - only flag if original clearly has mood and enhanced has NOTHING
    mood_indicators = [
        r'\b(neutral|depressed|anxious|elevated|manic|stable|euthymic|dysthymic|irritable|calm|agitated|cooperative|pleasant|withdrawn|good|poor|fair)\b',
        r'\b(mood|affect|feeling|emotional|spirit|temperament)\b',
        r'\b(happy|sad|angry|frustrated|hopeful|hopeless|optimistic|pessimistic)\b',
        r'\b(upbeat|downcast|cheerful|gloomy|bright|dull|lively|sluggish)\b',
        r'\b(composed|restless|peaceful|troubled|content|discontent)\b',
    ]
    
    # Check for mood preservation - VERY permissive
    has_mood_original = any(re.search(pattern, original_text, re.IGNORECASE) for pattern in mood_indicators)
    
    if has_mood_original:
        # Check if enhanced text has ANY descriptive content about the patient
        has_patient_description = bool(re.search(
            r'\b(patient|individual|he|she|they|person|client)\b.{10,}', 
            enhanced_text, 
            re.IGNORECASE
        ))
        
        # Only fail if there's literally no patient description at all
        if not has_patient_description:
            missing_elements.append('mood state')
    
    # Check critical safety elements with extreme leniency
    for original_pattern, enhanced_pattern, description in critical_safety_patterns:
        if re.search(original_pattern, original_text, re.IGNORECASE):
            # If original has safety content, enhanced must have SOMETHING related
            if not re.search(enhanced_pattern, enhanced_text, re.IGNORECASE):
                # Extra lenient check - look for ANY negative statement or assessment
                safety_fallback = re.search(r'\b(denies|negative|no|without|absent|unremarkable)\b', enhanced_text, re.IGNORECASE)
                if not safety_fallback:
                    missing_elements.append(description)
    
    # Almost always allow enhancement - only fail on complete content omission
    is_valid = len(missing_elements) == 0
    return is_valid, missing_elements

def process_multiple_ai_requests(requests_data):
    """Process multiple AI requests concurrently with rate limiting"""
    
    # Limit concurrent requests to prevent resource exhaustion
    max_concurrent = min(len(requests_data), _max_workers)
    
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_concurrent) as executor:
        # Submit all requests
        futures = {
            executor.submit(
                call_ollama_api,
                req['prompt'],
                req.get('model'),
                req.get('temperature', 0.7),
                req.get('max_tokens', 500)
            ): i for i, req in enumerate(requests_data)
        }
        
        # Collect results as they complete
        for future in concurrent.futures.as_completed(futures, timeout=120):
            request_index = futures[future]
            try:
                result = future.result()
                results.append((request_index, result))
            except Exception as e:
                current_app.logger.error(f"AI request {request_index} failed: {str(e)}")
                results.append((request_index, {
                    'success': False,
                    'error': f'Request failed: {str(e)[:100]}',
                    'processing_time_ms': 0
                }))
    
    # Sort results by original request order
    results.sort(key=lambda x: x[0])
    return [result for _, result in results]

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

@ai_bp.route('/spell-check', methods=['POST'])
@jwt_required()
def spell_check_only():
    """Dedicated spell check endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        if len(text) > 10000:
            return jsonify({'error': 'Text too long (max 10000 characters)'}), 400
        
        # Perform spell check
        issues = check_spelling_and_grammar(text)
        spelling_issues = [i for i in issues if i['type'] == 'spelling']
        
        # Get current user for audit logging
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Log spell check request
        AuditLog.log_action(
            user_id=str(current_user.id),
            action='READ',
            details={
                'text_length': len(text),
                'issues_found': len(spelling_issues)
            },
        )
        
        return jsonify({
            'spelling_issues': spelling_issues,
            'issues_found': len(spelling_issues),
            'text_analyzed': len(text)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Spell check error: {str(e)}")
        return jsonify({'error': 'An error occurred during spell check'}), 500

@ai_bp.route('/grammar-check', methods=['POST'])
@jwt_required()
def grammar_check_only():
    """Dedicated grammar check endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        if len(text) > 10000:
            return jsonify({'error': 'Text too long (max 10000 characters)'}), 400
        
        # Perform grammar check
        issues = check_spelling_and_grammar(text)
        grammar_issues = [i for i in issues if i['type'] == 'grammar']
        
        # Get current user for audit logging
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Log grammar check request
        AuditLog.log_action(
            user_id=str(current_user.id),
            action='READ',
            details={
                'text_length': len(text),
                'issues_found': len(grammar_issues)
            },
        )
        
        return jsonify({
            'grammar_issues': grammar_issues,
            'issues_found': len(grammar_issues),
            'text_analyzed': len(text)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Grammar check error: {str(e)}")
        return jsonify({'error': 'An error occurred during grammar check'}), 500

@ai_bp.route('/ai-enhancement-status', methods=['GET', 'OPTIONS'])
def ai_enhancement_status():
    """
    Enhanced AI service status with circuit breaker information and longer timeout
    
    Returns comprehensive status including circuit breaker state, Ollama connectivity,
    and available models with better error handling.
    """
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        from flask import Response
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    try:
        import os
        start_time = time.time()
        
        # Get Ollama configuration (preferred over llama-server)
        ollama_url = current_app.config.get('OLLAMA_BASE_URL') or current_app.config.get('LLAMA_SERVER_URL')
        
        # Check circuit breaker status first
        circuit_available, circuit_reason = check_ai_circuit_breaker()
        
        # Initialize startup time and get startup awareness information
        initialize_startup_time()
        startup_phase = is_startup_phase()
        ollama_ready = is_ollama_verified_ready()
        time_since_start = (datetime.now() - _backend_start_time).total_seconds() if _backend_start_time else 0
        
        # Initialize status info with circuit breaker and startup details
        status_info = {
            'ollama_url': ollama_url,
            'last_check': datetime.utcnow().isoformat() + 'Z',
            'check_duration_ms': 0,
            'startup_info': {
                'in_startup_phase': startup_phase,
                'ollama_verified_ready': ollama_ready,
                'time_since_backend_start': time_since_start,
                'startup_grace_period_seconds': _startup_grace_period.total_seconds()
            },
            'circuit_breaker': {
                'active': not circuit_available,
                'failure_count': _ai_failures,
                'max_failures': _max_failures,
                'disabled_until': _ai_disabled_until.isoformat() + 'Z' if _ai_disabled_until else None,
                'reason': circuit_reason
            }
        }
        
        # If circuit breaker is active, return early
        if not circuit_available:
            status_info.update({
                'status': 'circuit_breaker_active',
                'ai_enhancement_available': False,
                'models_available': [],
                'error_message': circuit_reason,
                'connection_test': 'skipped_circuit_breaker'
            })
            status_info['check_duration_ms'] = int((time.time() - start_time) * 1000)
            return jsonify(status_info), 200
        
        # Enhanced Ollama connectivity test with startup awareness and warmup verification
        try:
            # Use the persistent session for better connection handling
            session = get_ai_session()
            
            # Determine timeout based on startup phase
            if startup_phase:
                timeout = 30  # Longer timeout during startup
                current_app.logger.info("Using extended timeout during startup phase")
            else:
                timeout = 10  # Normal timeout
            
            # Step 1: Test basic connectivity (try multiple endpoints since llama-server doesn't have /health)
            connection_success = False
            health_data = {}
            
            # Try Ollama endpoints first, then llama-server endpoints
            ollama_endpoints = ["/api/tags", "/"]
            llama_server_endpoints = ["/v1/models", "/props", "/slots"]
            endpoints_to_try = ollama_endpoints + llama_server_endpoints
            
            for endpoint in endpoints_to_try:
                try:
                    response = session.get(f"{ollama_url}{endpoint}", timeout=timeout)
                    if response.status_code == 200:
                        connection_success = True
                        try:
                            health_data = response.json()
                        except:
                            health_data = {"endpoint": endpoint, "status": "ok"}
                        break
                except Exception:
                    continue
            
            if connection_success:
                # llama-server is responding, check if model is loaded
                
                # Get model path from config
                model_path = current_app.config.get('LLAMA_MODEL_PATH', '')
                model_name = os.path.basename(model_path) if model_path else 'unknown'
                
                # Check if model is actually loaded by testing the generate endpoint
                try:
                    # Test Ollama API endpoint first
                    test_response = session.post(
                        f"{ollama_url}/api/generate",
                        json={
                            "model": "mistral:latest",
                            "prompt": "Test",
                            "stream": False
                        },
                        timeout=min(timeout, 15),  # Shorter timeout for test
                        headers={
                            "Content-Type": "application/json"
                        }
                    )
                    
                    if test_response.status_code == 200:
                        # Ollama is fully ready
                        record_ai_success()
                        
                        status_info.update({
                            'status': 'available',
                            'ai_enhancement_available': True,
                            'models_available': ['mistral:latest'],
                            'model_count': 1,
                            'default_model': 'ollama',
                            'error_message': None,
                            'connection_test': 'passed_ready'
                        })
                    else:
                        # Health check passed but model not ready
                        status_info.update({
                            'status': 'starting',
                            'ai_enhancement_available': False,
                            'models_available': ['mistral:latest'],
                            'model_count': 1,
                            'error_message': 'Ollama starting up - model not ready',
                            'connection_test': 'passed_loading'
                        })
                        
                except requests.exceptions.Timeout:
                    # Health passed but completion timed out
                    status_info.update({
                        'status': 'slow_response',
                        'ai_enhancement_available': False,
                        'models_available': [model_name],
                        'model_count': 1,
                        'error_message': 'Ollama responding slowly - may be loading model',
                        'connection_test': 'timeout_loading'
                    })
                    
                except Exception as e:
                    # Health passed but completion failed
                    status_info.update({
                        'status': 'partial',
                        'ai_enhancement_available': False,
                        'models_available': [model_name],
                        'model_count': 1,
                        'error_message': f'Ollama health ok but completion failed: {str(e)[:100]}',
                        'connection_test': 'failed_completion'
                    })
            else:
                # Connection failed - don't record as failure during startup
                error_message = 'llama-server not responding to any endpoints'
                if not startup_phase:
                    record_ai_failure()
                
                status_info.update({
                    'status': 'error',
                    'ai_enhancement_available': False,
                    'models_available': [],
                    'error_message': error_message,
                    'connection_test': 'failed_connection'
                })
                
        except requests.exceptions.Timeout:
            timeout_message = f'Ollama service timeout ({timeout} seconds)'
            if startup_phase:
                timeout_message += ' - startup in progress'
            else:
                timeout_message += ' - service may be overloaded'
                record_ai_failure()
            
            status_info.update({
                'status': 'timeout',
                'ai_enhancement_available': False,
                'models_available': [],
                'error_message': timeout_message,
                'connection_test': 'failed_timeout'
            })
            
        except requests.exceptions.ConnectionError as e:
            connection_message = f'Cannot connect to Ollama: {str(e)[:100]}'
            if startup_phase:
                connection_message += ' (startup in progress)'
            else:
                record_ai_failure()
            
            status_info.update({
                'status': 'unavailable',
                'ai_enhancement_available': False,
                'models_available': [],
                'error_message': connection_message,
                'connection_test': 'failed_connection'
            })
            
        except Exception as e:
            error_message = f'Unexpected error: {str(e)[:100]}'
            if not startup_phase:
                record_ai_failure()
            
            status_info.update({
                'status': 'error',
                'ai_enhancement_available': False,
                'models_available': [],
                'error_message': error_message,
                'connection_test': 'failed_unexpected'
            })
        
        status_info['check_duration_ms'] = int((time.time() - start_time) * 1000)
        return jsonify(status_info), 200
        
    except Exception as e:
        current_app.logger.error(f"AI enhancement status check failed: {str(e)}")
        return jsonify({
            'status': 'service_error',
            'ai_enhancement_available': False,
            'ollama_url': 'unknown',
            'models_available': [],
            'last_check': datetime.utcnow().isoformat() + 'Z',
            'error_message': f'Status service error: {str(e)[:100]}',
            'connection_test': 'service_error',
            'check_duration_ms': int((time.time() - start_time) * 1000) if 'start_time' in locals() else 0,
            'circuit_breaker': {
                'active': True,
                'reason': 'Status service error'
            }
        }), 500

@ai_bp.route('/reset-circuit-breaker', methods=['POST', 'GET'])
def reset_ai_circuit_breaker():
    """
    Manual circuit breaker reset endpoint for troubleshooting.
    Useful for testing and when you need to force-reset the AI service.
    """
    try:
        global _ai_failures, _ai_disabled_until, _ollama_verified_ready, _ollama_warmup_check_time
        
        # Store previous state for logging
        previous_failures = _ai_failures
        previous_disabled = _ai_disabled_until is not None
        previous_verified = _ollama_verified_ready
        
        # Reset circuit breaker state
        with _circuit_breaker_lock:
            _ai_failures = 0
            _ai_disabled_until = None
        
        # Reset Ollama verification state to force re-verification
        with _startup_lock:
            _ollama_verified_ready = False
            _ollama_warmup_check_time = None
        
        current_app.logger.info(f"Circuit breaker manually reset - was: {previous_failures} failures, disabled: {previous_disabled}, verified: {previous_verified}")
        
        return jsonify({
            'success': True,
            'message': 'Circuit breaker reset successfully',
            'previous_state': {
                'failure_count': previous_failures,
                'was_disabled': previous_disabled,
                'was_verified_ready': previous_verified
            },
            'new_state': {
                'failure_count': 0,
                'disabled': False,
                'verified_ready': False
            },
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Circuit breaker reset failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Reset failed: {str(e)}',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500

@ai_bp.route('/debug-status', methods=['GET'])
def ai_debug_status():
    """
    Debug endpoint that shows detailed internal state for troubleshooting.
    Includes startup timings, circuit breaker state, and verification status.
    """
    try:
        initialize_startup_time()
        now = datetime.now()
        time_since_start = (now - _backend_start_time).total_seconds() if _backend_start_time else 0
        
        # Get detailed state information
        debug_info = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'backend_start_time': _backend_start_time.isoformat() if _backend_start_time else None,
            'time_since_backend_start_seconds': time_since_start,
            'startup_phase': {
                'in_startup_phase': is_startup_phase(),
                'grace_period_seconds': _startup_grace_period.total_seconds(),
                'remaining_grace_seconds': max(0, _startup_grace_period.total_seconds() - time_since_start)
            },
            'ollama_verification': {
                'verified_ready': _ollama_verified_ready,
                'warmup_check_time': _ollama_warmup_check_time.isoformat() if _ollama_warmup_check_time else None,
                'time_to_verify_seconds': (_ollama_warmup_check_time - _backend_start_time).total_seconds() if _ollama_warmup_check_time else None
            },
            'circuit_breaker': {
                'failure_count': _ai_failures,
                'max_failures': _max_failures,
                'disabled_until': _ai_disabled_until.isoformat() if _ai_disabled_until else None,
                'failure_window_minutes': _failure_window.total_seconds() / 60,
                'is_active': _ai_disabled_until is not None and now < _ai_disabled_until
            },
            'configuration': {
                'ollama_url': current_app.config.get('OLLAMA_BASE_URL', 'http://localhost:11434'),
                'default_model': current_app.config.get('OLLAMA_MODEL', 'mistral:latest')
            }
        }
        
        return jsonify(debug_info), 200
        
    except Exception as e:
        current_app.logger.error(f"Debug status failed: {str(e)}")
        return jsonify({
            'error': f'Debug status failed: {str(e)}',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500

@ai_bp.route('/ollama/pull-model', methods=['POST'])
@jwt_required()
def pull_ollama_model():
    """Pull an Ollama model"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        model = data.get('model', '').strip()
        
        if not model:
            return jsonify({'error': 'Model name is required'}), 400
        
        # Get current user for audit logging
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        base_url = current_app.config.get('OLLAMA_BASE_URL', 'http://localhost:11434')
        
        try:
            # Get persistent session with connection pooling
            session = get_ai_session()
            
            # Call Ollama API to pull model
            response = session.post(
                f"{base_url}/api/pull",
                json={"name": model},
                timeout=300  # 5 minutes for model pulling
            )
            
            if response.status_code == 200:
                # Log successful model pull
                AuditLog.log_action(
                    user_id=str(current_user.id),
                    action='CREATE',
                    details={
                        'model': model,
                        'success': True
                    },
                        )
                
                return jsonify({
                    'success': True,
                    'message': f'Model {model} pulled successfully',
                    'model': model
                }), 200
            else:
                error_msg = f"Ollama API error: {response.status_code} - {response.text[:200]}"
                
                # Log failed model pull
                AuditLog.log_action(
                    user_id=str(current_user.id),
                    action='CREATE',
                    details={
                        'model': model,
                        'success': False,
                        'error': error_msg
                    },
                        )
                
                return jsonify({'error': error_msg}), 500
                
        except requests.exceptions.Timeout:
            return jsonify({'error': f'Timeout pulling model {model} (5 minutes)'}), 500
        except requests.exceptions.ConnectionError:
            return jsonify({'error': 'Cannot connect to Ollama service'}), 500
        except Exception as e:
            current_app.logger.error(f"Unexpected error pulling model: {str(e)}")
            return jsonify({'error': f"Unexpected error: {str(e)[:100]}"}), 500
        
    except Exception as e:
        current_app.logger.error(f"Model pull error: {str(e)}")
        return jsonify({'error': 'An error occurred while pulling the model'}), 500

@ai_bp.route('/debug-status', methods=['GET'])
def debug_ai_status():
    """Debug endpoint to help diagnose AI enhancement issues"""
    try:
        debug_info = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'circuit_breaker': {
                'failures': _ai_failures,
                'max_failures': _max_failures,
                'disabled_until': _ai_disabled_until.isoformat() + 'Z' if _ai_disabled_until else None,
                'is_active': _ai_disabled_until and datetime.now() < _ai_disabled_until if _ai_disabled_until else False
            },
            'session_info': {
                'session_exists': _ai_session is not None,
                'last_used': _session_last_used.isoformat() + 'Z' if _session_last_used else None,
                'thread_pool_exists': _ai_thread_pool is not None
            },
            'config': {
                'ollama_url': current_app.config.get('OLLAMA_BASE_URL', 'http://localhost:11434'),
                'ollama_model': current_app.config.get('OLLAMA_MODEL', 'mistral:latest')
            }
        }
        
        # Quick Ollama ping test
        try:
            start_time = time.time()
            session = get_ai_session()
            response = session.get(f"{debug_info['config']['ollama_url']}/api/version", timeout=5)
            ping_time = int((time.time() - start_time) * 1000)
            
            debug_info['ollama_ping'] = {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'response_time_ms': ping_time,
                'error': None
            }
            
            if response.status_code == 200:
                try:
                    version_data = response.json()
                    debug_info['ollama_ping']['version'] = version_data.get('version', 'unknown')
                except:
                    debug_info['ollama_ping']['version'] = 'could_not_parse'
                    
        except Exception as e:
            debug_info['ollama_ping'] = {
                'success': False,
                'error': str(e)[:100],
                'response_time_ms': int((time.time() - start_time) * 1000) if 'start_time' in locals() else 0
            }
        
        return jsonify(debug_info), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Debug status failed: {str(e)}',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500

@ai_bp.route('/reset-circuit-breaker', methods=['POST'])
@jwt_required()
def reset_circuit_breaker():
    """Manual circuit breaker reset for debugging (admin only)"""
    try:
        global _ai_failures, _ai_disabled_until
        
        with _circuit_breaker_lock:
            previous_failures = _ai_failures
            previous_disabled = _ai_disabled_until
            
            _ai_failures = 0
            _ai_disabled_until = None
            
            current_app.logger.info(f"Circuit breaker manually reset by user {get_jwt_identity()}")
            
            return jsonify({
                'success': True,
                'message': 'Circuit breaker reset successfully',
                'previous_state': {
                    'failures': previous_failures,
                    'disabled_until': previous_disabled.isoformat() + 'Z' if previous_disabled else None
                },
                'new_state': {
                    'failures': 0,
                    'disabled_until': None
                }
            }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to reset circuit breaker: {str(e)}'
        }), 500

@ai_bp.route('/ollama/models', methods=['GET'])
@jwt_required()
def get_ollama_models():
    """Get available Ollama models"""
    try:
        base_url = current_app.config.get('OLLAMA_BASE_URL', 'http://localhost:11434')
        
        try:
            # Get persistent session with connection pooling
            session = get_ai_session()
            
            # Call Ollama API to get models
            response = session.get(f"{base_url}/api/tags", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                models = data.get('models', [])
                
                return jsonify({
                    'success': True,
                    'models': models,
                    'count': len(models)
                }), 200
            else:
                return jsonify({
                    'error': f"Ollama API error: {response.status_code} - {response.text[:200]}"
                }), 500
                
        except requests.exceptions.ConnectionError:
            return jsonify({'error': 'Cannot connect to Ollama service'}), 500
        except Exception as e:
            current_app.logger.error(f"Unexpected error getting models: {str(e)}")
            return jsonify({'error': f"Unexpected error: {str(e)[:100]}"}), 500
        
    except Exception as e:
        current_app.logger.error(f"Get models error: {str(e)}")
        return jsonify({'error': 'An error occurred while getting models'}), 500
