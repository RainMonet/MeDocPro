// medocpro-dashboard/src/components/layout/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import QuoteDisplay from '../ui/QuoteDisplay';
import './Header.css';

const Header = ({ user, theme, onToggleTheme, viewMode, onViewChange, onLogout, isNewLogin }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Logout clicked!');
    console.log('onLogout prop:', onLogout);
    console.log('typeof onLogout:', typeof onLogout);
    
    setShowUserMenu(false); // Close the dropdown
    
    if (onLogout && typeof onLogout === 'function') {
      console.log('Calling onLogout function');
      onLogout();
    } else {
      console.error('onLogout is not a function or is undefined');
      // Fallback - try direct localStorage manipulation
      console.log('Using fallback logout method');
      localStorage.removeItem('token');
      window.location.reload();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="logo" style={{ marginLeft: '80px' }}>
            <div className="logo-icon">
              <div className="logo-symbol">M</div>
            </div>
            <span className="logo-text">MDoc</span>
          </div>
          
          {/* Navigation Links */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            marginLeft: '2rem'
          }}>
            <button
              className="nav-button"
              onClick={() => handleViewChange('workspace')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: viewMode === 'workspace' ? '600' : '500',
                color: viewMode === 'workspace' ? 'var(--accent-color)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'color 0.2s ease, font-weight 0.2s ease'
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
              className="nav-button"
              onClick={() => handleViewChange('dashboard')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: viewMode === 'dashboard' ? '600' : '500',
                color: viewMode === 'dashboard' ? 'var(--accent-color)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'color 0.2s ease, font-weight 0.2s ease'
              }}
            >
              Analytics
            </button>
          </div>
        </div>
        
        {/* Quote Display */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '0 20px'
        }}>
          <QuoteDisplay theme={theme} onLogin={isNewLogin} />
        </div>
        
        <div className="header-right">
          <button 
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <div className="user-menu" ref={menuRef}>
            <div 
              className="user-avatar"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Avatar clicked! Current showUserMenu:', showUserMenu);
                setShowUserMenu(prev => {
                  console.log('Setting showUserMenu to:', !prev);
                  return !prev;
                });
              }}
              style={{ 
                cursor: 'pointer', 
                position: 'relative',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              <div 
                className="avatar-placeholder"
                style={{ 
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
              >
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              
              {/* Dropdown Menu - Rendered inline with very high z-index */}
              {showUserMenu && (
                <div style={{
                  position: 'fixed',
                  top: '70px',
                  right: '20px',
                  background: theme === 'dark' ? '#1e293b' : '#faf8f3',
                  border: `1px solid ${theme === 'dark' ? '#475569' : '#d4c4a8'}`,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  minWidth: '180px',
                  zIndex: 2147483647, // Maximum possible z-index value
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#ede8df'}`,
                    background: theme === 'dark' ? '#0f172a' : '#f4f1eb'
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: theme === 'dark' ? '#f1f5f9' : '#2d1810'
                    }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: theme === 'dark' ? '#cbd5e1' : '#5d4d3a'
                    }}>
                      {user.role}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      fontSize: '14px',
                      color: theme === 'dark' ? '#f1f5f9' : '#2d1810',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = theme === 'dark' ? '#374151' : '#ede8df';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;