// components/AIAutomationModal.jsx
import React, { useState, useEffect } from 'react';
import './AIAutomationModal.css';

const AIAutomationModal = ({ 
  isOpen, 
  onClose, 
  selectedPatients = [], 
  selectedTemplate = null 
}) => {
  // AI Settings State
  const [aiSettings, setAiSettings] = useState({
    enabled: true,
    percentage: 80,
    tone: 'formal'
  });

  // Modal State
  const [isLoading, setIsLoading] = useState(false);
  const [generationStep, setGenerationStep] = useState('configure'); // 'configure', 'generating', 'results'
  const [generatedResults, setGeneratedResults] = useState(null);
  const [error, setError] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);

  // Tone options matching the backend
  const toneOptions = [
    { value: 'formal', label: 'Formal (Standard)', description: 'Professional and formal medical tone' },
    { value: 'concise', label: 'Concise', description: 'Concise and direct clinical tone' },
    { value: 'descriptive', label: 'Descriptive', description: 'Descriptive and detailed clinical tone' },
    { value: 'narrative', label: 'Narrative', description: 'Narrative and flowing clinical tone' },
    { value: 'clinical', label: 'Clinical', description: 'Standard clinical documentation tone' },
    { value: 'compassionate', label: 'Compassionate', description: 'Compassionate and empathetic tone' },
    { value: 'technical', label: 'Technical', description: 'Technical and precise medical terminology' }
  ];

  // Check AI service status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkAIStatus();
      setGenerationStep('configure');
      setGeneratedResults(null);
      setError(null);
    }
  }, [isOpen]);

  const checkAIStatus = async () => {
    try {
      const response = await fetch('/api/documents/ai-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const status = await response.json();
        setAiStatus(status);
      }
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setAiStatus({ status: 'error', error: 'Failed to check AI service status' });
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || selectedPatients.length === 0) {
      setError('Please select a template and at least one patient');
      return;
    }

    setIsLoading(true);
    setGenerationStep('generating');
    setError(null);

    try {
      const payload = {
        patient_ids: selectedPatients.map(p => p.id),
        template_id: selectedTemplate.id,
        ai_settings: aiSettings
      };

      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate documents');
      }

      const results = await response.json();
      setGeneratedResults(results);
      setGenerationStep('results');

    } catch (error) {
      console.error('Document generation failed:', error);
      setError(error.message);
      setGenerationStep('configure');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setGenerationStep('configure');
    setGeneratedResults(null);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  const downloadAsText = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={handleClose}>
        <div className="ai-automation-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="header-content">
              <h2 className="modal-title">AI-Enhanced Document Generation</h2>
              <p className="modal-subtitle">
                Generate clinical documentation with AI assistance for {selectedPatients.length} patient(s)
              </p>
              {aiStatus && (
                <div className={`ai-status ${aiStatus.status}`}>
                  <span className="status-indicator"></span>
                  {aiStatus.status === 'available' ? (
                    `AI Service: Online (${aiStatus.models?.length || 0} models)`
                  ) : (
                    `AI Service: ${aiStatus.error || 'Unavailable'}`
                  )}
                </div>
              )}
            </div>
            <button className="modal-close" onClick={handleClose}>×</button>
          </div>

          <div className="modal-body">
            {generationStep === 'configure' && (
              <div className="configuration-section">
                {/* Template and Patient Summary */}
                <div className="selection-summary">
                  <div className="summary-item">
                    <h3>Selected Template</h3>
                    <div className="template-info">
                      <span className="template-name">{selectedTemplate?.name || 'No template selected'}</span>
                      {selectedTemplate?.category && (
                        <span className="template-category">{selectedTemplate.category}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="summary-item">
                    <h3>Selected Patients ({selectedPatients.length})</h3>
                    <div className="patient-list">
                      {selectedPatients.map(patient => (
                        <div key={patient.id} className="patient-item">
                          <span className="patient-name">{patient.name}</span>
                          <span className="patient-id">{patient.patient_id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Configuration */}
                <div className="ai-configuration">
                  <div className="config-header">
                    <h3>AI Enhancement Settings</h3>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={aiSettings.enabled}
                        onChange={(e) => setAiSettings(prev => ({
                          ...prev,
                          enabled: e.target.checked
                        }))}
                      />
                      <span className="slider"></span>
                      Enable AI Text Enhancement
                    </label>
                  </div>

                  {aiSettings.enabled && (
                    <div className="ai-options">
                      <div className="option-group">
                        <label className="option-label">
                          Enhancement Level: {aiSettings.percentage}%
                        </label>
                        <div className="slider-container">
                          <input
                            type="range"
                            min="20"
                            max="90"
                            step="10"
                            value={aiSettings.percentage}
                            onChange={(e) => setAiSettings(prev => ({
                              ...prev,
                              percentage: parseInt(e.target.value)
                            }))}
                            className="percentage-slider"
                          />
                          <div className="slider-labels">
                            <span>Conservative (20%)</span>
                            <span>Moderate (50%)</span>
                            <span>Significant (90%)</span>
                          </div>
                        </div>
                      </div>

                      <div className="option-group">
                        <label className="option-label">Writing Tone</label>
                        <select
                          value={aiSettings.tone}
                          onChange={(e) => setAiSettings(prev => ({
                            ...prev,
                            tone: e.target.value
                          }))}
                          className="tone-select"
                        >
                          {toneOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="tone-description">
                          {toneOptions.find(opt => opt.value === aiSettings.tone)?.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {error}
                  </div>
                )}
              </div>
            )}

            {generationStep === 'generating' && (
              <div className="generating-section">
                <div className="loading-animation">
                  <div className="spinner"></div>
                  <h3>Generating Clinical Documents</h3>
                  <p>Processing {selectedPatients.length} patient record(s) with AI enhancement...</p>
                  <div className="progress-steps">
                    <div className="step active">Merging patient data</div>
                    <div className="step active">Processing AI enhancement zones</div>
                    <div className="step">Finalizing documents</div>
                  </div>
                </div>
              </div>
            )}

            {generationStep === 'results' && generatedResults && (
              <div className="results-section">
                <div className="results-header">
                  <h3>Generated Documents</h3>
                  <p>Successfully generated {generatedResults.generated_notes?.length} clinical document(s)</p>
                  {generatedResults.ai_enhanced && (
                    <div className="ai-badge">AI Enhanced</div>
                  )}
                </div>

                <div className="document-results">
                  {generatedResults.generated_notes?.map((note, index) => (
                    <div key={note.patient_id} className="result-item">
                      <div className="result-header">
                        <h4>{note.patient_name}</h4>
                        <div className="result-actions">
                          <button
                            className="action-btn copy"
                            onClick={() => copyToClipboard(note.note)}
                            title="Copy to clipboard"
                          >
                            📋 Copy
                          </button>
                          <button
                            className="action-btn download"
                            onClick={() => downloadAsText(
                              note.note, 
                              `${note.patient_name.replace(/[^a-zA-Z0-9]/g, '_')}_${generatedResults.template_name}_${new Date().toISOString().split('T')[0]}.txt`
                            )}
                            title="Download as text file"
                          >
                            💾 Download
                          </button>
                        </div>
                      </div>
                      <div className="document-preview">
                        <pre className="note-content">{note.note}</pre>
                      </div>
                    </div>
                  ))}
                </div>

                {generatedResults.errors && generatedResults.errors.length > 0 && (
                  <div className="error-summary">
                    <h4>Processing Errors</h4>
                    {generatedResults.errors.map((error, index) => (
                      <div key={index} className="error-item">
                        Patient ID {error.patient_id}: {error.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <div className="footer-info">
              {generationStep === 'configure' && (
                <>
                  HIPAA-compliant AI enhancement • Local processing with Ollama
                </>
              )}
              {generationStep === 'results' && generatedResults && (
                <>
                  Generated at {new Date(generatedResults.generation_timestamp).toLocaleString()}
                </>
              )}
            </div>
            
            <div className="footer-actions">
              {generationStep === 'configure' && (
                <>
                  <button className="btn secondary" onClick={handleClose}>
                    Cancel
                  </button>
                  <button 
                    className="btn primary" 
                    onClick={handleGenerate}
                    disabled={isLoading || !selectedTemplate || selectedPatients.length === 0 || aiStatus?.status !== 'available'}
                  >
                    Generate Documents
                  </button>
                </>
              )}
              
              {generationStep === 'generating' && (
                <button className="btn secondary" disabled>
                  Generating...
                </button>
              )}
              
              {generationStep === 'results' && (
                <>
                  <button 
                    className="btn secondary" 
                    onClick={() => setGenerationStep('configure')}
                  >
                    Generate More
                  </button>
                  <button className="btn primary" onClick={handleClose}>
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAutomationModal;