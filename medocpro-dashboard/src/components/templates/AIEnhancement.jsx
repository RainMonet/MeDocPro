import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

// AI Enhancement Icons
const BrainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

const CpuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="9" y="9" width="6" height="6"/>
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>
  </svg>
);

const GpuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="7" cy="12" r="2"/>
    <circle cx="17" cy="12" r="2"/>
    <path d="M12 8v8"/>
    <path d="M8 10h8"/>
    <path d="M8 14h8"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="m12 1 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z"/>
  </svg>
);

const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);

// Clinical Writing Style Options
const CLINICAL_STYLES = {
  'professional': {
    name: 'Professional Clinical',
    description: 'Formal, precise medical terminology with structured format',
    example: 'Patient presents with acute depressive episode characterized by...'
  },
  'concise': {
    name: 'Concise Documentation',
    description: 'Brief, factual statements optimized for quick review',
    example: 'Pt reports mood improvement. Sleep stable. Continues therapy.'
  },
  'detailed': {
    name: 'Comprehensive Detail',
    description: 'Thorough documentation with extensive clinical observations',
    example: 'Patient demonstrates significant improvement in mood regulation with notable reduction in depressive symptoms as evidenced by...'
  },
  'narrative': {
    name: 'Narrative Clinical',
    description: 'Story-like format maintaining clinical accuracy',
    example: 'During today\'s session, the patient described experiencing...'
  }
};

// Enhancement Levels
const ENHANCEMENT_LEVELS = {
  'light': {
    name: 'Light Enhancement (20-30%)',
    description: 'Minimal changes - grammar, terminology, basic structure',
    percentage: 25
  },
  'moderate': {
    name: 'Moderate Enhancement (40-60%)',
    description: 'Significant improvements - clinical language, organization',
    percentage: 50
  },
  'comprehensive': {
    name: 'Comprehensive Enhancement (70-80%)',
    description: 'Extensive rewriting - professional formatting, clinical accuracy',
    percentage: 75
  }
};

// AI Enhancement Settings Component
const AISettings = ({ settings, onSettingsChange, isVisible, onToggle }) => {
  if (!isVisible) {
    return (
      <button 
        className="btn btn-sm btn-secondary"
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <SettingsIcon />
        AI Settings
      </button>
    );
  }

  return (
    <div className="card" style={{ marginBottom: '16px', border: '2px solid #e2e8f0' }}>
      <div className="card-header" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
          <BrainIcon style={{ marginRight: '8px' }} />
          Ollama AI Enhancement Settings
        </h4>
        <button 
          className="btn btn-sm"
          style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white' }}
          onClick={onToggle}
        >
          ×
        </button>
      </div>
      
      <div className="card-content" style={{ padding: '20px' }}>
        {/* Compute Mode Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ fontWeight: '600', marginBottom: '8px' }}>
            Compute Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              className={`btn ${settings.computeMode === 'cpu' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onSettingsChange({ ...settings, computeMode: 'cpu' })}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '12px',
                justifyContent: 'center'
              }}
            >
              <CpuIcon />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>CPU Mode</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Slower, universal compatibility</div>
              </div>
            </button>
            <button
              className={`btn ${settings.computeMode === 'gpu' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onSettingsChange({ ...settings, computeMode: 'gpu' })}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '12px',
                justifyContent: 'center'
              }}
            >
              <GpuIcon />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>GPU Mode</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Faster, requires CUDA/ROCm</div>
              </div>
            </button>
          </div>
        </div>

        {/* Model Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ fontWeight: '600' }}>
            Ollama Model
          </label>
          <select
            className="form-input"
            value={settings.model}
            onChange={(e) => onSettingsChange({ ...settings, model: e.target.value })}
          >
            <option value="mistral:latest">Mistral 7B (Latest)</option>
            <option value="mistral:7b">Mistral 7B</option>
            <option value="llama2:latest">Llama 2 (Latest)</option>
            <option value="llama2:7b">Llama 2 7B</option>
            <option value="llama2:13b">Llama 2 13B</option>
            <option value="codellama:latest">Code Llama (Latest)</option>
            <option value="neural-chat:latest">Neural Chat</option>
          </select>
          <small style={{ color: '#64748b', fontSize: '12px' }}>
            Ensure the selected model is pulled in Ollama. Run: <code>ollama pull {settings.model}</code>
          </small>
        </div>

        {/* Enhancement Level */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ fontWeight: '600' }}>
            Enhancement Level
          </label>
          <div style={{ display: 'grid', gap: '8px' }}>
            {Object.entries(ENHANCEMENT_LEVELS).map(([key, level]) => (
              <button
                key={key}
                className={`btn ${settings.enhancementLevel === key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onSettingsChange({ ...settings, enhancementLevel: key })}
                style={{ 
                  textAlign: 'left',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{level.name}</div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>{level.description}</div>
                </div>
                <div style={{ 
                  background: settings.enhancementLevel === key ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {level.percentage}%
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Clinical Writing Style */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ fontWeight: '600' }}>
            Clinical Writing Style
          </label>
          <div style={{ display: 'grid', gap: '8px' }}>
            {Object.entries(CLINICAL_STYLES).map(([key, style]) => (
              <button
                key={key}
                className={`btn ${settings.clinicalStyle === key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onSettingsChange({ ...settings, clinicalStyle: key })}
                style={{ 
                  textAlign: 'left',
                  padding: '12px'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>
                  {style.name}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '6px' }}>
                  {style.description}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  fontStyle: 'italic',
                  color: '#64748b',
                  background: 'rgba(0,0,0,0.05)',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  "{style.example}"
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div>
          <label className="form-label" style={{ fontWeight: '600' }}>
            Advanced Options
          </label>
          <div style={{ display: 'grid', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.preserveStructure}
                onChange={(e) => onSettingsChange({ ...settings, preserveStructure: e.target.checked })}
              />
              <span style={{ fontSize: '13px' }}>Preserve original document structure</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.enhanceTerminology}
                onChange={(e) => onSettingsChange({ ...settings, enhanceTerminology: e.target.checked })}
              />
              <span style={{ fontSize: '13px' }}>Enhance clinical terminology (DSM-5, ICD-11)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.generateSuggestions}
                onChange={(e) => onSettingsChange({ ...settings, generateSuggestions: e.target.checked })}
              />
              <span style={{ fontSize: '13px' }}>Generate diagnostic/treatment suggestions</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main AI Enhancement Component
const AIEnhancement = ({ content, onEnhancedContent, isVisible }) => {
  const [settings, setSettings] = useState({
    computeMode: 'cpu',
    model: 'mistral:latest',
    enhancementLevel: 'moderate',
    clinicalStyle: 'professional',
    preserveStructure: true,
    enhanceTerminology: true,
    generateSuggestions: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [enhancementHistory, setEnhancementHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState('checking');

  // Check Ollama service status
  const checkOllamaStatus = async () => {
    try {
      setOllamaStatus('checking');
      const response = await apiService.checkOllamaStatus();
      setOllamaStatus(response.status || 'online');
    } catch (err) {
      console.error('Ollama status check failed:', err);
      setOllamaStatus('offline');
    }
  };

  // Enhance content using Ollama
  const enhanceContent = async () => {
    if (!content.trim()) {
      setError('Please provide content to enhance');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const enhancementRequest = {
        content: content,
        settings: settings,
        enhancementLevel: ENHANCEMENT_LEVELS[settings.enhancementLevel].percentage,
        clinicalStyle: settings.clinicalStyle
      };

      const response = await apiService.enhanceContentWithOllama(enhancementRequest);
      
      if (response.enhanced_content) {
        const enhancement = {
          id: Date.now(),
          original: content,
          enhanced: response.enhanced_content,
          settings: { ...settings },
          timestamp: new Date().toISOString(),
          processingTime: response.processing_time || 0
        };

        setEnhancementHistory(prev => [enhancement, ...prev.slice(0, 4)]); // Keep last 5
        onEnhancedContent(response.enhanced_content);
      } else {
        throw new Error('No enhanced content received from AI service');
      }

    } catch (err) {
      console.error('AI Enhancement failed:', err);
      setError(err.message || 'AI enhancement failed. Please check Ollama service.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('aiEnhancementSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load AI settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('aiEnhancementSettings', JSON.stringify(settings));
  }, [settings]);

  // Check Ollama status on mount
  useEffect(() => {
    checkOllamaStatus();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="ai-enhancement">
      {/* Status Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        padding: '12px 16px',
        background: ollamaStatus === 'online' ? '#f0f9ff' : '#fef2f2',
        border: `1px solid ${ollamaStatus === 'online' ? '#bae6fd' : '#fecaca'}`,
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: ollamaStatus === 'online' ? '#10b981' : ollamaStatus === 'offline' ? '#ef4444' : '#f59e0b'
          }} />
          <span style={{ fontSize: '13px', fontWeight: '500' }}>
            Ollama {settings.computeMode.toUpperCase()}: {ollamaStatus === 'online' ? 'Connected' : ollamaStatus === 'offline' ? 'Disconnected' : 'Checking...'}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Model: {settings.model}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <AISettings
            settings={settings}
            onSettingsChange={setSettings}
            isVisible={showSettings}
            onToggle={() => setShowSettings(!showSettings)}
          />
          <button
            className="btn btn-sm btn-secondary"
            onClick={checkOllamaStatus}
          >
            Refresh Status
          </button>
        </div>
      </div>

      {/* AI Settings */}
      <AISettings
        settings={settings}
        onSettingsChange={setSettings}
        isVisible={showSettings}
        onToggle={() => setShowSettings(!showSettings)}
      />

      {/* Enhancement Controls */}
      <div className="card">
        <div className="card-header" style={{ background: '#f8fafc' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SparklesIcon />
            AI-Powered Clinical Enhancement
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Transform your notes with {ENHANCEMENT_LEVELS[settings.enhancementLevel].name.toLowerCase()} using {settings.model}
          </p>
        </div>

        <div className="card-content">
          {/* Error Display */}
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
              <strong>Enhancement Error:</strong> {error}
            </div>
          )}

          {/* Enhancement Button */}
          <div style={{ marginBottom: '20px' }}>
            <button
              className="btn btn-primary"
              onClick={enhanceContent}
              disabled={isLoading || ollamaStatus !== 'online' || !content.trim()}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                width: '100%',
                justifyContent: 'center',
                padding: '12px'
              }}
            >
              <BrainIcon />
              {isLoading ? 'Enhancing with AI...' : `Enhance with ${settings.model} (${settings.computeMode.toUpperCase()})`}
            </button>
            
            {isLoading && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '8px', 
                fontSize: '12px', 
                color: '#64748b' 
              }}>
                Processing on {settings.computeMode.toUpperCase()}... This may take 30-60 seconds
              </div>
            )}
          </div>

          {/* Enhancement History */}
          {enhancementHistory.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                Recent Enhancements
              </h4>
              <div style={{ display: 'grid', gap: '8px', maxHeight: '200px', overflow: 'auto' }}>
                {enhancementHistory.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => onEnhancedContent(item.enhanced)}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f1f5f9';
                      e.target.style.borderColor = '#cbd5e0';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f8fafc';
                      e.target.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#4a5568' }}>
                        {CLINICAL_STYLES[item.settings.clinicalStyle].name} • {ENHANCEMENT_LEVELS[item.settings.enhancementLevel].name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                        {item.processingTime && ` • ${item.processingTime}s`}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#64748b', 
                      marginTop: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.enhanced.substring(0, 100)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ollama Setup Instructions */}
          {ollamaStatus === 'offline' && (
            <div className="alert alert-info" style={{ marginTop: '16px' }}>
              <strong>Ollama Setup Required:</strong>
              <ol style={{ margin: '8px 0 0 20px', fontSize: '13px' }}>
                <li>Install Ollama: <code>curl -fsSL https://ollama.ai/install.sh | sh</code></li>
                <li>Pull Mistral model: <code>ollama pull mistral:latest</code></li>
                <li>Start Ollama service: <code>ollama serve</code></li>
                <li>For GPU: Ensure CUDA/ROCm drivers are installed</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIEnhancement;