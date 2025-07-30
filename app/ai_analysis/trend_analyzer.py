"""
Clinical Trend Analyzer - AI Analysis Module
Analyzes trends and changes in patient clinical data over time
Optimized for quantized LLM pattern recognition with temporal analysis
"""

import logging
import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from .analysis_engine import AnalysisResult

logger = logging.getLogger(__name__)

class TrendAnalyzer:
    """
    Analyzes clinical trends from historical documentation
    Focuses on pattern recognition of temporal changes
    """
    
    def __init__(self, analysis_engine):
        self.engine = analysis_engine
        
        # Trend indicators and change patterns
        self.trend_patterns = {
            'improvement': {
                'patterns': [
                    r'better|improving|progress|good response',
                    r'less|decreased|reduced|diminished',
                    r'stable|stabilized|controlled|managed',
                    r'effective|working|helping|benefit'
                ],
                'weight': 0.3,
                'direction': 'positive'
            },
            'deterioration': {
                'patterns': [
                    r'worse|worsening|deteriorating|declining',
                    r'increased|more|higher|elevated',
                    r'poor response|not working|ineffective',
                    r'relapse|recurrence|setback|crisis'
                ],
                'weight': 0.4,  # Higher weight as concerning
                'direction': 'negative'
            },
            'stability': {
                'patterns': [
                    r'stable|unchanged|same|consistent',
                    r'maintained|steady|plateau|baseline',
                    r'no change|status quo|as before'
                ],
                'weight': 0.2,
                'direction': 'neutral'
            },
            'fluctuation': {
                'patterns': [
                    r'fluctuat|variable|inconsistent|up and down',
                    r'good days.*bad days|better.*worse',
                    r'intermittent|episodic|cyclic|periodic'
                ],
                'weight': 0.3,
                'direction': 'variable'
            }
        }
        
        # Clinical domains to track trends
        self.clinical_domains = {
            'mood': [
                r'mood|depression|depressed|anxiety|anxious',
                r'manic|hypomanic|irritable|sad|happy',
                r'emotional|feeling|affect'
            ],
            'symptoms': [
                r'symptom|hallucination|delusion|paranoia',
                r'sleep|energy|appetite|concentration',
                r'pain|nausea|headache|dizziness'
            ],
            'functioning': [
                r'function|work|social|relationship',
                r'activities|daily living|self.care|adl',
                r'independent|dependent|assistance'
            ],
            'medication': [
                r'medication|drug|dose|dosage|mg',
                r'side effect|adverse|reaction|tolerance',
                r'compliant|adherent|missed|stopped'
            ],
            'cognition': [
                r'memory|concentration|focus|attention',
                r'cognitive|thinking|confused|oriented',
                r'insight|judgment|awareness'
            ]
        }
        
        # Temporal indicators
        self.temporal_indicators = [
            r'since last|from last|compared to',
            r'over.*week|over.*month|over.*time',
            r'previously|before|earlier|past',
            r'now|currently|today|recently',
            r'improving|worsening|changing'
        ]
    
    def analyze_trends(self, content: str, content_id: str, patient_id: str, 
                      historical_data: List[Dict[str, Any]] = None) -> AnalysisResult:
        """
        Analyze trends in clinical documentation
        
        Args:
            content: Current clinical documentation text
            content_id: Unique identifier for content
            patient_id: Patient identifier  
            historical_data: Optional list of previous documentation for comparison
            
        Returns:
            AnalysisResult with trend analysis and temporal insights
        """
        start_time = datetime.now()
        
        try:
            # Step 1: Analyze current document for trend indicators
            current_trends = self._analyze_current_trends(content)
            
            # Step 2: Compare with historical data if available
            temporal_analysis = self._analyze_temporal_patterns(content, historical_data)
            
            # Step 3: LLM-enhanced trend interpretation
            llm_trends = self._analyze_trends_with_llm(content, current_trends, historical_data)
            
            # Step 4: Synthesize trend insights
            trend_synthesis = self._synthesize_trend_analysis(current_trends, temporal_analysis, llm_trends)
            
            results = {
                'current_trends': current_trends,
                'temporal_analysis': temporal_analysis,
                'llm_insights': llm_trends,
                'trend_synthesis': trend_synthesis,
                'trend_summary': self._create_trend_summary(trend_synthesis),
                'clinical_recommendations': self._generate_trend_recommendations(trend_synthesis)
            }
            
            # Calculate confidence based on data availability and pattern clarity
            confidence = self._calculate_trend_confidence(current_trends, temporal_analysis, llm_trends, historical_data)
            
            return AnalysisResult(
                analysis_type="trends",
                patient_id=patient_id,
                content_id=content_id,
                results=results,
                confidence=confidence,
                timestamp=datetime.now(),
                processing_time_ms=0  # Will be set by calling function
            )
            
        except Exception as e:
            logger.error(f"Error in trend analysis: {e}")
            return AnalysisResult(
                analysis_type="trends",
                patient_id=patient_id,
                content_id=content_id,
                results={
                    'error': str(e),
                    'trend_summary': {'note': 'Trend analysis requires historical data'},
                    'fallback_mode': True
                },
                confidence=0.0,
                timestamp=datetime.now(),
                processing_time_ms=0
            )
    
    def _analyze_current_trends(self, content: str) -> Dict[str, Any]:
        """
        Analyze trend indicators in current documentation
        """
        content_lower = content.lower()
        trend_indicators = {}
        
        # Check for trend patterns in each clinical domain
        for domain, domain_patterns in self.clinical_domains.items():
            domain_trends = {}
            
            for trend_type, trend_config in self.trend_patterns.items():
                matches = []
                
                # Look for trend patterns combined with domain patterns
                for trend_pattern in trend_config['patterns']:
                    for domain_pattern in domain_patterns:
                        # Create combined patterns to find domain-specific trends
                        combined_patterns = [
                            f"{trend_pattern}.*{domain_pattern}",
                            f"{domain_pattern}.*{trend_pattern}",
                            # Also check for proximity (within 50 characters)
                        ]
                        
                        for pattern in combined_patterns:
                            pattern_matches = list(re.finditer(pattern, content_lower, re.IGNORECASE))
                            for match in pattern_matches:
                                context_start = max(0, match.start() - 50)
                                context_end = min(len(content), match.end() + 50)
                                context = content[context_start:context_end].strip()
                                
                                matches.append({
                                    'pattern': match.group(0),
                                    'context': context,
                                    'position': match.start()
                                })
                
                if matches:
                    domain_trends[trend_type] = {
                        'matches': matches,
                        'count': len(matches),
                        'direction': trend_config['direction'],
                        'weight': trend_config['weight']
                    }
            
            if domain_trends:
                trend_indicators[domain] = domain_trends
        
        # Also look for general temporal indicators
        temporal_matches = []
        for pattern in self.temporal_indicators:
            matches = list(re.finditer(pattern, content_lower, re.IGNORECASE))
            temporal_matches.extend([match.group(0) for match in matches])
        
        return {
            'method': 'current_trend_analysis',
            'domain_trends': trend_indicators,
            'temporal_indicators': temporal_matches,
            'has_trend_language': len(temporal_matches) > 0,
            'total_trend_patterns': sum(
                sum(trend_data['count'] for trend_data in domain.values())
                for domain in trend_indicators.values()
            )
        }
    
    def _analyze_temporal_patterns(self, content: str, historical_data: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyze temporal patterns across multiple documents
        """
        if not historical_data:
            return {
                'method': 'temporal_analysis',
                'status': 'insufficient_data',
                'note': 'Requires multiple documents for temporal analysis'
            }
        
        # For now, return placeholder structure
        # This would be implemented with actual historical comparison
        return {
            'method': 'temporal_analysis',
            'historical_documents': len(historical_data),
            'time_span_days': 0,  # Would calculate from actual dates
            'note': 'Historical trend analysis not yet implemented - requires database integration'
        }
    
    def _analyze_trends_with_llm(self, content: str, current_trends: Dict[str, Any], 
                                historical_data: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Use LLM for nuanced trend interpretation
        """
        try:
            # Create focused trend analysis prompt
            prompt = self._create_trend_analysis_prompt(content, current_trends)
            
            # Call Ollama
            response = self.engine._call_ollama(prompt)
            
            if 'response' in response:
                return self._parse_llm_trend_response(response['response'])
            else:
                return {'method': 'llm_trend_analysis', 'error': 'No response from LLM'}
                
        except Exception as e:
            logger.error(f"LLM trend analysis failed: {e}")
            return {'method': 'llm_trend_analysis', 'error': str(e)}
    
    def _create_trend_analysis_prompt(self, content: str, current_trends: Dict[str, Any]) -> str:
        """
        Create optimized prompt for trend analysis
        """
        trend_count = current_trends.get('total_trend_patterns', 0)
        has_temporal = current_trends.get('has_trend_language', False)
        
        prompt = f"""Analyze trends and changes mentioned in this clinical documentation. Focus on identifying improvement, worsening, or stability.

CLINICAL NOTE:
{content[:1000]}

PATTERN ANALYSIS found {trend_count} trend indicators, temporal language: {has_temporal}

TREND ANALYSIS:
Identify trends in these areas:
1. MOOD/SYMPTOMS: Are symptoms improving, worsening, or stable?
2. FUNCTIONING: Is daily functioning better, worse, or unchanged?
3. MEDICATIONS: Any medication changes or responses mentioned?
4. OVERALL TRAJECTORY: What is the overall clinical direction?

RESPOND IN FORMAT:
MOOD: [improving/stable/worsening/unclear] - [brief explanation]
FUNCTIONING: [improving/stable/worsening/unclear] - [brief explanation]  
MEDICATIONS: [effective/ineffective/changed/unclear] - [brief explanation]
OVERALL: [positive/negative/stable/mixed] trajectory
TIMEFRAME: [when these changes occurred if mentioned]
CONFIDENCE: [high/medium/low] based on documentation clarity

Be specific about what is changing and in what direction."""

        return prompt
    
    def _parse_llm_trend_response(self, llm_text: str) -> Dict[str, Any]:
        """
        Parse LLM trend analysis response
        """
        try:
            trends = {}
            
            # Extract trend assessments for each domain
            domains = ['MOOD', 'FUNCTIONING', 'MEDICATIONS', 'OVERALL', 'TIMEFRAME', 'CONFIDENCE']
            
            for domain in domains:
                pattern = f'{domain}:\\s*([^\\n]+)'
                match = re.search(pattern, llm_text, re.IGNORECASE)
                
                if match:
                    content = match.group(1).strip()
                    
                    # Extract trend direction for clinical domains
                    if domain in ['MOOD', 'FUNCTIONING', 'MEDICATIONS']:
                        direction_match = re.search(r'(improving|stable|worsening|effective|ineffective|changed|unclear)', content, re.IGNORECASE)
                        direction = direction_match.group(1).lower() if direction_match else 'unclear'
                        
                        trends[domain.lower()] = {
                            'direction': direction,
                            'explanation': content
                        }
                    else:
                        trends[domain.lower()] = content
                else:
                    trends[domain.lower()] = 'not specified'
            
            return {
                'method': 'llm_trend_analysis',
                'trend_assessments': trends,
                'raw_response': llm_text[:400]
            }
            
        except Exception as e:
            logger.error(f"Failed to parse LLM trend response: {e}")
            return {
                'method': 'llm_trend_analysis',
                'error': f'Parse error: {str(e)}',
                'raw_response': llm_text[:200]
            }
    
    def _synthesize_trend_analysis(self, current_trends: Dict[str, Any], 
                                 temporal_analysis: Dict[str, Any], 
                                 llm_trends: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synthesize all trend analysis into coherent insights
        """
        synthesis = {
            'overall_trend_direction': 'unclear',
            'confidence_level': 'low',
            'key_findings': [],
            'areas_of_concern': [],
            'areas_of_improvement': []
        }
        
        # Analyze pattern-based trends
        domain_trends = current_trends.get('domain_trends', {})
        
        positive_indicators = 0
        negative_indicators = 0
        
        for domain, trends in domain_trends.items():
            for trend_type, trend_data in trends.items():
                direction = trend_data['direction']
                count = trend_data['count']
                
                if direction == 'positive':
                    positive_indicators += count
                    synthesis['areas_of_improvement'].append(f"{domain}: {trend_type} trends detected")
                elif direction == 'negative':
                    negative_indicators += count
                    synthesis['areas_of_concern'].append(f"{domain}: {trend_type} trends detected")
        
        # Determine overall direction from patterns
        if positive_indicators > negative_indicators:
            synthesis['overall_trend_direction'] = 'improving'
        elif negative_indicators > positive_indicators:
            synthesis['overall_trend_direction'] = 'declining'
        elif positive_indicators > 0 or negative_indicators > 0:
            synthesis['overall_trend_direction'] = 'mixed'
        else:
            synthesis['overall_trend_direction'] = 'stable'
        
        # Incorporate LLM insights if available
        if 'error' not in llm_trends:
            llm_assessments = llm_trends.get('trend_assessments', {})
            
            # Override with LLM overall assessment if available
            llm_overall = llm_assessments.get('overall', '')
            if 'positive' in llm_overall.lower():
                synthesis['overall_trend_direction'] = 'improving'
            elif 'negative' in llm_overall.lower():
                synthesis['overall_trend_direction'] = 'declining'
            elif 'mixed' in llm_overall.lower():
                synthesis['overall_trend_direction'] = 'mixed'
            
            # Add LLM confidence
            llm_confidence = llm_assessments.get('confidence', 'low')
            if 'high' in llm_confidence.lower():
                synthesis['confidence_level'] = 'high'
            elif 'medium' in llm_confidence.lower():
                synthesis['confidence_level'] = 'medium'
        
        # Generate key findings
        if current_trends.get('has_trend_language'):
            synthesis['key_findings'].append("Document contains explicit trend language")
        
        total_patterns = current_trends.get('total_trend_patterns', 0)
        if total_patterns > 5:
            synthesis['key_findings'].append(f"Multiple trend indicators detected ({total_patterns})")
        elif total_patterns > 0:
            synthesis['key_findings'].append(f"Some trend indicators detected ({total_patterns})")
        else:
            synthesis['key_findings'].append("Limited trend information available")
        
        return synthesis
    
    def _create_trend_summary(self, trend_synthesis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create concise trend summary
        """
        return {
            'overall_direction': trend_synthesis.get('overall_trend_direction', 'unclear'),
            'confidence': trend_synthesis.get('confidence_level', 'low'),
            'key_findings_count': len(trend_synthesis.get('key_findings', [])),
            'concerns_identified': len(trend_synthesis.get('areas_of_concern', [])),
            'improvements_noted': len(trend_synthesis.get('areas_of_improvement', []))
        }
    
    def _generate_trend_recommendations(self, trend_synthesis: Dict[str, Any]) -> List[str]:
        """
        Generate clinical recommendations based on trend analysis
        """
        recommendations = []
        
        overall_direction = trend_synthesis.get('overall_trend_direction', 'unclear')
        
        if overall_direction == 'declining':
            recommendations.extend([
                "Monitor closely for continued deterioration",
                "Consider treatment plan adjustments",
                "Evaluate need for increased intervention level"
            ])
        elif overall_direction == 'improving':
            recommendations.extend([
                "Continue current treatment approach",
                "Monitor to ensure sustained improvement",
                "Consider gradual step-down if appropriate"
            ])
        elif overall_direction == 'mixed':
            recommendations.extend([
                "Address areas of concern while reinforcing improvements",
                "Consider targeted interventions for declining domains"
            ])
        else:
            recommendations.extend([
                "Gather more specific trend information in future documentation",
                "Consider structured outcome measures for trend tracking"
            ])
        
        # Add confidence-based recommendations
        confidence = trend_synthesis.get('confidence_level', 'low')
        if confidence == 'low':
            recommendations.append("Document more explicit comparison to previous visits for trend clarity")
        
        return recommendations[:5]  # Limit to top 5
    
    def _calculate_trend_confidence(self, current_trends: Dict[str, Any], 
                                  temporal_analysis: Dict[str, Any],
                                  llm_trends: Dict[str, Any],
                                  historical_data: List[Dict[str, Any]] = None) -> float:
        """
        Calculate confidence in trend analysis
        """
        confidence_factors = []
        
        # Factor 1: Current trend indicators
        total_patterns = current_trends.get('total_trend_patterns', 0)
        if total_patterns > 5:
            confidence_factors.append(0.8)
        elif total_patterns > 2:
            confidence_factors.append(0.7)
        elif total_patterns > 0:
            confidence_factors.append(0.6)
        else:
            confidence_factors.append(0.3)
        
        # Factor 2: Temporal language presence
        has_temporal = current_trends.get('has_trend_language', False)
        confidence_factors.append(0.8 if has_temporal else 0.4)
        
        # Factor 3: Historical data availability
        if historical_data and len(historical_data) > 1:
            confidence_factors.append(0.9)
        else:
            confidence_factors.append(0.3)  # Low confidence without historical context
        
        # Factor 4: LLM analysis success
        if 'error' in llm_trends:
            confidence_factors.append(0.5)
        else:
            llm_confidence = llm_trends.get('trend_assessments', {}).get('confidence', 'low')
            if 'high' in llm_confidence.lower():
                confidence_factors.append(0.8)
            elif 'medium' in llm_confidence.lower():
                confidence_factors.append(0.7)
            else:
                confidence_factors.append(0.6)
        
        # Calculate weighted average (historical data is most important for trends)
        weights = [0.2, 0.2, 0.4, 0.2]  # Historical data gets highest weight
        overall_confidence = sum(cf * w for cf, w in zip(confidence_factors, weights))
        
        return min(0.9, max(0.1, overall_confidence))  # Clamp between 0.1-0.9