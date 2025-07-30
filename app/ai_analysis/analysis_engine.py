"""
AI Analysis Engine - Main coordinator for clinical documentation analysis
Optimized for quantized LLM models with focus on pattern recognition tasks
"""

import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import requests
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class AnalysisResult:
    """Structure for analysis results"""
    analysis_type: str
    patient_id: Optional[str]
    content_id: str
    results: Dict[str, Any]
    confidence: float
    timestamp: datetime
    processing_time_ms: int

class AIAnalysisEngine:
    """
    Main AI Analysis Engine for clinical documentation
    Coordinates all analysis tasks and manages Ollama communication
    """
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url.rstrip('/')
        # Preferred quantized models
        self.preferred_models = ["mistral:7b-instruct-q4_0", "llama2:7b-chat-q4_0"]
        # Fallback to any available models
        self.fallback_models = ["mistral:latest", "llama3:latest", "mistral", "llama3", "llama2"]
        self.current_model = None
        self.analysis_timeout = 30  # seconds
        
        # Analysis modules (will be initialized when needed)
        self._documentation_scorer = None
        self._pattern_extractor = None
        self._trend_analyzer = None
        self._risk_detector = None
        
    def check_ollama_status(self) -> Dict[str, Any]:
        """Check if Ollama service is available and what models are loaded"""
        try:
            # Check service availability
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code != 200:
                return {
                    "ollama_connected": False,
                    "models_loaded": False,
                    "analysis_ready": False,
                    "error": f"Ollama service returned status {response.status_code}"
                }
            
            models_data = response.json()
            models = [model["name"] for model in models_data.get("models", [])]
            
            # Check for preferred models first
            available_preferred = [m for m in self.preferred_models if m in models]
            # Then check for fallback models
            available_fallback = [m for m in self.fallback_models if m in models]
            
            # Determine the best available model
            if available_preferred:
                recommended_model = available_preferred[0]
                self.current_model = recommended_model
                models_loaded = True
                analysis_ready = True
            elif available_fallback:
                recommended_model = available_fallback[0]
                self.current_model = recommended_model
                models_loaded = True
                analysis_ready = True
            else:
                recommended_model = None
                self.current_model = None
                models_loaded = False
                analysis_ready = False
            
            return {
                "ollama_connected": True,
                "models_loaded": models_loaded,
                "analysis_ready": analysis_ready,
                "available_models": models,
                "preferred_models_available": available_preferred,
                "fallback_models_available": available_fallback,
                "recommended_model": recommended_model,
                "current_model": self.current_model
            }
            
        except requests.RequestException as e:
            logger.error(f"Failed to connect to Ollama: {e}")
            return {
                "ollama_connected": False,
                "models_loaded": False,
                "analysis_ready": False,
                "error": str(e)
            }
    
    def analyze_documentation(self, content: str, patient_id: str = None, 
                            analysis_types: List[str] = None) -> Dict[str, AnalysisResult]:
        """
        Perform comprehensive analysis on clinical documentation
        
        Args:
            content: Clinical documentation text
            patient_id: Optional patient identifier
            analysis_types: List of analysis types to perform 
                          ['completeness', 'patterns', 'risks', 'trends']
        
        Returns:
            Dictionary of analysis results keyed by analysis type
        """
        if analysis_types is None:
            analysis_types = ['completeness', 'patterns', 'risks']
        
        results = {}
        content_id = f"doc_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Check if Ollama is available
        status = self.check_ollama_status()
        if not status["analysis_ready"]:
            logger.warning("Ollama not ready for analysis")
            return self._create_fallback_results(content_id, patient_id, analysis_types, 
                                               "AI analysis service not available")
        
        try:
            # Perform each requested analysis
            for analysis_type in analysis_types:
                start_time = datetime.now()
                
                if analysis_type == 'completeness':
                    result = self._analyze_completeness(content, content_id, patient_id)
                elif analysis_type == 'patterns':
                    result = self._extract_patterns(content, content_id, patient_id)
                elif analysis_type == 'risks':
                    result = self._detect_risks(content, content_id, patient_id)
                elif analysis_type == 'trends':
                    result = self._analyze_trends(content, content_id, patient_id)
                else:
                    logger.warning(f"Unknown analysis type: {analysis_type}")
                    continue
                
                processing_time = (datetime.now() - start_time).total_seconds() * 1000
                result.processing_time_ms = int(processing_time)
                results[analysis_type] = result
                
        except Exception as e:
            logger.error(f"Error during analysis: {e}")
            return self._create_fallback_results(content_id, patient_id, analysis_types, str(e))
        
        return results
    
    def _create_fallback_results(self, content_id: str, patient_id: str, 
                               analysis_types: List[str], error_msg: str) -> Dict[str, AnalysisResult]:
        """Create fallback results when AI analysis fails"""
        results = {}
        for analysis_type in analysis_types:
            results[analysis_type] = AnalysisResult(
                analysis_type=analysis_type,
                patient_id=patient_id,
                content_id=content_id,
                results={"error": error_msg, "fallback_mode": True},
                confidence=0.0,
                timestamp=datetime.now(),
                processing_time_ms=0
            )
        return results
    
    def _call_ollama(self, prompt: str, model: str = None) -> Dict[str, Any]:
        """
        Make a call to Ollama with optimized settings for available models
        """
        if model is None:
            if self.current_model:
                model = self.current_model
            else:
                status = self.check_ollama_status()
                model = status.get("recommended_model")
                if not model:
                    raise Exception("No suitable AI model available")
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                # Optimized for quantized models - focus on consistency over creativity
                "temperature": 0.1,  # Low temperature for consistent responses
                "top_p": 0.9,       # Slightly constrained for reliability
                "repeat_penalty": 1.1,
                "num_ctx": 2048,    # Context window suitable for clinical notes
                "num_predict": 512  # Reasonable response length
            }
        }
        
        try:
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json=payload,
                timeout=self.analysis_timeout
            )
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            logger.error(f"Ollama API call failed: {e}")
            raise
    
    def _analyze_completeness(self, content: str, content_id: str, patient_id: str) -> AnalysisResult:
        """Analyze documentation completeness using quantized LLM"""
        from .documentation_scorer import DocumentationScorer
        
        if self._documentation_scorer is None:
            self._documentation_scorer = DocumentationScorer(self)
        
        return self._documentation_scorer.score_completeness(content, content_id, patient_id)
    
    def _extract_patterns(self, content: str, content_id: str, patient_id: str) -> AnalysisResult:
        """Extract clinical patterns from documentation"""
        from .pattern_extractor import PatternExtractor
        
        if self._pattern_extractor is None:
            self._pattern_extractor = PatternExtractor(self)
        
        return self._pattern_extractor.extract_patterns(content, content_id, patient_id)
    
    def _detect_risks(self, content: str, content_id: str, patient_id: str) -> AnalysisResult:
        """Detect risk factors in clinical documentation"""
        from .risk_detector import RiskDetector
        
        if self._risk_detector is None:
            self._risk_detector = RiskDetector(self)
        
        return self._risk_detector.detect_risks(content, content_id, patient_id)
    
    def _analyze_trends(self, content: str, content_id: str, patient_id: str) -> AnalysisResult:
        """Analyze trends (placeholder - requires historical data)"""
        # Trends require multiple documents over time
        # For now, return placeholder
        return AnalysisResult(
            analysis_type="trends",
            patient_id=patient_id,
            content_id=content_id,
            results={"note": "Trend analysis requires historical data", "trends_count": 0},
            confidence=0.0,
            timestamp=datetime.now(),
            processing_time_ms=0
        )