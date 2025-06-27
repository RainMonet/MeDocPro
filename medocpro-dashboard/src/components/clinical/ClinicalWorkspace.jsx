import React, { useState, useEffect, useCallback } from 'react';
import PatientCensusTable from './PatientCensusTable';

// Use CSS variables to match dashboard styling
const getThemeStyles = () => ({
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-secondary)',
  bgPrimary: 'var(--bg-secondary)',
  bgSecondary: 'var(--bg-tertiary)',
  bgAccent: 'var(--bg-hover)',
  borderColor: 'var(--border-color)',
  accentColor: 'var(--accent-color)',
  success: '#34a853',
  warning: '#f59e0b',
  danger: '#ef4444'
});

// Header section with date and quick stats - exactly matches dashboard StatCard grid
const WorkspaceHeader = ({ censusData }) => {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          margin: 0,
          fontSize: '1.8rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          🏥 Clinical Workspace
        </h1>
        <p style={{
          margin: '0.25rem 0 0 0',
          fontSize: '1rem',
          color: 'var(--text-secondary)'
        }}>
          {today}
        </p>
      </div>

      {/* Stats Cards Row - exactly like dashboard with beautiful gradients */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{censusData?.current_census_count || 0}</div>
          <div className="stat-label">Active Patients</div>
          <div className="stat-change positive">Current census</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>
            {censusData?.admission_count || 0}
          </div>
          <div className="stat-label">New Admissions</div>
          <div className="stat-change positive">+{censusData?.admission_count || 0} today</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {censusData?.discharge_count || 0}
          </div>
          <div className="stat-label">Discharges</div>
          <div className="stat-change">Processed today</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#8b5cf6' }}>
            {((censusData?.current_census_count || 0) > 0 ? 
              Math.round(((censusData?.admission_count || 0) / (censusData?.current_census_count || 1)) * 100) : 0)}%
          </div>
          <div className="stat-label">Turnover Rate</div>
          <div className="stat-change">Daily metric</div>
        </div>
      </div>
    </div>
  );
};

// Batch documentation generation section - matches dashboard card design
const BatchDocumentationPanel = ({ 
  censusData, 
  onGenerateDocuments, 
  onPreviewDocuments
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('progress-note');
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const styles = getThemeStyles();

  const activePatients = censusData?.rows?.filter(row => row.status === 'active') || [];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerateDocuments({
        template: selectedTemplate,
        patients: activePatients,
        aiEnhancement,
        exportFormat
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportOptions = [
    { value: 'pdf', label: '📄 PDF Documents' },
    { value: 'docx', label: '📝 Word Documents' },
    { value: 'txt', label: '📋 Plain Text' },
    { value: 'email', label: '📧 Email Format' },
    { value: 'clipboard', label: '📋 Copy to Clipboard' }
  ];

  const templateOptions = [
    { value: 'progress-note', label: 'Progress Notes' },
    { value: 'assessment', label: 'Psychiatric Assessment' },
    { value: 'treatment-plan', label: 'Treatment Plan' },
    { value: 'discharge-summary', label: 'Discharge Summary' }
  ];

  return (
    <div className="system-status" style={{ marginBottom: '2rem' }}>
      <h3>📄 Batch Documentation Generation</h3>
      <p>Generate clinical documents for all active patients</p>

      <div className="status-grid" style={{ marginBottom: '1.5rem' }}>
        {/* Template Selection */}
        <div className="form-group">
          <label className="form-label">Document Template</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="form-input"
          >
            {templateOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Export Format */}
        <div className="form-group">
          <label className="form-label">Export Format</label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="form-input"
          >
            {exportOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* AI Enhancement Toggle */}
        <div className="form-group">
          <label className="form-label">AI Enhancement</label>
          <div className="status-item">
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={aiEnhancement}
                onChange={(e) => setAiEnhancement(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px'
                }}
              />
              <span>🤖 Use Ollama LLM</span>
            </label>
          </div>
        </div>
      </div>

      {/* Generation Status */}
      <div className="status-item" style={{ marginBottom: '1rem' }}>
        <span>
          Ready to generate <strong>{activePatients.length}</strong> patient documents
        </span>
        <span className="status-badge available">
          {templateOptions.find(t => t.value === selectedTemplate)?.label}
        </span>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={() => onPreviewDocuments && onPreviewDocuments({
            template: selectedTemplate,
            patients: activePatients.slice(0, 1),
            aiEnhancement
          })}
          disabled={activePatients.length === 0}
          className="btn btn-secondary"
        >
          👁️ Preview Sample
        </button>

        <button
          onClick={handleGenerate}
          disabled={activePatients.length === 0 || isGenerating}
          className="btn btn-primary"
        >
          {isGenerating ? (
            <>
              <div className="loading" style={{ width: '16px', height: '16px' }}></div>
              Generating...
            </>
          ) : (
            <>
              🚀 Generate All Documents
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Main Clinical Workspace component - matches dashboard design
const ClinicalWorkspace = ({ onOpenTemplateEditor }) => {
  const [censusData, setCensusData] = useState(null);
  const [scratchNotes, setScratchNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const styles = getThemeStyles();

  // Load today's census data
  const loadCensusData = useCallback(async () => {
    try {
      const response = await fetch('/api/patient-census/today');
      const data = await response.json();
      
      if (data.success) {
        setCensusData(data.census);
      } else {
        setError(data.error || 'Failed to load census');
      }
    } catch (err) {
      setError('Network error loading census');
    }
  }, []);

  // Load scratch notes for integration
  const loadScratchNotes = useCallback(async () => {
    try {
      const response = await fetch('/api/scratch-notes');
      const data = await response.json();
      
      if (data.success) {
        setScratchNotes(data.scratch_notes || []);
      }
    } catch (err) {
      console.error('Failed to load scratch notes:', err);
    }
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadCensusData(), loadScratchNotes()]);
    setLoading(false);
  }, [loadCensusData, loadScratchNotes]);

  // Handle batch document generation
  const handleGenerateDocuments = async (options) => {
    try {
      console.log('Generating documents:', options);
      // TODO: Implement actual document generation
      alert(`Generating ${options.patients.length} ${options.template} documents in ${options.exportFormat} format${options.aiEnhancement ? ' with AI enhancement' : ''}`);
    } catch (err) {
      console.error('Failed to generate documents:', err);
      alert('Failed to generate documents. Please try again.');
    }
  };

  // Handle document preview
  const handlePreviewDocuments = async (options) => {
    try {
      console.log('Previewing document:', options);
      // TODO: Implement document preview
      alert(`Previewing ${options.template} for ${options.patients[0]?.patient_name || 'first patient'}`);
    } catch (err) {
      console.error('Failed to preview document:', err);
      alert('Failed to preview document. Please try again.');
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh',
        flexDirection: 'column',
        gap: '1rem',
        color: styles.textSecondary
      }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
        <div style={{ fontSize: '0.9rem' }}>Loading clinical workspace...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {/* Error Display */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '4px solid #ef4444',
          color: '#ef4444',
          borderRadius: '8px',
          fontSize: '0.9rem',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          {error}
        </div>
      )}

      {/* Workspace Header with Stats */}
      <WorkspaceHeader censusData={censusData} />

      {/* Main Content Row - like dashboard-row */}
      <div className="dashboard-row">
        {/* Patient Census Management */}
        <div className="system-status">
          <h3>👥 Patient Census Management</h3>
          <p>Manage daily patient census and assignments</p>
          <PatientCensusTable
            scratchNotes={scratchNotes}
            onGenerateTemplate={() => {}} // Not used in this workflow
          />
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <p>Common clinical workflow tasks</p>
          <div className="action-grid">
            <button 
              className="action-button"
              onClick={() => onOpenTemplateEditor && onOpenTemplateEditor()}
            >
              <div className="action-icon">📝</div>
              <div className="action-text">Create Template</div>
            </button>
            <button className="action-button">
              <div className="action-icon">📊</div>
              <div className="action-text">View Reports</div>
            </button>
            <button className="action-button">
              <div className="action-icon">🤖</div>
              <div className="action-text">AI Assistant</div>
            </button>
            <button className="action-button">
              <div className="action-icon">⚙️</div>
              <div className="action-text">Settings</div>
            </button>
          </div>
        </div>
      </div>

      {/* Batch Documentation Generation */}
      <BatchDocumentationPanel
        censusData={censusData}
        onGenerateDocuments={handleGenerateDocuments}
        onPreviewDocuments={handlePreviewDocuments}
      />
    </div>
  );
};

export default ClinicalWorkspace;