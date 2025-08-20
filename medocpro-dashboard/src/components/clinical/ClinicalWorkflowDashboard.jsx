import React, { useState, useEffect, useCallback } from 'react';
import ScratchPad from './ScratchPad';
import PatientCensusTable from './PatientCensusTable';

// Helper function for theme-aware styling
const getThemeStyles = (theme) => ({
  textPrimary: theme === 'dark' ? '#f1f5f9' : '#1f2937',
  textSecondary: theme === 'dark' ? '#cbd5e1' : '#6b7280',
  textMuted: theme === 'dark' ? '#94a3b8' : '#9ca3af',
  bgPrimary: theme === 'dark' ? '#1e293b' : 'white',
  bgSecondary: theme === 'dark' ? '#0f172a' : '#f8fafc',
  bgAccent: theme === 'dark' ? '#374151' : '#f3f4f6',
  borderColor: theme === 'dark' ? '#475569' : '#e5e7eb',
  accentColor: '#3b82f6'
});

// Workflow stage indicator
const WorkflowStage = ({ stage, isActive, isCompleted, theme = 'dark' }) => {
  const styles = getThemeStyles(theme);
  
  const stageConfig = {
    scratch: { icon: '📝', label: 'Clinical Notes', description: 'Capture quick observations' },
    census: { icon: '📊', label: 'Patient Census', description: 'Organize patient data' },
    template: { icon: '📄', label: 'Documentation', description: 'Generate clinical docs' }
  };

  const config = stageConfig[stage];
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : styles.bgSecondary,
      border: `2px solid ${isActive ? styles.accentColor : styles.borderColor}`,
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: isCompleted ? '#10b981' : isActive ? styles.accentColor : styles.borderColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        transition: 'all 0.3s ease'
      }}>
        {isCompleted ? '✓' : config.icon}
      </div>
      
      <div style={{ flex: 1 }}>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: isActive ? styles.accentColor : styles.textPrimary
        }}>
          {config.label}
        </h4>
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: styles.textSecondary
        }}>
          {config.description}
        </p>
      </div>

      {isCompleted && (
        <div style={{
          fontSize: '12px',
          color: '#10b981',
          fontWeight: '500'
        }}>
          ✓ Ready
        </div>
      )}
    </div>
  );
};

// Data flow visualization
const DataFlowVisualization = ({ scratchNotes, censusData, theme = 'dark' }) => {
  const styles = getThemeStyles(theme);
  
  return (
    <div style={{
      padding: '20px',
      backgroundColor: styles.bgSecondary,
      borderRadius: '8px',
      marginBottom: '24px'
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: styles.textPrimary,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🔄 Clinical Workflow Pipeline
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
      }}>
        <WorkflowStage 
          stage="scratch" 
          isActive={scratchNotes.length === 0}
          isCompleted={scratchNotes.length > 0}
          theme={theme}
        />
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: styles.textMuted
        }}>
          <span style={{ fontSize: '24px' }}>→</span>
        </div>
        
        <WorkflowStage 
          stage="census" 
          isActive={scratchNotes.length > 0 && (!censusData || (censusData.rows?.length || 0) === 0)}
          isCompleted={censusData && (censusData.rows?.length || 0) > 0}
          theme={theme}
        />
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: styles.textMuted
        }}>
          <span style={{ fontSize: '24px' }}>→</span>
        </div>
        
        <WorkflowStage 
          stage="template" 
          isActive={censusData && (censusData.rows?.length || 0) > 0}
          isCompleted={false}
          theme={theme}
        />
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: `1px solid ${styles.borderColor}`
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: styles.accentColor }}>
            {scratchNotes.length}
          </div>
          <div style={{ fontSize: '11px', color: styles.textMuted }}>
            Active Notes
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
            {censusData?.rows?.length || 0}
          </div>
          <div style={{ fontSize: '11px', color: styles.textMuted }}>
            Census Patients
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
            {scratchNotes.filter(n => n.transferred_to_census).length}
          </div>
          <div style={{ fontSize: '11px', color: styles.textMuted }}>
            Transferred
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
            {scratchNotes.filter(n => n.visual_age_stage === 'expiring').length}
          </div>
          <div style={{ fontSize: '11px', color: styles.textMuted }}>
            Expiring Soon
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Action Cards
const QuickActionCard = ({ title, description, icon, onClick, disabled = false, theme = 'dark' }) => {
  const styles = getThemeStyles(theme);
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '16px',
        backgroundColor: disabled ? styles.bgAccent : styles.bgPrimary,
        border: `1px solid ${styles.borderColor}`,
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        textAlign: 'left'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.borderColor = styles.accentColor;
          e.target.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.borderColor = styles.borderColor;
          e.target.style.transform = 'translateY(0)';
        }
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px'
      }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: styles.textPrimary
        }}>
          {title}
        </h4>
      </div>
      <p style={{
        margin: 0,
        fontSize: '12px',
        color: styles.textSecondary,
        lineHeight: 1.4
      }}>
        {description}
      </p>
    </button>
  );
};

// Main Clinical Workflow Dashboard
const ClinicalWorkflowDashboard = ({ 
  theme = 'dark', 
  onOpenTemplateEditor,
  onOpenTemplateLibrary 
}) => {
  const [activeView, setActiveView] = useState('overview'); // overview, scratch, census
  const [scratchNotes, setScratchNotes] = useState([]);
  const [censusData, setCensusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const styles = getThemeStyles(theme);

  // Load scratch notes
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

  // Load census data
  const loadCensusData = useCallback(async () => {
    try {
      const response = await fetch('/api/patient-census/today');
      const data = await response.json();
      
      if (data.success) {
        setCensusData(data.census);
      }
    } catch (err) {
      console.error('Failed to load census:', err);
    }
  }, []);

  // Handle data refresh
  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadScratchNotes(), loadCensusData()]);
    setLoading(false);
  }, [loadScratchNotes, loadCensusData]);

  // Handle transferring scratch note to census
  const handleTransferToCensus = useCallback((note) => {
    // This would open a modal to select/create census row
    // For now, just switch to census view
    setActiveView('census');
  }, []);

  // Handle creating template from scratch note
  const handleCreateTemplate = useCallback((note) => {
    if (onOpenTemplateEditor) {
      onOpenTemplateEditor({
        initialContent: note.content,
        title: note.title || 'Template from Scratch Note'
      });
    }
  }, [onOpenTemplateEditor]);

  // Handle generating templates for census patients
  const handleGenerateTemplates = useCallback((patients) => {
    if (onOpenTemplateEditor) {
      onOpenTemplateEditor({
        patientData: patients,
        mode: 'batch_generation'
      });
    }
  }, [onOpenTemplateEditor]);

  useEffect(() => {
    refreshData();
    // Auto-refresh every 2 minutes
    const interval = setInterval(refreshData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshData]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        backgroundColor: styles.bgPrimary,
        borderRadius: '8px'
      }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: styles.textPrimary
          }}>
            🏥 Clinical Workflow Dashboard
          </h1>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '14px',
            color: styles.textSecondary
          }}>
            Streamlined documentation workflow with PHI-minimal retention
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveView('overview')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeView === 'overview' ? styles.accentColor : 'transparent',
              color: activeView === 'overview' ? 'white' : styles.textPrimary,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveView('scratch')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeView === 'scratch' ? styles.accentColor : 'transparent',
              color: activeView === 'scratch' ? 'white' : styles.textPrimary,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📝 Scratch Pad
          </button>
          <button
            onClick={() => setActiveView('census')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeView === 'census' ? styles.accentColor : 'transparent',
              color: activeView === 'census' ? 'white' : styles.textPrimary,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            🏥 Census
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '4px solid #ef4444',
          color: '#ef4444',
          marginBottom: '20px',
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      {/* Content Views */}
      {activeView === 'overview' && (
        <div>
          {/* Data Flow Visualization */}
          <DataFlowVisualization 
            scratchNotes={scratchNotes}
            censusData={censusData}
            theme={theme}
          />

          {/* Quick Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <QuickActionCard
              title="Create Scratch Note"
              description="Start with quick clinical observations that auto-expire in 7 days"
              icon="📝"
              onClick={() => setActiveView('scratch')}
              theme={theme}
            />
            
            <QuickActionCard
              title="Update Patient Census"
              description="Manage today's patient list and organize clinical data"
              icon="📊"
              onClick={() => setActiveView('census')}
              theme={theme}
            />
            
            <QuickActionCard
              title="Generate Documentation"
              description="Create clinical documents from organized patient data"
              icon="📄"
              onClick={() => handleGenerateTemplates(censusData?.rows?.filter(r => r.status === 'active') || [])}
              disabled={!censusData || (censusData.rows?.length || 0) === 0}
              theme={theme}
            />
            
            <QuickActionCard
              title="Template Library"
              description="Browse and manage clinical documentation templates"
              icon="📚"
              onClick={onOpenTemplateLibrary}
              theme={theme}
            />
          </div>

          {/* Recent Activity */}
          <div style={{
            backgroundColor: styles.bgPrimary,
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: styles.textPrimary
            }}>
              📈 Recent Activity
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {/* Expiring Notes Alert */}
              {scratchNotes.filter(n => n.visual_age_stage === 'expiring').length > 0 && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderLeft: '4px solid #ef4444',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#ef4444' }}>
                    ⚠️ {scratchNotes.filter(n => n.visual_age_stage === 'expiring').length} notes expiring soon
                  </div>
                  <div style={{ fontSize: '11px', color: styles.textMuted, marginTop: '4px' }}>
                    Review and transfer to census or promote to templates
                  </div>
                </div>
              )}

              {/* Census Updates */}
              {censusData && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#3b82f6' }}>
                    📊 {censusData.rows?.length || 0} active patients
                  </div>
                  <div style={{ fontSize: '11px', color: styles.textMuted, marginTop: '4px' }}>
                    Last updated: {new Date(censusData.last_updated).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {/* Workflow Tips */}
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderLeft: '4px solid #10b981',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#10b981' }}>
                  💡 Pro Tip
                </div>
                <div style={{ fontSize: '11px', color: styles.textMuted, marginTop: '4px' }}>
                  Use scratch notes for quick observations, then transfer to census for documentation
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'scratch' && (
        <ScratchPad
          theme={theme}
          onTransferToCensus={handleTransferToCensus}
          onCreateTemplate={handleCreateTemplate}
        />
      )}

      {activeView === 'census' && (
        <PatientCensusTable
          scratchNotes={scratchNotes}
          onGenerateTemplate={handleGenerateTemplates}
          theme={theme}
        />
      )}
    </div>
  );
};

export default ClinicalWorkflowDashboard;