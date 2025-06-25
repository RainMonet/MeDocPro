// medocpro-dashboard/src/App.jsx - REFACTORED WITH EXTRACTED COMPONENTS
import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import SidebarToggle from './components/layout/SidebarToggle';
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
      <SidebarToggle onClick={toggleSidebar} theme={theme} />
      <Header user={user} theme={theme} onToggleTheme={toggleTheme} />

      <div className="main-layout">
        <Sidebar 
          onModalOpen={handleModalOpen}
          expanded={sidebarExpanded}
          isMobile={isMobile}
          onToggle={toggleSidebar}
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