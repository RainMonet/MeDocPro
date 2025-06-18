// AI Automation Modal Component for MeDocPro
// This component connects to the Flask backend AI endpoints

import React, { useState, useEffect } from 'react';
import './AIAutomationModal.css';

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
    service: 'ollama',
    model: 'llama2',
    available: false 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  // Fetch initial data when modal opens
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
      setError('Failed to connect to server. Is the Flask backend running on localhost:5000?');
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
      setError('Failed to connect to server. Is the Flask backend running on localhost:5000?');
      console.error('Fetch templates error:', err);
    }
  };

  const checkAIStatus = async () => {
    try {
      const response = await fetch('/api/documents/ai-status');
      const data = await response.json();
      setAiStatus(data);
    } catch (err) {
      setAiStatus({ 
        status: 'error', 
        available: false,
        error: 'Cannot connect to AI service' 
      });
      console.error('AI status check error:', err);
    }
  };

  const handlePatientSelect = (patientId) => {
    setSelectedPatients(prev => {
      if (prev.includes(patientId)) {
        return prev.filter(id => id !== patientId);
      } else {
        return [...prev, patientId];
      }
    });
  };

  const handleGenerate = async () => {
    if (selectedPatients.length === 0 || !selectedTemplate) {
      setError('Please select at least one patient and a template');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_ids: selectedPatients,
          template_id: parseInt(selectedTemplate),
          ai_settings: aiSettings
        })
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
      setError('Failed to generate documents. Please check your connection.');
      console.error('Generate documents error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedTemplate = () => {
    return templates.find(t => t.id === parseInt(selectedTemplate));
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing during generation
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={(e) => e.target.classList.contains('ai-modal-overlay') && handleClose()}>
      <div className="ai-modal">
        <div className="ai-modal-header">
          <h2>AI-Powered Document Generation</h2>
          <button 
            className="ai-modal-close" 
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="ai-modal-content">
          {error && (
            <div className="ai-error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* AI Status Section */}
          <div className="ai-status-section">
            <div className="ai-status-indicator">
              <div className={`ai-status-dot ${aiStatus.status}`}></div>
              <strong>AI Service Status:</strong> 
              <span className={`ai-status-text ${aiStatus.status}`}>
                {aiStatus.status === 'available' && 'Connected - Ready for AI enhancement'}
                {aiStatus.status === 'unavailable' && 'Ollama service not available'}
                {aiStatus.status === 'checking' && 'Checking AI service...'}
                {aiStatus.status === 'error' && `Error: ${aiStatus.error || 'Service unavailable'}`}
              </span>
            </div>
            {aiStatus.available && (
              <div className="ai-service-info">
                <small>Service: {aiStatus.service} | Model: {aiStatus.model}</small>
              </div>
            )}
          </div>

          {/* Patient Selection */}
          <div className="ai-section">
            <h3>Select Patients ({selectedPatients.length} selected)</h3>
            <div className="ai-patient-grid">
              {patients.map(patient => (
                <div 
                  key={patient.patient_id} 
                  className={`ai-patient-card ${selectedPatients.includes(patient.patient_id) ? 'selected' : ''}`}
                  onClick={() => handlePatientSelect(patient.patient_id)}
                >
                  <div className="ai-patient-info">
                    <strong>{patient.full_name}</strong>
                    <div className="ai-patient-details">
                      <span>ID: {patient.patient_id}</span>
                      <span>Age: {patient.age}</span>
                      <span>{patient.gender}</span>
                    </div>
                    <div className="ai-patient-diagnosis">
                      {patient.primary_diagnosis || 'No diagnosis recorded'}
                    </div>
                  </div>
                  <div className="ai-selection-indicator">
                    {selectedPatients.includes(patient.patient_id) ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
            {patients.length === 0 && (
              <div className="ai-empty-state">
                No patients available. Make sure your Flask backend is running with sample data.
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="ai-section">
            <h3>Select Template</h3>
            <select 
              value={selectedTemplate} 
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="ai-select"
              disabled={loading}
            >
              <option value="">Choose a template...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {getSelectedTemplate() && (
              <div className="ai-template-preview">
                <strong>Template Preview:</strong>
                <div className="ai-template-content">
                  {getSelectedTemplate().content.substring(0, 200)}...
                </div>
              </div>
            )}
          </div>

          {/* AI Settings */}
          <div className="ai-section">
            <h3>AI Enhancement Settings</h3>
            <div className="ai-settings-grid">
              <label className="ai-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={aiSettings.enable_ai}
                  onChange={(e) => setAiSettings(prev => ({...prev, enable_ai: e.target.checked}))}
                  disabled={!aiStatus.available || loading}
                />
                Enable AI Enhancement
                {!aiStatus.available && <span className="ai-disabled-note">(Ollama not available)</span>}
              </label>

              {aiSettings.enable_ai && aiStatus.available && (
                <>
                  <div className="ai-setting-item">
                    <label>Enhancement Level: {aiSettings.enhancement_percentage}%</label>
                    <input 
                      type="range" 
                      min="20" 
                      max="90" 
                      value={aiSettings.enhancement_percentage}
                      onChange={(e) => setAiSettings(prev => ({...prev, enhancement_percentage: parseInt(e.target.value)}))}
                      className="ai-slider"
                      disabled={loading}
                    />
                    <div className="ai-setting-help">
                      Lower values preserve original text more, higher values add more AI content
                    </div>
                  </div>

                  <div className="ai-setting-item">
                    <label>Clinical Tone:</label>
                    <select 
                      value={aiSettings.tone}
                      onChange={(e) => setAiSettings(prev => ({...prev, tone: e.target.value}))}
                      className="ai-select"
                      disabled={loading}
                    >
                      <option value="formal">Formal Medical</option>
                      <option value="clinical">Clinical Professional</option>
                      <option value="comprehensive">Comprehensive Detail</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Results Section */}
          {results && (
            <div className="ai-section ai-results-section">
              <h3>Generation Results</h3>
              <div className="ai-results-summary">
                <p><strong>Template:</strong> {results.template_used}</p>
                <p><strong>Patients Processed:</strong> {results.patients_processed}</p>
                <p><strong>AI Enhanced:</strong> {results.ai_enhanced ? 'Yes' : 'No'}</p>
              </div>
              <div className="ai-results-list">
                {results.results.map((result, index) => (
                  <div key={index} className="ai-result-item">
                    <h4>{result.patient_name} ({result.patient_id})</h4>
                    {result.error ? (
                      <div className="ai-error-result">Error: {result.error}</div>
                    ) : (
                      <div className="ai-success-result">
                        <p>✓ Document generated successfully</p>
                        {result.ai_enhanced && <p>✓ AI enhancement applied</p>}
                        <button 
                          className="ai-btn ai-btn-small"
                          onClick={() => {
                            // Here you could open a preview modal or download the document
                            console.log('Document content:', result);
                          }}
                        >
                          View Document
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ai-modal-footer">
          <button 
            className="ai-btn ai-btn-secondary" 
            onClick={handleClose}
            disabled={loading}
          >
            {results ? 'Done' : 'Cancel'}
          </button>
          {!results && (
            <button 
              className="ai-btn ai-btn-primary" 
              onClick={handleGenerate}
              disabled={loading || selectedPatients.length === 0 || !selectedTemplate}
            >
              {loading ? 'Generating Documents...' : `Generate for ${selectedPatients.length} Patient${selectedPatients.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAutomationModal;