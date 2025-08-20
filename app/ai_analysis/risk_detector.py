"""
Clinical Risk Detector - AI Analysis Module
Identifies safety risks and clinical concerns in documentation
Optimized for quantized LLM pattern recognition with safety focus
"""

import logging
import json
import re
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from .analysis_engine import AnalysisResult

logger = logging.getLogger(__name__)

class RiskDetector:
    """
    Detects clinical risks and safety concerns from documentation
    Prioritizes safety-critical pattern recognition
    """
    
    def __init__(self, analysis_engine):
        self.engine = analysis_engine
        
        # Risk categories with severity levels
        self.risk_categories = {
            'suicide_risk': {
                'high_risk': [
                    r'plan.*suicide|suicide.*plan|method.*suicide',
                    r'intent.*harm.*self|intent.*kill.*self',
                    r'better.*off.*dead|want.*to.*die',
                    r'suicide.*attempt|attempted.*suicide'
                ],
                'moderate_risk': [
                    r'suicidal.*ideation|si\s|thoughts.*suicide',
                    r'thoughts.*death|death.*thoughts',
                    r'hopeless|worthless|burden',
                    r'self.*harm|cutting|overdose'
                ],
                'protective_factors': [
                    r'no.*suicidal|denies.*si|denies.*suicidal',
                    r'good.*support|family.*support|reasons.*live',
                    r'safety.*plan|contract.*safety'
                ],
                'weight': 1.0,  # Highest priority
                'description': 'Suicide risk assessment'
            },
            'violence_risk': {
                'high_risk': [
                    r'homicidal.*ideation|hi\s|thoughts.*killing',
                    r'plan.*harm.*others|intent.*harm.*others',
                    r'violent.*toward|aggressive.*toward',
                    r'weapon.*access|gun|knife'
                ],
                'moderate_risk': [
                    r'angry|rage|furious|hostile',
                    r'irritable|agitated|restless',
                    r'paranoid.*others|others.*against',
                    r'command.*voices.*harm'
                ],
                'protective_factors': [
                    r'no.*homicidal|denies.*hi|denies.*violent',
                    r'calm|peaceful|cooperative',
                    r'no.*access.*weapons'
                ],
                'weight': 0.9,
                'description': 'Violence risk assessment'
            },
            'substance_risk': {
                'high_risk': [
                    r'withdrawal|detox|dt|delirium.*tremens',
                    r'overdose|od\s|intoxicated|drunk',
                    r'needle.*sharing|iv.*drug|injection',
                    r'driving.*under|dui|dwi'
                ],
                'moderate_risk': [
                    r'daily.*drinking|heavy.*drinking|binge',
                    r'drug.*use|marijuana|cocaine|heroin',
                    r'craving|urge.*use|relapse',
                    r'blackout|memory.*loss.*drinking'
                ],
                'protective_factors': [
                    r'sober|clean|abstinent|recovery',
                    r'aa|na|rehab|treatment',
                    r'no.*substance|denies.*use'
                ],
                'weight': 0.7,
                'description': 'Substance abuse risk'
            },
            'psychosis_risk': {
                'high_risk': [
                    r'command.*voice|voice.*tell|voice.*command',
                    r'delusion.*control|thought.*insertion',
                    r'paranoid.*plot|conspiracy.*against',
                    r'bizarre.*behavior|disorganized.*severely'
                ],
                'moderate_risk': [
                    r'hallucination|hearing.*voice|seeing.*thing',
                    r'delusion|paranoid|suspicious',
                    r'thought.*disorder|disorganized.*thought',
                    r'reality.*testing|insight.*poor'
                ],
                'protective_factors': [
                    r'no.*hallucination|denies.*voice|reality.*intact',
                    r'good.*insight|aware.*illness',
                    r'medication.*compliant'
                ],
                'weight': 0.8,
                'description': 'Psychosis and reality testing'
            },
            'cognitive_risk': {
                'high_risk': [
                    r'confusion|disoriented|memory.*severe',
                    r'delirium|cognitive.*impairment.*severe',
                    r'unable.*care.*self|adl.*impaired'
                ],
                'moderate_risk': [
                    r'memory.*problem|forgetful|concentration',
                    r'cognitive.*decline|thinking.*slower',
                    r'decision.*making.*poor'
                ],
                'protective_factors': [
                    r'oriented.*time.*place.*person|memory.*intact',
                    r'cognitive.*intact|thinking.*clear'
                ],
                'weight': 0.6,
                'description': 'Cognitive functioning'
            },
            'medical_risk': {
                'high_risk': [
                    r'chest.*pain|shortness.*breath|difficulty.*breathing',
                    r'seizure|convulsion|unconscious',
                    r'medication.*reaction|allergic.*reaction'
                ],
                'moderate_risk': [
                    r'side.*effect|adverse.*effect|medication.*problem',
                    r'medical.*condition|chronic.*illness',
                    r'pain.*severe|nausea|vomiting'
                ],
                'protective_factors': [
                    r'medically.*stable|vitals.*stable',
                    r'no.*medical.*concern'
                ],
                'weight': 0.5,
                'description': 'Medical comorbidities'
            }
        }
        
        # Context patterns that modify risk assessment
        self.risk_modifiers = {
            'temporal': [
                r'today|now|currently|present|recent',
                r'past|history|previous|former',
                r'chronic|ongoing|persistent'
            ],
            'severity': [
                r'severe|extreme|intense|overwhelming',
                r'moderate|some|mild|slight',
                r'minimal|barely|hardly'
            ],
            'frequency': [
                r'constant|always|daily|frequent',
                r'sometimes|occasional|intermittent',
                r'rare|seldom|never'
            ]
        }
    
    def detect_risks(self, content: str, content_id: str, patient_id: str) -> AnalysisResult:
        """
        Detect clinical risks in documentation
        
        Args:
            content: Clinical documentation text
            content_id: Unique identifier for content
            patient_id: Patient identifier
            
        Returns:
            AnalysisResult with risk analysis and safety recommendations
        """
        start_time = datetime.now()
        
        try:
            # Step 1: Pattern-based risk detection (primary method)
            pattern_risks = self._detect_pattern_risks(content)
            
            # Step 2: LLM risk validation and context analysis
            llm_risks = self._analyze_risks_with_llm(content, pattern_risks)
            
            # Step 3: Calculate risk scores and prioritize
            risk_assessment = self._calculate_risk_scores(pattern_risks, llm_risks)
            
            # Step 4: Generate safety recommendations
            recommendations = self._generate_safety_recommendations(risk_assessment)
            
            results = {
                'risk_assessment': risk_assessment,
                'safety_recommendations': recommendations,
                'immediate_concerns': self._identify_immediate_concerns(risk_assessment),
                'protective_factors': self._identify_protective_factors(pattern_risks),
                'risk_summary': self._create_risk_summary(risk_assessment)
            }
            
            # Calculate confidence based on pattern clarity and LLM agreement
            confidence = self._calculate_risk_confidence(pattern_risks, llm_risks)
            
            return AnalysisResult(
                analysis_type="risks",
                patient_id=patient_id,
                content_id=content_id,
                results=results,
                confidence=confidence,
                timestamp=datetime.now(),
                processing_time_ms=0  # Will be set by calling function
            )
            
        except Exception as e:
            logger.error(f"Error in risk detection: {e}")
            return AnalysisResult(
                analysis_type="risks",
                patient_id=patient_id,
                content_id=content_id,
                results={
                    'error': str(e),
                    'risk_assessment': {},
                    'safety_recommendations': ['Error in risk analysis - manual assessment recommended'],
                    'fallback_mode': True
                },
                confidence=0.0,
                timestamp=datetime.now(),
                processing_time_ms=0
            )
    
    def _detect_pattern_risks(self, content: str) -> Dict[str, Any]:
        """
        Detect risks using pattern matching with context analysis
        """
        content_lower = content.lower()
        detected_risks = {}
        
        for category, risk_config in self.risk_categories.items():
            category_results = {
                'high_risk_matches': [],
                'moderate_risk_matches': [],
                'protective_factors': []
            }
            
            # Check each risk level
            for risk_level in ['high_risk', 'moderate_risk', 'protective_factors']:
                patterns = risk_config.get(risk_level, [])
                
                for pattern in patterns:
                    matches = list(re.finditer(pattern, content_lower, re.IGNORECASE))
                    
                    for match in matches:
                        # Extract context around match
                        start_pos = max(0, match.start() - 75)
                        end_pos = min(len(content), match.end() + 75)
                        context = content[start_pos:end_pos].strip()
                        
                        match_info = {
                            'pattern': match.group(0),
                            'context': context,
                            'position': match.start()
                        }
                        
                        category_results[risk_level].append(match_info)
            
            # Only include categories with actual matches
            if any(category_results.values()):
                detected_risks[category] = {
                    **category_results,
                    'weight': risk_config['weight'],
                    'description': risk_config['description']
                }
        
        return {
            'method': 'pattern_detection',
            'detected_risks': detected_risks,
            'total_risk_patterns': sum(
                len(cat['high_risk_matches']) + len(cat['moderate_risk_matches'])
                for cat in detected_risks.values()
            )
        }
    
    def _analyze_risks_with_llm(self, content: str, pattern_risks: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use LLM for risk validation and context understanding
        """
        try:
            # Create focused risk assessment prompt
            prompt = self._create_risk_assessment_prompt(content, pattern_risks)
            
            # Call Ollama
            response = self.engine._call_ollama(prompt)
            
            if 'response' in response:
                return self._parse_llm_risk_response(response['response'])
            else:
                return {'method': 'llm_risk_analysis', 'error': 'No response from LLM'}
                
        except Exception as e:
            logger.error(f"LLM risk analysis failed: {e}")
            return {'method': 'llm_risk_analysis', 'error': str(e)}
    
    def _create_risk_assessment_prompt(self, content: str, pattern_risks: Dict[str, Any]) -> str:
        """
        Create optimized prompt for risk assessment
        """
        total_patterns = pattern_risks.get('total_risk_patterns', 0)
        risk_categories = list(pattern_risks.get('detected_risks', {}).keys())
        
        prompt = f"""Assess safety risks in this psychiatric documentation. Focus on immediate safety concerns and protective factors.

CLINICAL DOCUMENTATION:
{content[:1000]}

PATTERN ANALYSIS detected {total_patterns} risk indicators in categories: {', '.join(risk_categories)}

SAFETY ASSESSMENT:
Rate each risk area (0-10 scale):
- Suicide Risk: [0-10] 
- Violence Risk: [0-10]
- Substance Risk: [0-10]
- Overall Safety: [LOW/MODERATE/HIGH risk]

IMMEDIATE CONCERNS: [list any urgent safety issues]
PROTECTIVE FACTORS: [list factors that reduce risk]
RECOMMENDATIONS: [specific safety interventions needed]

Focus on patient safety. Be specific about risk level and protective factors.
Use clinical judgment to assess context and severity."""

        return prompt
    
    def _parse_llm_risk_response(self, llm_text: str) -> Dict[str, Any]:
        """
        Parse LLM risk assessment response
        """
        try:
            risk_scores = {}
            
            # Extract numeric risk scores
            score_patterns = [
                (r'Suicide Risk:\s*(\d+)', 'suicide_risk'),
                (r'Violence Risk:\s*(\d+)', 'violence_risk'), 
                (r'Substance Risk:\s*(\d+)', 'substance_risk')
            ]
            
            for pattern, risk_type in score_patterns:
                match = re.search(pattern, llm_text, re.IGNORECASE)
                if match:
                    score = int(match.group(1))
                    risk_scores[risk_type] = min(10, max(0, score))  # Clamp 0-10
            
            # Extract overall safety level
            safety_match = re.search(r'Overall Safety:\s*(\w+)', llm_text, re.IGNORECASE)
            overall_safety = safety_match.group(1).upper() if safety_match else 'UNKNOWN'
            
            # Extract sections
            concerns_match = re.search(r'IMMEDIATE CONCERNS:\s*([^\n]+(?:\n(?!(?:PROTECTIVE|RECOMMENDATIONS):)[^\n]*)*)', llm_text, re.IGNORECASE | re.DOTALL)
            immediate_concerns = concerns_match.group(1).strip() if concerns_match else ''
            
            protective_match = re.search(r'PROTECTIVE FACTORS:\s*([^\n]+(?:\n(?!RECOMMENDATIONS:)[^\n]*)*)', llm_text, re.IGNORECASE | re.DOTALL)
            protective_factors = protective_match.group(1).strip() if protective_match else ''
            
            recommendations_match = re.search(r'RECOMMENDATIONS:\s*([^\n]+(?:\n[^\n]*)*)', llm_text, re.IGNORECASE | re.DOTALL)
            recommendations = recommendations_match.group(1).strip() if recommendations_match else ''
            
            return {
                'method': 'llm_risk_analysis',
                'risk_scores': risk_scores,
                'overall_safety': overall_safety,
                'immediate_concerns': immediate_concerns,
                'protective_factors': protective_factors,
                'recommendations': recommendations,
                'raw_response': llm_text[:400]
            }
            
        except Exception as e:
            logger.error(f"Failed to parse LLM risk response: {e}")
            return {
                'method': 'llm_risk_analysis',
                'error': f'Parse error: {str(e)}',
                'raw_response': llm_text[:200]
            }
    
    def _calculate_risk_scores(self, pattern_risks: Dict[str, Any], llm_risks: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate final risk scores combining patterns and LLM analysis
        """
        risk_scores = {}
        detected_risks = pattern_risks.get('detected_risks', {})
        
        for category, risk_data in detected_risks.items():
            # Pattern-based scoring
            high_risk_count = len(risk_data.get('high_risk_matches', []))
            moderate_risk_count = len(risk_data.get('moderate_risk_matches', []))
            protective_count = len(risk_data.get('protective_factors', []))
            
            # Calculate pattern score (0-1 scale)
            pattern_score = min(1.0, (high_risk_count * 0.8 + moderate_risk_count * 0.4) / 3)
            
            # Adjust for protective factors
            if protective_count > 0:
                pattern_score *= max(0.3, 1.0 - (protective_count * 0.2))
            
            # Get LLM score if available
            llm_score = 0.5  # Default
            if 'error' not in llm_risks:
                llm_risk_scores = llm_risks.get('risk_scores', {})
                if category in llm_risk_scores:
                    llm_score = llm_risk_scores[category] / 10.0  # Convert 0-10 to 0-1
            
            # Combine scores (pattern weighted higher for safety)
            if 'error' in llm_risks:
                final_score = pattern_score
            else:
                final_score = (pattern_score * 0.7) + (llm_score * 0.3)
            
            # Risk level classification
            if final_score >= 0.7:
                risk_level = 'HIGH'
            elif final_score >= 0.4:
                risk_level = 'MODERATE'
            elif final_score >= 0.1:
                risk_level = 'LOW'
            else:
                risk_level = 'MINIMAL'
            
            risk_scores[category] = {
                'score': final_score,
                'level': risk_level,
                'pattern_score': pattern_score,
                'llm_score': llm_score,
                'high_risk_indicators': high_risk_count,
                'moderate_risk_indicators': moderate_risk_count,
                'protective_factors': protective_count,
                'weight': risk_data['weight'],
                'description': risk_data['description']
            }
        
        return risk_scores
    
    def _generate_safety_recommendations(self, risk_assessment: Dict[str, Any]) -> List[str]:
        """
        Generate specific safety recommendations based on risk assessment
        """
        recommendations = []
        
        # Check for high-risk categories
        high_risk_categories = [
            category for category, data in risk_assessment.items()
            if data.get('level') == 'HIGH'
        ]
        
        if 'suicide_risk' in high_risk_categories:
            recommendations.extend([
                "IMMEDIATE: Assess for suicide plan, means, and intent",
                "Consider safety planning or higher level of care",
                "Remove means of self-harm if possible",
                "Increase frequency of contact/monitoring"
            ])
        
        if 'violence_risk' in high_risk_categories:
            recommendations.extend([
                "IMMEDIATE: Assess for violence plan and target identification",
                "Consider Tarasoff duty to warn if specific threat identified",
                "Evaluate need for involuntary commitment",
                "Assess access to weapons"
            ])
        
        if 'substance_risk' in high_risk_categories:
            recommendations.extend([
                "Assess for withdrawal symptoms and medical stabilization needs",
                "Consider substance abuse treatment referral",
                "Evaluate medication interactions"
            ])
        
        if 'psychosis_risk' in high_risk_categories:
            recommendations.extend([
                "Assess reality testing and command hallucinations",
                "Consider antipsychotic medication evaluation",
                "Monitor for medication compliance"
            ])
        
        # General moderate risk recommendations
        moderate_risk_categories = [
            category for category, data in risk_assessment.items()
            if data.get('level') == 'MODERATE'
        ]
        
        if moderate_risk_categories:
            recommendations.append("Develop safety plan and coping strategies")
            recommendations.append("Schedule follow-up within appropriate timeframe")
        
        return recommendations[:8]  # Limit to top 8 recommendations
    
    def _identify_immediate_concerns(self, risk_assessment: Dict[str, Any]) -> List[str]:
        """
        Identify immediate safety concerns requiring urgent attention
        """
        immediate = []
        
        for category, data in risk_assessment.items():
            if data.get('level') == 'HIGH':
                if category == 'suicide_risk':
                    immediate.append("HIGH SUICIDE RISK - Immediate safety assessment required")
                elif category == 'violence_risk':
                    immediate.append("HIGH VIOLENCE RISK - Assess for specific threats")
                elif category == 'substance_risk':
                    immediate.append("HIGH SUBSTANCE RISK - Medical evaluation needed")
                elif category == 'psychosis_risk':
                    immediate.append("HIGH PSYCHOSIS RISK - Reality testing compromised")
        
        return immediate
    
    def _identify_protective_factors(self, pattern_risks: Dict[str, Any]) -> List[str]:
        """
        Identify protective factors that reduce risk
        """
        protective = []
        detected_risks = pattern_risks.get('detected_risks', {})
        
        for category, risk_data in detected_risks.items():
            protective_matches = risk_data.get('protective_factors', [])
            if protective_matches:
                for match in protective_matches[:2]:  # First 2 per category
                    protective.append(f"{category}: {match['pattern']}")
        
        return protective[:5]  # Limit to top 5
    
    def _create_risk_summary(self, risk_assessment: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create summary of risk assessment
        """
        high_risks = sum(1 for data in risk_assessment.values() if data.get('level') == 'HIGH')
        moderate_risks = sum(1 for data in risk_assessment.values() if data.get('level') == 'MODERATE')
        
        # Calculate weighted risk score
        total_weighted_score = sum(
            data['score'] * data['weight']
            for data in risk_assessment.values()
        )
        
        total_weight = sum(data['weight'] for data in risk_assessment.values())
        overall_risk_score = total_weighted_score / total_weight if total_weight > 0 else 0
        
        if overall_risk_score >= 0.7:
            overall_level = 'HIGH'
        elif overall_risk_score >= 0.4:
            overall_level = 'MODERATE'
        else:
            overall_level = 'LOW'
        
        return {
            'overall_risk_level': overall_level,
            'overall_risk_score': overall_risk_score,
            'high_risk_categories': high_risks,
            'moderate_risk_categories': moderate_risks,
            'total_categories_assessed': len(risk_assessment)
        }
    
    def _calculate_risk_confidence(self, pattern_risks: Dict[str, Any], llm_risks: Dict[str, Any]) -> float:
        """
        Calculate confidence in risk assessment
        High confidence is critical for safety decisions
        """
        # Base confidence on pattern detection clarity
        total_patterns = pattern_risks.get('total_risk_patterns', 0)
        
        if total_patterns > 5:
            pattern_confidence = 0.9
        elif total_patterns > 2:
            pattern_confidence = 0.8
        elif total_patterns > 0:
            pattern_confidence = 0.7
        else:
            pattern_confidence = 0.5  # No clear patterns found
        
        # LLM validation confidence
        if 'error' in llm_risks:
            llm_confidence = 0.5  # Neutral when LLM unavailable
        else:
            # High confidence if LLM provided structured response
            llm_response = llm_risks.get('risk_scores', {})
            if len(llm_response) > 0:
                llm_confidence = 0.8
            else:
                llm_confidence = 0.6
        
        # Weight pattern analysis higher for safety-critical decisions
        overall_confidence = (pattern_confidence * 0.8) + (llm_confidence * 0.2)
        
        return min(0.95, max(0.4, overall_confidence))  # Clamp between 0.4-0.95