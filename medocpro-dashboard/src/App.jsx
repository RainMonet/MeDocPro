// medocpro-dashboard/src/App.jsx
import React, { useState, useEffect } from 'react';
import PatientCensusModal from './components/PatientCensusModal';
import './App.css';

const App = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isPatientCensusModalOpen, setIsPatientCensusModalOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
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

  // Sidebar Navigation Component
  const Sidebar = ({ activeSection, onSectionChange, onPatientCensusClick, expanded }) => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'templates', label: 'Templates', icon: '📋' },
      { id: 'documents', label: 'Documents', icon: '📄' },
      { id: 'patients', label: 'Patient Census', icon: '👥', action: onPatientCensusClick },
      { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖' },
      { id: 'reports', label: 'Reports', icon: '📈' },
      { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
      <nav className={`sidebar ${expanded ? '' : 'collapsed'}`}>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => {
              if (item.action) {
                item.action();
              } else {
                onSectionChange(item.id);
              }
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    );
  };

  // Sidebar Toggle Button
  const SidebarToggle = ({ expanded, onToggle }) => (
    <button 
      className={`sidebar-toggle ${expanded ? '' : 'hidden'}`}
      onClick={onToggle}
      aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  );

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

  // Content Components (placeholder)
  const TemplatesContent = () => (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>
        Clinical Templates
      </h1>
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        background: 'var(--bg-primary)', 
        borderRadius: '12px',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.6' }}>📋</div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Coming Soon</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Template management system is being developed for the next release.</p>
      </div>
    </div>
  );

  const DocumentsContent = () => (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>
        Clinical Documents
      </h1>
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        background: 'var(--bg-primary)', 
        borderRadius: '12px',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.6' }}>📄</div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Coming Soon</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Document management system is being developed for the next release.</p>
      </div>
    </div>
  );

  const AIAssistantContent = () => (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>
        AI Assistant
      </h1>
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        background: 'var(--bg-primary)', 
        borderRadius: '12px',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.6' }}>🤖</div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Coming Soon</h3>
        <p style={{ color: 'var(--text-secondary)' }}>AI enhancement tools are being developed for the next release.</p>
      </div>
    </div>
  );

  const ReportsContent = () => (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>
        Analytics & Reports
      </h1>
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        background: 'var(--bg-primary)', 
        borderRadius: '12px',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.6' }}>📈</div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Coming Soon</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Analytics dashboard is being developed for the next release.</p>
      </div>
    </div>
  );

  const SettingsContent = () => (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: 'var(--text-primary)' }}>
        System Settings
      </h1>
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        background: 'var(--bg-primary)', 
        borderRadius: '12px',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.6' }}>⚙️</div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Coming Soon</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Settings panel is being developed for the next release.</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardContent />;
      case 'templates':
        return <TemplatesContent />;
      case 'documents':
        return <DocumentsContent />;
      case 'ai-assistant':
        return <AIAssistantContent />;
      case 'reports':
        return <ReportsContent />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <DashboardContent />;
    }
  };

  const handlePatientCensusClick = () => {
    setIsPatientCensusModalOpen(true);
  };

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
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

  return (
    <div className="app-container">
      <Header user={user} theme={theme} onToggleTheme={toggleTheme} />
      
      <div className="main-content">
        <SidebarToggle expanded={sidebarExpanded} onToggle={toggleSidebar} />
        
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          onPatientCensusClick={handlePatientCensusClick}
          expanded={sidebarExpanded}
        />
        
        <div className={`content-area ${sidebarExpanded ? '' : 'expanded'}`}>
          {renderContent()}
        </div>
      </div>

      {/* Patient Census Modal */}
      <PatientCensusModal 
        isOpen={isPatientCensusModalOpen}
        onClose={() => setIsPatientCensusModalOpen(false)}
      />
    </div>
  );
};

export default App;