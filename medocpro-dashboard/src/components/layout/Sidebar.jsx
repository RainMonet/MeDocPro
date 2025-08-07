// medocpro-dashboard/src/components/layout/Sidebar.jsx
import React from 'react';
import './Sidebar.css';

const Sidebar = ({ onModalOpen, onViewChange, expanded, isMobile, onToggle, viewMode = 'workspace' }) => {
  const handleItemClick = (modalType) => {
    // Handle view switching vs modal opening
    if (modalType === 'workspace' || modalType === 'dashboard') {
      onViewChange(modalType);
    } else {
      onModalOpen(modalType);
    }
    // Close sidebar on mobile when opening modal or switching views
    if (isMobile) {
      onToggle();
    }
  };

  const settingsMenuItems = [
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'ai-assistant-settings', label: 'AI Enhancement' },
    { id: 'audit-logging', label: 'Audit Logging' },
    { id: 'provider-absence', label: 'Provider Absences' }
  ];

  return (
    <nav 
      className={`sidebar ${expanded ? 'expanded' : 'collapsed'} ${isMobile ? 'mobile' : ''}`}
      style={{
        position: 'fixed',
        top: '70px',
        left: '0',
        height: 'calc(100vh - 70px)',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        zIndex: 100,
        transition: 'all 0.3s ease',
        width: expanded ? '250px' : '0px',
        overflow: 'hidden'
      }}
    >
      <div 
        className="sidebar-content"
        style={{
          width: '250px',
          padding: '0',
          height: '100%',
          visibility: expanded ? 'visible' : 'hidden'
        }}
      >
        {/* Settings Section */}
        <div style={{ 
          margin: '20px 0 20px 0',
          width: '250px'
        }}>
          {/* Settings Header */}
          <div style={{
            padding: '8px 32px',
            marginBottom: '12px'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '0.75rem',
              fontWeight: '700',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              lineHeight: '1.2'
            }}>
              Settings
            </h3>
          </div>

          {/* Settings Menu Items */}
          <ul className="settings-nav-list" style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            width: '250px'
          }}>
            {settingsMenuItems.map((item) => {
              return (
                <li key={item.id} className="nav-item" style={{ margin: '4px 16px' }}>
                  <button
                    className="nav-link"
                    onClick={() => handleItemClick(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 16px 10px 32px', // Extra left padding for indentation
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      width: 'calc(250px - 64px)',
                      textAlign: 'left',
                      fontSize: '0.85rem',
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
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;