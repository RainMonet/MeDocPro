import React, { useState, useEffect } from 'react';

const AIAutomationModal = ({ isOpen, onClose, onGenerate }) => {
  const [patients, setPatients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [aiSettings, setAiSettings] = useState({
    enable_ai: true,
    enhancement_percentage: 80,
    tone: 'formal'
  });
  const [aiStatus, setAiStatus] = useState({ 
    status: 'checking', 
    available: false,
    loading: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      resetModal();
      fetchPatients();
      fetchTemplates();
      checkAIStatus();
    }
  }, [isOpen]);

  const resetModal = () => {
    setSelectedPatients([]);
    setSelectedTemplate('');
    setError('');
    setResults(null);
    setLoading(false);
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      const data = await response.json();
      if (data.success) {
        setPatients(data.patients);
      } else {
        setError('Failed to load patients: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to connect to backend. Is Flask running on localhost:5000?');
      console.error('Fetch patients error:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      } else {
        setError('Failed to load templates: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to connect to backend. Is Flask running on localhost:5000?');
      console.error('Fetch templates error:', err);
    }
  };

  const checkAIStatus = async () => {
    try {
      setAiStatus(prev => ({ ...prev, loading: true }));
      const response = await fetch('/api/ai/status');
      const data = await response.json();
      
      setAiStatus({
        status: data.status,
        available: data.available,
        loading: false,
        service: data.service,
        url: data.url,
        configured_model: data.configured_model,
        models: data.models || [],
        model_exists: data.model_exists,
        recommendations: data.recommendations || [],
        test_generation: data.test_generation
      });
      
    } catch (err) {
      setAiStatus({
        status: 'error',
        available: false,
        loading: false,
        error: 'Failed to check AI service status'
      });
      console.error('AI status check error:', err);
    }
  };

  const handlePatientToggle = (patientId) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const handleGenerate = async () => {
    if (selectedPatients.length === 0 || !selectedTemplate) {
      setError('Please select at least one patient and a template');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_ids: selectedPatients,
          template_id: selectedTemplate,
          ai_settings: aiSettings
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data);
        if (onGenerate) {
          onGenerate(data);
        }
      } else {
        setError('Generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to generate documents: ' + err.message);
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndicator = () => {
    if (aiStatus.loading) {
      return (
        <div className="status-indicator checking">
          <div className="status-dot animate-pulse"></div>
          <span>Checking AI service...</span>
        </div>
      );
    }

    if (aiStatus.available && aiStatus.model_exists) {
      return (
        <div className="status-indicator connected">
          <div className="status-dot bg-green-500"></div>
          <span>AI Ready ({aiStatus.configured_model})</span>
        </div>
      );
    }

    if (aiStatus.available && !aiStatus.model_exists) {
      return (
        <div className="status-indicator warning">
          <div className="status-dot bg-yellow-500"></div>
          <span>Model not found ({aiStatus.configured_model})</span>
        </div>
      );
    }

    return (
      <div className="status-indicator disconnected">
        <div className="status-dot bg-red-500"></div>
        <span>AI service unavailable</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>AI-Assisted Documentation</h2>
            <button 
              onClick={onClose}
              className="close-button"
            >
              ×
            </button>
          </div>
          
          {/* AI Status */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {getStatusIndicator()}
            <button 
              onClick={checkAIStatus}
              className="refresh-status-button"
            >
              Refresh Status
            </button>
          </div>
          
          {/* AI Recommendations */}
          {aiStatus.recommendations && aiStatus.recommendations.length > 0 && (
            <div className="recommendations-panel">
              <h4>Recommendations:</h4>
              <ul className="recommendations-list">
                {aiStatus.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Patient Selection */}
          <div className="section">
            <h3 className="section-title">Select Patients</h3>
            <div className="patient-grid">
              {patients.map(patient => (
                <label key={patient.patient_id} className="patient-card">
                  <input
                    type="checkbox"
                    checked={selectedPatients.includes(patient.patient_id)}
                    onChange={() => handlePatientToggle(patient.patient_id)}
                  />
                  <div className={`patient-card-content ${
                    selectedPatients.includes(patient.patient_id) ? 'selected' : ''
                  }`}>
                    <div className="patient-name">{patient.name}</div>
                    <div className="patient-diagnosis">{patient.diagnosis}</div>
                    <div className="patient-age">Age: {patient.age}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="section">
            <h3 className="section-title">Choose Template</h3>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="template-select"
            >
              <option value="">Select a documentation template...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          </div>

          {/* AI Settings */}
          <div className="section">
            <h3 className="section-title">AI Enhancement Settings</h3>
            <div className="ai-settings">
              <label className="setting-item">
                <input
                  type="checkbox"
                  checked={aiSettings.enable_ai}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, enable_ai: e.target.checked }))}
                  disabled={!aiStatus.available}
                />
                <span style={{ color: aiStatus.available ? '#374151' : '#9ca3af' }}>
                  Enable AI Enhancement {!aiStatus.available && '(AI service unavailable)'}
                </span>
              </label>

              {aiSettings.enable_ai && aiStatus.available && (
                <>
                  <div className="setting-item">
                    <label className="setting-label">
                      Enhancement Level: {aiSettings.enhancement_percentage}%
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="90"
                      value={aiSettings.enhancement_percentage}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, enhancement_percentage: parseInt(e.target.value) }))}
                      style={{ width: '100%' }}
                    />
                    <div className="range-labels">
                      <span>Conservative</span>
                      <span>Moderate</span>
                      <span>Comprehensive</span>
                    </div>
                  </div>

                  <div className="setting-item">
                    <label className="setting-label">Writing Tone</label>
                    <select
                      value={aiSettings.tone}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, tone: e.target.value }))}
                      className="setting-select"
                    >
                      <option value="formal">Formal Clinical</option>
                      <option value="detailed">Detailed Clinical</option>
                      <option value="concise">Concise Professional</option>
                      <option value="empathetic">Empathetic Professional</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

{/* Results Display */}
{results && (
  <div className="section">
    <h3 className="section-title">Generated Documents</h3>
    <div className="results-container">
      <div className="results-summary">
        <div className="summary-card">
          <span className="summary-label">Documents Generated:</span>
          <span className="summary-value">{results.patients_processed}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Template Used:</span>
          <span className="summary-value">{results.template_used}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">AI Enhanced:</span>
          <span className="summary-value">{results.ai_enhanced ? 'Yes' : 'No'}</span>
        </div>
      </div>
      
      <div className="documents-list">
        {results.results && results.results.map((doc, index) => (
          <div key={index} className="document-card">
            <div className="document-header">
              <h4 className="document-title">
                {doc.template_name} - {doc.patient_name}
              </h4>
              <div className="document-meta">
                <span className="document-date">
                  {new Date(doc.generated_at).toLocaleString()}
                </span>
                {doc.ai_enhanced && (
                  <span className="ai-badge">AI Enhanced</span>
                )}
              </div>
            </div>
            
            <div className="document-content">
              <pre className="document-text">{doc.content}</pre>
            </div>
            
            <div className="document-actions">
              <button 
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(doc.content);
                  alert('Document copied to clipboard!');
                }}
              >
                📋 Copy to Clipboard
              </button>
              <button 
                className="btn-secondary"
                onClick={() => {
                  const blob = new Blob([doc.content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${doc.patient_name}_${doc.template_name}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                💾 Download
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="results-actions">
        <button 
          className="btn-secondary"
          onClick={() => setResults(null)}
        >
          Generate More Documents
        </button>
        <button 
          className="btn-primary"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
        {/* Footer */}
        <div className="modal-footer">
          <div className="footer-info">
            {selectedPatients.length} patient(s) selected
            {selectedTemplate && ', template selected'}
          </div>
          <div className="footer-buttons">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || selectedPatients.length === 0 || !selectedTemplate}
              className="btn-primary"
            >
              {loading ? 'Generating...' : 'Generate Documentation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAutomationModal;