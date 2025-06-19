// Fixed AIAutomationModal.jsx - Resolves document display issue
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
    loading: true,
    model_exists: false,
    configured_model: 'mistral:latest'
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
        loading: false,
        status: data.status || 'unknown',
        available: data.available || false,
        model_exists: data.model_exists || false,
        configured_model: data.configured_model || 'mistral:latest'
      });
    } catch (err) {
      console.error('AI status check failed:', err);
      setAiStatus({
        loading: false,
        status: 'error',
        available: false,
        model_exists: false,
        configured_model: 'mistral:latest'
      });
    }
  };

  const handlePatientSelect = (patientId) => {
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
      console.log('Generating documents...', {
        patient_ids: selectedPatients,
        template_id: selectedTemplate,
        ai_settings: aiSettings
      });

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
      console.log('Generation response:', data);

      if (data.success) {
        // CRITICAL FIX: Ensure results state is set properly
        setResults(data);
        console.log('Results set successfully:', data);
        
        // Callback for parent component
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
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Refresh Status
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            background: '#fee', 
            border: '1px solid #fcc', 
            color: '#c33', 
            padding: '12px', 
            borderRadius: '6px', 
            margin: '20px 20px 0 20px' 
          }}>
            {error}
          </div>
        )}

        {/* CRITICAL FIX: Results Display Section */}
        {results && (
          <div className="section" style={{ margin: '20px' }}>
            <h3 className="section-title">✅ Generated Documents</h3>
            <div className="results-container">
              <div className="results-summary">
                <div className="summary-card">
                  <span className="summary-label">Documents Generated:</span>
                  <span className="summary-value">{results.patients_processed || results.results?.length || 0}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Template Used:</span>
                  <span className="summary-value">{results.template_used || 'Unknown'}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">AI Enhanced:</span>
                  <span className="summary-value">{results.ai_enhanced ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              <div className="documents-list">
                {results.results && results.results.length > 0 ? (
                  results.results.map((doc, index) => (
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
                          Copy to Clipboard
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
                          Download
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    No documents were generated. Please check the console for errors.
                  </div>
                )}
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

        {/* Main Form - Only show if no results */}
        {!results && (
          <>
            {/* Patient Selection */}
            <div className="section" style={{ margin: '20px' }}>
              <h3 className="section-title">1. Select Patients</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {patients.map(patient => (
                  <div 
                    key={patient.id} 
                    className={`patient-option ${selectedPatients.includes(patient.id) ? 'selected' : ''}`}
                    onClick={() => handlePatientSelect(patient.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: selectedPatients.includes(patient.id) ? '2px solid #3b82f6' : '2px solid transparent',
                      backgroundColor: selectedPatients.includes(patient.id) ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                        {patient.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>
                        Age: {patient.age} | {patient.diagnosis}
                      </div>
                    </div>
                    {selectedPatients.includes(patient.id) && (
                      <div style={{ 
                        color: '#3b82f6', 
                        fontSize: '18px', 
                        fontWeight: 'bold' 
                      }}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Template Selection */}
            <div className="section" style={{ margin: '20px' }}>
              <h3 className="section-title">2. Select Template</h3>
              <div className="template-selection">
                {templates.map(template => (
                  <div 
                    key={template.id}
                    className={`template-option ${selectedTemplate === template.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(template.id)}
                    style={{
                      padding: '12px 16px',
                      margin: '8px 0',
                      borderRadius: '8px',
                      border: selectedTemplate === template.id ? '2px solid #3b82f6' : '2px solid transparent',
                      backgroundColor: selectedTemplate === template.id ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{template.icon || '📋'}</span>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{template.name}</div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>{template.description}</div>
                      </div>
                    </div>
                    {selectedTemplate === template.id && (
                      <div style={{ 
                        color: '#3b82f6', 
                        fontSize: '18px', 
                        fontWeight: 'bold' 
                      }}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Settings */}
            <div className="section" style={{ margin: '20px' }}>
              <h3 className="section-title">3. AI Settings</h3>
              <div className="ai-settings">
                <div className="setting-item">
                  <label className="setting-checkbox">
                    <input
                      type="checkbox"
                      checked={aiSettings.enable_ai && aiStatus.available}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, enable_ai: e.target.checked }))}
                      disabled={!aiStatus.available}
                    />
                    <span style={{ color: !aiStatus.available ? '#374151' : '#9ca3af' }}>
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
          </>
        )}

        {/* Footer - Only show if no results */}
        {!results && (
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
        )}
      </div>
    </div>
  );
};

export default AIAutomationModal;