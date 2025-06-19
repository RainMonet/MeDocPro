// FINAL WORKING AIAutomationModal.jsx - GUARANTEED TO SHOW RESULTS
import React, { useState, useEffect } from 'react';

const AIAutomationModal = ({ isOpen, onClose }) => {
  const [patients, setPatients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [aiSettings, setAiSettings] = useState({
    enable_ai: true,
    enhancement_percentage: 80,
    tone: 'formal'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  // Inline styles
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      maxWidth: '900px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    },
    header: {
      padding: '32px 32px 24px 32px',
      borderBottom: '1px solid #f1f5f9',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '16px 16px 0 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      margin: 0,
      fontSize: '24px',
      fontWeight: '700',
      color: '#1e293b'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '32px',
      color: '#64748b',
      cursor: 'pointer',
      padding: '0',
      width: '40px',
      height: '40px',
      borderRadius: '8px'
    },
    section: {
      margin: '20px 32px'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '16px'
    },
    card: {
      padding: '16px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: '12px'
    },
    cardSelected: {
      borderColor: '#3b82f6',
      backgroundColor: '#eff6ff'
    },
    cardTitle: {
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '4px'
    },
    cardSubtitle: {
      fontSize: '14px',
      color: '#64748b'
    },
    checkmark: {
      color: '#3b82f6',
      fontSize: '18px',
      fontWeight: 'bold',
      float: 'right'
    },
    footer: {
      padding: '24px 32px 32px 32px',
      background: '#f8fafc',
      borderRadius: '0 0 16px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: '1px solid #e2e8f0'
    },
    btnPrimary: {
      padding: '12px 32px',
      border: 'none',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: '#ffffff',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px'
    },
    btnSecondary: {
      padding: '12px 24px',
      border: '2px solid #d1d5db',
      borderRadius: '10px',
      background: '#ffffff',
      color: '#374151',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px'
    },
    btnDisabled: {
      background: '#9ca3af',
      cursor: 'not-allowed'
    },
    resultsContainer: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '16px'
    },
    documentCard: {
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '16px'
    },
    documentContent: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      padding: '16px',
      whiteSpace: 'pre-wrap',
      fontFamily: 'monospace',
      fontSize: '13px',
      lineHeight: '1.5',
      color: '#374151',
      maxHeight: '200px',
      overflowY: 'auto'
    },
    error: {
      background: '#fee2e2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      padding: '12px',
      borderRadius: '6px',
      margin: '20px 32px'
    },
    aiSettings: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px'
    }
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      resetModal();
      fetchPatients();
      fetchTemplates();
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
      const response = await fetch('http://localhost:5000/api/patients');
      const data = await response.json();
      if (data.success) {
        setPatients(data.patients);
      } else {
        setError('Failed to load patients');
      }
    } catch (err) {
      setError('Failed to connect to backend');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      } else {
        setError('Failed to load templates');
      }
    } catch (err) {
      setError('Failed to connect to backend');
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
      console.log('Generating documents...');
      
      const response = await fetch('http://localhost:5000/api/documents/generate', {
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
        setResults(data);
        console.log('Results set successfully - MODAL WILL SHOW RESULTS NOW');
        // DO NOT CALL ANY CALLBACKS - KEEP MODAL OPEN
      } else {
        setError('Generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to generate documents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>AI-Assisted Documentation</h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {/* RESULTS DISPLAY - This will show when results exist */}
        {results && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>✅ Generated Documents</h3>
            <div style={styles.resultsContainer}>
              <p><strong>Success!</strong> Generated {results.patients_processed} document(s)</p>
              <p><strong>Template:</strong> {results.template_used}</p>
              <p><strong>AI Enhanced:</strong> {results.ai_enhanced ? 'Yes' : 'No'}</p>
              
              {results.results && results.results.length > 0 && (
                <div style={{marginTop: '20px'}}>
                  <h4>Generated Documents:</h4>
                  {results.results.map((doc, index) => (
                    <div key={index} style={styles.documentCard}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                        <h5 style={{margin: 0}}>{doc.patient_name}</h5>
                        <span style={{color: '#166534', fontWeight: 'bold'}}>✅ Generated</span>
                      </div>
                      <p><strong>Patient ID:</strong> {doc.patient_id}</p>
                      <p><strong>Generated:</strong> {new Date(doc.generated_at).toLocaleString()}</p>
                      <div style={{marginTop: '12px'}}>
                        <strong>Document Content:</strong>
                        <div style={styles.documentContent}>
                          {doc.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px'}}>
                <button 
                  onClick={() => setResults(null)}
                  style={styles.btnSecondary}
                >
                  Generate More Documents
                </button>
                <button 
                  onClick={onClose}
                  style={styles.btnPrimary}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FORM - Only show if no results */}
        {!results && (
          <>
            {/* Patients */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>1. Select Patients</h3>
              {patients.map(patient => (
                <div 
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient.id)}
                  style={{
                    ...styles.card,
                    ...(selectedPatients.includes(patient.id) ? styles.cardSelected : {})
                  }}
                >
                  <div style={styles.cardTitle}>{patient.name}</div>
                  <div style={styles.cardSubtitle}>Age: {patient.age} | {patient.diagnosis}</div>
                  {selectedPatients.includes(patient.id) && (
                    <div style={styles.checkmark}>✓</div>
                  )}
                </div>
              ))}
            </div>

            {/* Templates */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>2. Select Template</h3>
              {templates.map(template => (
                <div 
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  style={{
                    ...styles.card,
                    ...(selectedTemplate === template.id ? styles.cardSelected : {})
                  }}
                >
                  <div style={styles.cardTitle}>{template.name}</div>
                  <div style={styles.cardSubtitle}>{template.description}</div>
                  <div style={{fontSize: '12px', color: '#9ca3af', marginTop: '4px'}}>
                    Category: {template.category}
                  </div>
                  {selectedTemplate === template.id && (
                    <div style={styles.checkmark}>✓</div>
                  )}
                </div>
              ))}
            </div>

            {/* AI Settings */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>3. AI Settings</h3>
              <div style={styles.aiSettings}>
                <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '16px'}}>
                  <input
                    type="checkbox"
                    checked={aiSettings.enable_ai}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, enable_ai: e.target.checked }))}
                    style={{width: '18px', height: '18px'}}
                  />
                  <span>Enable AI Enhancement</span>
                </label>

                {aiSettings.enable_ai && (
                  <>
                    <div style={{marginBottom: '16px'}}>
                      <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                        Enhancement Level: {aiSettings.enhancement_percentage}%
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="90"
                        value={aiSettings.enhancement_percentage}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, enhancement_percentage: parseInt(e.target.value) }))}
                        style={{width: '100%'}}
                      />
                    </div>

                    <div>
                      <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Writing Tone</label>
                      <select
                        value={aiSettings.tone}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, tone: e.target.value }))}
                        style={{width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db'}}
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

            {/* Footer */}
            <div style={styles.footer}>
              <div style={{color: '#64748b', fontSize: '14px'}}>
                {selectedPatients.length} patient(s) selected
                {selectedTemplate && ', template selected'}
              </div>
              <div style={{display: 'flex', gap: '16px'}}>
                <button onClick={onClose} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading || selectedPatients.length === 0 || !selectedTemplate}
                  style={{
                    ...styles.btnPrimary,
                    ...(loading || selectedPatients.length === 0 || !selectedTemplate ? styles.btnDisabled : {})
                  }}
                >
                  {loading ? 'Generating...' : 'Generate Documentation'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIAutomationModal;