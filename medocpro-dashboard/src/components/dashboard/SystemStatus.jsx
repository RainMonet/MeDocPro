import React, { useState, useEffect } from 'react';
import './SystemStatus.css';

const SystemStatus = () => {
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState({
    ollamaConnected: false,
    modelsLoaded: false,
    analysisReady: false,
    lastCheck: null
  });
  const [loading, setLoading] = useState(true);

  // Check AI analysis system status from backend
  const checkAiAnalysisStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setAiAnalysisStatus({
          ollamaConnected: false,
          modelsLoaded: false,
          analysisReady: false,
          lastCheck: new Date().toLocaleTimeString(),
          error: 'Authentication required'
        });
        return;
      }
      
      // Call AI analysis status endpoint
      const response = await fetch('http://localhost:5000/api/ai-analysis/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.status) {
        setAiAnalysisStatus({
          ollamaConnected: data.status.ollama_connected || false,
          modelsLoaded: data.status.models_loaded || false,
          analysisReady: data.status.analysis_ready || false,
          lastCheck: new Date().toLocaleTimeString(),
          availableModels: data.status.available_models || [],
          error: data.status.error || null
        });
      } else {
        setAiAnalysisStatus({
          ollamaConnected: false,
          modelsLoaded: false,
          analysisReady: false,
          lastCheck: new Date().toLocaleTimeString(),
          error: data.error || 'Status check failed'
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to check AI analysis status:', error);
      setAiAnalysisStatus({
        ollamaConnected: false,
        modelsLoaded: false,
        analysisReady: false,
        lastCheck: new Date().toLocaleTimeString(),
        error: 'Connection failed'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAiAnalysisStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkAiAnalysisStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="system-status">
        <h3>AI Analysis System</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          color: 'var(--text-muted)'
        }}>
          <div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
          Checking AI system status...
        </div>
      </div>
    );
  }

  return (
    <div className="system-status">
      <h3>AI Analysis System</h3>
      <p>Clinical documentation analysis and insights</p>
      
      <div className="status-items">
        <div className="status-item">
          <span className="status-label">Ollama Service</span>
          <span className={`status-badge ${aiAnalysisStatus.ollamaConnected ? 'connected' : 'disconnected'}`}>
            {aiAnalysisStatus.ollamaConnected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">AI Models</span>
          <span className={`status-badge ${aiAnalysisStatus.modelsLoaded ? 'available' : 'unavailable'}`}>
            {aiAnalysisStatus.modelsLoaded ? 'LOADED' : 'NOT LOADED'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Analysis Engine</span>
          <span className={`status-badge ${aiAnalysisStatus.analysisReady ? 'ready' : 'not-ready'}`}>
            {aiAnalysisStatus.analysisReady ? 'READY' : 'PREPARING'}
          </span>
        </div>
      </div>
      
      {aiAnalysisStatus.error && (
        <div className="system-notice" style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '3px solid #ef4444',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#ef4444'
        }}>
          <strong>Connection Issue:</strong> {aiAnalysisStatus.error}
        </div>
      )}
      
      {!aiAnalysisStatus.error && !aiAnalysisStatus.analysisReady && (
        <div className="system-notice" style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderLeft: '3px solid #3b82f6',
          borderRadius: '4px',
          fontSize: '12px',
          color: 'var(--text-primary)'
        }}>
          <strong>Setup Required:</strong> Install Ollama and download AI models to enable analysis features.
        </div>
      )}
      
      {aiAnalysisStatus.analysisReady && (
        <div className="system-notice" style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderLeft: '3px solid #10b981',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#10b981'
        }}>
          <strong>Ready:</strong> AI analysis system is operational and ready for clinical documentation analysis.
        </div>
      )}
      
      <div className="last-checked">
        {aiAnalysisStatus.lastCheck ? `Last checked: ${aiAnalysisStatus.lastCheck}` : 'Checking...'}
      </div>
    </div>
  );
};

export default SystemStatus;