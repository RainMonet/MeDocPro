// medocpro-dashboard/src/App.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import PatientCensusModal from './components/PatientCensusModal';
import AIAutomationModal from './components/AIAutomationModal';
import './App.css';

const App = () => {
  // Modal states
  const [isPatientCensusModalOpen, setIsPatientCensusModalOpen] = useState(false);
  const [isAIAutomationModalOpen, setIsAIAutomationModalOpen] = useState(false);
  
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [theme, setTheme] = useState(() => {
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

  // Handle AI generation completion
  const handleAIGenerationComplete = (results) => {
    console.log('AI Generation Results:', results);
    alert(`Successfully generated ${results.patients_processed} documents. AI enhanced: ${results.ai_enhanced ? 'Yes' : 'No'}`);
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
                  {theme === 'light' ? '🌙' : '☀️'}
                </div>
              </div>
            </div>
          </button>
          <div className="user-info">
            <div className="user-name">{user.firstName} {user.lastName}</div>
            <div className="user-role">{user.role}</div>
          </div>
          <div className="user-avatar">
            {user.firstName[0]}{user.lastName[0]}
          </div>
        </div>
      </div>
    </header>
  );

  // Sidebar Component with AI Automation
  const Sidebar = ({ expanded, onToggle }) => (
    <aside className={`sidebar ${expanded ? 'expanded' : 'collapsed'}`}>
      <button className="sidebar-toggle" onClick={onToggle}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-section-title">Documentation</h3>
          <ul className="nav-list">
            <li>
              <button 
                className="nav-item ai-automation-btn"
                onClick={() => setIsAIAutomationModalOpen(true)}
                title="AI-powered document generation"
              >
                <span className="nav-icon">🤖</span>
                <span className="nav-text">AI Automation</span>
                <span className="nav-badge">NEW</span>
              </button>
            </li>
            <li>
              <button className="nav-item" title="Clinical templates">
                <span className="nav-icon">📄</span>
                <span className="nav-text">Templates</span>
              </button>
            </li>
            <li>
              <button className="nav-item" title="Progress notes">
                <span className="nav-icon">📝</span>
                <span className="nav-text">Progress Notes</span>
              </button>
            </li>
            <li>
              <button className="nav-item" title="Treatment plans">
                <span className="nav-icon">🎯</span>
                <span className="nav-text">Treatment Plans</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="nav-section">
          <h3 className="nav-section-title">Patient Management</h3>
          <ul className="nav-list">
            <li>
              <button 
                className="nav-item"
                onClick={() => setIsPatientCensusModalOpen(true)}
                title="View patient census"
              >
                <span className="nav-icon">👥</span>
                <span className="nav-text">Patient Census</span>
              </button>
            </li>
            <li>
              <button className="nav-item" title="Assessments">
                <span className="nav-icon">🧠</span>
                <span className="nav-text">Assessments</span>
              </button>
            </li>
            <li>
              <button className="nav-item" title="Care coordination">
                <span className="nav-icon">🤝</span>
                <span className="nav-text">Care Coordination</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="nav-section">
          <h3 className="nav-section-title">Analytics</h3>
          <ul className="nav-list">
            <li>
              <button className="nav-item" title="Clinical reports">
                <span className="nav-icon">📊</span>
                <span className="nav-text">Reports</span>
              </button>
            </li>
            <li>
              <button className="nav-item" title="Quality metrics">
                <span className="nav-icon">📈</span>
                <span className="nav-text">Quality Metrics</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );

  // Main Content Area
  const MainContent = () => (
    <main className={`content-area ${sidebarExpanded ? '' : 'expanded'}`}>
      <div className="main-header">
        <h1 className="main-title">Welcome back, {user.firstName}</h1>
        <p className="page-subtitle">Streamlined psychiatric documentation with AI assistance</p>
      </div>

      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="action-grid">
            <div 
              className="action-card ai-featured"
              onClick={() => setIsAIAutomationModalOpen(true)}
            >
              <div className="action-icon">🤖</div>
              <h3>AI Document Generation</h3>
              <p>Generate clinical notes with AI assistance</p>
              <span className="action-badge">New Feature</span>
            </div>

            <div 
              className="action-card"
              onClick={() => setIsPatientCensusModalOpen(true)}
            >
              <div className="action-icon">👥</div>
              <h3>Patient Census</h3>
              <p>View and manage current patient list</p>
            </div>

            <div className="action-card">
              <div className="action-icon">📝</div>
              <h3>New Progress Note</h3>
              <p>Create psychiatric progress documentation</p>
            </div>

            <div className="action-card">
              <div className="action-icon">🎯</div>
              <h3>Treatment Planning</h3>
              <p>Develop comprehensive care strategies</p>
            </div>

            <div className="action-card">
              <div className="action-icon">🧠</div>
              <h3>Mental Status Exam</h3>
              <p>Conduct structured mental status assessments</p>
            </div>

            <div className="action-card">
              <div className="action-icon">📊</div>
              <h3>Clinical Reports</h3>
              <p>Generate outcome and quality reports</p>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#0066cc' }}>📋</div>
            <div className="stat-number">12</div>
            <div className="stat-label">Scheduled Patients</div>
            <div className="stat-change positive">+2 today</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#10b981' }}>📄</div>
            <div className="stat-number">8</div>
            <div className="stat-label">Completed Notes</div>
            <div className="stat-change positive">+3 today</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f59e0b' }}>🤖</div>
            <div className="stat-number">5</div>
            <div className="stat-label">AI Enhancements</div>
            <div className="stat-change positive">+5 today</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#8b5cf6' }}>📈</div>
            <div className="stat-number">95%</div>
            <div className="stat-label">Documentation Rate</div>
            <div className="stat-change positive">+2% this week</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📝</div>
              <div className="activity-content">
                <p><strong>Progress Note</strong> completed for Sarah Johnson</p>
                <span className="activity-time">10 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🤖</div>
              <div className="activity-content">
                <p><strong>AI Enhancement</strong> applied to treatment plan</p>
                <span className="activity-time">25 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🎯</div>
              <div className="activity-content">
                <p><strong>Treatment Plan</strong> updated for Michael Brown</p>
                <span className="activity-time">1 hour ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">👥</div>
              <div className="activity-content">
                <p><strong>Patient Census</strong> reviewed and updated</p>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <div className={`app ${theme}`}>
      <Header user={user} theme={theme} onToggleTheme={toggleTheme} />
      <div className="main-content">
        <Sidebar expanded={sidebarExpanded} onToggle={toggleSidebar} />
        <MainContent />
      </div>

      {/* Modals */}
      <PatientCensusModal 
        isOpen={isPatientCensusModalOpen}
        onClose={() => setIsPatientCensusModalOpen(false)}
      />
      
      <AIAutomationModal 
        isOpen={isAIAutomationModalOpen}
        onClose={() => setIsAIAutomationModalOpen(false)}
        onGenerate={handleAIGenerationComplete}
      />
    </div>
  );
};

export default App;