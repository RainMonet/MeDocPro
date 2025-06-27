// medocpro-dashboard/src/App.jsx - COMBINED WITH TEMPLATE EDITOR
import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import SidebarToggle from './components/layout/SidebarToggle';
import StatCard from './components/ui/StatCard';
import { SystemStatus, ClinicalNotesOverview, RecentDocuments } from './components/dashboard';
import { PatientCensusModal } from './components/modals';
import TemplateEditor from './components/TemplateEditor';
import TemplateLibrary from './components/templates/TemplateLibrary';
import ClinicalWorkflowDashboard from './components/clinical/ClinicalWorkflowDashboard';
import ClinicalWorkspace from './components/clinical/ClinicalWorkspace';
import apiService from './services/api';
import './App.css';

function App() {
  // State management
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [viewMode, setViewMode] = useState('workspace'); // 'workspace' or 'dashboard'
  
  // Template editor state
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);

  // User data
  const user = {
    firstName: "Dr. Jane",
    lastName: "Smith",
    role: "Psychiatrist"
  };


  // Effects
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarExpanded(false); // Start collapsed on desktop
      } else {
        setSidebarExpanded(false); // Start collapsed on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Event handlers
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarExpanded(prev => !prev);
  };

  const handleModalOpen = (modalType) => {
    console.log('Modal type clicked:', modalType);
    if (modalType === 'template-editor') {
      console.log('Opening template editor');
      setShowTemplateEditor(true);
      setCurrentTemplate(null);
    } else if (modalType === 'clinical-workflow') {
      setActiveModal(modalType);
    } else {
      setActiveModal(modalType);
    }
    // Close sidebar on mobile when opening modal
    if (isMobile) {
      setSidebarExpanded(false);
    }
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  // Template editor handlers
  const handleNewTemplate = () => {
    setCurrentTemplate(null);
    setShowTemplateEditor(true);
  };

  const handleEditTemplate = (template) => {
    setCurrentTemplate(template);
    setShowTemplateEditor(true);
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      if (currentTemplate && currentTemplate.id) {
        await apiService.updateTemplate(currentTemplate.id, templateData);
      } else {
        await apiService.createTemplate(templateData);
      }
      setShowTemplateEditor(false);
      setCurrentTemplate(null);
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setShowTemplateEditor(false);
    setCurrentTemplate(null);
  };

  const getModalTitle = (modalType) => {
    const titles = {
      documents: "Document Library",
      templates: "Clinical Templates",
      "template-library": "Template Library",
      assessments: "Psychiatric Assessments", 
      notes: "Progress Notes",
      treatment: "Treatment Plans",
      reports: "Clinical Reports",
      ai: "AI Assistant",
      settings: "Application Settings",
      "clinical-workflow": "Clinical Workflow Dashboard"
    };
    return titles[modalType] || "Feature";
  };

  return (
    <div className="app-container">
      <SidebarToggle onClick={toggleSidebar} theme={theme} />
      <Header user={user} theme={theme} onToggleTheme={toggleTheme} />

      <div className="main-layout">
        <Sidebar 
          onModalOpen={handleModalOpen}
          onViewChange={setViewMode}
          expanded={sidebarExpanded}
          isMobile={isMobile}
          onToggle={toggleSidebar}
          viewMode={viewMode}
        />
        
        {/* Mobile Overlay */}
        {isMobile && sidebarExpanded && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 99,
              backdropFilter: 'blur(2px)'
            }}
            onClick={() => setSidebarExpanded(false)}
          />
        )}
        
        {/* Content Area */}
        <div className={`content-area ${sidebarExpanded ? '' : 'expanded'}`}>
          {viewMode === 'workspace' ? (
            <ClinicalWorkspace 
              onOpenTemplateEditor={() => {
                setShowTemplateEditor(true);
                setCurrentTemplate(null);
              }}
            />
          ) : (
            <div className="dashboard-grid">
              {/* Statistics Cards */}
              <div className="stats-row">
                <StatCard 
                  value="24" 
                  label="Active Templates" 
                  change="+3 this week" 
                  trend="positive" 
                />
                <StatCard 
                  value="156" 
                  label="Documents Created" 
                  change="+12 today" 
                  trend="positive" 
                />
                <StatCard 
                  value="89%" 
                  label="AI Efficiency" 
                  change="+5% this month" 
                  trend="positive" 
                />
                <StatCard 
                  value="42" 
                  label="Patient Records" 
                  change="+8 today" 
                  trend="positive" 
                />
              </div>

              {/* Dashboard Content Row */}
              <div className="dashboard-row">
                <SystemStatus />
                <ClinicalNotesOverview onOpenClinicalWorkflow={(view) => {
                  setViewMode('workspace');
                  // Switch to workspace view instead of modal
                }} />
              </div>

              {/* Recent Documents */}
              <RecentDocuments />
            </div>
          )}
        </div>
      </div>

      {/* Modal System */}
      <PatientCensusModal
        isOpen={activeModal === 'patients'}
        onClose={handleModalClose}
      />
      
      {/* Template Editor Modal */}
      <TemplateEditor
        isOpen={showTemplateEditor}
        initialTemplate={currentTemplate}
        onSave={handleSaveTemplate}
        onCancel={handleCancelEdit}
        theme={theme}
      />
      
      {/* Clinical Workflow Dashboard Modal */}
      {activeModal === 'clinical-workflow' && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()}
            style={{
              width: '95vw',
              height: '90vh',
              maxWidth: '1400px',
              padding: '0',
              backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
              backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600',
                color: theme === 'dark' ? '#f1f5f9' : '#1f2937'
              }}>
                🏥 Clinical Workflow Dashboard
              </h2>
              <button 
                className="modal-close" 
                onClick={handleModalClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#94a3b8' : '#6b7280',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ 
              height: 'calc(100% - 70px)', 
              overflow: 'auto',
              padding: '0'
            }}>
              <ClinicalWorkflowDashboard 
                theme={theme}
                onOpenTemplateEditor={() => {
                  setActiveModal(null);
                  setShowTemplateEditor(true);
                }}
                onOpenTemplateLibrary={() => {
                  setActiveModal('template-library');
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Template Library Modal */}
      {activeModal === 'template-library' && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()}
            style={{
              width: '95vw',
              height: '90vh',
              maxWidth: '1200px',
              padding: '0',
              backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
              backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600',
                color: theme === 'dark' ? '#f1f5f9' : '#1f2937'
              }}>
                📚 Template Library
              </h2>
              <button 
                className="modal-close" 
                onClick={handleModalClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#94a3b8' : '#6b7280',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ 
              height: 'calc(100% - 70px)', 
              overflow: 'auto',
              padding: '0'
            }}>
              <TemplateLibrary
                onEditTemplate={(template) => {
                  setActiveModal(null);
                  handleEditTemplate(template);
                }}
                onUseTemplate={(template) => {
                  setActiveModal(null);
                  handleEditTemplate(template);
                }}
                onCreateNew={() => {
                  setActiveModal(null);
                  handleNewTemplate();
                }}
                theme={theme}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Coming Soon Modal for other features */}
      {activeModal && activeModal !== 'patients' && activeModal !== 'clinical-workflow' && activeModal !== 'template-library' && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content coming-soon" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleModalClose}>×</button>
            <div className="coming-soon-content">
              <h2>{getModalTitle(activeModal)}</h2>
              <p>This feature is coming soon to MeDocPro!</p>
              <p>We're working hard to bring you the best psychiatric documentation tools.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;