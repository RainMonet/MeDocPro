import React, { useState, useEffect, useCallback, useRef } from 'react';
import PatientCensusCard from './PatientCensusCard';
import BatchDocumentationCard from './BatchDocumentationCard';
import { RecentDocuments, ClockCard } from '../dashboard';
import DailyInfoEntryModal from '../modals/DailyInfoEntryModal';
import PreviewDocumentModal from '../modals/PreviewDocumentModal';
import { useWeeklyAverages } from './StatCardTooltips';
import apiService from '../../services/api';
import aiAgentAPI from '../../services/aiAgentAPI';

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
const WorkspaceHeader = ({ censusData, userName, onOpenModal, onOpenDailyInfo, onOpenTemplateLibrary }) => {
  const [is24HourFormat, setIs24HourFormat] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const { weeklyAverages, isLoading } = useWeeklyAverages();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Tooltip helper function
  const showStatTooltip = (e, type) => {
    console.log('showStatTooltip called with type:', type);
    console.log('weeklyAverages:', weeklyAverages);

    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });

    let content = '';
    
    if (isLoading) {
      content = 'Loading historical averages...';
    } else if (weeklyAverages) {
      switch (type) {
        case 'total':
          content = `Recent average: ${weeklyAverages.total} patients/day`;
          break;
        case 'admissions':
          content = `Recent average: ${weeklyAverages.admissions} new admissions/day`;
          break;
        case 'followUps':
          content = `Recent average: ${weeklyAverages.followUps} follow-up patients/day`;
          break;
        case 'discharges':
          content = `Recent average: ${weeklyAverages.discharges} discharges/day`;
          break;
        default:
          content = 'Historical data unavailable';
      }
    } else {
      content = 'Historical data unavailable';
    }

    console.log('Setting tooltip content:', content);
    setTooltipContent(content);
    setShowTooltip(true);
  };

  const hideTooltip = () => {
    setShowTooltip(false);
  };

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
      return censusData?.rows?.length || 0;
    }
    
    // Get last 7 days of census data
    const last7Days = censusData.historical_data.slice(-7);
    const total = last7Days.reduce((sum, day) => sum + (day.census_count || 0), 0);
    return Math.round(total / last7Days.length);
  };

  const averageDailyCaseload = calculate7DayAverage();

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Header with integrated stats */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '2rem'
        }}>
          {/* Left side - Title and Date/Time */}
          <div 
            id="workspace-title-section"
            data-ai-component="workspace-title"
            style={{ flex: '0 0 auto' }}
          >
            <h1 
              id="workspace-title"
              data-ai-element="page-title"
              style={{
                margin: 0,
                fontSize: '1.8rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '0.25rem'
              }}
            >
              Clinical Workspace
            </h1>
            <div 
              id="workspace-datetime"
              data-ai-component="datetime-display"
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'baseline',
                gap: '1rem',
                marginTop: '2px'
              }}
            >
              <span 
                id="current-date"
                data-ai-element="current-date"
                data-ai-value={today}
              >
                {today}
              </span>
              <span 
                id="current-time"
                data-ai-element="current-time"
                data-ai-value={formatTime(currentTime)}
                data-ai-format={is24HourFormat ? '24-hour' : '12-hour'}
                data-ai-action="toggle-time-format"
                role="button"
                tabIndex="0"
                aria-label={`Current time: ${formatTime(currentTime)}. Click to toggle format.`}
                style={{
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer'
                }}
                onClick={() => setIs24HourFormat(!is24HourFormat)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIs24HourFormat(!is24HourFormat);
                  }
                }}
                title="Click to toggle time format"
              >
                {formatTime(currentTime)}
              </span>
            </div>
          </div>

          {/* Right side - StatCards inline with header */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexShrink: 0
          }}>
            {/* Total Patients StatCard */}
            <div 
              id="stat-total-patients"
              className="workspace-stat-card"
              role="button"
              tabIndex="0"
              data-ai-component="stat-card"
              data-ai-stat-type="total-patients"
              data-ai-value={censusData?.rows?.length || 0}
              data-ai-action="view-patient-details"
              aria-label={`Total Patients: ${censusData?.rows?.length || 0}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                minWidth: '120px',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                showStatTooltip(e, 'total');
              }}
              onMouseLeave={(e) => {
                hideTooltip();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  showStatTooltip(e, 'total');
                }
              }}
            >
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div 
                  data-ai-element="stat-value"
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    color: 'var(--color-primary)',
                    lineHeight: '1'
                  }}
                >
                  {censusData?.rows?.length || 0}
                </div>
                <div 
                  data-ai-element="stat-label"
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginTop: '2px'
                  }}
                >
                  Total Patients
                </div>
              </div>
            </div>

            {/* Admissions StatCard */}
            <div 
              id="stat-admissions"
              className="workspace-stat-card"
              role="button"
              tabIndex="0"
              data-ai-component="stat-card"
              data-ai-stat-type="admissions"
              data-ai-value={censusData?.rows?.filter(row => row.workflow_type === 'admission' || row.status === 'admission').length || 0}
              data-ai-action="view-admission-patients"
              aria-label={`Admissions: ${censusData?.rows?.filter(row => row.workflow_type === 'admission' || row.status === 'admission').length || 0}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                minWidth: '100px',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                showStatTooltip(e, 'admissions');
              }}
              onMouseLeave={(e) => {
                hideTooltip();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  showStatTooltip(e, 'admissions');
                }
              }}
            >
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div 
                  data-ai-element="stat-value"
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    color: 'var(--color-success)',
                    lineHeight: '1'
                  }}
                >
                  {censusData?.rows?.filter(row => row.workflow_type === 'admission' || row.status === 'admission').length || 0}
                </div>
                <div 
                  data-ai-element="stat-label"
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginTop: '2px'
                  }}
                >
                  Admissions
                </div>
              </div>
            </div>

            {/* Follow-ups StatCard */}
            <div 
              id="stat-followups"
              className="workspace-stat-card"
              role="button"
              tabIndex="0"
              data-ai-component="stat-card"
              data-ai-stat-type="follow-ups"
              data-ai-value={censusData?.rows?.filter(row => row.workflow_type === 'follow-up' || row.status === 'follow-up' || row.status === 'active').length || 0}
              data-ai-action="view-followup-patients"
              aria-label={`Follow-ups: ${censusData?.rows?.filter(row => row.workflow_type === 'follow-up' || row.status === 'follow-up' || row.status === 'active').length || 0}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                minWidth: '100px',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                showStatTooltip(e, 'followUps');
              }}
              onMouseLeave={(e) => {
                hideTooltip();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  showStatTooltip(e, 'followUps');
                }
              }}
            >
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div 
                  data-ai-element="stat-value"
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    color: 'var(--color-info)',
                    lineHeight: '1'
                  }}
                >
                  {censusData?.rows?.filter(row => row.workflow_type === 'follow-up' || row.status === 'follow-up' || row.status === 'active').length || 0}
                </div>
                <div 
                  data-ai-element="stat-label"
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginTop: '2px'
                  }}
                >
                  Follow-Ups
                </div>
              </div>
            </div>

            {/* Discharges StatCard */}
            <div 
              id="stat-discharges"
              className="workspace-stat-card"
              role="button"
              tabIndex="0"
              data-ai-component="stat-card"
              data-ai-stat-type="discharges"
              data-ai-value={censusData?.rows?.filter(row => row.workflow_type === 'discharge' || row.status === 'discharge').length || 0}
              data-ai-action="view-discharge-patients"
              aria-label={`Discharges: ${censusData?.rows?.filter(row => row.workflow_type === 'discharge' || row.status === 'discharge').length || 0}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                minWidth: '100px',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                showStatTooltip(e, 'discharges');
              }}
              onMouseLeave={(e) => {
                hideTooltip();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  showStatTooltip(e, 'discharges');
                }
              }}
            >
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div 
                  data-ai-element="stat-value"
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    color: 'var(--color-warning)',
                    lineHeight: '1'
                  }}
                >
                  {censusData?.rows?.filter(row => row.workflow_type === 'discharge' || row.status === 'discharge').length || 0}
                </div>
                <div 
                  data-ai-element="stat-label"
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginTop: '2px'
                  }}
                >
                  Discharges
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      

      {/* Elegant App-Consistent Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translateX(-50%) translateY(-100%) translateY(-12px)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid var(--border-color)`,
            boxShadow: 'var(--shadow-lg)',
            fontSize: '12px',
            fontWeight: '500',
            fontFamily: 'inherit',
            zIndex: 10000,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            lineHeight: '1.4',
            backdropFilter: 'blur(8px)',
            opacity: 0,
            animation: 'tooltipFadeIn 0.2s ease-out forwards'
          }}
        >
          {tooltipContent}
          {/* Elegant arrow pointing down */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid var(--border-color)`
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% - 1px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `5px solid var(--bg-secondary)`
            }}
          />
        </div>
      )}
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

// Main Clinical Workspace component - AI Agent Enhanced for browser automation
const ClinicalWorkspace = ({ onOpenTemplateEditor, onOpenModal, user }) => {
  const [censusData, setCensusData] = useState(null);
  const [scratchNotes, setScratchNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInProgress, setLoadingInProgress] = useState(false);
  const [censusLoading, setCensusLoading] = useState(false);
  const [error, setError] = useState('');
  const [censusRefreshKey, setCensusRefreshKey] = useState(0);
  const [recentDocumentsRefreshKey, setRecentDocumentsRefreshKey] = useState(0);
  const loadDataRef = useRef();
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [dailyInfoModalOpen, setDailyInfoModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState([]);
  const [batchInfo, setBatchInfo] = useState({});
  const styles = getThemeStyles();

  // AI Agent State Exposure and Keyboard Navigation Setup
  useEffect(() => {
    // Global state exposure for AI agents
    window.MeDocProAPI = window.MeDocProAPI || {};
    window.MeDocProAPI.clinicalWorkspace = {
      // Current state
      state: {
        loading,
        error,
        censusData,
        selectedPatients,
        dailyInfoModalOpen,
        previewModalOpen,
        totalPatients: censusData?.rows?.length || 0,
        activePatients: censusData?.rows?.filter(r => r.status === 'active').length || 0,
        admissions: censusData?.rows?.filter(r => r.workflow_type === 'admission').length || 0,
        discharges: censusData?.rows?.filter(r => r.workflow_type === 'discharge').length || 0,
        followUps: censusData?.rows?.filter(r => r.workflow_type === 'follow-up').length || 0,
      },
      // Actions available to AI agents
      actions: {
        openDailyInfo: () => setDailyInfoModalOpen(true),
        closeDailyInfo: () => setDailyInfoModalOpen(false),
        openPreviewModal: () => setPreviewModalOpen(true),
        closePreviewModal: () => setPreviewModalOpen(false),
        refreshCensus: () => setCensusRefreshKey(prev => prev + 1),
        refreshRecentDocuments: () => setRecentDocumentsRefreshKey(prev => prev + 1),
        loadData: () => loadDataRef.current && loadDataRef.current(),
        openTemplateEditor: onOpenTemplateEditor,
        openModal: onOpenModal,
        selectPatients: setSelectedPatients,
        clearError: () => setError('')
      },
      // Patient data accessors
      patients: {
        getAll: () => censusData?.rows || [],
        getActive: () => censusData?.rows?.filter(r => r.status === 'active') || [],
        getByWorkflow: (type) => censusData?.rows?.filter(r => r.workflow_type === type) || [],
        getSelected: () => selectedPatients,
        findByName: (name) => censusData?.rows?.find(r => 
          r.patient_name?.toLowerCase().includes(name.toLowerCase())
        ),
        findByRoom: (room) => censusData?.rows?.find(r => r.room_number === room)
      },
      // Utility functions
      utils: {
        isReady: () => !loading && !error && censusData,
        hasPatients: () => censusData?.rows?.length > 0,
        canGenerateDocuments: () => selectedPatients.length > 0,
        getTimestamp: () => new Date().toISOString()
      },
      // Keyboard navigation helpers for AI agents
      keyboard: {
        focusNextElement: () => {
          const focusable = document.querySelectorAll('[data-ai-component][tabindex]:not([tabindex="-1"])');
          const current = document.activeElement;
          const currentIndex = Array.from(focusable).indexOf(current);
          const nextIndex = (currentIndex + 1) % focusable.length;
          focusable[nextIndex]?.focus();
        },
        focusPreviousElement: () => {
          const focusable = document.querySelectorAll('[data-ai-component][tabindex]:not([tabindex="-1"])');
          const current = document.activeElement;
          const currentIndex = Array.from(focusable).indexOf(current);
          const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
          focusable[prevIndex]?.focus();
        },
        focusElement: (selector) => {
          const element = document.querySelector(selector);
          element?.focus();
          return !!element;
        },
        activateElement: (selector) => {
          const element = document.querySelector(selector);
          if (element) {
            element.focus();
            element.click();
            element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            return true;
          }
          return false;
        }
      }
    };

    // Global keyboard event handler for AI agent control
    const handleGlobalKeyboard = (event) => {
      // Allow AI agents to intercept keyboard events
      if (window.MeDocProAPI?.keyboardInterceptor) {
        const intercepted = window.MeDocProAPI.keyboardInterceptor(event);
        if (intercepted) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }

      // Skip if typing in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.contentEditable === 'true') {
        return;
      }

      // Skip if modals are open (let modal handle its own navigation)
      if (dailyInfoModalOpen || previewModalOpen) {
        return;
      }

      // Global workspace shortcuts for AI agent automation
      switch (event.key) {
        case 'F1': // Help - show AI agent capabilities
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            console.log('MeDocPro AI Agent Capabilities:', window.MeDocProAI?.getCapabilities());
            console.log('Usage Examples:', window.MeDocProAI?.getUsageExamples());
          }
          break;
        
        case 'F2': // Focus patient census
          event.preventDefault();
          document.querySelector('#patient-census-section')?.focus();
          break;
          
        case 'F3': // Focus batch documentation
          event.preventDefault();
          document.querySelector('#batch-documentation-section')?.focus();
          break;
          
        case 'F4': // Open daily information modal (if patients available)
          if (censusData?.rows?.length > 0) {
            event.preventDefault();
            setDailyInfoModalOpen(true);
          }
          break;
          
        case 'F5': // Refresh census data
          event.preventDefault();
          setCensusRefreshKey(prev => prev + 1);
          loadDataRef.current && loadDataRef.current();
          break;

        case 'Escape': // Clear error or close any open contexts
          if (error) {
            event.preventDefault();
            setError('');
          }
          break;
      }
    };

    // Listen for keyboard shortcut events
    const handleDocumentGeneration = () => {
      // Trigger document generation with default settings
      if (selectedPatients.length > 0) {
        // Find a batch documentation component and trigger its generation
        const batchCard = document.querySelector('[data-ai-component="batch-documentation-card"]');
        if (batchCard) {
          const generateButton = batchCard.querySelector('[data-ai-action="generate-documents"]');
          if (generateButton) {
            generateButton.click();
          }
        }
      }
    };

    const handleTemplateSave = () => {
      // This would be handled by the template editor if it's open
      console.log('🎹 Template save shortcut triggered (handled by template editor)');
    };

    const handleTextEnhancement = () => {
      // Trigger text enhancement on currently focused textarea
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === 'TEXTAREA') {
        // Trigger AI enhancement for the focused text area
        window.dispatchEvent(new CustomEvent('triggerAIEnhancement', { 
          detail: { element: activeElement }
        }));
      }
    };

    // Attach event listeners
    document.addEventListener('keydown', handleGlobalKeyboard, true);
    window.addEventListener('triggerDocumentGeneration', handleDocumentGeneration);
    window.addEventListener('triggerTemplateSave', handleTemplateSave);
    window.addEventListener('triggerTextEnhancement', handleTextEnhancement);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyboard, true);
      window.removeEventListener('triggerDocumentGeneration', handleDocumentGeneration);
      window.removeEventListener('triggerTemplateSave', handleTemplateSave);
      window.removeEventListener('triggerTextEnhancement', handleTextEnhancement);
    };
  }, [
    loading, error, censusData, selectedPatients, dailyInfoModalOpen, 
    previewModalOpen, onOpenTemplateEditor, onOpenModal
  ]);

  // Load today's census data with 7-day historical data
  const loadCensusData = useCallback(async () => {
    if (censusLoading) {
      console.log('🔍 CensusData load already in progress, skipping...');
      return;
    }
    
    console.log('🔍 ClinicalWorkspace: loadCensusData called');
    setCensusLoading(true);
    const token = localStorage.getItem('token');
    console.log('🔍 Token check:', token ? `Token exists (${token.substring(0, 20)}...)` : 'No token');
    
    // Force clear any invalid tokens that keep appearing
    if (token && (token.startsWith('authenticated-token') || token === 'null' || token === 'undefined' || !token.includes('.'))) {
      console.log('❌ Force clearing invalid/persistent token:', token.substring(0, 30));
      localStorage.removeItem('token');
      // Also clear all other possible auth keys
      localStorage.removeItem('auth_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('access_token');
      localStorage.removeItem('accessToken');
      console.log('🧹 Cleared all possible auth tokens');
      return;
    }
    
    if (!token) {
      console.log('❌ No authentication token available, skipping census data load');
      return;
    }
    
    // Check if token looks like a JWT (has 3 parts separated by dots)
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.log('❌ Invalid token format, clearing and skipping load');
      localStorage.removeItem('token');
      return;
    }
    
    console.log('✅ Valid token found, proceeding with API call');
    
    try {
      // Load today's census data (primary data - required)
      const todayResponse = await fetch(`${apiService.baseURL}/api/patient-census/today`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!todayResponse.ok) {
        throw new Error(`HTTP ${todayResponse.status}: ${todayResponse.statusText}`);
      }
      
      const todayData = await todayResponse.json();
      
      if (!todayData.success) {
        setError(todayData.error || 'Failed to load census');
        return;
      }

      // Try to load 7-day historical data (optional - for averages)
      let historicalData = [];
      try {
        const historyResponse = await fetch(`${apiService.baseURL}/api/patient-census/history?days=7`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          // Add timeout for historical data too
          signal: AbortSignal.timeout(3000) // 3 second timeout for optional data
        });
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          if (historyData.success) {
            historicalData = historyData.census_history;
          }
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
      setCensusLoading(false);
      
    } catch (err) {
      console.error('Census loading error:', err);
      
      // More specific error messages
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('⚠️ Backend server not responding - Please restart the backend');
      } else if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
        setError('⏱️ Backend is slow/unresponsive - Try refreshing or restart backend');
      } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError('🔑 Session expired - Please log out and log back in');
        // Auto-logout on auth failure to force re-login
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.reload();
        }, 3000);
      } else if (err.message.includes('404')) {
        setError('📊 Census data not found - may need to initialize');
      } else {
        setError(`❌ Network error: ${err.message}`);
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
    setCensusLoading(false);
  }, [censusLoading]);

  // Load scratch notes for integration
  const loadScratchNotes = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No authentication token available, skipping scratch notes load');
      return;
    }
    
    try {
      const response = await fetch(`${apiService.baseURL}/api/scratch-notes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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

  // Load all data sequentially to avoid overwhelming the backend
  const loadData = useCallback(async () => {
    if (loadingInProgress) {
      console.log('LoadData already in progress, skipping...');
      return; // Prevent concurrent loads
    }
    
    setLoadingInProgress(true);
    setLoading(true);
    try {
      // Load census data first (most important)
      await loadCensusData();
      
      // Wait a bit before loading scratch notes to avoid overwhelming the backend
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadScratchNotes();
    } catch (error) {
      console.error('Error in loadData:', error);
    } finally {
      setLoading(false);
      setLoadingInProgress(false);
    }
  }, [loadCensusData, loadScratchNotes]); // Remove loadingInProgress dependency
  
  // Store loadData in ref to avoid stale closures
  loadDataRef.current = loadData;

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
        
        // Refresh recent documents to show newly generated documents
        setRecentDocumentsRefreshKey(prev => prev + 1);
        console.log('📄 Triggering Recent Documents refresh after document generation');
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

  // Handle daily info modal close with refresh
  const handleCloseDailyInfo = () => {
    setDailyInfoModalOpen(false);
    // Trigger census refresh to update daily info status
    console.log('Daily info modal closed - triggering census refresh for status update');
    setCensusRefreshKey(prev => prev + 1);
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


  // Initial load effect
  useEffect(() => {
    loadDataRef.current();
  }, []);
  
  // Auto-refresh and focus handling
  useEffect(() => {
    // Auto-refresh every 5 minutes, but only if no modals are open
    const interval = setInterval(() => {
      if (!dailyInfoModalOpen && !previewModalOpen) {
        console.log('Auto-refreshing data (no modals open)');
        loadDataRef.current();
      } else {
        console.log('Skipping auto-refresh (modal is open)');
      }
    }, 5 * 60 * 1000);
    
    // Refresh data when window gains focus, but only if no modals are open
    const handleFocus = () => {
      if (!dailyInfoModalOpen && !previewModalOpen) {
        console.log('Window focused - refreshing census data');
        loadDataRef.current();
      } else {
        console.log('Window focused but skipping refresh (modal is open)');
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [dailyInfoModalOpen, previewModalOpen]);

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
    <main 
      id="clinical-workspace"
      className="dashboard-grid"
      role="main"
      aria-label="Clinical Workspace"
      data-ai-component="clinical-workspace"
      data-ai-state={loading ? 'loading' : error ? 'error' : 'ready'}
      data-ai-patients-total={censusData?.rows?.length || 0}
      data-ai-patients-selected={selectedPatients.length}
      data-ai-modal-open={dailyInfoModalOpen || previewModalOpen}
    >
      {/* Error Display */}
      {error && (
        <div 
          id="workspace-error"
          className="error-banner"
          role="alert"
          aria-live="polite"
          data-ai-component="error-display"
          data-ai-error-type="workspace-error"
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '4px solid #ef4444',
            color: '#ef4444',
            borderRadius: '8px',
            fontSize: '0.9rem',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}
        >
          {error}
        </div>
      )}

      {/* Workspace Header with Stats */}
      <header
        id="workspace-header"
        data-ai-component="workspace-header"
        data-ai-action="view-stats"
        aria-label="Workspace Header with Patient Statistics"
      >
        <WorkspaceHeader 
          censusData={censusData} 
          userName={user?.firstName} 
          onOpenModal={onOpenModal} 
          onOpenDailyInfo={handleOpenDailyInfo}
          onOpenTemplateLibrary={() => onOpenModal && onOpenModal('template-library')}
        />
      </header>

      {/* Main Content Row - Patient Census and Batch Documentation */}
      <section 
        id="main-content"
        className="dashboard-row dashboard-row-main"
        data-ai-component="main-content"
        aria-label="Patient Management and Document Generation"
      >
        {/* Patient Census */}
        <div 
          id="patient-census-section"
          className="system-status"
          data-ai-component="patient-census"
          data-ai-action="manage-patients"
          data-ai-patients-count={censusData?.rows?.length || 0}
          aria-label="Patient Census Management"
        >
          <PatientCensusCard
            theme={document.documentElement.getAttribute('data-theme') || 'dark'}
            onBulkGenerate={handleGenerateDocuments}
            onOpenCensusModal={() => onOpenModal && onOpenModal('patient-census')}
            onSelectedPatientsChange={handleSelectedPatientsChange}
            refreshKey={censusRefreshKey}
          />
        </div>

        {/* Batch Documentation Generation */}
        <div 
          id="batch-documentation-section"
          className="system-status"
          data-ai-component="batch-documentation"
          data-ai-action="generate-documents"
          data-ai-selected-patients={selectedPatients.length}
          data-ai-can-generate={selectedPatients.length > 0}
          aria-label="Batch Document Generation"
        >
          <BatchDocumentationCard
            selectedPatients={selectedPatients}
            onGenerate={handleGenerateDocuments}
            theme={document.documentElement.getAttribute('data-theme') || 'dark'}
            onOpenTemplateEditor={() => onOpenTemplateEditor && onOpenTemplateEditor()}
            onOpenTemplateLibrary={() => onOpenModal && onOpenModal('template-library')}
          />
        </div>
      </section>

      {/* Secondary Content Row - Clock and Recent Documents */}
      <section 
        id="secondary-content"
        className="dashboard-row dashboard-row-secondary"
        data-ai-component="secondary-content"
        aria-label="Time Display and Document History"
      >
        {/* Analog Clock */}
        <div 
          id="clock-section"
          className="system-status"
          data-ai-component="clock-display"
          data-ai-action="view-time"
          aria-label="Current Time Display"
        >
          <ClockCard
            theme={document.documentElement.getAttribute('data-theme') || 'dark'}
          />
        </div>

        {/* Recent Documents */}
        <div 
          id="recent-documents-section"
          className="system-status"
          data-ai-component="recent-documents"
          data-ai-action="view-documents"
          aria-label="Recent Documents History"
        >
          <RecentDocuments 
            theme={document.documentElement.getAttribute('data-theme') || 'dark'} 
            refreshKey={recentDocumentsRefreshKey}
          />
        </div>
      </section>

      {/* Daily Information Entry Modal */}
      <DailyInfoEntryModal
        id="daily-info-modal"
        isOpen={dailyInfoModalOpen}
        onClose={handleCloseDailyInfo}
        patients={censusData?.rows || []}
        theme={document.documentElement.getAttribute('data-theme') || 'dark'}
        data-ai-component="daily-info-modal"
        data-ai-modal-state={dailyInfoModalOpen ? 'open' : 'closed'}
        data-ai-action="enter-daily-info"
        aria-label="Daily Information Entry"
      />

      {/* Preview Document Modal */}
      <PreviewDocumentModal
        id="preview-document-modal"
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        documents={generatedDocuments}
        batchInfo={batchInfo}
        theme={document.documentElement.getAttribute('data-theme') || 'dark'}
        data-ai-component="preview-modal"
        data-ai-modal-state={previewModalOpen ? 'open' : 'closed'}
        data-ai-action="preview-documents"
        data-ai-documents-count={generatedDocuments.length}
        aria-label="Document Preview"
      />
    </main>
  );
};

export default ClinicalWorkspace;