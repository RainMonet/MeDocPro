"""
Enhanced AI Enhancement API Blueprint
Adds spell check, grammar check, and improved text enhancement capabilities
"""

from flask import Blueprint, request, jsonify, g, current_app
import requests
import re
import time
from datetime import datetime
import json
from collections import defaultdict

from models import db, AIInteraction, User, AuditLog
from app import require_auth, limiter

ai_bp = Blueprint('ai', __name__)

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
@require_auth
@limiter.limit("30 per hour")
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
        current_user = User.query.get(g.current_user_id)
        
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
            deidentification_applied=phi_found
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
                'spell_check_included': include_spell_check,
                'grammar_check_included': include_grammar_check,
                'success': ai_result.get('success', False)
            },
            phi_accessed=phi_found,
            ip_address=request.remote_addr
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
        'concise': "Be brief and direct while maintaining clarity and clinical accuracy.",
        'detailed': "Provide comprehensive, thorough documentation with specific clinical details.",
        'empathetic': "Use patient-centered, compassionate language while maintaining professionalism.",
        'objective': "Focus on objective, measurable observations and clinical facts.",
        'formal': "Use highly structured, academic medical writing with precise terminology.",
        'interdisciplinary': "Use clear language suitable for all healthcare team members.",
        'progress': "Focus on patient progress, improvements, and treatment responses.",
        'diagnostic': "Emphasize diagnostic criteria and clinical decision-making."
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
    
    prompt = f"""You are a medical documentation assistant specializing in psychiatric clinical notes. Your task is to enhance the following clinical text.

Enhancement Guidelines:
- {type_instructions.get(enhancement_type, type_instructions['clinical'])}
- {style_instructions.get(style, style_instructions['professional'])}
- {intensity_instruction}
- Maintain all clinical facts and patient information exactly as provided
- Use appropriate psychiatric and medical terminology
- Ensure compliance with clinical documentation standards
- Do not add new clinical information not present in the original text
- Preserve the original meaning and intent{spell_grammar_instruction}

Original Text:
{text}

Enhanced Text:"""

    return prompt

def call_ollama_api(prompt, model, temperature=0.7, max_tokens=500):
    """Call Ollama API with error handling and monitoring"""
    base_url = current_app.config.get('OLLAMA_BASE_URL', 'http://localhost:11434')
    model = model or current_app.config.get('OLLAMA_MODEL', 'llama2')
    
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
@require_auth
@limiter.limit("50 per hour")
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
        current_user = User.query.get(g.current_user_id)
        
        # Log spell check request
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='spell_check',
            action='READ',
            details={
                'text_length': len(text),
                'issues_found': len(spelling_issues)
            },
            ip_address=request.remote_addr
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
@require_auth
@limiter.limit("50 per hour")  
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
        current_user = User.query.get(g.current_user_id)
        
        # Log grammar check request
        AuditLog.log_event(
            user_id=str(current_user.id),
            event_type='grammar_check',
            action='READ',
            details={
                'text_length': len(text),
                'issues_found': len(grammar_issues)
            },
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'grammar_issues': grammar_issues,
            'issues_found': len(grammar_issues),
            'text_analyzed': len(text)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Grammar check error: {str(e)}")
        return jsonify({'error': 'An error occurred during grammar check'}), 500