// medocpro-dashboard/src/App.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import PatientCensusModal from './components/PatientCensusModal';
import './App.css';

const App = () => {
  // Only keep Patient Census Modal for now - others will be developed later
  const [isPatientCensusModalOpen, setIsPatientCensusModalOpen] = useState(false);
  
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [theme, setTheme] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('medocpro-theme');
    return savedTheme || 'light';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('medocpro-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarExpanded(prev => !prev);
  };

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // On mobile, sidebar starts collapsed
      // On desktop, sidebar starts expanded
      if (mobile) {
        setSidebarExpanded(false);
      } else {
        setSidebarExpanded(true);
      }
    };

    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const user = {
    firstName: 'Dr. Jane',
    lastName: 'Smith',
    role: 'Psychiatrist'
  };

  // Header Component
  const Header = ({ user, theme, onToggleTheme }) => (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo">M</div>
          <div className="brand">MeDocPro</div>
        </div>
        <div className="user-menu">
          <button 
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <div className="toggle-track">
              <div className="toggle-thumb">
                <div className="toggle-icon">
                  {theme === 'light' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5"/>
                      <path d="m12 1 0 6m0 6 0 6M4.22 4.22l4.24 4.24m8.49 8.49 4.24 4.24M1 12l6 0m6 0 6 0M4.22 19.78l4.24-4.24m8.49-8.49 4.24-4.24"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </button>
          <div className="user-info">
            <div className="user-name">{user?.firstName || 'Dr.'} {user?.lastName || 'Smith'}</div>
            <div className="user-role">{user?.role || 'Psychiatrist'}</div>
          </div>
          <div className="user-avatar">
            {(user?.firstName?.[0] || 'D')}
          </div>
        </div>
      </div>
    </header>
  );

  // Sidebar Navigation Component - Modal-based navigation
  const Sidebar = ({ onModalOpen, expanded, isMobile }) => {
    const navItems = [
      { id: 'templates', label: 'Templates', action: () => onModalOpen('templates') },
      { id: 'documents', label: 'Documents', action: () => onModalOpen('documents') },
      { id: 'patients', label: 'Patient Census', action: () => onModalOpen('patients') },
      { id: 'ai-assistant', label: 'AI Assistant', action: () => onModalOpen('ai-assistant') },
      { id: 'reports', label: 'Reports', action: () => onModalOpen('reports') },
      { id: 'settings', label: 'Settings', action: () => onModalOpen('settings') },
    ];

    const handleItemClick = (item) => {
      item.action();
      
      // On mobile, close sidebar after selection
      if (isMobile && expanded) {
        setSidebarExpanded(false);
      }
    };

    return (
      <nav className={`sidebar ${expanded ? 'expanded' : 'collapsed'}`}>
        {navItems.map(item => (
          <div
            key={item.id}
            className="nav-item"
            onClick={() => handleItemClick(item)}
          >
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    );
  };

  // Sidebar Toggle Button
  const SidebarToggle = ({ expanded, onToggle }) => (
    <button 
      className="sidebar-toggle"
      onClick={onToggle}
      aria-label={expanded ? 'Close sidebar' : 'Open sidebar'}
      title={expanded ? 'Close sidebar' : 'Open sidebar'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  );

  // Mobile Overlay Component
  const SidebarOverlay = ({ expanded, isMobile, onClose }) => {
    if (!isMobile || !expanded) return null;
    
    return (
      <div 
        className="sidebar-overlay"
        onClick={onClose}
      />
    );
  };

  // Dashboard Content Component
  const DashboardContent = () => (
    <div className="dashboard-grid">
      {/* Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#0066cc' }}>📋</div>
          <div className="stat-number">24</div>
          <div className="stat-label">Active Templates</div>
          <div className="stat-change positive">+3 this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#20b2aa' }}>📄</div>
          <div className="stat-number">156</div>
          <div className="stat-label">Documents Created</div>
          <div className="stat-change positive">+12 today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981' }}>🤖</div>
          <div className="stat-number">89%</div>
          <div className="stat-label">AI Efficiency</div>
          <div className="stat-change positive">+5% this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b' }}>👥</div>
          <div className="stat-number">42</div>
          <div className="stat-label">Patient Records</div>
          <div className="stat-change positive">+8 today</div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        {/* System Status */}
        <div className="system-status">
          <h3>System Status</h3>
          <p>Real-time monitoring of backend services</p>
          
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Backend API</span>
              <div className="status-badge connected">
                <div className="status-dot"></div>
                Connected
              </div>
            </div>
            <div className="status-item">
              <span className="status-label">Database</span>
              <div className="status-badge connected">
                <div className="status-dot"></div>
                Connected
              </div>
            </div>
            <div className="status-item">
              <span className="status-label">AI Service</span>
              <div className="status-badge available">
                <div className="status-dot"></div>
                Available
              </div>
            </div>
          </div>
          
          <div className="last-checked">
            Last checked: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <p>Common clinical documentation tasks</p>
          
          <div className="action-grid">
            <button className="action-button">📝 New Progress Note</button>
            <button className="action-button">🔍 Initial Assessment</button>
            <button className="action-button">📋 Treatment Plan</button>
            <button className="action-button">🧠 Mental Status Exam</button>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="recent-section">
        <div className="section-header">
          <h2 className="section-title">Recent Documents</h2>
        </div>
        <div className="document-list">
          <div className="document-item">
            <div className="document-icon progress">📝</div>
            <div className="document-info">
              <div className="document-title">Progress Note - Anderson, S.</div>
              <div className="document-meta">Today, 2:30 PM</div>
            </div>
            <div className="document-status status-draft">Draft</div>
          </div>
          <div className="document-item">
            <div className="document-icon assessment">🔍</div>
            <div className="document-info">
              <div className="document-title">Initial Assessment - Johnson, M.</div>
              <div className="document-meta">Today, 10:15 AM</div>
            </div>
            <div className="document-status status-complete">Complete</div>
          </div>
          <div className="document-item">
            <div className="document-icon treatment">📋</div>
            <div className="document-info">
              <div className="document-title">Treatment Plan - Williams, E.</div>
              <div className="document-meta">Yesterday, 3:45 PM</div>
            </div>
            <div className="document-status status-active">Active</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Placeholder Modal Component for future development
  const ComingSoonModal = ({ isOpen, onClose, title }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button className="modal-close" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="modal-content">
            <div className="coming-soon-content">
              <div className="coming-soon-icon">🚧</div>
              <h3>Coming Soon</h3>
              <p>This feature is being developed and will be available in a future release.</p>
              <p>The {title.toLowerCase()} module will include comprehensive functionality for managing your psychiatric documentation workflow.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal handler function - only Patient Census works for now
  const handleModalOpen = (modalType) => {
    if (modalType === 'patients') {
      setIsPatientCensusModalOpen(true);
    } else {
      // For now, show coming soon modal for other features
      switch (modalType) {
        case 'templates':
          setIsTemplatesModalOpen(true);
          break;
        case 'documents':
          setIsDocumentsModalOpen(true);
          break;
        case 'ai-assistant':
          setIsAIAssistantModalOpen(true);
          break;
        case 'reports':
          setIsReportsModalOpen(true);
          break;
        case 'settings':
          setIsSettingsModalOpen(true);
          break;
      }
    }
  };

  // Temporary state for coming soon modals
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [isAIAssistantModalOpen, setIsAIAssistantModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <div className="app-container">
      <Header user={user} theme={theme} onToggleTheme={toggleTheme} />
      
      <div className="main-content">
        <SidebarToggle 
          expanded={sidebarExpanded} 
          onToggle={toggleSidebar}
        />
        
        <Sidebar 
          onModalOpen={handleModalOpen}
          expanded={sidebarExpanded}
          isMobile={isMobile}
        />
        
        <SidebarOverlay 
          expanded={sidebarExpanded}
          isMobile={isMobile}
          onClose={() => setSidebarExpanded(false)}
        />
        
        {/* Dashboard is always visible */}
        <div className={`content-area ${sidebarExpanded ? '' : 'expanded'}`}>
          <DashboardContent />
        </div>
      </div>

      {/* Patient Census Modal - Fully Functional */}
      <PatientCensusModal 
        isOpen={isPatientCensusModalOpen}
        onClose={() => setIsPatientCensusModalOpen(false)}
      />
      
      {/* Coming Soon Modals - Placeholder for future development */}
      <ComingSoonModal 
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        title="Clinical Templates"
      />
      
      <ComingSoonModal 
        isOpen={isDocumentsModalOpen}
        onClose={() => setIsDocumentsModalOpen(false)}
        title="Clinical Documents"
      />
      
      <ComingSoonModal 
        isOpen={isAIAssistantModalOpen}
        onClose={() => setIsAIAssistantModalOpen(false)}
        title="AI Assistant"
      />
      
      <ComingSoonModal 
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        title="Analytics & Reports"
      />
      
      <ComingSoonModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="System Settings"
      />
    </div>
  );
};

export default App;