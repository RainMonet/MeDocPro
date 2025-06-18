# app/services/ai_processor.py - Complete AI service for MeDocPro

import os
import requests
import logging
from typing import Optional

# Configure logging
logger = logging.getLogger(__name__)

# Maps user-friendly tone names to Mistral instructions
TONE_INSTRUCTIONS = {
    'formal': 'professional and formal medical tone',
    'concise': 'concise and direct clinical tone',
    'descriptive': 'descriptive and detailed clinical tone',
    'narrative': 'narrative and flowing clinical tone',
    'clinical': 'standard clinical documentation tone',
    'compassionate': 'compassionate and empathetic tone while maintaining professionalism',
    'technical': 'technical and precise medical terminology',
    'marktwain': 'literary style reminiscent of Mark Twain while maintaining medical accuracy and professionalism'
}

def get_ollama_prompt(text: str, percentage: int, tone: str) -> str:
    """
    Constructs the full prompt for the Ollama/Mistral API.
    
    Args:
        text: The clinical text to be processed
        percentage: How different the output should be (20-90%)
        tone: The writing tone to use
    
    Returns:
        Formatted prompt string for Ollama API
    """
    tone_instruction = TONE_INSTRUCTIONS.get(tone, 'professional medical tone')
    
    return f"""<s>[INST] You are a medical documentation assistant. Rephrase the following psychiatric clinical note text to be {percentage}% different while preserving all medical information, clinical details, and safety information.

Important Guidelines:
1. DO NOT include any introduction or explanatory text in your response
2. DO NOT mention the rephrasing instructions or the style you're using
3. DO NOT use "CurrentDate" - use "today" instead
4. Start your response immediately with the rephrased clinical note
5. Maintain the same length and use a {tone_instruction}
6. Preserve all diagnostic information, treatment plans, and safety assessments
7. Keep all medical terminology accurate and appropriate
8. Maintain HIPAA compliance - do not add any identifying information
9. Return only the rephrased clinical text, nothing else

Here is the clinical text to rephrase:

{text} [/INST]"""

def process_text_with_ollama(text: str, percentage: int = 80, tone: str = 'formal') -> str:
    """
    Sends text to the local Ollama API for AI enhancement using Mistral.
    
    Args:
        text: The clinical text to process
        percentage: Alteration percentage (20-90)
        tone: Writing tone for the output
    
    Returns:
        Enhanced text from Ollama/Mistral or error message
    """
    # Get Ollama API URL from environment or use default
    ollama_url = os.getenv('OLLAMA_API_URL', 'http://localhost:11434')
    api_url = f'{ollama_url}/api/generate'
    
    # Get model name from environment or use default
    model_name = os.getenv('OLLAMA_MODEL', 'mistral:latest')
    
    # Validate inputs
    if not text or not text.strip():
        return "[Error: No text provided for processing]"
    
    if not (20 <= percentage <= 90):
        percentage = 80  # Default to safe value
    
    if tone not in TONE_INSTRUCTIONS:
        tone = 'formal'  # Default to formal tone
    
    prompt = get_ollama_prompt(text, percentage, tone)
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
            "max_tokens": 4096,
            "stop": ["</s>", "[INST]", "[/INST]"]
        }
    }
    
    try:
        logger.info(f"Sending request to Ollama API at {api_url} with model: {model_name}, tone: {tone}, percentage: {percentage}")
        
        response = requests.post(api_url, json=payload, headers=headers, timeout=120)
        response.raise_for_status()  # Raises an exception for 4XX/5XX errors
        
        result = response.json()
        
        # Parse Ollama response format
        if 'response' in result:
            processed_text = result['response'].strip()
            
            # Clean up the response
            processed_text = processed_text.replace("CurrentDate", "today")
            
            # Remove any potential instruction artifacts
            if processed_text.startswith('[INST]') or processed_text.startswith('<s>'):
                # Try to extract just the clinical text
                lines = processed_text.split('\n')
                processed_text = '\n'.join([line for line in lines if not line.strip().startswith(('[INST]', '</s>', '<s>'))])
            
            return processed_text.strip() if processed_text.strip() else "[Error: Empty response from AI service]"
        else:
            logger.error(f"Unexpected Ollama API response format: {result}")
            return "[Error: Unexpected AI service response format]"
            
    except requests.exceptions.Timeout:
        logger.error("Ollama API request timed out")
        return f"[Error: AI service request timed out] Original Text: {text}"
        
    except requests.exceptions.ConnectionError:
        logger.error("Failed to connect to Ollama API")
        return f"[Error: Cannot connect to AI service. Please ensure Ollama is running] Original Text: {text}"
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Ollama API: {e}")
        return f"[Error communicating with AI service: {str(e)}] Original Text: {text}"
    
    except Exception as e:
        logger.error(f"Unexpected error in AI processing: {e}")
        return f"[Unexpected error in AI processing] Original Text: {text}"

def check_ollama_status() -> dict:
    """
    Check if Ollama is running and what models are available.
    
    Returns:
        Dictionary with status information
    """
    ollama_url = os.getenv('OLLAMA_API_URL', 'http://localhost:11434')
    
    try:
        # Check if Ollama is running
        response = requests.get(f'{ollama_url}/api/tags', timeout=5)
        response.raise_for_status()
        
        models = response.json().get('models', [])
        model_names = [model.get('name', '') for model in models]
        
        return {
            'status': 'available',
            'url': ollama_url,
            'models': model_names,
            'has_mistral': any('mistral' in name.lower() for name in model_names),
            'recommended_model': os.getenv('OLLAMA_MODEL', 'mistral:latest')
        }
        
    except requests.exceptions.ConnectionError:
        return {
            'status': 'unavailable',
            'url': ollama_url,
            'error': 'Cannot connect to Ollama service',
            'help': 'Please ensure Ollama is installed and running'
        }
    except Exception as e:
        return {
            'status': 'error',
            'url': ollama_url,
            'error': str(e)
        }

# For backward compatibility, create an alias
process_text_with_ai = process_text_with_ollama