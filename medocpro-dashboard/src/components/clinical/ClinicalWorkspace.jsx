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

// Header section with date and quick stats - matches dashboard design
const WorkspaceHeader = ({ censusData }) => {
  const styles = getThemeStyles();
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 2rem 0',
    }}>
      <div style={{
        background: styles.bgPrimary,
        borderRadius: '12px',
        padding: '1.5rem',
        border: `1px solid ${styles.borderColor}`,
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '700',
              color: styles.textPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              🏥 Clinical Workspace
            </h1>
            <p style={{
              margin: '0.25rem 0 0 0',
              fontSize: '0.9rem',
              color: styles.textSecondary
            }}>
              {today}
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            background: styles.bgSecondary,
            borderRadius: '8px',
            padding: '1rem',
            border: `1px solid ${styles.borderColor}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: styles.accentColor,
              marginBottom: '0.25rem'
            }}>
              {censusData?.current_census_count || 0}
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: styles.textSecondary,
              fontWeight: '500'
            }}>
              Active Patients
            </div>
          </div>

          <div style={{
            background: styles.bgSecondary,
            borderRadius: '8px',
            padding: '1rem',
            border: `1px solid ${styles.borderColor}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: styles.success,
              marginBottom: '0.25rem'
            }}>
              {censusData?.admission_count || 0}
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: styles.textSecondary,
              fontWeight: '500'
            }}>
              New Today
            </div>
          </div>

          <div style={{
            background: styles.bgSecondary,
            borderRadius: '8px',
            padding: '1rem',
            border: `1px solid ${styles.borderColor}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: styles.warning,
              marginBottom: '0.25rem'
            }}>
              {censusData?.discharge_count || 0}
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: styles.textSecondary,
              fontWeight: '500'
            }}>
              Discharged
            </div>
          </div>
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
    <div style={{
      background: styles.bgPrimary,
      borderRadius: '12px',
      padding: '1.5rem',
      border: `1px solid ${styles.borderColor}`,
      marginBottom: '2rem'
    }}>
      <h3 style={{
        margin: '0 0 1rem 0',
        fontSize: '1.1rem',
        fontWeight: '600',
        color: styles.textPrimary,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        📄 Batch Documentation Generation
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Template Selection */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: '500',
            color: styles.textPrimary,
            marginBottom: '0.5rem'
          }}>
            Document Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '8px',
              background: styles.bgSecondary,
              color: styles.textPrimary,
              fontSize: '0.9rem'
            }}
          >
            {templateOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Export Format */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: '500',
            color: styles.textPrimary,
            marginBottom: '0.5rem'
          }}>
            Export Format
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '8px',
              background: styles.bgSecondary,
              color: styles.textPrimary,
              fontSize: '0.9rem'
            }}
          >
            {exportOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* AI Enhancement Toggle */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: '500',
            color: styles.textPrimary,
            marginBottom: '0.5rem'
          }}>
            AI Enhancement
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            padding: '0.75rem',
            background: styles.bgSecondary,
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '8px'
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
            <span style={{
              fontSize: '0.9rem',
              color: styles.textPrimary
            }}>
              🤖 Use Ollama LLM
            </span>
          </label>
        </div>
      </div>

      {/* Generation Status */}
      <div style={{
        padding: '0.75rem 1rem',
        background: styles.bgSecondary,
        borderRadius: '8px',
        marginBottom: '1rem',
        border: `1px solid ${styles.borderColor}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem'
        }}>
          <span style={{ color: styles.textPrimary }}>
            Ready to generate <strong>{activePatients.length}</strong> patient documents
          </span>
          <span style={{ color: styles.textSecondary }}>
            {templateOptions.find(t => t.value === selectedTemplate)?.label}
          </span>
        </div>
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
          style={{
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '8px',
            color: styles.textPrimary,
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: activePatients.length > 0 ? 'pointer' : 'not-allowed',
            opacity: activePatients.length > 0 ? 1 : 0.5,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (activePatients.length > 0) {
              e.target.style.background = styles.bgAccent;
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
          }}
        >
          👁️ Preview Sample
        </button>

        <button
          onClick={handleGenerate}
          disabled={activePatients.length === 0 || isGenerating}
          style={{
            padding: '0.75rem 1.25rem',
            background: activePatients.length > 0 && !isGenerating ? styles.success : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: activePatients.length > 0 && !isGenerating ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          {isGenerating ? (
            <>
              <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
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
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      background: 'var(--bg-primary)'
    }}>
      {/* Workspace Header */}
      <WorkspaceHeader censusData={censusData} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 2rem' }}>
        {/* Error Display */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '4px solid #ef4444',
            color: '#ef4444',
            marginBottom: '2rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        {/* Patient Census Management */}
        <div style={{ marginBottom: '2rem' }}>
          <PatientCensusTable
            scratchNotes={scratchNotes}
            onGenerateTemplate={() => {}} // Not used in this workflow
          />
        </div>

        {/* Batch Documentation Generation */}
        <BatchDocumentationPanel
          censusData={censusData}
          onGenerateDocuments={handleGenerateDocuments}
          onPreviewDocuments={handlePreviewDocuments}
        />
      </div>
    </div>
  );
};

export default ClinicalWorkspace;