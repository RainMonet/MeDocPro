// medocpro-dashboard/src/components/layout/Header.jsx
import React from 'react';
import './Header.css';

const Header = ({ user, theme, onToggleTheme, viewMode, onViewChange }) => {
  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo" style={{ marginLeft: '80px' }}>
          <div className="logo-icon">
            <div className="logo-symbol">M</div>
          </div>
          <span className="logo-text">MeDocPro</span>
        </div>
        
        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          marginLeft: '2rem'
        }}>
          <button
            onClick={() => handleViewChange('workspace')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: viewMode === 'workspace' ? 'var(--accent-color)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              borderBottom: viewMode === 'workspace' ? '2px solid var(--accent-color)' : '2px solid transparent'
            }}
          >
            Workspace
          </button>
          <span style={{
            color: 'var(--text-muted)',
            margin: '0 0.5rem',
            fontSize: '0.9rem'
          }}>|</span>
          <button
            onClick={() => handleViewChange('dashboard')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: viewMode === 'dashboard' ? 'var(--accent-color)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              borderBottom: viewMode === 'dashboard' ? '2px solid var(--accent-color)' : '2px solid transparent'
            }}
          >
            Analytics
          </button>
        </div>
      </div>
      
      <div className="header-right">
        <button 
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        
        <div className="user-menu">
          <div className="user-info">
            <span className="user-name">{user.firstName} {user.lastName}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <div className="user-avatar">
            <div className="avatar-placeholder">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;