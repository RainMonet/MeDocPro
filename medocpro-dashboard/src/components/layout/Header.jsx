// medocpro-dashboard/src/components/layout/Header.jsx
import React from 'react';
import './Header.css';

const Header = ({ user, theme, onToggleTheme }) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo" style={{ marginLeft: '80px' }}>
          <div className="logo-icon">
            <div className="logo-symbol">M</div>
          </div>
          <span className="logo-text">MeDocPro</span>
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