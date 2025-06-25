// medocpro-dashboard/src/components/layout/SidebarToggle.jsx
import React from 'react';

const SidebarToggle = ({ onClick, theme }) => {
  return (
    <button 
      className="sidebar-toggle-btn"
      onClick={onClick}
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
        transition: 'background 0.2s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'var(--bg-tertiary)';
      }}
    >
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="18" height="2" rx="1" fill={theme === 'dark' ? '#e5e9f0' : '#495057'}/>
        <rect x="0" y="6" width="18" height="2" rx="1" fill={theme === 'dark' ? '#e5e9f0' : '#495057'}/>
        <rect x="0" y="12" width="18" height="2" rx="1" fill={theme === 'dark' ? '#e5e9f0' : '#495057'}/>
      </svg>
    </button>
  );
};

export default SidebarToggle;