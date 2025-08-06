// medocpro-dashboard/src/App.jsx - COMBINED WITH TEMPLATE EDITOR
import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import SidebarToggle from './components/layout/SidebarToggle';
import { SystemStatus, AIAnalysisOverview, RecentDocuments } from './components/dashboard';
import { PatientCensusModal } from './components/modals';
import DailyInfoEntryModal from './components/modals/DailyInfoEntryModal';
import AccessibilityModal from './components/modals/AccessibilityModal';
import AuditLoggingModal from './components/modals/AuditLoggingModal';
import AIEnhancementModal from './components/modals/AIEnhancementModal';
import AIEnhancement from './components/templates/AIEnhancement';
import TemplateEditor from './components/TemplateEditor';
import TemplateLibrary from './components/templates/TemplateLibrary';
import ClinicalWorkflowDashboard from './components/clinical/ClinicalWorkflowDashboard';
import ClinicalWorkspace from './components/clinical/ClinicalWorkspace';
import LoginForm from './components/auth/LoginForm';
import apiService from './services/api';
import quotesService from './services/quotesService';
import './App.css';

function App() {
  // State management
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });
  
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [viewMode, setViewMode] = useState('workspace'); // 'workspace' or 'dashboard'
  const [workspaceRefreshKey, setWorkspaceRefreshKey] = useState(0);
  const [isNewLogin, setIsNewLogin] = useState(false);
  
  // Template editor state
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [templateRefreshKey, setTemplateRefreshKey] = useState(0);
  
  // Patient data for daily info entry
  const [patientList, setPatientList] = useState([]);

  // User data - initially hardcoded, will be updated on login/switch
  const [user, setUser] = useState({
    firstName: "Jane",
    lastName: "Smith",
    role: "Psychiatrist"
  });



  // Authentication handlers
  const handleLogin = async () => {
    setIsAuthenticated(true);
    setIsNewLogin(true);
    
    // Load current user data after login
    try {
      const response = await apiService.getCurrentUser();
      if (response.success && response.user) {
        setUser({
          firstName: response.user.firstName || response.user.first_name,
          lastName: response.user.lastName || response.user.last_name,
          role: response.user.role,
          id: response.user.id
        });
      }
    } catch (error) {
      console.error('Failed to load current user after login:', error);
    }
    
    // Reset the new login flag after a brief moment
    setTimeout(() => setIsNewLogin(false), 1000);
  };

  const handleLogout = () => {
    console.log('App.jsx handleLogout called!');
    console.log('Current isAuthenticated:', isAuthenticated);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    quotesService.reset(); // Reset quotes service for next login
    console.log('Token removed from localStorage');
    setIsAuthenticated(false);
    setIsNewLogin(false);
    console.log('isAuthenticated set to false');
  };

  // User switch handler
  const handleUserSwitch = (newUser) => {
    setUser({
      firstName: newUser.firstName || newUser.first_name,
      lastName: newUser.lastName || newUser.last_name,
      role: newUser.role,
      id: newUser.id
    });
    // Refresh workspace data since we're now a different user
    setWorkspaceRefreshKey(prev => prev + 1);
  };

  // Load current user on app start
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (isAuthenticated && localStorage.getItem('token')) {
        try {
          const response = await apiService.getCurrentUser();
          if (response.success && response.user) {
            setUser({
              firstName: response.user.firstName || response.user.first_name,
              lastName: response.user.lastName || response.user.last_name,
              role: response.user.role,
              id: response.user.id
            });
          }
        } catch (error) {
          console.error('Failed to load current user:', error);
        }
      }
    };

    loadCurrentUser();
  }, [isAuthenticated]);

  // Also load user data on initial mount if already authenticated
  useEffect(() => {
    const loadInitialUser = async () => {
      if (isAuthenticated && localStorage.getItem('token')) {
        try {
          const response = await apiService.getCurrentUser();
          if (response.success && response.user) {
            setUser({
              firstName: response.user.firstName || response.user.first_name,
              lastName: response.user.lastName || response.user.last_name,
              role: response.user.role,
              id: response.user.id
            });
          }
        } catch (error) {
          console.error('Failed to load initial current user:', error);
        }
      }
    };

    loadInitialUser();
  }, []); // Run once on mount

  // Track activeModal changes
  useEffect(() => {
    console.log('🎯 activeModal changed to:', activeModal);
    console.log('🎯 Should render AIEnhancementModal:', activeModal === 'ai-assistant-settings');
  }, [activeModal]);

  // Effects
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Listen for custom modal events (fallback)
    const handleCustomModalEvent = (event) => {
      console.log('Custom modal event received:', event.detail);
      if (event.detail?.modalType) {
        handleModalOpen(event.detail.modalType);
      }
    };

    window.addEventListener('openModal', handleCustomModalEvent);
    return () => window.removeEventListener('openModal', handleCustomModalEvent);
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

  // Load patient data for daily info entry
  const loadPatientData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No authentication token available, skipping patient data load');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/patient-census/today', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success && data.census) {
        console.log('Loaded patients:', data.census.rows?.length || 0);
        setPatientList(data.census.rows || []);
      } else {
        console.error('Failed to load patient data:', data);
      }
    } catch (err) {
      console.error('Failed to load patient data:', err);
    }
  };

  const handleModalOpen = async (modalType) => {
    console.log('handleModalOpen called with:', modalType);
    console.log('Current activeModal before change:', activeModal);
    
    if (modalType === 'template-editor') {
      console.log('Opening template editor');
      setShowTemplateEditor(true);
      setCurrentTemplate(null);
    } else if (modalType === 'daily-info-entry') {
      console.log('Opening daily info entry modal');
      // Load fresh patient data when opening daily info entry
      await loadPatientData();
      setActiveModal(modalType);
      console.log('Set activeModal to:', modalType);
    } else if (modalType === 'clinical-workflow') {
      setActiveModal(modalType);
    } else if (modalType === 'accessibility') {
      setActiveModal(modalType);
    } else if (modalType === 'ai-assistant-settings') {
      console.log('Setting activeModal to ai-assistant-settings');
      setActiveModal(modalType);
      console.log('activeModal should now be:', modalType);
    } else if (modalType === 'audit-logging') {
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
    console.log('🚨 handleModalClose called! Current activeModal:', activeModal);
    console.trace('🚨 Modal close called from:');
    
    // Check which modal is closing before setting it to null
    const wasPatientCensusModal = activeModal === 'patient-census' || activeModal === 'patients';
    
    setActiveModal(null);
    console.log('🚨 Set activeModal to null');
    
    // Only refresh workspace if census data was actually modified (not for daily info modal)
    if (viewMode === 'workspace' && wasPatientCensusModal) {
      setWorkspaceRefreshKey(prev => prev + 1);
    }
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
    console.log('App.jsx handleSaveTemplate called with:', templateData);
    console.log('currentTemplate:', currentTemplate);
    
    try {
      if (currentTemplate && currentTemplate.id) {
        console.log('Updating existing template with ID:', currentTemplate.id);
        await apiService.updateTemplate(currentTemplate.id, templateData);
      } else {
        console.log('Creating new template');
        await apiService.createTemplate(templateData);
      }
      setShowTemplateEditor(false);
      setCurrentTemplate(null);
      
      // Trigger refresh of template-related components
      setTemplateRefreshKey(prev => prev + 1);
      console.log('Template saved successfully, triggering refresh');
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

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} theme={theme} />;
  }

  return (
    <div className="app-container">
      <SidebarToggle onClick={toggleSidebar} theme={theme} />
      <Header 
        user={user} 
        theme={theme} 
        onToggleTheme={toggleTheme}
        viewMode={viewMode}
        onViewChange={setViewMode}
        onLogout={handleLogout}
        onUserSwitch={handleUserSwitch}
        isNewLogin={isNewLogin}
      />

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
              key={workspaceRefreshKey} // Force refresh when key changes
              onOpenTemplateEditor={() => {
                setShowTemplateEditor(true);
                setCurrentTemplate(null);
              }}
              onOpenModal={handleModalOpen}
              user={user}
            />
          ) : (
            <div className="dashboard-grid">
              {/* Dashboard Content Row */}
              <div className="dashboard-row">
                <SystemStatus />
                <AIAnalysisOverview onOpenClinicalWorkflow={(view) => {
                  setViewMode('workspace');
                  // Switch to workspace view instead of modal
                }} />
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Modal System */}
      <PatientCensusModal
        isOpen={activeModal === 'patients' || activeModal === 'patient-census'}
        onClose={handleModalClose}
        onDataChange={() => setWorkspaceRefreshKey(prev => prev + 1)}
        theme={theme}
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
              backgroundColor: theme === 'dark' ? '#0f172a' : '#faf8f3',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#d4c4a8'}`,
              backgroundColor: theme === 'dark' ? '#1e293b' : '#f4f1eb'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600',
                color: theme === 'dark' ? '#f1f5f9' : '#2d1810'
              }}>
                Template Library
              </h2>
              <button 
                className="modal-close" 
                onClick={handleModalClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#94a3b8' : '#8b7355',
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
                key={templateRefreshKey}
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
      
      {/* Daily Info Entry Modal */}
      <DailyInfoEntryModal
        isOpen={activeModal === 'daily-info-entry'}
        onClose={handleModalClose}
        patients={patientList}
        theme={theme}
      />
      
      {/* Accessibility Modal */}
      <AccessibilityModal
        isOpen={activeModal === 'accessibility'}
        onClose={handleModalClose}
        theme={theme}
      />
      
      {/* Audit Logging Modal */}
      <AuditLoggingModal
        isOpen={activeModal === 'audit-logging'}
        onClose={handleModalClose}
        theme={theme}
      />
      
      {/* Debug info */}
      {console.log('Current activeModal:', activeModal)}
      {console.log('Modal should be open:', activeModal === 'daily-info-entry')}
      {console.log('Patient list length:', patientList.length)}
      
      {/* AI Assistant Settings Modal - Ollama AI Enhancement */}
      <AIEnhancementModal
        isOpen={activeModal === 'ai-assistant-settings'}
        onClose={handleModalClose}
        theme={theme}
        key="ai-enhancement-modal"
      />

      {/* Coming Soon Modal for other features */}
      {activeModal && activeModal !== 'patients' && activeModal !== 'patient-census' && activeModal !== 'clinical-workflow' && activeModal !== 'template-library' && activeModal !== 'daily-info-entry' && activeModal !== 'accessibility' && activeModal !== 'ai-assistant-settings' && activeModal !== 'audit-logging' && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content coming-soon" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleModalClose}>×</button>
            <div className="coming-soon-content">
              <h2>{getModalTitle(activeModal)}</h2>
              <p>This feature is coming soon to MDoc!</p>
              <p>We're working hard to bring you the best psychiatric documentation tools.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;