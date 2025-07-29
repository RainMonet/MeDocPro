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

  // Check AI analysis system status
  const checkAiAnalysisStatus = async () => {
    try {
      // This will connect to our AI analysis endpoints once implemented
      setLoading(false);
      // Placeholder for now - will implement actual checks
      setAiAnalysisStatus({
        ollamaConnected: false,
        modelsLoaded: false,
        analysisReady: false,
        lastCheck: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Failed to check AI analysis status:', error);
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
        <h3>🤖 AI Analysis System</h3>
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
      <h3>🤖 AI Analysis System</h3>
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
      
      <div className="system-notice" style={{
        marginTop: '12px',
        padding: '8px 12px',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderLeft: '3px solid #3b82f6',
        borderRadius: '4px',
        fontSize: '12px',
        color: 'var(--text-primary)'
      }}>
        <strong>🚧 Development Mode:</strong> AI analysis features are being implemented. 
        Real-time status monitoring will be available once the analysis engine is complete.
      </div>
      
      <div className="last-checked">
        {aiAnalysisStatus.lastCheck ? `Last checked: ${aiAnalysisStatus.lastCheck}` : 'Checking...'}
      </div>
    </div>
  );
};

export default SystemStatus;