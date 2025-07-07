import React, { useState, useEffect, useCallback } from 'react';
import PatientCensusCard from './PatientCensusCard';
import BatchDocumentationCard from './BatchDocumentationCard';
import { RecentDocuments } from '../dashboard';
import DailyInfoEntryModal from '../modals/DailyInfoEntryModal';
import PreviewDocumentModal from '../modals/PreviewDocumentModal';

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
const WorkspaceHeader = ({ censusData, userName, onOpenModal, onOpenDailyInfo }) => {
  const [is24HourFormat, setIs24HourFormat] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const formatTime = (date) => {
    if (is24HourFormat) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  // Calculate 7-day average daily caseload
  const calculate7DayAverage = () => {
    if (!censusData?.historical_data || censusData.historical_data.length === 0) {
      return censusData?.current_census_count || 0;
    }
    
    // Get last 7 days of census data
    const last7Days = censusData.historical_data.slice(-7);
    const total = last7Days.reduce((sum, day) => sum + (day.census_count || 0), 0);
    return Math.round(total / last7Days.length);
  };

  const averageDailyCaseload = calculate7DayAverage();

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.8rem',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              {userName ? `${userName}'s Workspace` : 'Clinical Workspace'}
            </h1>
            <div style={{
              margin: '0.25rem 0 0 0',
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>{today}</span>
              <span>•</span>
              <button
                onClick={() => setIs24HourFormat(!is24HourFormat)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '0'
                }}
                title={`Switch to ${is24HourFormat ? '12-hour' : '24-hour'} format`}
              >
                {formatTime(currentTime)}
              </button>
            </div>
          </div>
          
          {/* Daily Info Button - positioned to the right of the header */}
          <button
            onClick={() => {
              console.log('Daily Info Entry button clicked!');
              if (onOpenDailyInfo) {
                onOpenDailyInfo();
              }
            }}
            style={{
              padding: '8px 16px',
              background: 'var(--color-success)',
              color: 'white',
              border: '1px solid var(--color-success)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)',
              letterSpacing: '0.025em'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = 'var(--shadow-md)';
              e.target.style.background = 'var(--color-success)';
              e.target.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'var(--shadow-sm)';
              e.target.style.background = 'var(--color-success)';
              e.target.style.filter = 'brightness(1)';
            }}
          >
            Daily Info Entry
          </button>
          
        </div>
      </div>

      {/* Stats Cards Row - exactly like dashboard with beautiful gradients */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{censusData?.current_census_count || 0}</div>
          <div className="stat-label">Active Patients</div>
          <div className="stat-change positive">Avg {averageDailyCaseload} over 7 days</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>
            {censusData?.admission_count || 0}
          </div>
          <div className="stat-label">New Admissions</div>
          <div className="stat-change positive">+{censusData?.admission_count || 0} today</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>
            {censusData?.discharge_count || 0}
          </div>
          <div className="stat-label">Discharges</div>
          <div className="stat-change">Processed today</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-info)' }}>
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
const ClinicalWorkspace = ({ onOpenTemplateEditor, onOpenModal, user }) => {
  const [censusData, setCensusData] = useState(null);
  const [scratchNotes, setScratchNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [censusRefreshKey, setCensusRefreshKey] = useState(0);
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [dailyInfoModalOpen, setDailyInfoModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState([]);
  const [batchInfo, setBatchInfo] = useState({});
  const styles = getThemeStyles();

  // Load today's census data with 7-day historical data
  const loadCensusData = useCallback(async () => {
    try {
      // Load today's census data (primary data - required)
      const todayResponse = await fetch('http://localhost:5001/api/patient-census/today', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const todayData = await todayResponse.json();
      
      if (!todayData.success) {
        setError(todayData.error || 'Failed to load census');
        return;
      }

      // Try to load 7-day historical data (optional - for averages)
      let historicalData = [];
      try {
        const historyResponse = await fetch('http://localhost:5001/api/patient-census/history?days=7', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        const historyData = await historyResponse.json();
        
        if (historyData.success) {
          historicalData = historyData.census_history;
        }
        // Silently continue if historical data fails - it's not critical
      } catch (historyErr) {
        console.warn('Historical data not available:', historyErr);
        // Continue without historical data
      }
      
      // Set census data with or without historical data
      const censusWithHistory = {
        ...todayData.census,
        historical_data: historicalData
      };
      
      console.log('Census data loaded:', {
        current_census_count: censusWithHistory.current_census_count,
        admission_count: censusWithHistory.admission_count,
        discharge_count: censusWithHistory.discharge_count,
        totalRows: censusWithHistory.rows?.length || 0,
        activeRows: censusWithHistory.rows?.filter(r => r.status === 'active').length || 0
      });
      
      setCensusData(censusWithHistory);
      setError(''); // Clear any previous errors
      
    } catch (err) {
      console.error('Census loading error:', err);
      
      // More specific error messages
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Backend server not running - using demo data');
      } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError('Authentication failed - please log in');
      } else {
        setError(`Network error: ${err.message}`);
      }
      
      // Provide fallback data so the workspace is still usable
      setCensusData({
        current_census_count: 0,
        admission_count: 0,
        discharge_count: 0,
        rows: [],
        historical_data: []
      });
    }
  }, []);

  // Load scratch notes for integration
  const loadScratchNotes = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/scratch-notes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
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
      
      // Set generated documents and batch info from the BatchDocumentationCard
      if (options.documents && options.batchId) {
        setGeneratedDocuments(options.documents);
        setBatchInfo({
          batchId: options.batchId,
          totalCount: options.totalCount,
          template: options.template,
          exportFormat: options.exportFormat,
          aiEnhanced: options.aiEnhancement
        });
        
        // Open preview modal
        setPreviewModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to generate documents:', err);
      alert('Failed to generate documents. Please try again.');
    }
  };

  // Handle daily info entry
  const handleOpenDailyInfo = () => {
    setDailyInfoModalOpen(true);
  };

  // Handle selected patients change from census card
  const handleSelectedPatientsChange = (patients) => {
    setSelectedPatients(patients);
  };

  // Handle census data changes from modal
  const handleCensusDataChange = () => {
    console.log('Census data changed - triggering refresh');
    setCensusRefreshKey(prev => prev + 1);
    // Also refresh the main census data for the header
    loadCensusData();
  };


  useEffect(() => {
    loadData();
    
    // Auto-refresh every 5 minutes, but only if no modals are open
    const interval = setInterval(() => {
      if (!dailyInfoModalOpen && !previewModalOpen) {
        console.log('Auto-refreshing data (no modals open)');
        loadData();
      } else {
        console.log('Skipping auto-refresh (modal is open)');
      }
    }, 5 * 60 * 1000);
    
    // Refresh data when window gains focus, but only if no modals are open
    const handleFocus = () => {
      if (!dailyInfoModalOpen && !previewModalOpen) {
        console.log('Window focused - refreshing census data');
        loadData();
      } else {
        console.log('Window focused but skipping refresh (modal is open)');
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData, dailyInfoModalOpen, previewModalOpen]);

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
      <WorkspaceHeader censusData={censusData} userName={user?.firstName} onOpenModal={onOpenModal} onOpenDailyInfo={handleOpenDailyInfo} />

      {/* Main Content Row - like dashboard-row */}
      <div className="dashboard-row">
        {/* Patient Census */}
        <div className="system-status">
          <PatientCensusCard
            theme={document.documentElement.getAttribute('data-theme') || 'dark'}
            onBulkGenerate={handleGenerateDocuments}
            onOpenCensusModal={() => onOpenModal && onOpenModal('patient-census')}
            onSelectedPatientsChange={handleSelectedPatientsChange}
            refreshKey={censusRefreshKey}
          />
        </div>

        {/* Batch Documentation Generation */}
        <div className="system-status">
          <BatchDocumentationCard
            selectedPatients={selectedPatients}
            onGenerate={handleGenerateDocuments}
            theme={document.documentElement.getAttribute('data-theme') || 'dark'}
            onOpenTemplateEditor={() => onOpenTemplateEditor && onOpenTemplateEditor()}
          />
        </div>
      </div>

      {/* Recent Documents */}
      <RecentDocuments theme={document.documentElement.getAttribute('data-theme') || 'dark'} />

      {/* Daily Information Entry Modal */}
      <DailyInfoEntryModal
        isOpen={dailyInfoModalOpen}
        onClose={() => setDailyInfoModalOpen(false)}
        patients={censusData?.rows || []}
        theme={document.documentElement.getAttribute('data-theme') || 'dark'}
      />

      {/* Preview Document Modal */}
      <PreviewDocumentModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        documents={generatedDocuments}
        batchInfo={batchInfo}
        theme={document.documentElement.getAttribute('data-theme') || 'dark'}
      />
    </div>
  );
};

export default ClinicalWorkspace;