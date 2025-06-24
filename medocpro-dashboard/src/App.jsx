// medocpro-dashboard/src/App.jsx - COMPLETE FINAL VERSION
import React, { useState, useEffect } from 'react';
import StatCard from './components/ui/StatCard';
import PatientCensusModal from './components/PatientCensusModal';
import './App.css';

function App() {
  // State management
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // User data
  const user = {
    firstName: "Dr. Jane",
    lastName: "Smith",
    role: "Psychiatrist"
  };

  // Navigation items
  const menuItems = [
    { id: 'documents', label: 'Documents' },
    { id: 'patients', label: 'Patient Census' },
    { id: 'ai', label: 'AI Assistant' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' }
  ];

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
    setActiveModal(modalType);
    // Close sidebar on mobile when opening modal
    if (isMobile) {
      setSidebarExpanded(false);
    }
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  const getModalTitle = (modalType) => {
    const titles = {
      documents: "Document Library",
      templates: "Clinical Templates",
      assessments: "Psychiatric Assessments", 
      notes: "Progress Notes",
      treatment: "Treatment Plans",
      reports: "Clinical Reports",
      ai: "AI Assistant",
      settings: "Application Settings"
    };
    return titles[modalType] || "Feature";
  };

  return (
    <div className="app-container">
      {/* HAMBURGER BUTTON - Fixed with guaranteed three lines */}
      <button 
  className="sidebar-toggle-btn"
  onClick={toggleSidebar}
  style={{
    position: 'fixed',
    top: '13px',
    left: '16px',
    zIndex: 1001,
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px',
    cursor: 'pointer',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease', // Only animate background, not color
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }}
  onMouseEnter={(e) => {
    e.target.style.background = 'var(--bg-hover)';
    // Don't change any color properties on hover
  }}
  onMouseLeave={(e) => {
    e.target.style.background = 'var(--bg-tertiary)';
  }}
>
  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Use explicit colors instead of currentColor */}
    <rect x="0" y="0" width="18" height="2" rx="1" fill={theme === 'dark' ? '#e5e9f0' : '#495057'}/>
    <rect x="0" y="6" width="18" height="2" rx="1" fill={theme === 'dark' ? '#e5e9f0' : '#495057'}/>
    <rect x="0" y="12" width="18" height="2" rx="1" fill={theme === 'dark' ? '#e5e9f0' : '#495057'}/>
  </svg>
</button>

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo" style={{ marginLeft: '80px' }}>
            <div className="logo-icon">
              <div className="logo-symbol">M</div>
            </div>
            <span className="logo-text">MeDocPro</span>
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <div className="user-menu">
            <div className="user-info">
              <span className="user-name">{user.firstName} {user.lastName}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <div className="user-avatar">
              <div className="avatar-placeholder">
                {user.firstName.charAt(2)}{user.lastName.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="main-layout">
        {/* Sidebar */}
        <nav 
          className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'} ${isMobile ? 'mobile' : ''}`}
          style={{
            position: 'fixed',
            top: '70px',
            left: '0',
            height: 'calc(100vh - 70px)',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            zIndex: 100,
            transition: 'all 0.3s ease',
            width: sidebarExpanded ? '250px' : '0px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="sidebar-content"
            style={{
              width: '250px',
              padding: '0',
              height: '100%',
              visibility: sidebarExpanded ? 'visible' : 'hidden'
            }}
          >
            <ul className="nav-list" style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: '20px 0',
              width: '250px'
            }}>
              {menuItems.map((item) => (
                <li key={item.id} className="nav-item" style={{ margin: '8px 16px' }}>
                  <button
                    className="nav-link"
                    onClick={() => handleModalOpen(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      width: 'calc(250px - 64px)',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--bg-hover)';
                      e.target.style.color = 'var(--text-primary)';
                      e.target.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'none';
                      e.target.style.color = 'var(--text-secondary)';
                      e.target.style.transform = 'translateX(0)';
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        
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
              <div className="system-status">
                <h3>🟢 System Status</h3>
                <p>Real-time monitoring of backend services</p>
                
                <div className="status-items">
                  <div className="status-item">
                    <span className="status-label">Backend API</span>
                    <span className="status-badge connected">CONNECTED</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Database</span>
                    <span className="status-badge connected">CONNECTED</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">AI Service</span>
                    <span className="status-badge available">AVAILABLE</span>
                  </div>
                </div>
                
                <div className="last-checked">
                  Last checked: 9:11:00 AM
                </div>
              </div>

              <div className="quick-actions">
                <h3>⚡ Quick Actions</h3>
                <p>Common clinical documentation tasks</p>
                
                <div className="action-buttons">
                  <button 
                    className="action-btn" 
                    onClick={() => handleModalOpen('notes')}
                  >
                    <span className="action-icon">📝</span>
                    <span className="action-label">New Progress Note</span>
                  </button>
                  <button 
                    className="action-btn" 
                    onClick={() => handleModalOpen('assessments')}
                  >
                    <span className="action-icon">🧠</span>
                    <span className="action-label">Initial Assessment</span>
                  </button>
                  <button 
                    className="action-btn" 
                    onClick={() => handleModalOpen('treatment')}
                  >
                    <span className="action-icon">🎯</span>
                    <span className="action-label">Treatment Plan</span>
                  </button>
                  <button 
                    className="action-btn" 
                    onClick={() => handleModalOpen('mental')}
                  >
                    <span className="action-icon">🧠</span>
                    <span className="action-label">Mental Status Exam</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Documents */}
            <div className="recent-documents">
              <h3>Recent Documents</h3>
              <div className="document-item">
                <span className="document-icon">📝</span>
                <div className="document-info">
                  <span className="document-title">Progress Note - Anderson, S.</span>
                  <span className="document-date">Today, 2:30 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal System */}
      <PatientCensusModal
        isOpen={activeModal === 'patients'}
        onClose={handleModalClose}
      />
      
      {/* Coming Soon Modal for other features */}
      {activeModal && activeModal !== 'patients' && (
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