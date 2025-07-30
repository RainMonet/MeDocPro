"""
Clinical Pattern Extractor - AI Analysis Module
Extracts clinical patterns and key information from documentation
Optimized for quantized LLM pattern recognition capabilities
"""

import logging
import json
import re
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from .analysis_engine import AnalysisResult

logger = logging.getLogger(__name__)

class PatternExtractor:
    """
    Extracts clinical patterns from documentation using quantized LLMs
    Focuses on structured pattern recognition tasks
    """
    
    def __init__(self, analysis_engine):
        self.engine = analysis_engine
        
        # Clinical pattern categories for extraction
        self.pattern_categories = {
            'symptoms': {
                'psychiatric': [
                    r'depression|depressed|sad|hopeless|worthless',
                    r'anxiety|anxious|worried|nervous|panic',
                    r'manic|hypomanic|elevated mood|grandiose',
                    r'psychosis|hallucination|delusion|paranoid',
                    r'insomnia|sleep disturbance|fatigue|energy',
                    r'concentration|focus|memory|cognitive'
                ],
                'physical': [
                    r'headache|pain|nausea|dizziness',
                    r'appetite|weight loss|weight gain',
                    r'tremor|restless|agitation|sedation'
                ]
            },
            'medications': {
                'patterns': [
                    r'mg|mcg|units|\d+\s*x\s*daily|bid|tid|qid',
                    r'started|discontinued|increased|decreased|adjusted',
                    r'side effect|adverse|reaction|tolerance'
                ],
                'drug_classes': [
                    r'antidepressant|ssri|snri|tricyclic|maoi',
                    r'antipsychotic|typical|atypical|risperidone|olanzapine',
                    r'mood stabilizer|lithium|valproate|lamotrigine',
                    r'anxiolytic|benzodiazepine|buspirone'
                ]
            },
            'risk_factors': {
                'suicide': [
                    r'suicidal|si|self.harm|self.injury',
                    r'plan|method|intent|means',
                    r'hopeless|burden|better off dead'
                ],
                'violence': [
                    r'homicidal|hi|violent|aggressive',
                    r'anger|rage|irritable|hostile'
                ],
                'substance': [
                    r'alcohol|drinking|etoh|beer|wine|liquor',
                    r'drug|substance|marijuana|cocaine|opioid',
                    r'abuse|dependence|addiction|withdrawal'
                ]
            },
            'functioning': {
                'social': [
                    r'relationship|family|friends|social',
                    r'isolated|withdrawn|support system'
                ],
                'occupational': [
                    r'work|job|employment|school|student',
                    r'disability|unable to work|missed work'
                ],
                'activities': [
                    r'activities of daily living|adl|self.care',
                    r'hobbies|interests|enjoyment|pleasure'
                ]
            }
        }
        
        # Temporal patterns for tracking changes
        self.temporal_patterns = [
            r'since|for|over|past|last|within|during',
            r'days?|weeks?|months?|years?|hours?',
            r'getting worse|improving|stable|unchanged',
            r'new|recent|chronic|acute|ongoing'
        ]
    
    def extract_patterns(self, content: str, content_id: str, patient_id: str) -> AnalysisResult:
        """
        Extract clinical patterns from documentation
        
        Args:
            content: Clinical documentation text
            content_id: Unique identifier for content
            patient_id: Patient identifier
            
        Returns:
            AnalysisResult with extracted patterns and insights
        """
        start_time = datetime.now()
        
        try:
            # Step 1: Rule-based pattern extraction (fast, reliable)
            rule_patterns = self._extract_rule_based_patterns(content)
            
            # Step 2: LLM-enhanced pattern recognition (for context and nuance)
            llm_patterns = self._extract_llm_patterns(content, rule_patterns)
            
            # Step 3: Combine and structure results
            final_patterns = self._combine_pattern_results(rule_patterns, llm_patterns)
            
            # Step 4: Generate clinical insights
            insights = self._generate_clinical_insights(final_patterns)
            
            results = {
                'extracted_patterns': final_patterns,
                'clinical_insights': insights,
                'pattern_summary': self._create_pattern_summary(final_patterns),
                'confidence_scores': self._calculate_pattern_confidence(rule_patterns, llm_patterns),
                'temporal_analysis': self._analyze_temporal_patterns(content)
            }
            
            # Calculate overall confidence
            confidence = self._calculate_overall_confidence(rule_patterns, llm_patterns)
            
            return AnalysisResult(
                analysis_type="patterns",
                patient_id=patient_id,
                content_id=content_id,
                results=results,
                confidence=confidence,
                timestamp=datetime.now(),
                processing_time_ms=0  # Will be set by calling function
            )
            
        except Exception as e:
            logger.error(f"Error in pattern extraction: {e}")
            return AnalysisResult(
                analysis_type="patterns",
                patient_id=patient_id,
                content_id=content_id,
                results={
                    'error': str(e),
                    'extracted_patterns': {},
                    'fallback_mode': True
                },
                confidence=0.0,
                timestamp=datetime.now(),
                processing_time_ms=0
            )
    
    def _extract_rule_based_patterns(self, content: str) -> Dict[str, Any]:
        """
        Extract patterns using rule-based matching
        Fast and reliable baseline extraction
        """
        content_lower = content.lower()
        extracted = {}
        
        for category, subcategories in self.pattern_categories.items():
            extracted[category] = {}
            
            for subcategory, patterns in subcategories.items():
                matches = []
                contexts = []
                
                for pattern in patterns:
                    # Find all matches with surrounding context
                    for match in re.finditer(pattern, content_lower, re.IGNORECASE):
                        match_text = match.group(0)
                        start_pos = max(0, match.start() - 50)
                        end_pos = min(len(content), match.end() + 50)
                        context = content[start_pos:end_pos].strip()
                        
                        matches.append(match_text)
                        contexts.append(context)
                
                if matches:
                    extracted[category][subcategory] = {
                        'matches': matches,
                        'contexts': contexts,
                        'count': len(matches)
                    }
        
        return {
            'method': 'rule_based',
            'patterns': extracted,
            'total_patterns': sum(
                sum(subcat.get('count', 0) for subcat in cat.values()) 
                for cat in extracted.values()
            )
        }
    
    def _extract_llm_patterns(self, content: str, rule_patterns: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use LLM for nuanced pattern extraction and validation
        """
        try:
            # Create focused prompt for pattern extraction
            prompt = self._create_pattern_extraction_prompt(content, rule_patterns)
            
            # Call Ollama
            response = self.engine._call_ollama(prompt)
            
            if 'response' in response:
                return self._parse_llm_pattern_response(response['response'])
            else:
                return {'method': 'llm_extraction', 'error': 'No response from LLM'}
                
        except Exception as e:
            logger.error(f"LLM pattern extraction failed: {e}")
            return {'method': 'llm_extraction', 'error': str(e)}
    
    def _create_pattern_extraction_prompt(self, content: str, rule_patterns: Dict[str, Any]) -> str:
        """
        Create optimized prompt for pattern extraction
        """
        rule_count = rule_patterns.get('total_patterns', 0)
        
        prompt = f"""Extract key clinical patterns from this psychiatric documentation. Focus on identifying symptoms, medications, and functional status.

CLINICAL NOTE:
{content[:1200]}

RULE-BASED ANALYSIS found {rule_count} patterns.

EXTRACT AND CATEGORIZE:
1. SYMPTOMS: List main psychiatric and physical symptoms mentioned
2. MEDICATIONS: List medications, dosages, and changes  
3. FUNCTIONING: Describe work, social, and daily functioning
4. TIMELINE: Note when symptoms started or changed
5. SEVERITY: Rate symptom severity if mentioned

RESPOND IN FORMAT:
SYMPTOMS: [list key symptoms with severity if noted]
MEDICATIONS: [list meds with dosages/changes]
FUNCTIONING: [work/social/daily functioning status]
TIMELINE: [when symptoms began/changed]
INSIGHTS: [key clinical observations]

Be concise and specific. Focus on clinically relevant patterns."""

        return prompt
    
    def _parse_llm_pattern_response(self, llm_text: str) -> Dict[str, Any]:
        """
        Parse LLM pattern extraction response
        """
        try:
            patterns = {}
            
            # Extract each category
            categories = ['SYMPTOMS', 'MEDICATIONS', 'FUNCTIONING', 'TIMELINE', 'INSIGHTS']
            
            for category in categories:
                pattern = f'{category}:\\s*([^\\n]+(?:\\n(?!(?:SYMPTOMS|MEDICATIONS|FUNCTIONING|TIMELINE|INSIGHTS):)[^\\n]*)*)'
                match = re.search(pattern, llm_text, re.IGNORECASE | re.DOTALL)
                
                if match:
                    content = match.group(1).strip()
                    # Split into list items if format suggests it
                    if content.startswith('[') and content.endswith(']'):
                        content = content[1:-1]  # Remove brackets
                    
                    patterns[category.lower()] = content
                else:
                    patterns[category.lower()] = ''
            
            return {
                'method': 'llm_extraction',
                'extracted_categories': patterns,
                'raw_response': llm_text[:300]
            }
            
        except Exception as e:
            logger.error(f"Failed to parse LLM pattern response: {e}")
            return {
                'method': 'llm_extraction',
                'error': f'Parse error: {str(e)}',
                'raw_response': llm_text[:200]
            }
    
    def _combine_pattern_results(self, rule_patterns: Dict[str, Any], llm_patterns: Dict[str, Any]) -> Dict[str, Any]:
        """
        Combine rule-based and LLM pattern extraction results
        """
        combined = {
            'rule_based': rule_patterns.get('patterns', {}),
            'llm_enhanced': llm_patterns.get('extracted_categories', {}),
            'total_rule_patterns': rule_patterns.get('total_patterns', 0)
        }
        
        # Create unified view
        unified_patterns = {}
        
        # Process rule-based patterns
        for category, subcategories in rule_patterns.get('patterns', {}).items():
            if subcategories:  # Only include categories with actual matches
                unified_patterns[category] = {
                    'rule_matches': subcategories,
                    'llm_insights': llm_patterns.get('extracted_categories', {}).get(category, '')
                }
        
        # Add LLM-only insights
        for category, content in llm_patterns.get('extracted_categories', {}).items():
            if content and category not in unified_patterns:
                unified_patterns[category] = {
                    'rule_matches': {},
                    'llm_insights': content
                }
        
        combined['unified_patterns'] = unified_patterns
        return combined
    
    def _generate_clinical_insights(self, patterns: Dict[str, Any]) -> List[str]:
        """
        Generate clinical insights from extracted patterns
        """
        insights = []
        
        # Analyze pattern density
        total_patterns = patterns.get('total_rule_patterns', 0)
        if total_patterns > 10:
            insights.append("Rich clinical documentation with multiple pattern detections")
        elif total_patterns > 5:
            insights.append("Moderate clinical detail captured")
        else:
            insights.append("Limited clinical patterns detected - consider more detailed documentation")
        
        # Analyze specific pattern categories
        unified = patterns.get('unified_patterns', {})
        
        if 'symptoms' in unified:
            symptom_data = unified['symptoms']
            if symptom_data.get('rule_matches'):
                insights.append(f"Multiple symptom categories documented")
        
        if 'medications' in unified:
            med_data = unified['medications']
            if med_data.get('rule_matches'):
                insights.append("Medication information captured")
        
        if 'risk_factors' in unified:
            risk_data = unified['risk_factors']
            if risk_data.get('rule_matches'):
                insights.append("Risk factors identified - ensure appropriate safety planning")
        
        # LLM insights
        llm_insights = unified.get('insights', {}).get('llm_insights', '')
        if llm_insights and 'error' not in llm_insights:
            insights.append(f"AI insight: {llm_insights[:100]}")
        
        return insights[:5]  # Limit to top 5 insights
    
    def _create_pattern_summary(self, patterns: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a summary of extracted patterns
        """
        summary = {
            'total_patterns': patterns.get('total_rule_patterns', 0),
            'categories_found': len(patterns.get('unified_patterns', {})),
            'pattern_density': 'high' if patterns.get('total_rule_patterns', 0) > 10 else 'moderate' if patterns.get('total_rule_patterns', 0) > 5 else 'low'
        }
        
        # Count patterns by category
        category_counts = {}
        for category, data in patterns.get('rule_based', {}).items():
            if data:
                category_counts[category] = sum(
                    subcat.get('count', 0) for subcat in data.values()
                )
        
        summary['category_counts'] = category_counts
        return summary
    
    def _analyze_temporal_patterns(self, content: str) -> Dict[str, Any]:
        """
        Analyze temporal aspects of the documentation
        """
        temporal_matches = []
        content_lower = content.lower()
        
        for pattern in self.temporal_patterns:
            matches = re.findall(pattern, content_lower, re.IGNORECASE)
            temporal_matches.extend(matches)
        
        return {
            'temporal_indicators': len(temporal_matches),
            'has_timeline': len(temporal_matches) > 0,
            'temporal_details': temporal_matches[:10]  # First 10 matches
        }
    
    def _calculate_pattern_confidence(self, rule_patterns: Dict[str, Any], llm_patterns: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculate confidence scores for different pattern types
        """
        confidences = {}
        
        # Rule-based confidence (based on pattern count)
        total_patterns = rule_patterns.get('total_patterns', 0)
        if total_patterns > 10:
            confidences['rule_based'] = 0.9
        elif total_patterns > 5:
            confidences['rule_based'] = 0.8
        elif total_patterns > 0:
            confidences['rule_based'] = 0.7
        else:
            confidences['rule_based'] = 0.3
        
        # LLM confidence (based on successful extraction)
        if 'error' in llm_patterns:
            confidences['llm_enhanced'] = 0.2
        else:
            extracted_categories = llm_patterns.get('extracted_categories', {})
            non_empty_categories = sum(1 for content in extracted_categories.values() if content.strip())
            confidences['llm_enhanced'] = min(0.9, 0.3 + (non_empty_categories * 0.15))
        
        return confidences
    
    def _calculate_overall_confidence(self, rule_patterns: Dict[str, Any], llm_patterns: Dict[str, Any]) -> float:
        """
        Calculate overall confidence in pattern extraction
        """
        confidences = self._calculate_pattern_confidence(rule_patterns, llm_patterns)
        
        # Weighted average with higher weight on rule-based (more reliable for quantized models)
        rule_weight = 0.7
        llm_weight = 0.3
        
        overall = (confidences.get('rule_based', 0.5) * rule_weight + 
                   confidences.get('llm_enhanced', 0.5) * llm_weight)
        
        return min(0.95, max(0.1, overall))  # Clamp between 0.1 and 0.95