// medocpro-dashboard/src/components/layout/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import QuoteDisplay from '../ui/QuoteDisplay';
import AddUserModal from '../modals/AddUserModal';
import apiService from '../../services/api';
import './Header.css';

const Header = ({ user, theme, onToggleTheme, viewMode, onViewChange, onLogout, isNewLogin, onUserSwitch }) => {
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
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

  // Load available users when menu opens
  const loadAvailableUsers = async () => {
    if (loadingUsers) return;
    
    setLoadingUsers(true);
    try {
      const response = await apiService.listUsers();
      if (response.success) {
        setAvailableUsers(response.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle user switching
  const handleUserSwitch = async (targetUserId) => {
    // Skip the same-user check if current user doesn't have an ID
    if (user.id && targetUserId === user.id) {
      setShowUserMenu(false);
      return; // Already current user
    }

    try {
      const response = await apiService.switchUser(targetUserId);
      if (response.success) {
        // Update tokens
        localStorage.setItem('token', response.access_token);
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }

        // Notify parent component
        if (onUserSwitch) {
          onUserSwitch(response.user);
        }

        setShowUserMenu(false);
      } else {
        alert('Failed to switch user: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to switch user:', error);
      alert('Failed to switch user. Please try again.');
    }
  };

  // Handle add user
  const handleAddUser = () => {
    setShowUserMenu(false);
    setShowAddUserModal(true);
  };

  // Handle user added
  const handleUserAdded = (newUser) => {
    setAvailableUsers(prev => [...prev, newUser]);
    setShowAddUserModal(false);
  };

  // Generate user initials
  const getUserInitials = (userData) => {
    const firstName = userData?.firstName || userData?.first_name || 'U';
    const lastName = userData?.lastName || userData?.last_name || 'U';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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

  // Load available users when menu opens
  useEffect(() => {
    if (showUserMenu) {
      loadAvailableUsers();
    }
  }, [showUserMenu]);

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
          padding: '0 20px',
          minWidth: 0, // Allow flex item to shrink
          maxWidth: '100%', // Prevent overflow
          overflow: 'hidden' // Ensure no overflow
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
                setShowUserMenu(prev => !prev);
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
                {(user.firstName || 'U').charAt(0)}{(user.lastName || 'U').charAt(0)}
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
                  minWidth: '220px',
                  zIndex: 2147483647, // Maximum possible z-index value
                  overflow: 'hidden'
                }}>
                  {/* Current User Section */}
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
                      {(user.firstName || 'Unknown')} {(user.lastName || 'User')}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: theme === 'dark' ? '#cbd5e1' : '#5d4d3a'
                    }}>
                      {user.role}
                    </div>
                  </div>

                  {/* User Management Section */}
                  <div style={{
                    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#ede8df'}`,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {/* Available Users List */}
                    {availableUsers.length > 0 && (
                      <div style={{
                        padding: '8px 0'
                      }}>
                        <div style={{
                          padding: '4px 16px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: theme === 'dark' ? '#94a3b8' : '#8b7355',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Switch User
                        </div>
                        {availableUsers.map((availableUser) => (
                          <button
                            key={availableUser.id}
                            onClick={() => handleUserSwitch(availableUser.id)}
                            disabled={availableUser.id === user.id}
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              border: 'none',
                              background: availableUser.id === user.id 
                                ? (theme === 'dark' ? '#374151' : '#ede8df')
                                : 'none',
                              textAlign: 'left',
                              fontSize: '13px',
                              color: availableUser.id === user.id 
                                ? (theme === 'dark' ? '#94a3b8' : '#8b7355')
                                : (theme === 'dark' ? '#f1f5f9' : '#2d1810'),
                              cursor: availableUser.id === user.id ? 'default' : 'pointer',
                              transition: 'background-color 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                              if (availableUser.id !== user.id) {
                                e.target.style.backgroundColor = theme === 'dark' ? '#374151' : '#ede8df';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (availableUser.id !== user.id) {
                                e.target.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: theme === 'dark' ? '#475569' : '#d4c4a8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: '600',
                              color: theme === 'dark' ? '#f1f5f9' : '#2d1810'
                            }}>
                              {getUserInitials(availableUser)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '500' }}>
                                {availableUser.firstName || availableUser.first_name} {availableUser.lastName || availableUser.last_name}
                                {availableUser.id === user.id && ' (current)'}
                              </div>
                              <div style={{ 
                                fontSize: '11px',
                                color: theme === 'dark' ? '#94a3b8' : '#8b7355'
                              }}>
                                {availableUser.role}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Add User Button */}
                    <button
                      onClick={handleAddUser}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        fontSize: '13px',
                        color: theme === 'dark' ? '#3b82f6' : '#8b4513',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme === 'dark' ? '#374151' : '#ede8df';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      + Add User
                    </button>
                  </div>

                  {/* Logout Button */}
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
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={handleUserAdded}
        theme={theme}
      />
    </>
  );
};

export default Header;