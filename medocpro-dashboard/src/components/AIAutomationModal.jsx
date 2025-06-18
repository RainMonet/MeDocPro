import React, { useState, useEffect } from 'react';
import './AIAutomationModal.css';

const AIAutomationModal = ({ isOpen, onClose, onGenerate }) => {
  const [patients, setPatients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [aiStatus, setAiStatus] = useState({ available: false, checking: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPatients();
      fetchTemplates();
      checkAIStatus();
    }
  }, [isOpen]);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      const data = await response.json();
      if (data.success) {
        setPatients(data.patients);
      } else {
        setError('Failed to load patients');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      } else {
        setError('Failed to load templates');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const checkAIStatus = async () => {
    try {
      const response = await fetch('/api/ai-status');
      const data = await response.json();
      if (data.success) {
        setAiStatus({ 
          available: data.ai_available, 
          checking: false,
          service: data.service,
          model: data.model 
        });
      } else {
        setAiStatus({ available: false, checking: false });
      }
    } catch (err) {
      setAiStatus({ available: false, checking: false });
    }
  };

  const handleGenerate = async () => {
    if (!selectedPatient || !selectedTemplate) {
      setError('Please select both a patient and template');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: selectedPatient,
          template_id: parseInt(selectedTemplate),
          use_ai: useAI && aiStatus.available
        })
      });

      const data = await response.json();
      
      if (data.success) {
        onGenerate(data.document);
        onClose();
        resetForm();
      } else {
        setError(data.error || 'Failed to generate document');
      }
    } catch (err) {
      setError('Failed to generate document');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPatient('');
    setSelectedTemplate('');
    setUseAI(true);
    setError('');
  };

  const getSelectedTemplate = () => {
    return templates.find(t => t.id === parseInt(selectedTemplate));
  };

  const getSelectedPatient = () => {
    return patients.find(p => p.patient_id === selectedPatient);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay">
      <div className="ai-modal">
        <div className="ai-modal-header">
          <h2>AI Document Generation</h2>
          <button className="ai-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="ai-modal-content">
          {error && (
            <div className="ai-error-message">
              {error}
            </div>
          )}

          {/* AI Status */}
          <div className="ai-status-section">
            <div className="ai-status-indicator">
              <span className={`ai-status-dot ${aiStatus.available ? 'available' : 'unavailable'}`}></span>
              <span className="ai-status-text">
                {aiStatus.checking ? 'Checking AI status...' : 
                 aiStatus.available ? `AI Available (${aiStatus.service} - ${aiStatus.model})` : 
                 'AI Unavailable - Ollama not running'}
              </span>
            </div>
          </div>

          {/* Patient Selection */}
          <div className="ai-form-section">
            <label className="ai-form-label">Select Patient:</label>
            <select 
              className="ai-form-select"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
            >
              <option value="">Choose a patient...</option>
              {patients.map(patient => (
                <option key={patient.patient_id} value={patient.patient_id}>
                  {patient.full_name} (ID: {patient.patient_id}) - {patient.primary_diagnosis}
                </option>
              ))}
            </select>
          </div>

          {/* Template Selection */}
          <div className="ai-form-section">
            <label className="ai-form-label">Select Template:</label>
            <select 
              className="ai-form-select"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">Choose a template...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.template_type})
                  {template.has_ai_zones && ' ✨'}
                </option>
              ))}
            </select>
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="ai-template-preview">
              <h4>Template Details:</h4>
              <div className="ai-template-info">
                <p><strong>Name:</strong> {getSelectedTemplate()?.name}</p>
                <p><strong>Type:</strong> {getSelectedTemplate()?.template_type}</p>
                <p><strong>Description:</strong> {getSelectedTemplate()?.description}</p>
                {getSelectedTemplate()?.has_ai_zones && (
                  <p><strong>AI Zones:</strong> {getSelectedTemplate()?.ai_zone_count} enhancement zones available</p>
                )}
              </div>
            </div>
          )}

          {/* AI Enhancement Option */}
          <div className="ai-form-section">
            <div className="ai-checkbox-container">
              <input 
                type="checkbox" 
                id="useAI"
                checked={useAI && aiStatus.available}
                onChange={(e) => setUseAI(e.target.checked)}
                disabled={!aiStatus.available}
              />
              <label htmlFor="useAI" className="ai-checkbox-label">
                Use AI Enhancement
                {!aiStatus.available && ' (Unavailable)'}
              </label>
            </div>
            <p className="ai-help-text">
              {aiStatus.available ? 
                'AI will automatically fill enhancement zones with clinically appropriate content.' :
                'Start Ollama with Mistral model to enable AI features.'
              }
            </p>
          </div>

          {/* Patient Info Preview */}
          {selectedPatient && (
            <div className="ai-patient-preview">
              <h4>Patient Information:</h4>
              <div className="ai-patient-info">
                <p><strong>Name:</strong> {getSelectedPatient()?.full_name}</p>
                <p><strong>Age:</strong> {getSelectedPatient()?.age}</p>
                <p><strong>Gender:</strong> {getSelectedPatient()?.gender}</p>
                <p><strong>Primary Diagnosis:</strong> {getSelectedPatient()?.primary_diagnosis}</p>
              </div>
            </div>
          )}
        </div>

        <div className="ai-modal-footer">
          <button 
            className="ai-btn ai-btn-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="ai-btn ai-btn-primary" 
            onClick={handleGenerate}
            disabled={loading || !selectedPatient || !selectedTemplate}
          >
            {loading ? 'Generating...' : 'Generate Document'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAutomationModal;