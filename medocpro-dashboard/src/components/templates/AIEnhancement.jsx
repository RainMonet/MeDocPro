import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

// AI Enhancement Icons
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

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M3 21v-5h5"/>
  </svg>
);

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
  const [isPullingModel, setIsPullingModel] = useState(false);

  const handlePullModel = async () => {
    if (!settings.model) {
      alert('Please select a model first');
      return;
    }

    setIsPullingModel(true);
    try {
      // Call the backend API to pull the model
      const response = await fetch(`${apiService.baseURL}/api/ollama/pull-model`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: settings.model })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Model ${settings.model} pulled successfully!`);
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to pull model');
      }
    } catch (error) {
      console.error('Error pulling model:', error);
      alert(`Error pulling model: ${error.message}\n\nYou can manually pull the model using: ollama pull ${settings.model}`);
    } finally {
      setIsPullingModel(false);
    }
  };

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
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
          AI Enhancement Settings
        </h4>
      </div>
      
      <div className="card-content" style={{ 
        padding: '20px', 
        backgroundColor: styles.bgPrimary,
        color: styles.textPrimary
      }}>
        {/* Compute Mode Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label" style={{ fontWeight: '600', marginBottom: '12px', display: 'block' }}>
            Compute Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={() => onSettingsChange({ ...settings, computeMode: 'cpu' })}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '16px',
                backgroundColor: settings.computeMode === 'cpu' ? styles.primaryColor : styles.bgSecondary,
                color: settings.computeMode === 'cpu' ? 'white' : styles.textPrimary,
                border: `1px solid ${settings.computeMode === 'cpu' ? styles.primaryColor : styles.borderColor}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <CpuIcon />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>CPU Mode</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Slower, universal compatibility</div>
              </div>
            </button>
            <button
              onClick={() => onSettingsChange({ ...settings, computeMode: 'gpu' })}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '16px',
                backgroundColor: settings.computeMode === 'gpu' ? styles.primaryColor : styles.bgSecondary,
                color: settings.computeMode === 'gpu' ? 'white' : styles.textPrimary,
                border: `1px solid ${settings.computeMode === 'gpu' ? styles.primaryColor : styles.borderColor}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <GpuIcon />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>GPU Mode</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Faster, requires CUDA/ROCm</div>
              </div>
            </button>
          </div>
        </div>

        {/* Model Selection */}
        <div>
          <label className="form-label" style={{ fontWeight: '600', marginBottom: '12px', display: 'block' }}>
            Ollama Model
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <select
                value={settings.model}
                onChange={(e) => onSettingsChange({ ...settings, model: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${styles.borderColor}`,
                  backgroundColor: styles.bgSecondary,
                  color: styles.textPrimary,
                  fontSize: '14px'
                }}
              >
                <option value="mistral:latest">Mistral 7B (Latest)</option>
                <option value="mistral:7b">Mistral 7B</option>
                <option value="llama2:latest">Llama 2 (Latest)</option>
                <option value="llama2:7b">Llama 2 7B</option>
                <option value="llama2:13b">Llama 2 13B</option>
                <option value="codellama:latest">Code Llama (Latest)</option>
                <option value="neural-chat:latest">Neural Chat</option>
              </select>
            </div>
            <button
              onClick={handlePullModel}
              disabled={isPullingModel}
              style={{
                padding: '12px 16px',
                backgroundColor: styles.successColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isPullingModel ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isPullingModel ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <DownloadIcon />
              {isPullingModel ? 'Pulling...' : 'Pull Model'}
            </button>
          </div>
          <small style={{ color: styles.textMuted, fontSize: '12px', display: 'block', marginTop: '8px' }}>
            Click "Pull Model" to download the selected model from Ollama
          </small>
        </div>
      </div>
    </div>
  );
};

// System Prompt Settings Component
const SystemPromptSettings = ({ settings, onSettingsChange, savedPrompts, onSavedPromptsChange, theme = 'dark' }) => {
  const styles = getThemeStyles(theme);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptDescription, setNewPromptDescription] = useState('');

  const handlePromptSelect = (promptId) => {
    const selectedPrompt = savedPrompts.find(p => p.id === promptId);
    if (selectedPrompt) {
      onSettingsChange({ 
        ...settings, 
        systemPrompt: selectedPrompt.prompt,
        selectedPromptId: promptId
      });
    }
  };

  const handleSaveCurrentPrompt = () => {
    if (!newPromptName.trim()) {
      alert('Please enter a name for the prompt');
      return;
    }

    const newPrompt = {
      id: Date.now().toString(),
      name: newPromptName.trim(),
      description: newPromptDescription.trim() || 'Custom system prompt',
      prompt: settings.systemPrompt
    };

    onSavedPromptsChange([...savedPrompts, newPrompt]);
    onSettingsChange({ ...settings, selectedPromptId: newPrompt.id });
    
    setNewPromptName('');
    setNewPromptDescription('');
    setShowSaveDialog(false);
    alert(`Prompt "${newPrompt.name}" saved successfully!`);
  };

  const handleDeletePrompt = (promptId) => {
    const promptToDelete = savedPrompts.find(p => p.id === promptId);
    if (!promptToDelete) return;

    // Prevent deleting default prompts
    if (['default', 'concise', 'detailed'].includes(promptId)) {
      alert('Cannot delete built-in prompts');
      return;
    }

    if (window.confirm(`Delete prompt "${promptToDelete.name}"? This cannot be undone.`)) {
      const updatedPrompts = savedPrompts.filter(p => p.id !== promptId);
      onSavedPromptsChange(updatedPrompts);
      
      // If current prompt is deleted, switch to default
      if (settings.selectedPromptId === promptId) {
        const defaultPrompt = savedPrompts.find(p => p.id === 'default');
        onSettingsChange({ 
          ...settings, 
          systemPrompt: defaultPrompt.prompt,
          selectedPromptId: 'default'
        });
      }
    }
  };

  const currentPrompt = savedPrompts.find(p => p.id === settings.selectedPromptId);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            System Prompt Configuration
          </h4>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              color: styles.textMuted,
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="card-content" style={{ 
          padding: '20px', 
          backgroundColor: styles.bgPrimary,
          color: styles.textPrimary
        }}>
          {/* Saved Prompts Dropdown */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Select Saved Prompt
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <select
                  value={settings.selectedPromptId || 'default'}
                  onChange={(e) => handlePromptSelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: `1px solid ${styles.borderColor}`,
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                    fontSize: '14px'
                  }}
                >
                  {savedPrompts.map(prompt => (
                    <option key={prompt.id} value={prompt.id}>
                      {prompt.name}
                    </option>
                  ))}
                </select>
                {currentPrompt && (
                  <small style={{ color: styles.textMuted, fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    {currentPrompt.description}
                  </small>
                )}
              </div>
              {currentPrompt && !['default', 'concise', 'detailed'].includes(currentPrompt.id) && (
                <button
                  onClick={() => handleDeletePrompt(currentPrompt.id)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: styles.errorColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* System Prompt Editor */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              System Prompt
            </label>
            <textarea
              value={settings.systemPrompt || DEFAULT_SYSTEM_PROMPT}
              onChange={(e) => onSettingsChange({ ...settings, systemPrompt: e.target.value })}
              placeholder="Enter your custom system prompt for AI enhancement..."
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${styles.borderColor}`,
                backgroundColor: styles.bgSecondary,
                color: styles.textPrimary,
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '1.5',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
            <small style={{ color: styles.textMuted, fontSize: '12px', display: 'block', marginTop: '8px' }}>
              This prompt defines how the AI will enhance clinical text. Modify and save with a custom name.
            </small>
          </div>

          {/* Save New Prompt Dialog */}
          {showSaveDialog && (
            <div style={{ 
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: styles.bgAccent,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '6px'
            }}>
              <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '600' }}>Save Current Prompt</h5>
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Prompt name (required)"
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: `1px solid ${styles.borderColor}`,
                    backgroundColor: styles.bgPrimary,
                    color: styles.textPrimary,
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="One-line description (optional)"
                  value={newPromptDescription}
                  onChange={(e) => setNewPromptDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: `1px solid ${styles.borderColor}`,
                    backgroundColor: styles.bgPrimary,
                    color: styles.textPrimary,
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    color: styles.textSecondary,
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCurrentPrompt}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: styles.successColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Save Prompt
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowSaveDialog(!showSaveDialog)}
              style={{
                padding: '8px 16px',
                backgroundColor: styles.successColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {showSaveDialog ? 'Cancel Save' : 'Save As New'}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(settings.systemPrompt || DEFAULT_SYSTEM_PROMPT);
                alert('System prompt copied to clipboard!');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: styles.primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Copy Prompt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Default system prompt for AI enhancement
const DEFAULT_SYSTEM_PROMPT = `You are a medical documentation assistant. Enhance the following clinical text while preserving its exact meaning and clinical content.

CRITICAL REQUIREMENTS:
- PRESERVE ALL ORIGINAL MEANING: Do not change clinical facts, diagnoses, or medical content
- MAINTAIN CLINICAL ACCURACY: Keep all medical information exactly as provided
- PRESERVE INTENT: The enhanced text must convey the same message as the original
- RETURN ONLY THE ENHANCED TEXT: Do not include explanations, metadata, or commentary
- NO EXPLANATIONS: Do not explain what changes were made or why

Enhancement Guidelines:
- Use appropriate psychiatric and medical terminology
- Ensure compliance with clinical documentation standards
- Do not add new clinical information not present in the original text
- Maintain professional tone and structure

Enhanced Text (ONLY the enhanced text, no explanations):`;

// Default saved prompts
const DEFAULT_SAVED_PROMPTS = [
  {
    id: 'default',
    name: 'Clinical Documentation',
    description: 'Standard medical documentation enhancement with clinical accuracy focus',
    prompt: DEFAULT_SYSTEM_PROMPT
  },
  {
    id: 'concise',
    name: 'Concise Clinical',
    description: 'Brief, factual clinical documentation for quick reviews',
    prompt: `You are a medical documentation assistant. Make the clinical text concise while preserving all medical facts.

CRITICAL REQUIREMENTS:
- PRESERVE ALL ORIGINAL MEANING: Do not change clinical facts, diagnoses, or medical content
- MAINTAIN CLINICAL ACCURACY: Keep all medical information exactly as provided
- PRESERVE INTENT: The enhanced text must convey the same message as the original
- RETURN ONLY THE ENHANCED TEXT: Do not include explanations, metadata, or commentary
- NO EXPLANATIONS: Do not explain what changes were made or why

Enhancement Guidelines:
- Keep all clinical information intact
- Use brief, clear language
- Maintain medical accuracy
- Remove unnecessary words while preserving meaning
- Use standard medical abbreviations appropriately

Enhanced Text (concise version only):`
  },
  {
    id: 'detailed',
    name: 'Comprehensive Clinical',
    description: 'Detailed clinical documentation with thorough explanations',
    prompt: `You are a medical documentation assistant. Expand the clinical text with comprehensive detail while maintaining accuracy.

CRITICAL REQUIREMENTS:
- PRESERVE ALL ORIGINAL MEANING: Do not change clinical facts, diagnoses, or medical content
- MAINTAIN CLINICAL ACCURACY: Keep all medical information exactly as provided
- PRESERVE INTENT: The enhanced text must convey the same message as the original
- RETURN ONLY THE ENHANCED TEXT: Do not include explanations, metadata, or commentary
- NO EXPLANATIONS: Do not explain what changes were made or why

Enhancement Guidelines:
- Preserve all original clinical information
- Add appropriate clinical context and detail
- Use comprehensive medical terminology
- Maintain professional clinical tone
- Include relevant clinical observations

Enhanced Text (detailed version only):`
  }
];

// Function to load settings synchronously from localStorage
const loadSettingsFromStorage = () => {
  try {
    const savedSettings = localStorage.getItem('aiAssistantSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      console.log('AIEnhancement: Loading settings synchronously:', parsed);
      return {
        computeMode: parsed.computeMode || 'cpu',
        model: parsed.model || 'mistral:latest',
        systemPrompt: parsed.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        selectedPromptId: parsed.selectedPromptId || 'default'
      };
    }
  } catch (e) {
    console.error('Failed to load AI settings from localStorage:', e);
  }
  
  return {
    computeMode: 'cpu',
    model: 'mistral:latest',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    selectedPromptId: 'default'
  };
};

// Function to load saved prompts synchronously from localStorage  
const loadPromptsFromStorage = () => {
  try {
    const savedPromptsData = localStorage.getItem('aiSavedPrompts');
    if (savedPromptsData) {
      return JSON.parse(savedPromptsData);
    }
  } catch (e) {
    console.error('Failed to load saved prompts from localStorage:', e);
  }
  
  return DEFAULT_SAVED_PROMPTS;
};

// Main AI Enhancement Component
const AIEnhancement = ({ content, onEnhancedContent, isVisible, theme = 'dark' }) => {
  const styles = getThemeStyles(theme);
  
  // Generate a unique instance ID for debugging
  const [instanceId] = useState(() => Math.random().toString(36).substr(2, 9));
  
  const [settings, setSettings] = useState(() => {
    const loaded = loadSettingsFromStorage();
    console.log(`AIEnhancement [${instanceId}]: Component created with settings:`, loaded);
    return loaded;
  });
  
  const [savedPrompts, setSavedPrompts] = useState(() => loadPromptsFromStorage());

  const [ollamaStatus, setOllamaStatus] = useState('checking');

  // Check Ollama service status
  const checkOllamaStatus = async () => {
    try {
      setOllamaStatus('checking');
      const response = await apiService.checkOllamaStatus();
      setOllamaStatus(response.status || 'offline');
    } catch (err) {
      console.error('Ollama status check failed:', err);
      setOllamaStatus('offline');
    }
  };

  // Settings are now loaded synchronously during component initialization

  // Save settings to localStorage when changed
  useEffect(() => {
    console.log(`AIEnhancement [${instanceId}]: Saving settings to localStorage:`, settings);
    localStorage.setItem('aiAssistantSettings', JSON.stringify(settings));
  }, [settings, instanceId]);

  // Save prompts to localStorage when changed
  useEffect(() => {
    localStorage.setItem('aiSavedPrompts', JSON.stringify(savedPrompts));
  }, [savedPrompts]);

  // Manual refresh function for debugging (declare before useEffect)
  const refreshSettingsFromStorage = () => {
    const fresh = loadSettingsFromStorage();
    console.log(`AIEnhancement [${instanceId}]: Manually refreshing settings:`, fresh);
    setSettings(fresh);
  };

  // Check Ollama status on mount and track component lifecycle
  useEffect(() => {
    console.log(`AIEnhancement [${instanceId}]: Component mounted`);
    checkOllamaStatus();
    
    // Expose debug functions globally for testing
    window.aiEnhancementDebug = {
      instanceId,
      getCurrentSettings: () => settings,
      refreshSettings: refreshSettingsFromStorage,
      setGPUMode: () => setSettings(prev => ({ ...prev, computeMode: 'gpu' })),
      setCPUMode: () => setSettings(prev => ({ ...prev, computeMode: 'cpu' })),
      getStorageSettings: () => {
        const stored = localStorage.getItem('aiAssistantSettings');
        return stored ? JSON.parse(stored) : null;
      }
    };
    
    return () => {
      console.log(`AIEnhancement [${instanceId}]: Component unmounting`);
      delete window.aiEnhancementDebug;
    };
  }, [instanceId, settings, refreshSettingsFromStorage]);

  console.log(`AIEnhancement [${instanceId}]: Rendering with compute mode:`, settings.computeMode, 'isVisible:', isVisible);

  return (
    <div 
      className="ai-enhancement"
      data-component="ai-enhancement">
      {/* Status Card */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '16px 20px',
        background: ollamaStatus === 'online' ? 
          (theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#f0f9ff') : 
          (theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2'),
        border: `2px solid ${ollamaStatus === 'online' ? styles.successColor : styles.errorColor}`,
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            className={`status-indicator ${ollamaStatus}`}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: ollamaStatus === 'online' ? styles.successColor : ollamaStatus === 'offline' ? styles.errorColor : styles.warningColor
            }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: styles.textPrimary }}>
              Ollama Status: {ollamaStatus === 'online' ? 'Connected' : ollamaStatus === 'offline' ? 'Disconnected' : 'Checking...'}
            </div>
            <div style={{ fontSize: '12px', color: styles.textMuted }}>
              Mode: {settings.computeMode.toUpperCase()} | Model: {settings.model}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={checkOllamaStatus}
            style={{
              padding: '8px 16px',
              backgroundColor: styles.bgSecondary,
              color: styles.textPrimary,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = styles.bgAccent;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = styles.bgSecondary;
            }}
          >
            <RefreshIcon />
            Refresh Status
          </button>
          
          <button
            onClick={refreshSettingsFromStorage}
            style={{
              padding: '8px 12px',
              backgroundColor: styles.warningColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Debug: Refresh settings from localStorage"
          >
            🔧 Debug
          </button>
        </div>
      </div>

      {/* AI Settings */}
      <AISettings
        settings={settings}
        onSettingsChange={setSettings}
        theme={theme}
      />

      {/* System Prompt Settings */}
      <SystemPromptSettings
        settings={settings}
        onSettingsChange={setSettings}
        savedPrompts={savedPrompts}
        onSavedPromptsChange={setSavedPrompts}
        theme={theme}
      />
    </div>
  );
};

export default AIEnhancement;