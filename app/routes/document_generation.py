# app/routes/document_generation.py

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import DailyInformation, PatientCensusRow, Template, User, SavedDocument
from ..utils.audit import log_audit_event
from datetime import datetime, date
import json
import requests
import re
import time

# Global AI enhancement failure counter for circuit breaker
ai_enhancement_failures = 0
ai_enhancement_disabled_until = None

document_generation_bp = Blueprint('document_generation', __name__)

# Removed duplicate ai-enhancement-status endpoint
# This is now handled by the ai_enhancement blueprint at /api/ai/ai-enhancement-status
# to avoid conflicts and confusion

@document_generation_bp.route('/test-pdf-download', methods=['POST'])
def test_pdf_download():
    """Test the PDF download functionality with sample data"""
    try:
        # Create sample document data
        sample_docs = [
            {
                'patient_name': 'Test Patient',
                'patient_id': 'test123',
                'room_number': '101',
                'template_name': 'Test Template', 
                'populated_content': 'This is a test document content.\n\nIt has multiple paragraphs to test PDF generation.\n\nThis should appear as a proper PDF if everything is working correctly.',
                'generated_at': '2025-08-25 10:25:00',
                'ai_enhanced': True
            }
        ]
        
        # Test the download logic directly
        import tempfile
        import zipfile
        import os
        from io import BytesIO
        
        with tempfile.TemporaryDirectory() as temp_dir:
            files_created = []
            export_format = 'pdf'  # Force PDF format
            
            # Test PDF generation logic
            try:
                from reportlab.lib.pagesizes import letter, A4
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib.units import inch
                from reportlab.lib.enums import TA_LEFT, TA_CENTER
                
                current_app.logger.info("✅ ReportLab successfully imported in test")
                pdf_available = True
            except ImportError as e:
                current_app.logger.error(f"❌ ReportLab import failed in test: {e}")
                pdf_available = False
            except Exception as e:
                current_app.logger.error(f"❌ Unexpected error importing ReportLab in test: {e}")
                pdf_available = False
            
            for doc in sample_docs:
                if pdf_available:
                    filename = f"test_document.pdf"
                    filepath = os.path.join(temp_dir, filename)
                    
                    # Create PDF document using the same logic as the main function
                    pdf_doc = SimpleDocTemplate(
                        filepath,
                        pagesize=letter,
                        rightMargin=72,
                        leftMargin=72,
                        topMargin=72,
                        bottomMargin=18
                    )
                    
                    # Get styles
                    styles = getSampleStyleSheet()
                    
                    # Custom styles for medical documents
                    title_style = ParagraphStyle(
                        'CustomTitle',
                        parent=styles['Heading1'],
                        fontSize=16,
                        textColor='#2c3e50',
                        alignment=TA_CENTER,
                        spaceAfter=20
                    )
                    
                    # Build PDF content
                    story = []
                    story.append(Paragraph("Test PDF Generation", title_style))
                    story.append(Spacer(1, 20))
                    story.append(Paragraph("This is a test PDF to verify the generation is working.", styles['Normal']))
                    
                    # Build PDF
                    try:
                        pdf_doc.build(story)
                        current_app.logger.info(f"✅ Successfully generated test PDF")
                        
                        # Check file size
                        file_size = os.path.getsize(filepath)
                        current_app.logger.info(f"📊 Test PDF file size: {file_size} bytes")
                        
                        files_created.append((filepath, filename))
                        
                    except Exception as pdf_error:
                        current_app.logger.error(f"❌ PDF generation error in test: {pdf_error}")
                        return jsonify({
                            'success': False,
                            'message': f'PDF generation failed: {pdf_error}',
                            'pdf_available': pdf_available
                        })
                
            if files_created:
                return jsonify({
                    'success': True,
                    'message': f'Successfully created {len(files_created)} PDF files',
                    'files': [f[1] for f in files_created],  # Just filenames
                    'pdf_available': pdf_available
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'No files were created',
                    'pdf_available': pdf_available
                })
                
    except Exception as e:
        current_app.logger.error(f"Test PDF download error: {e}")
        return jsonify({
            'success': False,
            'message': f'Test failed: {e}'
        })

@document_generation_bp.route('/test-pdf-generation', methods=['GET'])
def test_pdf_generation():
    """Test PDF generation capability without authentication"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph
        from reportlab.lib.styles import getSampleStyleSheet
        import tempfile
        import os
        
        # Create a test PDF
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            doc = SimpleDocTemplate(tmp_file.name, pagesize=letter)
            styles = getSampleStyleSheet()
            story = [Paragraph("Test PDF Generation - MeDocPro", styles['Title'])]
            doc.build(story)
            
            # Check if file was created and has content
            if os.path.exists(tmp_file.name) and os.path.getsize(tmp_file.name) > 0:
                os.unlink(tmp_file.name)  # Clean up
                return jsonify({
                    'success': True,
                    'message': 'PDF generation is working correctly',
                    'reportlab_available': True
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'PDF file was not created properly',
                    'reportlab_available': True
                })
                
    except ImportError as e:
        return jsonify({
            'success': False,
            'message': f'ReportLab not available: {e}',
            'reportlab_available': False
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'PDF generation error: {e}',
            'reportlab_available': True
        })

@document_generation_bp.route('/test-ai-enhancement', methods=['POST'])
@jwt_required()
def test_ai_enhancement():
    """Test endpoint to debug AI enhancement issues"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        text = data.get('text', 'Test text for enhancement')
        intensity = data.get('intensity', 50)
        style = data.get('style', 'professional')
        compute_mode = data.get('compute_mode', 'cpu')
        
        current_app.logger.info(f"Testing AI enhancement with text: '{text[:100]}...'")
        
        # Test direct AI enhancement
        enhanced = call_ai_enhancement(text, intensity, style, compute_mode)
        
        return jsonify({
            'success': True,
            'original_text': text,
            'enhanced_text': enhanced,
            'intensity': intensity,
            'style': style,
            'ollama_available': True,
            'message': 'AI enhancement test completed'
        })
        
    except Exception as e:
        current_app.logger.error(f"AI enhancement test error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'ollama_available': False
        }), 500

def apply_ai_enhancement_zones(content, ai_zones, compute_mode='cpu'):
    """Apply AI enhancement to specific zones in the content"""
    if not ai_zones or not isinstance(ai_zones, list):
        current_app.logger.info("No AI enhancement zones provided")
        return content
    
    current_app.logger.info(f"Applying AI enhancement to {len(ai_zones)} zones")
    enhanced_content = content
    
    # Process zones in reverse order by their original positions to maintain text positions
    sorted_zones = sorted(ai_zones, key=lambda z: z.get('start', 0), reverse=True)
    
    for i, zone in enumerate(sorted_zones):
        try:
            intensity = zone.get('intensity', 50)
            style = zone.get('style', 'professional')
            zone_text = zone.get('text', '').strip()
            
            current_app.logger.info(f"Processing zone {i+1}: intensity={intensity}, style={style}")
            current_app.logger.info(f"Looking for text: '{zone_text[:50]}...'")
            
            if not zone_text:
                current_app.logger.warning(f"Zone {i+1} has no text to enhance")
                continue
            
            # Try to find the zone text in the current content
            # Handle both exact matches and populated versions
            zone_start = enhanced_content.find(zone_text)
            
            if zone_start == -1:
                # Try to find a partial match or populated version
                # Look for text patterns that might match after placeholder substitution
                import re
                
                current_app.logger.info(f"Exact match failed, trying pattern matching for zone {i+1}")
                
                # Create a more flexible pattern
                # Replace placeholder patterns with flexible matching
                pattern = re.escape(zone_text)
                # Replace {{placeholder}} with flexible text matching
                pattern = re.sub(r'\\\{\\\{[^}]+\\\}\\\}', r'[^.!?]*?', pattern)
                # Also handle spaces and punctuation more flexibly
                pattern = pattern.replace(r'\ \ ', r'\s+').replace(r'\.', r'[.!?]*')
                
                # Create pattern variations with different flexibility levels
                patterns_to_try = [
                    pattern,  # Original pattern with placeholders as wildcards
                    # More flexible: Replace all {{placeholders}} with broader matching
                    re.sub(r'\\\{\\\{[^}]+\\\}\\\}', r'.{0,200}?', re.escape(zone_text)),
                    # Just match the beginning of the zone
                    re.escape(zone_text.split('.')[0]) + r'.*?(?=[.!?]|$)',
                    # Specific patterns for common templates
                    r'Prior to evaluation.*?(?:acute events|overnight)\.?',
                ]
                
                match_found = False
                for pattern_attempt in patterns_to_try:
                    try:
                        current_app.logger.info(f"Trying pattern: {pattern_attempt[:50]}...")
                        matches = list(re.finditer(pattern_attempt, enhanced_content, re.DOTALL | re.IGNORECASE))
                        
                        if matches:
                            match = matches[0]  # Use first match
                            zone_start = match.start()
                            zone_end = match.end()
                            text_to_enhance = enhanced_content[zone_start:zone_end]
                            current_app.logger.info(f"Found pattern match for zone {i+1} with pattern {pattern_attempt[:30]}...")
                            match_found = True
                            break
                    except re.error as regex_error:
                        current_app.logger.warning(f"Regex error with pattern {pattern_attempt}: {regex_error}")
                        continue
                
                if not match_found:
                    current_app.logger.warning(f"Could not find zone text in content for zone {i+1}")
                    current_app.logger.info(f"Zone text was: '{zone_text[:100]}...'")
                    current_app.logger.info(f"Content sample: '{enhanced_content[:200]}...'")
                    continue
            else:
                zone_end = zone_start + len(zone_text)
                text_to_enhance = enhanced_content[zone_start:zone_end]
                current_app.logger.info(f"Found exact match for zone {i+1}")
            
            # Call AI enhancement API
            current_app.logger.info(f"Enhancing text: '{text_to_enhance[:50]}...'")
            enhanced_text = call_ai_enhancement(text_to_enhance, intensity, style, compute_mode)
            
            if enhanced_text and enhanced_text.strip() != text_to_enhance.strip():
                # Clean up AI enhancement metadata from the enhanced text
                try:
                    from . import ai_enhancement
                    if hasattr(ai_enhancement, 'clean_ai_response'):
                        cleaned_enhanced_text = ai_enhancement.clean_ai_response(enhanced_text)
                    else:
                        cleaned_enhanced_text = enhanced_text.strip()
                    
                    # Verify psychiatric content is preserved
                    if hasattr(ai_enhancement, 'verify_psychiatric_content'):
                        is_valid, missing_elements = ai_enhancement.verify_psychiatric_content(text_to_enhance, cleaned_enhanced_text)
                        if not is_valid:
                            current_app.logger.warning(f"Zone {i+1}: AI enhancement failed verification - missing: {missing_elements}")
                            current_app.logger.info(f"Zone {i+1}: Reverting to original text due to missing psychiatric content")
                            continue  # Skip this enhancement, keep original text
                        else:
                            current_app.logger.info(f"Zone {i+1}: AI enhancement passed psychiatric content verification")
                    
                except ImportError:
                    cleaned_enhanced_text = enhanced_text.strip()
                
                current_app.logger.info(f"Zone {i+1}: AI enhancement successful - text changed")
                
                # Remove explanations and metadata that AI might add
                explanation_patterns = [
                    # Remove explanation sections
                    r'Explanation:.*?(?=\n\n|\Z)',
                    r'Changes made:.*?(?=\n\n|\Z)', 
                    r'Modifications:.*?(?=\n\n|\Z)',
                    r'Summary of changes:.*?(?=\n\n|\Z)',
                    
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
                ]
                
                for pattern in explanation_patterns:
                    cleaned_enhanced_text = re.sub(pattern, '', cleaned_enhanced_text, flags=re.IGNORECASE | re.DOTALL)
                
                # Remove any text after "Explanation:" or similar markers
                explanation_markers = ['Explanation:', 'Changes made:', 'Modifications:', 'Summary of changes:']
                for marker in explanation_markers:
                    marker_pos = cleaned_enhanced_text.find(marker)
                    if marker_pos != -1:
                        cleaned_enhanced_text = cleaned_enhanced_text[:marker_pos]
                
                # Clean up extra whitespace and newlines
                cleaned_enhanced_text = re.sub(r'\n\s*\n\s*\n+', '\n\n', cleaned_enhanced_text)
                cleaned_enhanced_text = re.sub(r'^\s*\n+', '', cleaned_enhanced_text)  # Remove leading newlines
                cleaned_enhanced_text = cleaned_enhanced_text.strip()
                
                # Replace the zone text with cleaned enhanced version
                enhanced_content = (
                    enhanced_content[:zone_start] + 
                    cleaned_enhanced_text + 
                    enhanced_content[zone_end:]
                )
                current_app.logger.info(f"Successfully enhanced zone {i+1}")
            else:
                if not enhanced_text:
                    current_app.logger.warning(f"Zone {i+1}: AI enhancement failed - no text returned")
                elif enhanced_text.strip() == text_to_enhance.strip():
                    current_app.logger.warning(f"Zone {i+1}: AI enhancement returned identical text - no changes made")
                else:
                    current_app.logger.warning(f"Zone {i+1}: AI enhancement returned empty/invalid response")
                        
        except Exception as e:
            current_app.logger.error(f"Error enhancing zone {i+1}: {str(e)}")
            continue
    
    return enhanced_content

def call_ai_enhancement(text, intensity, style, compute_mode='cpu'):
    """Call the AI enhancement API with improved connection handling"""
    global ai_enhancement_failures, ai_enhancement_disabled_until
    
    try:
        # Check circuit breaker - disable AI enhancement if too many recent failures
        if ai_enhancement_disabled_until and datetime.now() < ai_enhancement_disabled_until:
            current_app.logger.warning(f"AI enhancement disabled due to recent failures until {ai_enhancement_disabled_until}")
            return text
            
        # Skip AI enhancement for very long texts to prevent timeouts
        if len(text) > 2000:
            current_app.logger.warning(f"Skipping AI enhancement for text longer than 2000 chars ({len(text)} chars)")
            return text
            
        base_url = current_app.config.get('OLLAMA_BASE_URL', 'http://localhost:11434')
        current_app.logger.info(f"Calling AI enhancement API at {base_url} with {compute_mode.upper()} mode")
        
        # Generate enhancement prompt
        prompt = f"""You are a medical documentation assistant. Enhance the following clinical text while preserving its exact meaning and clinical content.

CRITICAL REQUIREMENTS:
- PRESERVE ALL ORIGINAL MEANING: Do not change clinical facts, diagnoses, or medical content
- MAINTAIN CLINICAL ACCURACY: Keep all medical information exactly as provided
- PRESERVE INTENT: The enhanced text must convey the same message as the original
- RETURN ONLY THE ENHANCED TEXT: Do not include explanations, metadata, or commentary
- NO EXPLANATIONS: Do not explain what changes were made or why

Enhancement Guidelines:
- Style: {style}
- Intensity: {intensity}% (10%=minimal changes, 50%=moderate improvements, 90%=comprehensive enhancement)
- Use appropriate psychiatric and medical terminology
- Ensure compliance with clinical documentation standards
- Do not add new clinical information not present in the original text

Original Text:
{text}

Enhanced Text (ONLY the enhanced text, no explanations):"""

        current_app.logger.info(f"Sending request to Ollama with model: mistral:latest")
        
        # Use improved AI processing from ai_enhancement module
        try:
            from . import ai_enhancement
            if hasattr(ai_enhancement, 'call_ollama_api'):
                # Use the improved AI API call with connection pooling and circuit breaker
                result = ai_enhancement.call_ollama_api(
                    prompt=prompt,
                    model="mistral:latest",
                    compute_mode=compute_mode,
                    temperature=min(0.7, intensity / 100),
                    max_tokens=min(500, len(text) * 2)
                )
                
                if result.get('success'):
                    enhanced_text = result.get('response', '').strip()
                    
                    # Clean the response to remove any explanations or metadata
                    try:
                        from . import ai_enhancement
                        if hasattr(ai_enhancement, 'clean_ai_response'):
                            enhanced_text = ai_enhancement.clean_ai_response(enhanced_text)
                    except ImportError:
                        pass  # Fall back to basic cleaning if module not available
                    
                    current_app.logger.info(f"AI enhancement successful. Original length: {len(text)}, Enhanced length: {len(enhanced_text)}")
                    # Reset failure counter on success
                    ai_enhancement_failures = 0
                    ai_enhancement_disabled_until = None
                    return enhanced_text
                else:
                    error_msg = result.get('error', 'Unknown AI enhancement error')
                    current_app.logger.error(f"AI enhancement failed: {error_msg}")
                    
                    # Check if it's a circuit breaker issue
                    if 'circuit breaker' in error_msg.lower() or 'temporarily unavailable' in error_msg.lower():
                        current_app.logger.warning("AI enhancement temporarily disabled by circuit breaker, returning original text")
                        return text  # Return original text instead of raising exception
                    
                    raise Exception(error_msg)
                    
            else:
                current_app.logger.warning("AI enhancement module not available, falling back to basic session")
                raise ImportError("AI enhancement not available")
                
        except ImportError:
            # Fallback to basic implementation
            current_app.logger.warning("Using fallback AI enhancement implementation")
            
            session = requests.Session()
            try:
                # Adjust timeout based on text length
                timeout = min(30, max(10, len(text) // 50 + 10))
                
                response = session.post(
                    f"{base_url}/api/generate",
                    json={
                        "model": "mistral:latest",
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": min(0.7, intensity / 100),
                            "num_predict": min(500, len(text) * 2),
                            "top_p": 0.9,
                            "stop": ["</s>", "\n\n---", "\n\nUser:", "\n\nHuman:"]
                        }
                    },
                    timeout=timeout
                )
            finally:
                session.close()
            
            if response.status_code == 200:
                result = response.json()
                enhanced_text = result.get('response', '').strip()
                
                # Apply basic cleaning to remove explanations
                explanation_markers = ['Explanation:', 'Changes made:', 'Modifications:', 'Summary of changes:']
                for marker in explanation_markers:
                    marker_pos = enhanced_text.find(marker)
                    if marker_pos != -1:
                        enhanced_text = enhanced_text[:marker_pos].strip()
                
                current_app.logger.info(f"AI enhancement successful (fallback). Original length: {len(text)}, Enhanced length: {len(enhanced_text)}")
                # Reset failure counter on success
                ai_enhancement_failures = 0
                ai_enhancement_disabled_until = None
                return enhanced_text
            else:
                current_app.logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                raise Exception(f"Ollama API returned status {response.status_code}")
            
    except requests.Timeout:
        current_app.logger.error("AI enhancement request timed out")
        return text
    except requests.ConnectionError as e:
        current_app.logger.error(f"Could not connect to Ollama API: {str(e)}")
        return text
    except Exception as e:
        # Increment failure counter and potentially disable AI enhancement temporarily
        ai_enhancement_failures += 1
        current_app.logger.error(f"AI enhancement error #{ai_enhancement_failures}: {str(e)}")
        
        # If too many failures, disable AI enhancement for 10 minutes
        if ai_enhancement_failures >= 3:
            from datetime import timedelta
            ai_enhancement_disabled_until = datetime.now() + timedelta(minutes=10)
            current_app.logger.error(f"AI enhancement disabled for 10 minutes due to {ai_enhancement_failures} consecutive failures")
        
        # Log the full error for debugging but continue with original text
        import traceback
        current_app.logger.error(f"Full AI enhancement error traceback: {traceback.format_exc()}")
        return text  # Return original text if enhancement fails

@document_generation_bp.route('/generate-documents-stream', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def generate_batch_documents_stream():
    """Generate documents for multiple patients with streaming progress updates"""
    from flask import Response
    import json
    
    # Handle preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    try:
        
        # Get authenticated user
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        template_data = data.get('template')
        patients = data.get('patients', [])
        export_format = data.get('exportFormat', 'pdf')
        ai_enhancement = data.get('aiEnhancement', False)
        
        if not template_data:
            return jsonify({'success': False, 'error': 'Template is required'}), 400
        
        if not patients:
            return jsonify({'success': False, 'error': 'At least one patient is required'}), 400
        
        # Get template from database
        template = Template.query.get(template_data['id'])
        if not template:
            return jsonify({'success': False, 'error': 'Template not found'}), 404

        current_app.logger.info(f"Starting streaming generation for {len(patients)} patients with template {template.name}")

        # Get app instance outside the generator  
        app = current_app._get_current_object()
        
        # Store template data to avoid session binding issues
        template_id = template.id
        template_name = template.name
        template_content = template.content
        template_ai_zones = getattr(template, 'aiEnhancementZones', None)

        def generate_stream():
            with app.app_context():
                try:
                    # Send initial progress
                    yield f"data: {json.dumps({'type': 'progress', 'current': 0, 'total': len(patients), 'status': 'Starting document generation...'})}\\n\\n"
                    
                    # Generate documents for each patient
                    documents = []
                    successful_count = 0
                    failed_patients = []
                    
                    for i, patient in enumerate(patients):
                        try:
                            # Send progress update
                            patient_name = patient.get("patient_name", "Unknown")
                            yield f"data: {json.dumps({'type': 'progress', 'current': i, 'total': len(patients), 'status': f'Processing {patient_name}...'})}\\n\\n"
                            
                            # Get patient from database
                            patient_record = PatientCensusRow.query.get(patient['id'])
                            if not patient_record:
                                failed_patients.append({
                                    'patient_id': patient['id'],
                                    'patient_name': patient.get('patient_name', 'Unknown'),
                                    'error': 'Patient not found in database'
                                })
                                continue
                            
                            # Get today's daily information entry for this patient
                            daily_info = DailyInformation.get_latest_for_patient(
                                patient_record.id, 
                                date.today()
                            )
                            
                            if not daily_info:
                                # No daily information entry found - create a basic document with patient info only
                                populated_content = template_content
                                
                                # Replace basic patient information placeholders if they exist
                                patient_name_parts = (patient_record.patient_name or '').split(', ')
                                if len(patient_name_parts) >= 2:
                                    last_name, first_name = patient_name_parts[0], patient_name_parts[1]
                                else:
                                    last_name = patient_record.patient_name or ''
                                    first_name = ''
                                
                                # Basic patient info substitutions
                                basic_substitutions = {
                                    'last_name': last_name,
                                    'first_name': first_name,
                                    'patient_name': patient_record.patient_name or '',
                                    'room_number': patient_record.room_number or '',
                                    'patient_id': str(patient_record.id),
                                    'date_of_service': date.today().strftime('%Y-%m-%d')
                                }
                                
                                for field_name, field_value in basic_substitutions.items():
                                    placeholder = f"{{{{{field_name}}}}}"
                                    if placeholder in populated_content:
                                        populated_content = populated_content.replace(placeholder, str(field_value))
                                
                                # Mark remaining placeholders as empty
                                import re
                                remaining_placeholders = re.findall(r'\{\{([^}]+)\}\}', populated_content)
                                for placeholder_name in remaining_placeholders:
                                    placeholder = f"{{{{{placeholder_name}}}}}"
                                    populated_content = populated_content.replace(placeholder, "[Not completed]")
                                
                                document = {
                                    'patient_id': patient_record.id,
                                    'patient_name': patient_record.patient_name,
                                    'room_number': patient_record.room_number,
                                    'template_name': template_name,
                                    'populated_content': populated_content,
                                    'content': populated_content,
                                    'has_daily_info': False,
                                    'daily_info_id': None,
                                    'entry_date': date.today().isoformat(),
                                    'status': 'generated_without_daily_info',
                                    'format': export_format,
                                    'generated_at': datetime.now().isoformat(),
                                    'ai_enhanced': ai_enhancement
                                }
                            else:
                                # Daily information entry found - use it to populate the template
                                populated_content = daily_info.get_template_populated_content()
                                
                                if not populated_content:
                                    # Template content is empty or template is not associated
                                    failed_patients.append({
                                        'patient_id': patient['id'],
                                        'patient_name': patient.get('patient_name', 'Unknown'),
                                        'error': 'Template content is empty or not associated with daily info'
                                    })
                                    continue
                                
                                document = {
                                    'patient_id': patient_record.id,
                                    'patient_name': patient_record.patient_name,
                                    'room_number': patient_record.room_number,
                                    'template_name': template_name,
                                    'populated_content': populated_content,
                                    'content': populated_content,
                                    'has_daily_info': True,
                                    'daily_info_id': daily_info.id,
                                    'entry_date': daily_info.entry_date.isoformat(),
                                    'status': daily_info.status,
                                    'field_values': daily_info.field_values,
                                    'format': export_format,
                                    'generated_at': datetime.now().isoformat(),
                                    'ai_enhanced': ai_enhancement
                                }
                            
                            # Apply AI enhancement if requested
                            if ai_enhancement:
                                app.logger.info(f"AI enhancement requested for patient {patient_record.patient_name}")
                                
                                if template_ai_zones:
                                    app.logger.info(f"Template has {len(template_ai_zones)} AI enhancement zones")
                                    try:
                                        enhanced_content = apply_ai_enhancement_zones(
                                            document['populated_content'], 
                                            template_ai_zones
                                        )
                                        document['ai_enhanced'] = True
                                        document['populated_content'] = enhanced_content
                                        document['content'] = enhanced_content
                                        app.logger.info(f"AI enhancement completed for patient {patient_record.patient_name}")
                                    except Exception as e:
                                        # AI enhancement failed, but continue with unenhanced document
                                        app.logger.error(f"AI enhancement failed for patient {patient_record.patient_name}: {str(e)}")
                                        document['ai_enhanced'] = False
                                        document['ai_enhancement_error'] = str(e)
                                else:
                                    # AI enhancement requested but no zones defined in template
                                    app.logger.warning(f"AI enhancement requested but template '{template_name}' has no enhancement zones defined")
                                    document['ai_enhanced'] = False
                                    document['ai_enhancement_error'] = 'No AI enhancement zones defined in template'
                            
                            documents.append(document)
                            successful_count += 1
                            
                            # Send document completion update (without full content to avoid JSON parsing issues)
                            doc_summary = {
                                'patient_id': document['patient_id'],
                                'patient_name': document['patient_name'],
                                'template_name': document['template_name'],
                                'has_daily_info': document['has_daily_info'],
                                'ai_enhanced': document['ai_enhanced']
                            }
                            yield f"data: {json.dumps({'type': 'document_complete', 'document_summary': doc_summary, 'current': i + 1}, ensure_ascii=False)}\\n\\n"
                            
                        except Exception as e:
                            failed_patients.append({
                                'patient_id': patient.get('id', 'unknown'),
                                'patient_name': patient.get('patient_name', 'Unknown'),
                                'error': str(e)
                            })
                    
                    # Generate batch ID for tracking
                    batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{current_user_id}"
                    
                    # Send final completion
                    yield f"data: {json.dumps({'type': 'complete', 'success': True, 'message': f'Generated {successful_count} documents successfully', 'documents': documents, 'batch_id': batch_id, 'total_count': len(patients), 'successful_count': successful_count, 'failed_count': len(failed_patients), 'failed_patients': failed_patients}, ensure_ascii=False)}\\n\\n"
                    
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': f'Generator error: {str(e)}'})}\\n\\n"

        # Log audit event for streaming initiation
        log_audit_event(
            user_id=current_user_id,
            action='batch_documents_stream_started',
            resource_type='document_generation',
            resource_id=template_id,
            details={
                'template_id': template_id,
                'template_name': template_name,
                'patient_count': len(patients),
                'export_format': export_format,
                'ai_enhancement': ai_enhancement
            }
        )
        
        return Response(
            generate_stream(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
                'Access-Control-Allow-Credentials': 'true'
            }
        )
        
    except Exception as e:
        current_app.logger.error(f"Error in streaming document generation: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@document_generation_bp.route('/generate-documents-stream-test', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def generate_batch_documents_stream_test():
    """Simple test version to debug streaming issues"""
    from flask import Response
    import json
    
    # Handle preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    try:
        # Get authenticated user
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        patients = data.get('patients', [])
        
        # Get app instance outside the generator
        app = current_app._get_current_object()
        
        def generate_test_stream():
            try:
                # Send initial progress - no app context needed for simple JSON
                yield f"data: {json.dumps({'type': 'progress', 'current': 0, 'total': len(patients), 'status': 'Starting simple test...'})}\\n\\n"
                
                # Test debug message
                yield f"data: {json.dumps({'type': 'debug', 'message': f'Simple test generator with {len(patients)} patients (no app context)'})}\\n\\n"
                
                # Simple completion
                yield f"data: {json.dumps({'type': 'complete', 'success': True, 'message': 'Simple test completed!', 'documents': [], 'batch_id': 'test_123', 'total_count': len(patients), 'successful_count': 0, 'failed_count': 0, 'failed_patients': []})}\\n\\n"
                
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Simple test error: {str(e)}'})}\\n\\n"
        
        return Response(
            generate_test_stream(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
                'Access-Control-Allow-Credentials': 'true'
            }
        )
        
    except Exception as e:
        current_app.logger.error(f"Error in test streaming: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Ultra simple test endpoint without authentication
@document_generation_bp.route('/stream-test', methods=['GET'])  
def ultra_simple_stream_test():
    """Ultra simple streaming test without authentication"""
    from flask import Response
    import json
    
    def simple_stream():
        import time
        yield f"data: {json.dumps({'type': 'debug', 'message': 'Ultra simple stream test'})}\\n\\n"
        time.sleep(0.1)  # Small delay to ensure data is sent
        yield f"data: {json.dumps({'type': 'complete', 'success': True, 'message': 'Ultra simple test completed!', 'documents': [], 'batch_id': 'test_123', 'total_count': 0, 'successful_count': 0, 'failed_count': 0, 'failed_patients': []})}\\n\\n"
        time.sleep(0.1)  # Ensure completion data is sent before closing
    
    return Response(
        simple_stream(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        }
    )

@document_generation_bp.route('/generate-documents', methods=['POST'])
@jwt_required()
def generate_batch_documents():
    """Generate documents for multiple patients using template populated with daily information data"""
    try:
        # Get authenticated user
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        template_data = data.get('template')
        patients = data.get('patients', [])
        export_format = data.get('exportFormat', 'pdf')
        ai_enhancement = data.get('aiEnhancement', False)
        compute_mode = data.get('computeMode', 'cpu')
        
        if not template_data:
            return jsonify({'success': False, 'error': 'Template is required'}), 400
        
        if not patients:
            return jsonify({'success': False, 'error': 'At least one patient is required'}), 400
        
        # Limit batch size to prevent backend overload
        if len(patients) > 10:
            return jsonify({
                'success': False, 
                'error': f'Batch size too large ({len(patients)} patients). Please select 10 or fewer patients at a time.'
            }), 400
        
        # Check if AI enhancement should be disabled due to recent failures
        original_ai_request = ai_enhancement
        
        if ai_enhancement and ai_enhancement_disabled_until and datetime.now() < ai_enhancement_disabled_until:
            current_app.logger.warning(f"AI enhancement disabled due to recent failures until {ai_enhancement_disabled_until}")
            ai_enhancement = False
        elif ai_enhancement:
            current_app.logger.info(f"AI enhancement requested and available for {len(patients)} patients")
        
        # Get template from database
        template = Template.query.get(template_data['id'])
        if not template:
            return jsonify({'success': False, 'error': 'Template not found'}), 404
        
        current_app.logger.info(f"Starting document generation for {len(patients)} patients with template {template.name}")
        
        # Generate documents for each patient
        documents = []
        successful_count = 0
        failed_patients = []
        
        for patient in patients:
            try:
                # Get patient from database
                patient_record = PatientCensusRow.query.get(patient['id'])
                if not patient_record:
                    failed_patients.append({
                        'patient_id': patient['id'],
                        'patient_name': patient.get('patient_name', 'Unknown'),
                        'error': 'Patient not found in database'
                    })
                    continue
                
                # Get today's daily information entry for this patient
                daily_info = DailyInformation.get_latest_for_patient(
                    patient_record.id, 
                    date.today()
                )
                
                if not daily_info:
                    # No daily information entry found - create a basic document with patient info only
                    populated_content = template.content
                    
                    # Replace basic patient information placeholders if they exist
                    patient_name_parts = (patient_record.patient_name or '').split(', ')
                    if len(patient_name_parts) >= 2:
                        last_name, first_name = patient_name_parts[0], patient_name_parts[1]
                    else:
                        last_name = patient_record.patient_name or ''
                        first_name = ''
                    
                    # Basic patient info substitutions
                    basic_substitutions = {
                        'last_name': last_name,
                        'first_name': first_name,
                        'patient_name': patient_record.patient_name or '',
                        'room_number': patient_record.room_number or '',
                        'patient_id': str(patient_record.id),
                        'date_of_service': date.today().strftime('%Y-%m-%d')
                    }
                    
                    for field_name, field_value in basic_substitutions.items():
                        placeholder = f"{{{{{field_name}}}}}"
                        if placeholder in populated_content:
                            populated_content = populated_content.replace(placeholder, str(field_value))
                    
                    # Mark remaining placeholders as empty
                    import re
                    remaining_placeholders = re.findall(r'\{\{([^}]+)\}\}', populated_content)
                    for placeholder_name in remaining_placeholders:
                        placeholder = f"{{{{{placeholder_name}}}}}"
                        populated_content = populated_content.replace(placeholder, "[Not completed]")
                    
                    document = {
                        'patient_id': patient_record.id,
                        'patient_name': patient_record.patient_name,
                        'room_number': patient_record.room_number,
                        'template_name': template.name,
                        'populated_content': populated_content,
                        'content': populated_content,  # For PreviewDocumentModal compatibility
                        'has_daily_info': False,
                        'daily_info_id': None,
                        'entry_date': date.today().isoformat(),
                        'status': 'generated_without_daily_info',
                        'format': export_format,
                        'generated_at': datetime.now().isoformat(),
                        'ai_enhanced': ai_enhancement
                    }
                else:
                    # Daily information entry found - use it to populate the template
                    populated_content = daily_info.get_template_populated_content()
                    
                    if not populated_content:
                        # Template content is empty or template is not associated
                        failed_patients.append({
                            'patient_id': patient['id'],
                            'patient_name': patient.get('patient_name', 'Unknown'),
                            'error': 'Template content is empty or not associated with daily info'
                        })
                        continue
                    
                    document = {
                        'patient_id': patient_record.id,
                        'patient_name': patient_record.patient_name,
                        'room_number': patient_record.room_number,
                        'template_name': template.name,
                        'populated_content': populated_content,
                        'content': populated_content,  # For PreviewDocumentModal compatibility
                        'has_daily_info': True,
                        'daily_info_id': daily_info.id,
                        'entry_date': daily_info.entry_date.isoformat(),
                        'status': daily_info.status,
                        'field_values': daily_info.field_values,
                        'format': export_format,
                        'generated_at': datetime.now().isoformat(),
                        'ai_enhanced': ai_enhancement
                    }
                
                # Apply AI enhancement if requested
                if ai_enhancement:
                    current_app.logger.info(f"AI enhancement requested for patient {patient_record.patient_name}")
                    
                    if hasattr(template, 'aiEnhancementZones') and template.aiEnhancementZones:
                        current_app.logger.info(f"Template has {len(template.aiEnhancementZones)} AI enhancement zones")
                        try:
                            enhanced_content = apply_ai_enhancement_zones(
                                document['populated_content'], 
                                template.aiEnhancementZones,
                                compute_mode
                            )
                            document['ai_enhanced'] = True
                            document['populated_content'] = enhanced_content
                            document['content'] = enhanced_content
                            current_app.logger.info(f"AI enhancement completed for patient {patient_record.patient_name}")
                        except Exception as e:
                            # AI enhancement failed, but continue with unenhanced document
                            current_app.logger.error(f"AI enhancement failed for patient {patient_record.patient_name}: {str(e)}")
                            document['ai_enhanced'] = False
                            document['ai_enhancement_error'] = str(e)
                    else:
                        # AI enhancement requested but no zones defined in template
                        current_app.logger.warning(f"AI enhancement requested but template '{template.name}' has no enhancement zones defined")
                        document['ai_enhanced'] = False
                        document['ai_enhancement_error'] = 'No AI enhancement zones defined in template'
                
                documents.append(document)
                successful_count += 1
                
            except Exception as e:
                failed_patients.append({
                    'patient_id': patient.get('id', 'unknown'),
                    'patient_name': patient.get('patient_name', 'Unknown'),
                    'error': str(e)
                })
        
        # Generate batch ID for tracking
        batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{current_user_id}"
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='batch_documents_generated',
            resource_type='document_generation',
            resource_id=template.id,
            details={
                'template_id': template.id,
                'template_name': template.name,
                'patient_count': len(patients),
                'successful_count': successful_count,
                'failed_count': len(failed_patients),
                'export_format': export_format,
                'ai_enhancement': ai_enhancement,
                'batch_id': batch_id
            }
        )
        
        # Check if AI enhancement was originally requested
        original_ai_request = data.get('aiEnhancement', False)
        
        return jsonify({
            'success': True,
            'message': f'Generated {successful_count} documents successfully',
            'documents': documents,
            'batch_id': batch_id,
            'total_count': len(patients),
            'successful_count': successful_count,
            'failed_count': len(failed_patients),
            'failed_patients': failed_patients,
            'template': {
                'id': template.id,
                'name': template.name,
                'category': template.category
            },
            'export_format': export_format,
            'ai_enhancement': ai_enhancement,
            'ai_enhancement_disabled': original_ai_request and not ai_enhancement,
            'ai_enhancement_used': ai_enhancement and any(doc.get('ai_enhanced', False) for doc in documents)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to generate documents: {str(e)}'
        }), 500

@document_generation_bp.route('/generate-documents/<batch_id>/google-docs', methods=['POST'])
@jwt_required()
def export_to_google_docs(batch_id):
    """Export generated documents to Google Docs"""
    try:
        # Get user ID for security
        current_user_id = get_jwt_identity()
        
        # Get data from request body
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        documents = data.get('documents')
        google_folder_name = data.get('folderName', f'MeDocPro Export - {datetime.now().strftime("%Y-%m-%d %H:%M")}')
        
        current_app.logger.info(f"🔍 Google Docs Export Request - Documents: {len(documents) if documents else 0}")
        
        if not documents:
            return jsonify({
                'success': False,
                'error': 'Documents data is required'
            }), 400
        
        # Check if Google Drive credentials are available
        credentials_path = current_app.config.get('GOOGLE_CREDENTIALS_PATH')
        if not credentials_path:
            return jsonify({
                'success': False,
                'error': 'Google Drive integration not configured. Please contact your administrator.'
            }), 400
        
        try:
            # Use the Google Drive helper class
            from ..utils.google_drive import get_google_drive_instance
            
            google_drive = get_google_drive_instance()
            
            # Check if Google Drive is configured
            if not google_drive.is_configured():
                return jsonify({
                    'success': False,
                    'error': 'Google Drive integration not configured. Please contact your administrator.'
                }), 400
            
            # Authenticate with Google Drive
            auth_success, auth_error = google_drive.authenticate()
            if not auth_success:
                return jsonify({
                    'success': False,
                    'error': auth_error or 'Google Drive authentication failed'
                }), 401
            
            current_app.logger.info(f"📁 Creating Google Drive folder: {google_folder_name}")
            
            # Create a folder for this export
            folder_success, folder_info, folder_error = google_drive.create_folder(google_folder_name)
            if not folder_success:
                return jsonify({
                    'success': False,
                    'error': folder_error or 'Failed to create Google Drive folder'
                }), 500
            
            folder_id = folder_info.get('id')
            folder_link = folder_info.get('webViewLink')
            current_app.logger.info(f"✅ Created folder: {folder_id}")
            
            # Upload each document as a Google Doc
            uploaded_docs = []
            successful_count = 0
            failed_docs = []
            
            for i, doc in enumerate(documents):
                try:
                    patient_name = doc.get('patient_name', 'Unknown Patient')
                    template_name = doc.get('template_name', 'Document')
                    
                    current_app.logger.info(f"📝 Processing document {i+1}/{len(documents)}: {patient_name}")
                    
                    # Create document title
                    doc_title = f"{template_name} - {patient_name}"
                    if doc.get('room_number'):
                        doc_title += f" (Room {doc.get('room_number')})"
                    
                    # Prepare document content with header information
                    content_lines = [
                        doc_title,
                        "=" * len(doc_title),
                        "",
                        f"Patient: {patient_name}",
                        f"Room: {doc.get('room_number', 'N/A')}",
                        f"Generated: {doc.get('generated_at', 'Unknown')}",
                        f"Template: {template_name}"
                    ]
                    
                    if doc.get('ai_enhanced'):
                        content_lines.append("AI Enhanced: Yes")
                    
                    content_lines.extend([
                        "",
                        "-" * 60,
                        "",
                        doc.get('populated_content', doc.get('content', 'No content available'))
                    ])
                    
                    full_content = '\n'.join(content_lines)
                    
                    current_app.logger.info(f"⬆️ Uploading to Google Docs: {doc_title}")
                    
                    # Upload document
                    upload_success, file_result, upload_error = google_drive.upload_document(
                        content=full_content,
                        title=doc_title,
                        folder_id=folder_id
                    )
                    
                    if upload_success:
                        uploaded_docs.append({
                            'patient_name': patient_name,
                            'document_title': doc_title,
                            'google_doc_id': file_result.get('id'),
                            'google_doc_link': file_result.get('webViewLink'),
                            'folder_id': folder_id
                        })
                        successful_count += 1
                        current_app.logger.info(f"✅ Successfully uploaded: {doc_title}")
                    else:
                        raise Exception(upload_error)
                    
                except Exception as doc_error:
                    error_msg = str(doc_error)
                    current_app.logger.error(f"❌ Failed to upload document for {doc.get('patient_name', 'Unknown')}: {error_msg}")
                    failed_docs.append({
                        'patient_name': doc.get('patient_name', 'Unknown'),
                        'error': error_msg
                    })
            
            # Log audit event
            log_audit_event(
                user_id=current_user_id,
                action='google_docs_export',
                resource_type='document_export',
                resource_id=batch_id,
                details={
                    'batch_id': batch_id,
                    'total_documents': len(documents),
                    'successful_count': successful_count,
                    'failed_count': len(failed_docs),
                    'folder_name': google_folder_name,
                    'folder_id': folder_id
                }
            )
            
            current_app.logger.info(f"🎉 Google Docs export completed: {successful_count}/{len(documents)} successful")
            
            return jsonify({
                'success': True,
                'message': f'Successfully exported {successful_count} documents to Google Docs',
                'results': {
                    'folder_name': google_folder_name,
                    'folder_id': folder_id,
                    'folder_link': folder_link,
                    'total_documents': len(documents),
                    'successful_count': successful_count,
                    'failed_count': len(failed_docs),
                    'uploaded_documents': uploaded_docs,
                    'failed_documents': failed_docs
                }
            }), 200
            
        except ImportError as import_error:
            current_app.logger.error(f"Google API libraries not available: {import_error}")
            return jsonify({
                'success': False,
                'error': 'Google Drive integration not available. Please install required dependencies.'
            }), 500
            
        except Exception as google_error:
            current_app.logger.error(f"Google Drive API error: {google_error}")
            return jsonify({
                'success': False,
                'error': f'Google Drive error: {str(google_error)}'
            }), 500
        
    except Exception as e:
        current_app.logger.error(f"Error in Google Docs export for batch {batch_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to export to Google Docs: {str(e)}'
        }), 500

@document_generation_bp.route('/generate-documents/<batch_id>/download', methods=['GET', 'POST'])
@jwt_required()
def download_batch_documents(batch_id):
    """Download generated documents as a zip file"""
    from flask import send_file
    import os
    import tempfile
    import zipfile
    from io import BytesIO
    import json
    
    try:
        # Get user ID for security
        current_user_id = get_jwt_identity()
        
        # Handle both GET (legacy with URL params) and POST (with request body) methods
        if request.method == 'POST':
            # POST request - get data from request body
            data = request.get_json()
            if not data:
                return jsonify({
                    'success': False,
                    'error': 'Request body is required for POST requests'
                }), 400
            
            export_format = data.get('format', 'individual')
            documents = data.get('documents')
            
            current_app.logger.info(f"🔍 POST Request - Export format requested: '{export_format}', Documents: {len(documents) if documents else 0}")
            
            if not documents:
                return jsonify({
                    'success': False,
                    'error': 'Documents data is required'
                }), 400
        else:
            # GET request - get data from query parameters (legacy support)
            export_format = request.args.get('format', 'individual')
            documents_json = request.args.get('documents')
            
            current_app.logger.info(f"🔍 GET Request - Export format requested: '{export_format}'")
            
            if not documents_json:
                return jsonify({
                    'success': False,
                    'error': 'Document data is required for download'
                }), 400
            
            try:
                documents = json.loads(documents_json)
                current_app.logger.info(f"🔍 GET Request - Parsed {len(documents)} documents")
            except json.JSONDecodeError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid document data format'
                }), 400
        
        if not documents:
            return jsonify({
                'success': False,
                'error': 'No documents to download'
            }), 400
        
        current_app.logger.info(f"🚀 Starting download for batch {batch_id} with {len(documents)} documents in '{export_format}' format")
        
        # Create a temporary directory for files
        with tempfile.TemporaryDirectory() as temp_dir:
            files_created = []
            
            if export_format == 'combined':
                # Create one combined file with all documents
                combined_filename = f"batch_documents_{batch_id}.txt"
                combined_path = os.path.join(temp_dir, combined_filename)
                
                with open(combined_path, 'w', encoding='utf-8') as combined_file:
                    combined_file.write(f"Batch Document Export - {batch_id}\n")
                    combined_file.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                    combined_file.write(f"Total Documents: {len(documents)}\n")
                    combined_file.write("=" * 80 + "\n\n")
                    
                    for i, doc in enumerate(documents, 1):
                        combined_file.write(f"Document {i}: {doc.get('template_name', 'Unknown Template')} - {doc.get('patient_name', 'Unknown Patient')}\n")
                        combined_file.write(f"Room: {doc.get('room_number', 'N/A')}\n")
                        combined_file.write(f"Generated: {doc.get('generated_at', 'Unknown')}\n")
                        if doc.get('ai_enhanced'):
                            combined_file.write("AI Enhanced: Yes\n")
                        combined_file.write("-" * 60 + "\n")
                        combined_file.write(doc.get('populated_content', doc.get('content', 'No content available')))
                        combined_file.write("\n\n" + "=" * 80 + "\n\n")
                
                files_created.append((combined_path, combined_filename))
                
            elif export_format == 'pdf':
                # Generate actual PDF files using reportlab
                try:
                    from reportlab.lib.pagesizes import letter, A4
                    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
                    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                    from reportlab.lib.units import inch
                    from reportlab.lib.enums import TA_LEFT, TA_CENTER
                    
                    current_app.logger.info("✅ ReportLab successfully imported - generating PDF documents")
                    pdf_available = True
                except ImportError as e:
                    current_app.logger.error(f"❌ ReportLab import failed for PDF generation: {e}")
                    current_app.logger.info("Falling back to text file generation for PDF export")
                    pdf_available = False
                except Exception as e:
                    current_app.logger.error(f"❌ Unexpected error importing ReportLab: {e}")
                    pdf_available = False
                
                current_app.logger.info(f"🔄 Processing {len(documents)} documents with pdf_available={pdf_available}")
                
                for doc in documents:
                    safe_patient_name = "".join(c for c in doc.get('patient_name', 'Unknown') if c.isalnum() or c in (' ', '-', '_')).strip()
                    safe_template_name = "".join(c for c in doc.get('template_name', 'Document') if c.isalnum() or c in (' ', '-', '_')).strip()
                    
                    current_app.logger.info(f"📄 Processing document for patient: {doc.get('patient_name', 'Unknown')}")
                    
                    if pdf_available:
                        filename = f"{safe_template_name}_{safe_patient_name}_{doc.get('patient_id', 'unknown')}.pdf"
                        filepath = os.path.join(temp_dir, filename)
                        current_app.logger.info(f"📋 Creating PDF file: {filename}")
                    else:
                        # Fallback to text files
                        filename = f"{safe_template_name}_{safe_patient_name}_{doc.get('patient_id', 'unknown')}.txt"
                        filepath = os.path.join(temp_dir, filename)
                        current_app.logger.info(f"📄 Creating TEXT file (fallback): {filename}")
                    
                    if pdf_available:
                        # Create PDF document
                        pdf_doc = SimpleDocTemplate(
                            filepath,
                            pagesize=letter,
                            rightMargin=72,
                            leftMargin=72,
                            topMargin=72,
                            bottomMargin=18
                        )
                        
                        # Get styles
                        styles = getSampleStyleSheet()
                        
                        # Custom styles for medical documents
                        title_style = ParagraphStyle(
                            'CustomTitle',
                            parent=styles['Heading1'],
                            fontSize=16,
                            textColor='#2c3e50',
                            alignment=TA_CENTER,
                            spaceAfter=20
                        )
                        
                        header_style = ParagraphStyle(
                            'CustomHeader',
                            parent=styles['Heading2'],
                            fontSize=12,
                            textColor='#34495e',
                            spaceBefore=10,
                            spaceAfter=6
                        )
                        
                        body_style = ParagraphStyle(
                            'CustomBody',
                            parent=styles['Normal'],
                            fontSize=11,
                            leading=14,
                            textColor='#2c3e50',
                            alignment=TA_LEFT,
                            leftIndent=0,
                            rightIndent=0
                        )
                        
                        # Build PDF content
                        story = []
                        
                        # Title
                        story.append(Paragraph(doc.get('template_name', 'Clinical Document'), title_style))
                        story.append(Spacer(1, 20))
                        
                        # Patient information header
                        patient_info = f"""
                        <b>Patient:</b> {doc.get('patient_name', 'Unknown Patient')}<br/>
                        <b>Room:</b> {doc.get('room_number', 'N/A')}<br/>
                        <b>Date Generated:</b> {doc.get('generated_at', 'Unknown')}<br/>
                        """
                        if doc.get('ai_enhanced'):
                            patient_info += "<b>AI Enhanced:</b> Yes<br/>"
                        
                        story.append(Paragraph(patient_info, header_style))
                        story.append(Spacer(1, 20))
                        
                        # Document content
                        content = doc.get('populated_content', doc.get('content', 'No content available'))
                        
                        # Handle line breaks and formatting in content
                        content_paragraphs = content.split('\n\n')
                        for para in content_paragraphs:
                            if para.strip():
                                # Handle single line breaks within paragraphs
                                formatted_para = para.replace('\n', '<br/>')
                                story.append(Paragraph(formatted_para, body_style))
                                story.append(Spacer(1, 12))
                        
                        # Build PDF
                        try:
                            pdf_doc.build(story)
                            current_app.logger.info(f"Successfully generated PDF for {doc.get('patient_name', 'Unknown')}")
                        except Exception as pdf_error:
                            current_app.logger.error(f"PDF generation error for {doc.get('patient_name', 'Unknown')}: {pdf_error}")
                            # If PDF generation fails, create a text file instead
                            filename = f"{safe_template_name}_{safe_patient_name}_{doc.get('patient_id', 'unknown')}.txt"
                            filepath = os.path.join(temp_dir, filename)
                            with open(filepath, 'w', encoding='utf-8') as doc_file:
                                doc_file.write(f"Template: {doc.get('template_name', 'Unknown Template')}\n")
                                doc_file.write(f"Patient: {doc.get('patient_name', 'Unknown Patient')}\n")
                                doc_file.write(f"Room: {doc.get('room_number', 'N/A')}\n")
                                doc_file.write(f"Generated: {doc.get('generated_at', 'Unknown')}\n")
                                if doc.get('ai_enhanced'):
                                    doc_file.write("AI Enhanced: Yes\n")
                                doc_file.write("=" * 60 + "\n\n")
                                doc_file.write(doc.get('populated_content', doc.get('content', 'No content available')))
                    else:
                        # Fallback to text file generation
                        with open(filepath, 'w', encoding='utf-8') as doc_file:
                            doc_file.write(f"Template: {doc.get('template_name', 'Unknown Template')}\n")
                            doc_file.write(f"Patient: {doc.get('patient_name', 'Unknown Patient')}\n")
                            doc_file.write(f"Room: {doc.get('room_number', 'N/A')}\n")
                            doc_file.write(f"Generated: {doc.get('generated_at', 'Unknown')}\n")
                            if doc.get('ai_enhanced'):
                                doc_file.write("AI Enhanced: Yes\n")
                            doc_file.write("=" * 60 + "\n\n")
                            doc_file.write(doc.get('populated_content', doc.get('content', 'No content available')))
                    
                    files_created.append((filepath, filename))
                    
            else:  # individual format (default)
                # Create individual files for each document
                for doc in documents:
                    safe_patient_name = "".join(c for c in doc.get('patient_name', 'Unknown') if c.isalnum() or c in (' ', '-', '_')).strip()
                    safe_template_name = "".join(c for c in doc.get('template_name', 'Document') if c.isalnum() or c in (' ', '-', '_')).strip()
                    
                    filename = f"{safe_template_name}_{safe_patient_name}_{doc.get('patient_id', 'unknown')}.txt"
                    filepath = os.path.join(temp_dir, filename)
                    
                    with open(filepath, 'w', encoding='utf-8') as doc_file:
                        doc_file.write(f"Template: {doc.get('template_name', 'Unknown Template')}\n")
                        doc_file.write(f"Patient: {doc.get('patient_name', 'Unknown Patient')}\n")
                        doc_file.write(f"Room: {doc.get('room_number', 'N/A')}\n")
                        doc_file.write(f"Generated: {doc.get('generated_at', 'Unknown')}\n")
                        if doc.get('ai_enhanced'):
                            doc_file.write("AI Enhanced: Yes\n")
                        doc_file.write("=" * 60 + "\n\n")
                        doc_file.write(doc.get('populated_content', doc.get('content', 'No content available')))
                    
                    files_created.append((filepath, filename))
            
            # Create ZIP file
            zip_buffer = BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for filepath, filename in files_created:
                    zip_file.write(filepath, filename)
            
            zip_buffer.seek(0)
            
            # Generate download filename
            download_filename = f"batch_documents_{batch_id}_{export_format}.zip"
            
            # Log audit event
            log_audit_event(
                user_id=current_user_id,
                action='batch_documents_downloaded',
                resource_type='document_download',
                resource_id=batch_id,
                details={
                    'batch_id': batch_id,
                    'document_count': len(documents),
                    'export_format': export_format,
                    'filename': download_filename
                }
            )
            
            current_app.logger.info(f"Download prepared for batch {batch_id}: {len(files_created)} files in ZIP")
            
            return send_file(
                zip_buffer,
                mimetype='application/zip',
                as_attachment=True,
                download_name=download_filename
            )
        
    except Exception as e:
        current_app.logger.error(f"Error generating download for batch {batch_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to generate download: {str(e)}'
        }), 500

# Document Finalization and Saved Documents Management

@document_generation_bp.route('/finalize-document', methods=['POST'])
@jwt_required()
def finalize_document():
    """
    Finalize a generated document and save it to the permanent records.
    Only finalized documents are kept for the 7-day retention period.
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['patient_census_row_id', 'document_title', 'document_content', 'document_type']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Get patient census row to validate and extract patient information
        patient_row = PatientCensusRow.query.get(data['patient_census_row_id'])
        if not patient_row:
            return jsonify({
                'success': False,
                'error': 'Patient census row not found'
            }), 404
        
        # Get template information if provided
        template = None
        template_name = None
        if data.get('template_id'):
            template = Template.query.get(data['template_id'])
            template_name = template.name if template else None
        
        # Create saved document
        saved_doc = SavedDocument(
            patient_census_row_id=data['patient_census_row_id'],
            template_id=data.get('template_id'),
            user_id=current_user_id,
            patient_name=patient_row.patient_name,
            patient_id=patient_row.patient_id,
            room_number=patient_row.room_number,
            document_title=data['document_title'],
            document_content=data['document_content'],
            document_type=data['document_type'],
            document_format=data.get('document_format', 'text'),
            template_name=template_name,
            document_date=datetime.strptime(data.get('document_date', str(date.today())), '%Y-%m-%d').date(),
        )
        
        # Set metadata separately using the property
        saved_doc.document_metadata = data.get('metadata', {})
        
        # Generate checksum for integrity
        import hashlib
        saved_doc.checksum = hashlib.sha256(saved_doc.document_content.encode()).hexdigest()
        
        db.session.add(saved_doc)
        db.session.commit()
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='document_finalized',
            resource_type='saved_document',
            resource_id=str(saved_doc.id),
            details={
                'patient_name': patient_row.patient_name,
                'document_type': data['document_type'],
                'document_title': data['document_title']
            }
        )
        
        current_app.logger.info(f"Document finalized: {saved_doc.id} for patient {patient_row.patient_name}")
        
        return jsonify({
            'success': True,
            'message': 'Document finalized successfully',
            'document': saved_doc.to_dict(),
            'expires_in_days': saved_doc.days_remaining
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error finalizing document: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to finalize document: {str(e)}'
        }), 500

@document_generation_bp.route('/recent-documents', methods=['GET'])
@jwt_required()
def get_recent_documents():
    """
    Get recent finalized documents with filtering and sorting options.
    Only returns documents within the 7-day retention period.
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        sort_by = request.args.get('sort_by', 'finalized_at')  # finalized_at, patient_name, document_type, document_date
        sort_order = request.args.get('sort_order', 'desc')  # asc, desc
        document_type = request.args.get('document_type')  # follow-up, admission, discharge
        search_query = request.args.get('search')
        
        # Validate sort parameters
        valid_sort_fields = ['finalized_at', 'patient_name', 'document_type', 'document_date']
        if sort_by not in valid_sort_fields:
            sort_by = 'finalized_at'
        
        if sort_order not in ['asc', 'desc']:
            sort_order = 'desc'
        
        # Build query
        query = SavedDocument.query.filter(
            SavedDocument.user_id == current_user_id,
            SavedDocument.is_deleted == False,
            SavedDocument.expires_at > datetime.utcnow()
        )
        
        # Apply filters
        if document_type:
            query = query.filter(SavedDocument.document_type == document_type)
        
        if search_query:
            search_term = f"%{search_query}%"
            query = query.filter(
                db.or_(
                    SavedDocument.patient_name.ilike(search_term),
                    SavedDocument.document_title.ilike(search_term),
                    SavedDocument.document_content.ilike(search_term)
                )
            )
        
        # Apply sorting
        sort_field = getattr(SavedDocument, sort_by)
        if sort_by == 'patient_name':
            # Sort by last name for patient names
            if sort_order == 'desc':
                query = query.order_by(SavedDocument.patient_name.desc())
            else:
                query = query.order_by(SavedDocument.patient_name.asc())
        else:
            if sort_order == 'desc':
                query = query.order_by(sort_field.desc())
            else:
                query = query.order_by(sort_field.asc())
        
        # Get total count for pagination
        total_count = query.count()
        
        # Apply pagination
        documents = query.offset(offset).limit(limit).all()
        
        # Convert to dictionaries
        documents_data = [doc.to_dict() for doc in documents]
        
        # Get document type counts for filtering UI
        type_counts = db.session.query(
            SavedDocument.document_type,
            db.func.count(SavedDocument.id).label('count')
        ).filter(
            SavedDocument.user_id == current_user_id,
            SavedDocument.is_deleted == False,
            SavedDocument.expires_at > datetime.utcnow()
        ).group_by(SavedDocument.document_type).all()
        
        type_counts_dict = {item[0]: item[1] for item in type_counts}
        
        return jsonify({
            'success': True,
            'documents': documents_data,
            'pagination': {
                'total_count': total_count,
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < total_count
            },
            'filters': {
                'document_type_counts': type_counts_dict,
                'applied_filters': {
                    'document_type': document_type,
                    'search_query': search_query,
                    'sort_by': sort_by,
                    'sort_order': sort_order
                }
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error retrieving recent documents: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to retrieve documents: {str(e)}'
        }), 500

@document_generation_bp.route('/recent-documents/<int:document_id>', methods=['GET'])
@jwt_required()
def get_document_details(document_id):
    """Get full details of a specific document including content"""
    try:
        current_user_id = get_jwt_identity()
        
        document = SavedDocument.query.filter(
            SavedDocument.id == document_id,
            SavedDocument.user_id == current_user_id,
            SavedDocument.is_deleted == False
        ).first()
        
        if not document:
            return jsonify({
                'success': False,
                'error': 'Document not found or access denied'
            }), 404
        
        return jsonify({
            'success': True,
            'document': document.to_dict(include_content=True)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error retrieving document details: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to retrieve document: {str(e)}'
        }), 500

@document_generation_bp.route('/recent-documents/<int:document_id>', methods=['DELETE'])
@jwt_required()
def delete_document(document_id):
    """Soft delete a document before its expiration"""
    try:
        current_user_id = get_jwt_identity()
        
        document = SavedDocument.query.filter(
            SavedDocument.id == document_id,
            SavedDocument.user_id == current_user_id,
            SavedDocument.is_deleted == False
        ).first()
        
        if not document:
            return jsonify({
                'success': False,
                'error': 'Document not found or access denied'
            }), 404
        
        # Soft delete the document
        document.soft_delete(current_user_id)
        db.session.commit()
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='document_deleted',
            resource_type='saved_document',
            resource_id=str(document_id),
            details={
                'patient_name': document.patient_name,
                'document_type': document.document_type,
                'document_title': document.document_title
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Document deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting document: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to delete document: {str(e)}'
        }), 500

@document_generation_bp.route('/backup-download', methods=['GET'])
@jwt_required()
def download_backup():
    """
    Download all documents within retention period as a ZIP file for backup.
    Optionally filter by date range and document type.
    """
    try:
        from flask import send_file
        import zipfile
        import io
        from datetime import datetime, timedelta
        
        current_user_id = get_jwt_identity()
        
        # Get query parameters for filtering
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date') 
        document_type = request.args.get('document_type')
        
        # Parse dates
        start_date = None
        end_date = None
        
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid start_date format. Use YYYY-MM-DD'
                }), 400
        
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid end_date format. Use YYYY-MM-DD'
                }), 400
        
        # Get documents for backup
        documents = SavedDocument.get_documents_for_backup(
            user_id=current_user_id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Filter by document type if specified
        if document_type:
            documents = [doc for doc in documents if doc.document_type == document_type]
        
        if not documents:
            return jsonify({
                'success': False,
                'error': 'No documents found for backup with the specified criteria'
            }), 404
        
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Group documents by date for organization
            documents_by_date = {}
            for doc in documents:
                date_key = doc.document_date.strftime('%Y-%m-%d')
                if date_key not in documents_by_date:
                    documents_by_date[date_key] = []
                documents_by_date[date_key].append(doc)
            
            # Add documents to ZIP organized by date
            for date_key, date_docs in documents_by_date.items():
                for doc in date_docs:
                    # Create safe filename
                    safe_patient_name = "".join(c for c in doc.patient_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
                    safe_title = "".join(c for c in doc.document_title if c.isalnum() or c in (' ', '-', '_')).rstrip()
                    
                    # Create filename with date, patient, and document info
                    filename = f"{date_key}/{safe_patient_name}_{doc.document_type}_{safe_title}_{doc.id}.txt"
                    
                    # Prepare document content with metadata header
                    content_lines = [
                        f"Document ID: {doc.id}",
                        f"Patient: {doc.patient_name}",
                        f"Patient ID: {doc.patient_id or 'N/A'}",
                        f"Room: {doc.room_number or 'N/A'}",
                        f"Document Type: {doc.document_type}",
                        f"Document Title: {doc.document_title}",
                        f"Template: {doc.template_name or 'N/A'}",
                        f"Document Date: {doc.document_date}",
                        f"Finalized: {doc.finalized_at.strftime('%Y-%m-%d %H:%M:%S')}",
                        f"Expires: {doc.expires_at.strftime('%Y-%m-%d %H:%M:%S')}",
                        f"Status: {doc.status}",
                        "-" * 80,
                        "",
                        doc.document_content
                    ]
                    
                    content = "\n".join(content_lines)
                    
                    # Add file to ZIP
                    zip_file.writestr(filename, content.encode('utf-8'))
            
            # Add a manifest file with backup information
            manifest_lines = [
                f"MeDocPro Document Backup",
                f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC",
                f"User ID: {current_user_id}",
                f"Total Documents: {len(documents)}",
                f"Date Range: {start_date or 'N/A'} to {end_date or 'N/A'}",
                f"Document Type Filter: {document_type or 'All types'}",
                "",
                "Document Summary:",
                "-" * 50
            ]
            
            # Add document summary to manifest
            for doc in documents:
                manifest_lines.extend([
                    f"ID: {doc.id}",
                    f"  Patient: {doc.patient_name}",
                    f"  Type: {doc.document_type}",
                    f"  Date: {doc.document_date}",
                    f"  Title: {doc.document_title}",
                    ""
                ])
            
            zip_file.writestr("MANIFEST.txt", "\n".join(manifest_lines).encode('utf-8'))
        
        # Prepare ZIP file for download
        zip_buffer.seek(0)
        
        # Create filename for download
        date_range = ""
        if start_date and end_date:
            date_range = f"_{start_date}_to_{end_date}"
        elif start_date:
            date_range = f"_from_{start_date}"
        elif end_date:
            date_range = f"_to_{end_date}"
        
        type_filter = f"_{document_type}" if document_type else ""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        download_filename = f"medocpro_backup{date_range}{type_filter}_{timestamp}.zip"
        
        # Log audit event
        log_audit_event(
            user_id=current_user_id,
            action='backup_downloaded',
            resource_type='saved_document',
            resource_id='bulk',
            details={
                'document_count': len(documents),
                'start_date': str(start_date) if start_date else None,
                'end_date': str(end_date) if end_date else None,
                'document_type': document_type,
                'filename': download_filename
            }
        )
        
        current_app.logger.info(f"Backup downloaded: {len(documents)} documents for user {current_user_id}")
        
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name=download_filename,
            mimetype='application/zip'
        )
        
    except Exception as e:
        current_app.logger.error(f"Error generating backup download: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to generate backup: {str(e)}'
        }), 500

@document_generation_bp.route('/backup-info', methods=['GET'])
@jwt_required()
def get_backup_info():
    """Get information about available documents for backup"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get all documents within retention period
        all_documents = SavedDocument.get_active_documents(user_id=current_user_id)
        
        # Group by document type
        type_counts = {}
        date_range = {'earliest': None, 'latest': None}
        total_size = 0
        
        for doc in all_documents:
            # Count by type
            if doc.document_type not in type_counts:
                type_counts[doc.document_type] = 0
            type_counts[doc.document_type] += 1
            
            # Track date range
            if date_range['earliest'] is None or doc.document_date < date_range['earliest']:
                date_range['earliest'] = doc.document_date
            if date_range['latest'] is None or doc.document_date > date_range['latest']:
                date_range['latest'] = doc.document_date
            
            # Calculate total size
            total_size += doc.file_size or 0
        
        # Estimate ZIP file size (approximately 60-70% compression for text)
        estimated_zip_size = int(total_size * 0.65)
        
        return jsonify({
            'success': True,
            'backup_info': {
                'total_documents': len(all_documents),
                'document_types': type_counts,
                'date_range': {
                    'earliest': date_range['earliest'].isoformat() if date_range['earliest'] else None,
                    'latest': date_range['latest'].isoformat() if date_range['latest'] else None
                },
                'total_size_bytes': total_size,
                'estimated_zip_size_bytes': estimated_zip_size,
                'retention_period_days': 7
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting backup info: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get backup info: {str(e)}'
        }), 500