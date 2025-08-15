// medocpro-dashboard/src/App.jsx - COMBINED WITH TEMPLATE EDITOR
import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import SidebarToggle from './components/layout/SidebarToggle';
import { SystemStatus, AIAnalysisOverview, RecentDocuments, WeeklyPassOffCard } from './components/dashboard';
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
import ProviderAbsenceManager from './components/provider/ProviderAbsenceManager';
import QuoteTicker, { QuoteTickerSettings } from './components/quotes/QuoteTicker';
import ColorPrioritySystemModal from './components/modals/ColorPrioritySystemModal';
import apiService from './services/api';
import quotesService from './services/quotesService';
import './App.css';

function App() {
  // State management
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    const hasToken = !!token;
    console.log('🔍 Initial auth check - token exists:', hasToken, 'token:', token ? 'present' : 'none');
    return hasToken;
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
  
  // Patient data state no longer needed - daily info modal loads its own data

  // User data - initially hardcoded, will be updated on login/switch
  const [user, setUser] = useState({
    firstName: "Jane",
    lastName: "Smith",
    role: "Psychiatrist"
  });



  // Authentication handlers
  const handleLogin = async () => {
    console.log('🔑 App.jsx handleLogin called!');
    console.log('Current isAuthenticated before login:', isAuthenticated);
    
    setIsAuthenticated(true);
    setIsNewLogin(true);
    
    console.log('✅ Authentication state set to true');
    
    // Load current user data after login
    try {
      const response = await apiService.getCurrentUser();
      if (response.success && response.user) {
        const userData = {
          firstName: response.user.firstName || response.user.first_name,
          lastName: response.user.lastName || response.user.last_name,
          role: response.user.role,
          id: response.user.id
        };
        setUser(userData);
        console.log('👤 User data loaded:', userData);
      }
    } catch (error) {
      console.error('❌ Failed to load current user after login:', error);
      // Don't fail login if user data loading fails
    }
    
    // Reset the new login flag after a brief moment
    setTimeout(() => setIsNewLogin(false), 1000);
  };

  const handleLogout = () => {
    console.log('🔄 App.jsx handleLogout called!');
    console.log('Current isAuthenticated:', isAuthenticated);
    
    // Clear all authentication-related localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    console.log('✅ All tokens removed from localStorage');
    
    // Reset all authentication-related state
    setIsAuthenticated(false);
    setIsNewLogin(false);
    setActiveModal(null); // Close any open modals
    setUser({
      firstName: "Jane",
      lastName: "Smith", 
      role: "Psychiatrist"
    }); // Reset to default user
    
    // Reset services
    quotesService.reset();
    
    console.log('🔓 User logged out completely');
    
    // Force a small delay and page reload if still having issues
    setTimeout(() => {
      if (localStorage.getItem('token')) {
        console.log('⚠️ Token still present after logout, forcing reload');
        window.location.reload();
      }
    }, 100);
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

  // loadPatientData function removed - daily info modal now loads its own data

  const handleModalOpen = async (modalType) => {
    console.log('handleModalOpen called with:', modalType);
    console.log('Current activeModal before change:', activeModal);
    
    if (modalType === 'template-editor') {
      console.log('Opening template editor');
      setShowTemplateEditor(true);
      setCurrentTemplate(null);
    } else if (modalType === 'daily-info-entry') {
      console.log('🏥 Opening daily info entry modal (self-contained data loading)');
      setActiveModal(modalType);
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
    } else if (modalType === 'provider-absence') {
      setActiveModal(modalType);
    } else if (modalType === 'quote-ticker') {
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
    console.log('🔒 Rendering LoginForm - isAuthenticated:', isAuthenticated);
    return <LoginForm onLogin={handleLogin} theme={theme} />;
  }
  
  console.log('🏠 Rendering main app - isAuthenticated:', isAuthenticated);

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
        onOpenDailyInfo={() => handleModalOpen('daily-info-entry')}
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

              {/* Weekly Pass-Off Summary Row */}
              <div className="dashboard-row">
                <WeeklyPassOffCard />
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
      
      {/* AI Assistant Settings Modal - Ollama AI Enhancement */}
      <AIEnhancementModal
        isOpen={activeModal === 'ai-assistant-settings'}
        onClose={handleModalClose}
        theme={theme}
        key="ai-enhancement-modal"
      />
      
      {/* Provider Absence Management Modal */}
      {activeModal === 'provider-absence' && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              maxWidth: '1200px',
              height: '90%',
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
                Provider Absence Management
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
              <ProviderAbsenceManager />
            </div>
          </div>
        </div>
      )}

      {/* Quote Ticker Settings Modal */}
      {activeModal === 'quote-ticker' && (
        <QuoteTickerSettings onClose={handleModalClose} />
      )}

      {/* Color Priority System Modal */}
      {activeModal === 'color-priority-system' && (
        <ColorPrioritySystemModal isOpen={true} onClose={handleModalClose} theme={theme} />
      )}

      {/* Daily Info Entry Modal */}
      {activeModal === 'daily-info-entry' && (
        <DailyInfoEntryModal
          isOpen={true}
          onClose={handleModalClose}
          theme={theme}
        />
      )}

      {/* Coming Soon Modal for other features */}
      {activeModal && activeModal !== 'patients' && activeModal !== 'patient-census' && activeModal !== 'clinical-workflow' && activeModal !== 'template-library' && activeModal !== 'daily-info-entry' && activeModal !== 'accessibility' && activeModal !== 'ai-assistant-settings' && activeModal !== 'audit-logging' && activeModal !== 'provider-absence' && activeModal !== 'quote-ticker' && activeModal !== 'color-priority-system' && (
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