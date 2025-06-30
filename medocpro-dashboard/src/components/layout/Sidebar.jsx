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

  const menuItems = [
    { id: 'template-editor', label: 'Template Editor' },
    { id: 'template-library', label: 'Template Library' },
    { id: 'patients', label: 'Patient Census' },
    { id: 'documents', label: 'Documents' },
    { id: 'ai', label: 'AI Assistant' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' }
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
        <ul className="nav-list" style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: '20px 0',
          width: '250px'
        }}>
          {menuItems.map((item) => {
            if (item.type === 'separator') {
              return (
                <li key={item.id} style={{ 
                  margin: '12px 16px', 
                  borderTop: '1px solid var(--border-color)', 
                  height: '1px' 
                }} />
              );
            }

            const isActive = item.isView && viewMode === item.id;
            
            return (
              <li key={item.id} className="nav-item" style={{ margin: '8px 16px' }}>
                <button
                  className="nav-link"
                  onClick={() => handleItemClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: isActive ? 'var(--accent-color)' : 'none',
                    border: 'none',
                    borderRadius: '8px',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: 'calc(250px - 64px)',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: isActive ? '600' : '500',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.background = 'var(--bg-hover)';
                      e.target.style.color = 'var(--text-primary)';
                      e.target.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.target.style.background = 'none';
                      e.target.style.color = 'var(--text-secondary)';
                      e.target.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;