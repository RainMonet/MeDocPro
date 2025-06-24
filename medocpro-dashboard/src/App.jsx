// medocpro-dashboard/src/App.jsx - Updated with StatCard Component
import React, { useState, useEffect } from 'react';
import PatientCensusModal from './components/PatientCensusModal';
import StatCard from './components/ui/StatCard';
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
                  {theme === 'light' ? '☀' : '🌙'}
                </div>
              </div>
            </div>
          </button>
          <div className="user-profile">
            <div className="user-avatar">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="user-info">
              <div className="user-name">{user.firstName} {user.lastName}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  // Navigation Items
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
    
    // Close sidebar on mobile after selection
    if (isMobile) {
      setSidebarExpanded(false);
    }
  };

  // Sidebar Component
  const Sidebar = ({ expanded, isMobile, items, onItemClick }) => {
    if (isMobile && !expanded) return null;
    
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

  // Dashboard Content Component - Updated to use StatCard component
  const DashboardContent = () => {
    // Clinical statistics data
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
      <div className="dashboard-grid">
        {/* Statistics Grid - Now using StatCard component */}
        <div className="stats-grid">
          {clinicalStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-2">
          {/* System Status */}
          <div className="system-status">
            <h3>System Status</h3>
            <div className="status-grid">
              <div className="status-item">
                <span>Backend API</span>
                <div className="status online">Online</div>
              </div>
              <div className="status-item">
                <span>Database</span>
                <div className="status online">Connected</div>
              </div>
              <div className="status-item">
                <span>AI Service</span>
                <div className="status warning">Available</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button 
                className="action-btn primary"
                onClick={() => setIsPatientCensusModalOpen(true)}
              >
                <span className="action-icon">👥</span>
                View Patient Census
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">📋</span>
                New Assessment
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">📄</span>
                Progress Note
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">🤖</span>
                AI Assistant
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📋</div>
              <div className="activity-content">
                <div className="activity-title">Completed intake assessment for Patient #P2024-156</div>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📄</div>
              <div className="activity-content">
                <div className="activity-title">Generated progress note with AI assistance</div>
                <div className="activity-time">4 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🤖</div>
              <div className="activity-content">
                <div className="activity-title">AI enhancement applied to treatment plan</div>
                <div className="activity-time">Yesterday</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <Header user={user} theme={theme} onToggleTheme={toggleTheme} />
      
      <div className="app-body">
        <SidebarToggle expanded={sidebarExpanded} onToggle={toggleSidebar} />
        <SidebarOverlay 
          expanded={sidebarExpanded} 
          isMobile={isMobile} 
          onClose={() => setSidebarExpanded(false)} 
        />
        
        <Sidebar 
          expanded={sidebarExpanded}
          isMobile={isMobile}
          items={navItems}
          onItemClick={handleItemClick}
        />
        
        <main className={`main-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
          <div className="page-header">
            <h1>Clinical Dashboard</h1>
            <p>Streamlined psychiatric documentation with AI assistance</p>
          </div>
          
          <DashboardContent />
        </main>
      </div>

      {/* Patient Census Modal */}
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