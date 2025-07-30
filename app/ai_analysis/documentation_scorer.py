"""
Documentation Completeness Scorer - AI Analysis Module
Analyzes clinical documentation completeness using quantized LLM models
Optimized for pattern recognition and structured evaluation
"""

import logging
import json
import re
from datetime import datetime
from typing import Dict, List, Any, Optional
from .analysis_engine import AnalysisResult

logger = logging.getLogger(__name__)

class DocumentationScorer:
    """
    Analyzes clinical documentation completeness using quantized LLM models
    Focuses on pattern recognition tasks that work well with quantized models
    """
    
    def __init__(self, analysis_engine):
        self.engine = analysis_engine
        
        # Documentation elements to check for completeness
        self.essential_elements = {
            'chief_complaint': {
                'patterns': [
                    r'chief complaint|cc:|presenting complaint|reason for visit',
                    r'patient reports|patient states|patient presents with'
                ],
                'weight': 0.15,
                'description': 'Chief complaint or reason for visit'
            },
            'history_present_illness': {
                'patterns': [
                    r'history of present illness|hpi:|present illness',
                    r'onset|duration|character|alleviating|aggravating',
                    r'started|began|since|for the past'
                ],
                'weight': 0.20,
                'description': 'History of present illness'
            },
            'mental_status': {
                'patterns': [
                    r'mental status|mse|mental state examination',
                    r'appearance|behavior|speech|mood|affect',
                    r'thought process|thought content|perceptual|cognitive',
                    r'insight|judgment|orientation'
                ],
                'weight': 0.20,
                'description': 'Mental status examination'
            },
            'assessment': {
                'patterns': [
                    r'assessment|impression|diagnosis|diagnostic',
                    r'dsm|icd|axis|primary diagnosis|secondary diagnosis',
                    r'differential|rule out|r/o'
                ],
                'weight': 0.15,
                'description': 'Clinical assessment or diagnosis'
            },
            'plan': {
                'patterns': [
                    r'plan|treatment plan|recommendations|intervention',
                    r'medication|therapy|follow.?up|referral',
                    r'goals|objectives|next appointment'
                ],
                'weight': 0.15,
                'description': 'Treatment plan and recommendations'
            },
            'risk_assessment': {
                'patterns': [
                    r'suicide|self.?harm|homicide|risk assessment',
                    r'safety|harm to self|harm to others',
                    r'si|hi|suicidal ideation|homicidal ideation'
                ],
                'weight': 0.10,
                'description': 'Safety and risk assessment'
            },
            'functional_status': {
                'patterns': [
                    r'function|activities of daily living|adl|work',
                    r'social|relationships|living situation',
                    r'independent|dependent|assistance'
                ],
                'weight': 0.05,
                'description': 'Functional and social status'
            }
        }
    
    def score_completeness(self, content: str, content_id: str, patient_id: str) -> AnalysisResult:
        """
        Score documentation completeness using both pattern matching and LLM analysis
        
        Args:
            content: Clinical documentation text
            content_id: Unique identifier for this content
            patient_id: Patient identifier
            
        Returns:
            AnalysisResult with completeness score and detailed breakdown
        """
        start_time = datetime.now()
        
        try:
            # Step 1: Pattern-based analysis (fast, reliable baseline)
            pattern_results = self._analyze_patterns(content)
            
            # Step 2: LLM-enhanced analysis (for nuanced evaluation)
            llm_results = self._analyze_with_llm(content, pattern_results)
            
            # Step 3: Combine results for final score
            final_score = self._calculate_final_score(pattern_results, llm_results)
            
            # Generate detailed results
            results = {
                'overall_score': final_score,
                'pattern_analysis': pattern_results,
                'llm_analysis': llm_results,
                'recommendations': self._generate_recommendations(pattern_results, llm_results),
                'missing_elements': self._identify_missing_elements(pattern_results),
                'documentation_quality': self._assess_quality_level(final_score)
            }
            
            # Calculate confidence based on pattern vs LLM agreement
            confidence = self._calculate_confidence(pattern_results, llm_results)
            
            return AnalysisResult(
                analysis_type="completeness",
                patient_id=patient_id,
                content_id=content_id,
                results=results,
                confidence=confidence,
                timestamp=datetime.now(),
                processing_time_ms=0  # Will be set by calling function
            )
            
        except Exception as e:
            logger.error(f"Error in documentation scoring: {e}")
            return AnalysisResult(
                analysis_type="completeness",
                patient_id=patient_id,
                content_id=content_id,
                results={
                    'error': str(e),
                    'overall_score': 0.0,
                    'fallback_mode': True
                },
                confidence=0.0,
                timestamp=datetime.now(),
                processing_time_ms=0
            )
    
    def _analyze_patterns(self, content: str) -> Dict[str, Any]:
        """
        Analyze documentation using pattern matching
        Fast and reliable baseline scoring
        """
        content_lower = content.lower()
        element_scores = {}
        total_weighted_score = 0.0
        
        for element_name, element_config in self.essential_elements.items():
            patterns = element_config['patterns']
            weight = element_config['weight']
            
            # Check if any patterns match
            matches = []
            for pattern in patterns:
                pattern_matches = re.findall(pattern, content_lower, re.IGNORECASE)
                matches.extend(pattern_matches)
            
            # Score based on pattern density and presence
            if matches:
                # Base score for presence
                presence_score = 0.6
                
                # Bonus for multiple pattern matches (indicates detailed documentation)
                density_bonus = min(0.4, len(matches) * 0.1)
                
                element_score = presence_score + density_bonus
            else:
                element_score = 0.0
            
            element_scores[element_name] = {
                'score': element_score,
                'matches': len(matches),
                'weight': weight,
                'weighted_score': element_score * weight
            }
            
            total_weighted_score += element_score * weight
        
        return {
            'total_score': total_weighted_score,
            'element_scores': element_scores,
            'method': 'pattern_matching'
        }
    
    def _analyze_with_llm(self, content: str, pattern_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use LLM for nuanced completeness analysis
        Optimized prompts for quantized models
        """
        try:
            # Create a focused prompt for quantized models
            prompt = self._create_completeness_prompt(content, pattern_results)
            
            # Call Ollama with optimized settings
            response = self.engine._call_ollama(prompt)
            
            if 'response' in response:
                llm_text = response['response']
                return self._parse_llm_response(llm_text)
            else:
                logger.warning("No response from LLM")
                return {'method': 'llm_analysis', 'error': 'No response from LLM'}
                
        except Exception as e:
            logger.error(f"LLM analysis failed: {e}")
            return {'method': 'llm_analysis', 'error': str(e)}
    
    def _create_completeness_prompt(self, content: str, pattern_results: Dict[str, Any]) -> str:
        """
        Create optimized prompt for quantized models
        Focus on clear, structured analysis tasks
        """
        # Get pattern analysis insights
        missing_elements = [
            name for name, scores in pattern_results['element_scores'].items()
            if scores['score'] < 0.3
        ]
        
        prompt = f"""Analyze this clinical documentation for completeness. Focus on identifying what information is present or missing.

CLINICAL DOCUMENTATION:
{content[:1500]}  # Limit content for context window

ANALYSIS TASK:
Rate documentation completeness on a scale of 0-100. Look for these key elements:

1. Chief complaint or reason for visit
2. History of present illness with timeline
3. Mental status examination findings  
4. Clinical assessment/diagnosis
5. Treatment plan and recommendations
6. Safety/risk assessment
7. Functional status information

PATTERN ANALYSIS FOUND: {len([e for e in pattern_results['element_scores'].values() if e['score'] > 0.3])}/7 elements detected

RESPOND WITH:
Score: [0-100]
Quality: [Excellent/Good/Fair/Poor]
Missing: [list key missing elements]
Strengths: [what is well documented]

Keep response concise and structured."""

        return prompt
    
    def _parse_llm_response(self, llm_text: str) -> Dict[str, Any]:
        """
        Parse LLM response into structured data
        Robust parsing for quantized model outputs
        """
        try:
            # Extract score
            score_match = re.search(r'Score:\s*(\d+)', llm_text, re.IGNORECASE)
            llm_score = float(score_match.group(1)) / 100.0 if score_match else 0.5
            
            # Extract quality assessment
            quality_match = re.search(r'Quality:\s*(\w+)', llm_text, re.IGNORECASE)
            quality = quality_match.group(1).lower() if quality_match else 'unknown'
            
            # Extract missing elements
            missing_match = re.search(r'Missing:\s*([^\n]+)', llm_text, re.IGNORECASE)
            missing_text = missing_match.group(1) if missing_match else ''
            
            # Extract strengths
            strengths_match = re.search(r'Strengths:\s*([^\n]+)', llm_text, re.IGNORECASE)
            strengths_text = strengths_match.group(1) if strengths_match else ''
            
            return {
                'method': 'llm_analysis',
                'score': llm_score,
                'quality_assessment': quality,
                'missing_elements_text': missing_text,
                'strengths_text': strengths_text,
                'raw_response': llm_text[:500]  # Keep first 500 chars for debugging
            }
            
        except Exception as e:
            logger.error(f"Failed to parse LLM response: {e}")
            return {
                'method': 'llm_analysis',
                'error': f'Parse error: {str(e)}',
                'raw_response': llm_text[:200]
            }
    
    def _calculate_final_score(self, pattern_results: Dict[str, Any], llm_results: Dict[str, Any]) -> float:
        """
        Combine pattern and LLM analysis for final score
        Weight based on confidence in each method
        """
        pattern_score = pattern_results.get('total_score', 0.0)
        llm_score = llm_results.get('score', 0.0)
        
        # If LLM analysis failed, use pattern analysis only
        if 'error' in llm_results:
            return pattern_score
        
        # Weighted combination - pattern analysis is more reliable for quantized models
        pattern_weight = 0.7
        llm_weight = 0.3
        
        final_score = (pattern_score * pattern_weight) + (llm_score * llm_weight)
        
        # Ensure score is in valid range
        return max(0.0, min(1.0, final_score))
    
    def _calculate_confidence(self, pattern_results: Dict[str, Any], llm_results: Dict[str, Any]) -> float:
        """
        Calculate confidence based on agreement between methods
        """
        if 'error' in llm_results:
            # Lower confidence if LLM analysis failed
            return 0.6
        
        pattern_score = pattern_results.get('total_score', 0.0)
        llm_score = llm_results.get('score', 0.0)
        
        # Calculate agreement (lower difference = higher confidence)
        difference = abs(pattern_score - llm_score)
        
        # High confidence if methods agree closely
        if difference < 0.1:
            return 0.9
        elif difference < 0.2:
            return 0.8
        elif difference < 0.3:
            return 0.7
        else:
            return 0.6
    
    def _generate_recommendations(self, pattern_results: Dict[str, Any], llm_results: Dict[str, Any]) -> List[str]:
        """
        Generate actionable recommendations for improving documentation
        """
        recommendations = []
        
        # Analyze missing elements from pattern analysis
        element_scores = pattern_results.get('element_scores', {})
        
        for element_name, scores in element_scores.items():
            if scores['score'] < 0.3:
                element_config = self.essential_elements[element_name]
                recommendations.append(
                    f"Add {element_config['description'].lower()} to improve completeness"
                )
        
        # Add LLM-based recommendations if available
        if 'missing_elements_text' in llm_results and llm_results['missing_elements_text']:
            recommendations.append(f"LLM identified missing: {llm_results['missing_elements_text']}")
        
        # General recommendations based on score
        total_score = pattern_results.get('total_score', 0.0)
        if total_score < 0.5:
            recommendations.append("Consider using structured templates to ensure comprehensive documentation")
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    def _identify_missing_elements(self, pattern_results: Dict[str, Any]) -> List[str]:
        """
        Identify specific missing documentation elements
        """
        missing = []
        element_scores = pattern_results.get('element_scores', {})
        
        for element_name, scores in element_scores.items():
            if scores['score'] < 0.3:
                element_config = self.essential_elements[element_name]
                missing.append({
                    'element': element_name,
                    'description': element_config['description'],
                    'weight': element_config['weight']
                })
        
        # Sort by weight (importance)
        missing.sort(key=lambda x: x['weight'], reverse=True)
        return missing
    
    def _assess_quality_level(self, score: float) -> str:
        """
        Convert numeric score to quality assessment
        """
        if score >= 0.85:
            return "Excellent"
        elif score >= 0.70:
            return "Good" 
        elif score >= 0.50:
            return "Fair"
        else:
            return "Poor"