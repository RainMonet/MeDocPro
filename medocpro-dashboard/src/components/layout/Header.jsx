// medocpro-dashboard/src/components/layout/Header.jsx
import React from 'react';
import './Header.css';

const Header = ({ user, theme, onToggleTheme }) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#gradient)"/>
              <path d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h12v2H8v-2z" fill="white"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0066cc"/>
                  <stop offset="100%" stopColor="#004499"/>
                </linearGradient>
              </defs>
            </svg>
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
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <div className="user-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <div className="avatar-placeholder">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;