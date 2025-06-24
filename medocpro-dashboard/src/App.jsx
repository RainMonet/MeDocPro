// medocpro-dashboard/src/App.jsx - WORKING FULL VERSION
import React, { useState, useEffect } from 'react';
import PatientCensusModal from './components/PatientCensusModal';
import StatCard from './components/ui/StatCard';
import './App.css';

const App = () => {
  const [isPatientCensusModalOpen, setIsPatientCensusModalOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('medocpro-theme');
    return savedTheme || 'light';
  });

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

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarExpanded(false);
      } else {
        setSidebarExpanded(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const user = {
    firstName: 'Dr. Jane',
    lastName: 'Smith',
    role: 'Psychiatrist'
  };

  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'templates', icon: '📋', label: 'Templates' },
    { id: 'patients', icon: '👥', label: 'Patient Census' },
    { id: 'documentation', icon: '📄', label: 'Documentation' },
    { id: 'reports', icon: '📊', label: 'Reports' },
    { id: 'settings', icon: '⚙', label: 'Settings' }
  ];

  const handleItemClick = (item) => {
    if (item.id === 'patients') {
      setIsPatientCensusModalOpen(true);
    }
    if (isMobile) {
      setSidebarExpanded(false);
    }
  };

  const clinicalStats = [
    {
      icon: { background: '#0066cc', symbol: '📋' },
      value: '24',
      label: 'Active Templates',
      change: '+3 this week',
      trend: 'positive'
    },
    {
      icon: { background: '#20b2aa', symbol: '📄' },
      value: '156',
      label: 'Documents Created', 
      change: '+12 today',
      trend: 'positive'
    },
    {
      icon: { background: '#10b981', symbol: '🤖' },
      value: '89%',
      label: 'AI Efficiency',
      change: '+5% this month',
      trend: 'positive'
    },
    {
      icon: { background: '#f59e0b', symbol: '👥' },
      value: '42',
      label: 'Patient Records',
      change: '+8 today',
      trend: 'positive'
    }
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">M</div>
            <div className="brand">MeDocPro</div>
          </div>
          <div className="user-menu">
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <div className="toggle-track">
                <div className="toggle-thumb">
                  <div className="toggle-icon">
                    {theme === 'light' ? '☀' : '🌙'}
                  </div>
                </div>
              </div>
            </button>
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="user-info">
                <div className="user-name">{user.firstName} {user.lastName}</div>
                <div className="user-role">{user.role}</div>
              </div>
              <div className="user-avatar">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="app-body">
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        
        {isMobile && sidebarExpanded && (
          <div 
            className="sidebar-overlay"
            onClick={() => setSidebarExpanded(false)}
          />
        )}
        
        {(!isMobile || sidebarExpanded) && (
          <nav className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
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
        )}
        
        <main className={`main-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
          <div style={{
            padding: '2rem',
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden'
          }}>
            
            {/* Statistics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? '1rem' : '1.5rem',
              marginBottom: '2rem',
              width: '100%',
              maxWidth: '100%'
            }}>
              {clinicalStats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>

            {/* System Status and Quick Actions - Using Inline Styles (We Know This Works) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* System Status */}
              <div className="system-status">
                <h3>System Status</h3>
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '0.5rem'
                  }}>
                    <span>Backend API</span>
                    <span style={{ color: '#10b981', fontWeight: '500' }}>Online</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '0.5rem'
                  }}>
                    <span>Database</span>
                    <span style={{ color: '#10b981', fontWeight: '500' }}>Connected</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '0.5rem'
                  }}>
                    <span>AI Service</span>
                    <span style={{ color: '#f59e0b', fontWeight: '500' }}>Available</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  marginTop: '1rem'
                }}>
                  <button 
                    style={{
                      background: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                    onClick={() => setIsPatientCensusModalOpen(true)}
                  >
                    <span>👥</span>
                    View Patient Census
                  </button>
                  <button 
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    <span>📋</span>
                    New Assessment
                  </button>
                  <button 
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    <span>📄</span>
                    Progress Note
                  </button>
                  <button 
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    <span>🤖</span>
                    AI Assistant
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ marginTop: '2rem' }}>
              <h3>Recent Activity</h3>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>📋</span>
                  <div>
                    <div style={{ fontWeight: '500' }}>Completed intake assessment for Patient #P2024-156</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>2 hours ago</div>
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>📄</span>
                  <div>
                    <div style={{ fontWeight: '500' }}>Generated progress note with AI assistance</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>4 hours ago</div>
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>🤖</span>
                  <div>
                    <div style={{ fontWeight: '500' }}>AI enhancement applied to treatment plan</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Yesterday</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isPatientCensusModalOpen && (
        <PatientCensusModal 
          isOpen={isPatientCensusModalOpen}
          onClose={() => setIsPatientCensusModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;