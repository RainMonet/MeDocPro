// medocpro-dashboard/src/components/layout/SidebarToggle.jsx
import React from 'react';

const SidebarToggle = ({ isExpanded, onToggle, isMobile }) => {
  if (!isMobile) return null;

  return (
    <button 
      className="sidebar-toggle"
      onClick={onToggle}
      aria-label={isExpanded ? 'Close sidebar' : 'Open sidebar'}
    >
      <div className={`hamburger ${isExpanded ? 'active' : ''}`}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </button>
  );
};

export default SidebarToggle;