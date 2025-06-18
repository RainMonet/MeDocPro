// Fixed MeDocPro Dashboard - App.jsx
import React, { useState, useEffect } from 'react';
import PatientCensusModal from './components/PatientCensusModal';
import AIAutomationModal from './components/AIAutomationModal';
import './App.css';

const App = () => {
  // Modal states
  const [isPatientCensusModalOpen, setIsPatientCensusModalOpen] = useState(false);
  const [isAIAutomationModalOpen, setIsAIAutomationModalOpen] = useState(false);
  
  // Layout states
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
                  {theme === 'light' ? '☀️' : '🌙'}
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

  // Sidebar Component
  const Sidebar = ({ expanded, onToggle }) => (
    <>
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
      >
        ☰
      </button>
      
      {/* Mobile overlay */}
      {isMobile && expanded && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarExpanded(false)}
        />
      )}
      
      <aside className={`sidebar ${expanded ? '' : 'collapsed'}`}>
        <nav className="nav">
          <div className="nav-item active">
            📊 Dashboard
          </div>
          <div className="nav-item">
            📝 Templates
          </div>
          <div className="nav-item" onClick={() => setIsPatientCensusModalOpen(true)}>
            👥 Patient Management
          </div>
          <div className="nav-item">
            🎯 Care Coordination
          </div>
          <div className="nav-item">
            📈 Reports
          </div>
          <div className="nav-item">
            📋 Quality Measures
          </div>
        </nav>
      </aside>
    </>
  );

  // Main Content Component
  const MainContent = () => (
    <main className={`content-area ${sidebarExpanded && !isMobile ? '' : 'expanded'}`}>
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome back, Dr. Jane</h1>
        <p className="welcome-subtitle">Streamlined psychiatric documentation with AI assistance</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-number">24</div>
            <div className="stat-label">Active Patients</div>
          </div>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' }}>
            👥
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-number">8</div>
            <div className="stat-label">Pending Notes</div>
          </div>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            📝
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-number">12</div>
            <div className="stat-label">AI Enhanced</div>
          </div>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            🤖
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-number">96%</div>
            <div className="stat-label">Quality Score</div>
          </div>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            ⭐
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
          <div className="section-border"></div>
        </div>
        
        <div className="action-grid">
          <div 
            className="action-card primary"
            onClick={() => setIsAIAutomationModalOpen(true)}
          >
            <div className="action-icon">🤖</div>
            <div className="action-content">
              <h3 className="action-title">AI Document Generation</h3>
              <p className="action-description">Generate clinical notes with AI assistance</p>
              <span className="action-badge">NEW FEATURE</span>
            </div>
          </div>
          
          <div 
            className="action-card"
            onClick={() => setIsPatientCensusModalOpen(true)}
          >
            <div className="action-icon">👥</div>
            <div className="action-content">
              <h3 className="action-title">Patient Census</h3>
              <p className="action-description">View and manage current patient list</p>
            </div>
          </div>
          
          <div className="action-card">
            <div className="action-icon">📝</div>
            <div className="action-content">
              <h3 className="action-title">New Progress Note</h3>
              <p className="action-description">Create psychiatric progress documentation</p>
            </div>
          </div>
          
          <div className="action-card">
            <div className="action-icon">🎯</div>
            <div className="action-content">
              <h3 className="action-title">Treatment Planning</h3>
              <p className="action-description">Develop comprehensive care strategies</p>
            </div>
          </div>
          
          <div className="action-card">
            <div className="action-icon">🧠</div>
            <div className="action-content">
              <h3 className="action-title">Mental Status Exam</h3>
              <p className="action-description">Conduct structured mental status assessments</p>
            </div>
          </div>
          
          <div className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-content">
              <h3 className="action-title">Clinical Reports</h3>
              <p className="action-description">Generate outcome and quality reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Recent Activity</h2>
          <div className="section-border"></div>
        </div>
        
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
      </section>
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