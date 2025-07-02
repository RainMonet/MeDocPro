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

// Theme-aware style helpers - consistent with other modals
const getThemeStyles = (theme) => ({
  textPrimary: theme === 'dark' ? '#f1f5f9' : '#2d1810',
  textSecondary: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
  textMuted: theme === 'dark' ? '#94a3b8' : '#8b7355',
  bgPrimary: theme === 'dark' ? '#1e293b' : '#faf8f3',
  bgSecondary: theme === 'dark' ? '#0f172a' : '#f4f1eb',
  bgAccent: theme === 'dark' ? '#374151' : '#ede8df',
  borderColor: theme === 'dark' ? '#475569' : '#d4c4a8',
  primaryColor: theme === 'dark' ? '#3b82f6' : '#8b4513',
  successColor: theme === 'dark' ? '#10b981' : '#6b8e23',
  warningColor: theme === 'dark' ? '#f59e0b' : '#cd853f',
  errorColor: theme === 'dark' ? '#ef4444' : '#a0522d'
});

// AI Enhancement Settings Component
const AISettings = ({ settings, onSettingsChange, theme = 'dark' }) => {
  const styles = getThemeStyles(theme);

  return (
    <div className="card" style={{ 
      marginBottom: '16px', 
      border: `2px solid ${styles.borderColor}`,
      backgroundColor: styles.bgPrimary
    }}>
      <div className="card-header" style={{ 
        background: styles.bgSecondary,
        color: styles.textPrimary,
        borderBottom: `1px solid ${styles.borderColor}`
      }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainIcon />
          Ollama AI Enhancement Settings
        </h4>
      </div>
      
      <div className="card-content" style={{ 
        padding: '20px', 
        backgroundColor: styles.bgPrimary,
        color: styles.textPrimary
      }}>
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
                  color: styles.textMuted,
                  background: styles.bgAccent,
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
const AIEnhancement = ({ content, onEnhancedContent, isVisible, theme = 'dark' }) => {
  const styles = getThemeStyles(theme);
  const [settings, setSettings] = useState({
    computeMode: 'cpu',
    model: 'mistral:latest',
    enhancementLevel: 'moderate',
    clinicalStyle: 'professional',
    preserveStructure: true,
    enhanceTerminology: true,
    generateSuggestions: false
  });

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
        background: ollamaStatus === 'online' ? 
          (theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#f0f9ff') : 
          (theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2'),
        border: `1px solid ${ollamaStatus === 'online' ? styles.successColor : styles.errorColor}`,
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: ollamaStatus === 'online' ? '#10b981' : ollamaStatus === 'offline' ? '#ef4444' : '#f59e0b'
          }} />
          <span style={{ fontSize: '13px', fontWeight: '500', color: styles.textPrimary }}>
            Ollama {settings.computeMode.toUpperCase()}: {ollamaStatus === 'online' ? 'Connected' : ollamaStatus === 'offline' ? 'Disconnected' : 'Checking...'}
          </span>
          <span style={{ fontSize: '11px', color: styles.textMuted }}>
            Model: {settings.model}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
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
        theme={theme}
      />

      {/* Ollama Setup Instructions */}
      {ollamaStatus === 'offline' && (
        <div className="alert alert-info" style={{ 
          marginTop: '16px',
          backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#f0f9ff',
          border: `1px solid ${styles.primaryColor}`,
          color: styles.textPrimary,
          padding: '16px',
          borderRadius: '8px'
        }}>
          <strong>Ollama Setup Required:</strong>
          <ol style={{ margin: '8px 0 0 20px', fontSize: '13px', color: styles.textSecondary }}>
            <li>Install Ollama: <code style={{ 
              backgroundColor: styles.bgAccent, 
              padding: '2px 4px', 
              borderRadius: '3px',
              color: styles.textPrimary
            }}>curl -fsSL https://ollama.ai/install.sh | sh</code></li>
            <li>Pull Mistral model: <code style={{ 
              backgroundColor: styles.bgAccent, 
              padding: '2px 4px', 
              borderRadius: '3px',
              color: styles.textPrimary
            }}>ollama pull mistral:latest</code></li>
            <li>Start Ollama service: <code style={{ 
              backgroundColor: styles.bgAccent, 
              padding: '2px 4px', 
              borderRadius: '3px',
              color: styles.textPrimary
            }}>ollama serve</code></li>
            <li>For GPU: Ensure CUDA/ROCm drivers are installed</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default AIEnhancement;