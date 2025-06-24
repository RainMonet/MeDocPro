// medocpro-dashboard/src/components/layout/Sidebar.jsx
import React from 'react';
import './Sidebar.css';

const Sidebar = ({ onModalOpen, onMobileClose, expanded, isMobile }) => {
  const handleItemClick = (modalType) => {
    onModalOpen(modalType);
    // Close mobile sidebar after selection
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const menuItems = [
    {
      id: 'patients',
      label: 'Patient Census',
      icon: '👥',
      description: 'View and manage current patients'
    },
    {
      id: 'templates',
      label: 'Clinical Templates',
      icon: '📋',
      description: 'Access documentation templates'
    },
    {
      id: 'assessments',
      label: 'Assessments',
      icon: '🧠',
      description: 'Psychiatric evaluation tools'
    },
    {
      id: 'notes',
      label: 'Progress Notes',
      icon: '📝',
      description: 'Create and review notes'
    },
    {
      id: 'treatment',
      label: 'Treatment Plans',
      icon: '🎯',
      description: 'Develop treatment strategies'
    },
    {
      id: 'reports',
      label: 'Clinical Reports',
      icon: '📊',
      description: 'Generate clinical reports'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      description: 'Application preferences'
    }
  ];

  return (
    <nav className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'} ${isMobile ? 'mobile' : ''}`}>
  <div className="sidebar-content">
    <ul className="nav-list">
      {menuItems.map((item) => (
        <li key={item.id} className="nav-item">
          <button
            className="nav-link"
            onClick={() => handleItemClick(item.id)}
            title={!sidebarExpanded ? item.label : ''}
          >
            <span className="nav-label">{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  </div>
</nav>
  );
};

export default Sidebar;