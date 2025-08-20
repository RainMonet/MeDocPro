"""
AI Chat API Routes - Local LLM Integration for General Chatbot
Provides conversational AI capabilities using local Ollama LLM service
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import json
from datetime import datetime
from ..utils.audit import log_audit_event

ai_chat_bp = Blueprint('ai_chat', __name__)

# Default Ollama configuration
OLLAMA_BASE_URL = "http://localhost:11434"
# Common model names to try in order of preference
PREFERRED_MODELS = [
    "mistral:latest", # Latest Mistral - USER CONFIRMED AVAILABLE
    "mistral:7b",     # Mistral 7B
    "llama3:8b",      # Llama 3 8B - most recent and capable
    "llama3:latest",   # Latest Llama 3
    "llama2:7b",      # Llama 2 7B
    "llama2:latest",  # Latest Llama 2
    "codellama:7b",   # Code Llama
    "phi:latest",     # Microsoft Phi
    "gemma:2b",       # Google Gemma 2B (lightweight)
    "gemma:7b"        # Google Gemma 7B
]

def get_best_available_model(ollama_url):
    """Find the best available model from the preferred list"""
    try:
        available_models = get_available_models(ollama_url)
        if not available_models:
            return None
        
        # Check preferred models in order
        for preferred_model in PREFERRED_MODELS:
            if preferred_model in available_models:
                return preferred_model
        
        # If no preferred model found, return the first available model
        return available_models[0] if available_models else None
        
    except Exception as e:
        current_app.logger.error(f"Error finding best model: {e}")
        return None

def get_ollama_config():
    """Get Ollama configuration from app config or environment"""
    import os
    
    ollama_url = current_app.config.get('OLLAMA_URL', os.getenv('OLLAMA_URL', OLLAMA_BASE_URL))
    configured_model = current_app.config.get('OLLAMA_MODEL', os.getenv('OLLAMA_MODEL'))
    
    # If no specific model configured, find the best available one
    if not configured_model:
        configured_model = get_best_available_model(ollama_url.rstrip('/'))
        if not configured_model:
            configured_model = PREFERRED_MODELS[0]  # Fallback to first preferred
    
    return {
        'url': ollama_url.rstrip('/'),
        'model': configured_model
    }

def test_ollama_connection(ollama_url):
    """Test if Ollama service is running and accessible"""
    try:
        response = requests.get(f"{ollama_url}/api/tags", timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

def get_available_models(ollama_url):
    """Get list of available models from Ollama"""
    try:
        response = requests.get(f"{ollama_url}/api/tags", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return [model.get('name', 'unknown') for model in data.get('models', [])]
    except requests.exceptions.RequestException:
        pass
    return []

def format_conversation_context(conversation_history):
    """Format conversation history for better LLM context"""
    if not conversation_history:
        return ""
    
    context_parts = []
    for message in conversation_history[-6:]:  # Last 6 messages for context
        if message.get('type') == 'user':
            context_parts.append(f"User: {message.get('content', '')}")
        elif message.get('type') == 'assistant':
            context_parts.append(f"Assistant: {message.get('content', '')}")
    
    return "\n".join(context_parts) if context_parts else ""

def create_chat_prompt(user_message, conversation_context="", model_name=""):
    """Create a well-structured prompt optimized for the specific LLM"""
    
    # Mistral-optimized prompt structure
    if "mistral" in model_name.lower():
        system_prompt = """<s>[INST] You are a helpful AI assistant integrated into MeDocPro, a clinical documentation system.

You can help with:
• General questions and discussions
• Clinical terminology and medical concepts (educational information only)
• Technology and software questions
• MeDocPro system assistance

Guidelines:
- Never provide medical advice or diagnose conditions
- For clinical questions, provide educational information only
- Be concise but thorough in your responses
- Maintain a professional yet friendly tone

{context_section}

{message} [/INST]"""
        
        context_section = f"Previous conversation:\n{conversation_context}\n" if conversation_context else ""
        
        return system_prompt.format(
            context_section=context_section,
            message=user_message
        )
    
    # General prompt for other models
    else:
        system_prompt = """You are a helpful AI assistant integrated into MeDocPro, a clinical documentation system. You can help with:

- General questions and discussions
- Clinical terminology and medical concepts (informational only)
- Technology and software questions
- General conversation and support

Important guidelines:
- Do not provide medical advice or diagnose conditions
- For clinical questions, provide educational information only
- Be concise but helpful in your responses
- Maintain a professional yet friendly tone
- If asked about MeDocPro features, explain that you're an integrated AI assistant

Previous conversation context:
{context}

Current user message: {message}

Please provide a helpful response:"""

        return system_prompt.format(
            context=conversation_context if conversation_context else "No previous context",
            message=user_message
        )

@ai_chat_bp.route('/ai-chat', methods=['POST'])
@jwt_required()
def chat_with_ai():
    """
    Chat with local LLM (Ollama) for general conversation and assistance
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        user_message = data.get('message', '').strip()
        if not user_message:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        conversation_history = data.get('conversation_history', [])
        
        # Get Ollama configuration
        ollama_config = get_ollama_config()
        ollama_url = ollama_config['url']
        model_name = ollama_config['model']
        
        # Test Ollama connection
        if not test_ollama_connection(ollama_url):
            # Try to get available models to suggest alternatives
            available_models = get_available_models(ollama_url)
            error_msg = "Local AI service (Ollama) is not accessible. "
            if available_models:
                error_msg += f"Available models: {', '.join(available_models)}"
            else:
                error_msg += "Please ensure Ollama is running on localhost:11434"
            
            return jsonify({
                'success': False,
                'error': error_msg,
                'available_models': available_models,
                'suggestions': [
                    "1. Start Ollama: 'ollama serve'",
                    "2. Install a model: 'ollama pull llama3:8b'",
                    "3. Check running models: 'ollama list'"
                ]
            }), 503
        
        # Verify the selected model exists
        available_models = get_available_models(ollama_url)
        if available_models and model_name not in available_models:
            # Try to find a better model
            better_model = get_best_available_model(ollama_url)
            if better_model and better_model != model_name:
                model_name = better_model
                current_app.logger.info(f"Using alternative model: {model_name}")
            else:
                return jsonify({
                    'success': False,
                    'error': f"Model '{model_name}' not found. Available models: {', '.join(available_models)}",
                    'available_models': available_models,
                    'suggestions': [
                        f"Install the model: 'ollama pull {model_name}'",
                        f"Or try an available model: 'ollama pull {available_models[0]}'" if available_models else ""
                    ]
                }), 400
        
        # Format conversation context
        conversation_context = format_conversation_context(conversation_history)
        
        # Create the prompt (optimized for the specific model)
        prompt = create_chat_prompt(user_message, conversation_context, model_name)
        
        # Prepare request to Ollama
        ollama_request = {
            'model': model_name,
            'prompt': prompt,
            'options': {
                'temperature': 0.7,
                'top_p': 0.9,
                'max_tokens': 1000,
                'stop': ['User:', 'Assistant:']
            },
            'stream': False
        }
        
        # Make request to Ollama
        current_app.logger.info(f"Making request to Ollama: {ollama_url}/api/generate")
        response = requests.post(
            f"{ollama_url}/api/generate",
            json=ollama_request,
            timeout=60  # 1 minute timeout for generation
        )
        
        if response.status_code != 200:
            error_detail = f"Ollama API error: {response.status_code}"
            try:
                error_data = response.json()
                error_detail += f" - {error_data.get('error', 'Unknown error')}"
            except:
                error_detail += f" - {response.text[:200]}"
            
            return jsonify({
                'success': False,
                'error': error_detail
            }), 500
        
        # Parse response
        try:
            ollama_response = response.json()
            ai_response = ollama_response.get('response', '').strip()
            
            if not ai_response:
                ai_response = "I apologize, but I wasn't able to generate a response. Please try rephrasing your question."
            
        except json.JSONDecodeError as e:
            current_app.logger.error(f"Failed to parse Ollama response: {e}")
            return jsonify({
                'success': False,
                'error': 'Failed to parse AI response'
            }), 500
        
        # Log the interaction for audit purposes
        log_audit_event(
            user_id=current_user_id,
            action='ai_chat_interaction',
            resource_type='ai_assistant',
            resource_id=None,
            details={
                'user_message_length': len(user_message),
                'ai_response_length': len(ai_response),
                'model_used': model_name,
                'conversation_context_length': len(conversation_history)
            }
        )
        
        return jsonify({
            'success': True,
            'response': ai_response,
            'model': model_name,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'error': 'AI service timeout. The request took too long to process.'
        }), 504
        
    except requests.exceptions.ConnectionError:
        return jsonify({
            'success': False,
            'error': 'Cannot connect to local AI service. Please ensure Ollama is running.'
        }), 503
        
    except Exception as e:
        current_app.logger.error(f"AI Chat error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@ai_chat_bp.route('/ai-chat/status', methods=['GET'])
@jwt_required()
def get_ai_status():
    """
    Get status of local AI service and available models
    """
    try:
        current_user_id = get_jwt_identity()
        ollama_config = get_ollama_config()
        ollama_url = ollama_config['url']
        model_name = ollama_config['model']
        
        # Test connection
        is_connected = test_ollama_connection(ollama_url)
        
        # Get available models
        available_models = get_available_models(ollama_url) if is_connected else []
        
        # Log status check
        log_audit_event(
            user_id=current_user_id,
            action='ai_status_check',
            resource_type='ai_assistant',
            resource_id=None,
            details={
                'ollama_url': ollama_url,
                'is_connected': is_connected,
                'available_models_count': len(available_models)
            }
        )
        
        return jsonify({
            'success': True,
            'status': 'connected' if is_connected else 'disconnected',
            'ollama_url': ollama_url,
            'current_model': model_name,
            'available_models': available_models,
            'model_available': model_name in available_models if available_models else False
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"AI Status check error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to check AI status: {str(e)}'
        }), 500

@ai_chat_bp.route('/ai-chat/models', methods=['GET'])
@jwt_required()
def list_available_models():
    """
    List all available models in the local Ollama instance
    """
    try:
        current_user_id = get_jwt_identity()
        ollama_config = get_ollama_config()
        ollama_url = ollama_config['url']
        
        # Get detailed model information
        try:
            response = requests.get(f"{ollama_url}/api/tags", timeout=10)
            if response.status_code == 200:
                data = response.json()
                models = []
                
                for model in data.get('models', []):
                    model_info = {
                        'name': model.get('name', 'unknown'),
                        'size': model.get('size', 0),
                        'modified_at': model.get('modified_at'),
                        'digest': model.get('digest', ''),
                        'details': model.get('details', {})
                    }
                    models.append(model_info)
                
                # Log model list request
                log_audit_event(
                    user_id=current_user_id,
                    action='ai_models_list',
                    resource_type='ai_assistant',
                    resource_id=None,
                    details={'models_count': len(models)}
                )
                
                return jsonify({
                    'success': True,
                    'models': models,
                    'count': len(models)
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': f'Failed to fetch models: HTTP {response.status_code}'
                }), 500
                
        except requests.exceptions.RequestException as e:
            return jsonify({
                'success': False,
                'error': f'Cannot connect to Ollama service: {str(e)}'
            }), 503
            
    except Exception as e:
        current_app.logger.error(f"List models error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500