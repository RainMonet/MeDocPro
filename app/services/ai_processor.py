import requests
import json
import re
from typing import Dict, Any, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIProcessor:
    def __init__(self, base_url="http://localhost:11434", model="mistral:latest"):
        self.base_url = base_url
        self.model = model
        self.api_url = f"{base_url}/api/generate"
    
    def test_connection(self) -> bool:
        """Test if Ollama is running and accessible"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def generate_text(self, prompt: str, max_tokens: int = 500) -> str:
        """Generate text using Ollama"""
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": 0.3,
                    "top_p": 0.9
                }
            }
            
            response = requests.post(
                self.api_url,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('response', '').strip()
            else:
                logger.error(f"Ollama API error: {response.status_code}")
                return "Error: AI service unavailable"
                
        except Exception as e:
            logger.error(f"AI generation error: {str(e)}")
            return "Error: AI processing failed"
    
    def create_clinical_prompt(self, template_type: str, patient_data: Dict[str, Any], ai_zone_content: str) -> str:
        """Create a clinical prompt based on template type and patient data"""
        
        # Extract key patient information
        patient_name = patient_data.get('full_name', 'Patient')
        age = patient_data.get('age', 'Unknown')
        gender = patient_data.get('gender', 'Unknown')
        primary_dx = patient_data.get('primary_diagnosis', 'Not specified')
        
        base_context = f"""
Patient: {patient_name} (Age: {age}, Gender: {gender})
Primary Diagnosis: {primary_dx}
"""
        
        # Template-specific prompts
        prompts = {
            'progress_note': f"""
{base_context}
You are a psychiatrist writing a progress note. Based on the patient information above, 
please complete the following section with professional clinical language:

{ai_zone_content}

Requirements:
- Use professional psychiatric terminology
- Be concise and objective
- Include relevant clinical observations
- Maintain HIPAA compliance
- Focus on therapeutic progress and clinical status
""",
            
            'intake_assessment': f"""
{base_context}
You are a psychiatrist conducting an intake assessment. Based on the patient information above,
please complete the following section with comprehensive clinical documentation:

{ai_zone_content}

Requirements:
- Use thorough psychiatric assessment language
- Include relevant history and presentation details
- Be objective and clinical in tone
- Consider differential diagnosis factors
- Maintain professional medical documentation standards
""",
            
            'treatment_plan': f"""
{base_context}
You are a psychiatrist developing a treatment plan. Based on the patient information above,
please complete the following section with evidence-based treatment recommendations:

{ai_zone_content}

Requirements:
- Use evidence-based treatment approaches
- Be specific and measurable in goals
- Include appropriate interventions
- Consider patient safety and wellbeing
- Use professional clinical language
""",
            
            'mental_status_exam': f"""
{base_context}
You are a psychiatrist documenting a mental status examination. Based on the patient information above,
please complete the following section with detailed clinical observations:

{ai_zone_content}

Requirements:
- Use standard MSE terminology
- Be objective and descriptive
- Include relevant behavioral observations
- Maintain clinical precision
- Focus on current mental state presentation
"""
        }
        
        return prompts.get(template_type, prompts['progress_note'])
    
    def process_template_zones(self, template_content: str, patient_data: Dict[str, Any], template_type: str) -> str:
        """Process AI zones in template content"""
        
        if not self.test_connection():
            logger.error("Ollama connection failed")
            return template_content.replace("{{BEGIN_AI}}", "").replace("{{END_AI}}", "[AI service unavailable]")
        
        # Find all AI zones
        ai_zone_pattern = r'{{BEGIN_AI}}(.*?){{END_AI}}'
        zones = re.findall(ai_zone_pattern, template_content, re.DOTALL)
        
        processed_content = template_content
        
        for zone_content in zones:
            try:
                # Create clinical prompt
                prompt = self.create_clinical_prompt(template_type, patient_data, zone_content.strip())
                
                # Generate AI content
                ai_generated = self.generate_text(prompt, max_tokens=300)
                
                # Replace the zone with generated content
                zone_pattern = f"{{{{BEGIN_AI}}}}{re.escape(zone_content)}{{{{END_AI}}}}"
                processed_content = re.sub(zone_pattern, ai_generated, processed_content, flags=re.DOTALL)
                
                logger.info(f"Successfully processed AI zone for {template_type}")
                
            except Exception as e:
                logger.error(f"Error processing AI zone: {str(e)}")
                # Replace with error message
                zone_pattern = f"{{{{BEGIN_AI}}}}{re.escape(zone_content)}{{{{END_AI}}}}"
                processed_content = re.sub(zone_pattern, "[AI processing error]", processed_content, flags=re.DOTALL)
        
        return processed_content
    
    def enhance_clinical_text(self, text: str, enhancement_type: str = "clinical") -> str:
        """Enhance existing clinical text with AI suggestions"""
        
        enhancement_prompts = {
            "clinical": f"""
Please enhance the following clinical text to be more professional and precise:

{text}

Requirements:
- Maintain all original medical information
- Improve clinical language and terminology
- Ensure professional psychiatric documentation standards
- Keep the same meaning but enhance clarity
- Use appropriate medical abbreviations where suitable
""",
            
            "concise": f"""
Please make the following clinical text more concise while maintaining all essential information:

{text}

Requirements:
- Preserve all critical clinical information
- Remove redundancy
- Use efficient medical terminology
- Maintain professional tone
- Keep all diagnostic and treatment information
""",
            
            "detailed": f"""
Please expand the following clinical text with more detailed professional language:

{text}

Requirements:
- Add appropriate clinical detail
- Use comprehensive psychiatric terminology
- Maintain objectivity
- Enhance with relevant clinical context
- Follow professional documentation standards
"""
        }
        
        prompt = enhancement_prompts.get(enhancement_type, enhancement_prompts["clinical"])
        return self.generate_text(prompt, max_tokens=400)

# Global instance
ai_processor = AIProcessor()