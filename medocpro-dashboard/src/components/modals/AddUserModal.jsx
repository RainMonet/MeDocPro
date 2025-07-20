import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

// Helper function for theme-aware styling
const getThemeStyles = (theme = 'dark') => ({
  textPrimary: theme === 'dark' ? '#f1f5f9' : '#2d1810',
  textSecondary: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
  textMuted: theme === 'dark' ? '#94a3b8' : '#8b7355',
  bgPrimary: theme === 'dark' ? '#1e293b' : '#faf8f3',
  bgSecondary: theme === 'dark' ? '#0f172a' : '#f4f1eb',
  bgAccent: theme === 'dark' ? '#374151' : '#ede8df',
  borderColor: theme === 'dark' ? '#475569' : '#d4c4a8',
  primaryColor: theme === 'dark' ? '#3b82f6' : '#8b4513',
  successColor: theme === 'dark' ? '#10b981' : '#6b8e23',
  errorColor: theme === 'dark' ? '#ef4444' : '#a0522d'
});

const AddUserModal = ({ isOpen, onClose, onUserAdded, theme = 'dark' }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'clinician'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [currentTheme, setCurrentTheme] = useState(theme);

  const styles = getThemeStyles(currentTheme);

  // Listen for theme changes
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setCurrentTheme(newTheme);
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        role: 'clinician'
      });
      setError('');
      setSuccess('');
      setGeneratedPassword('');
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.createUser(formData);
      
      if (response.success) {
        setSuccess('User created successfully!');
        
        // Store generated password if provided (development mode)
        if (response.generated_password) {
          setGeneratedPassword(response.generated_password);
        }

        // Notify parent component
        if (onUserAdded) {
          onUserAdded(response.user);
        }

        // Auto-close modal after 2 seconds or keep open to show password
        if (!response.generated_password) {
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else {
        setError(response.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050
    }}>
      <div style={{
        backgroundColor: styles.bgPrimary,
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: `1px solid ${styles.borderColor}`
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px',
          borderBottom: `1px solid ${styles.borderColor}`
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: styles.textPrimary
          }}>
            Add New User
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: styles.textMuted,
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {success && !generatedPassword ? (
            <div style={{
              padding: '12px',
              backgroundColor: `${styles.successColor}15`,
              border: `1px solid ${styles.successColor}30`,
              borderRadius: '6px',
              color: styles.successColor,
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {success}
            </div>
          ) : generatedPassword ? (
            <div style={{
              padding: '16px',
              backgroundColor: `${styles.successColor}15`,
              border: `1px solid ${styles.successColor}30`,
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <div style={{
                color: styles.successColor,
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                User created successfully!
              </div>
              <div style={{
                color: styles.textSecondary,
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                Generated password (save this - it won't be shown again):
              </div>
              <div style={{
                padding: '8px 12px',
                backgroundColor: styles.bgSecondary,
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '16px',
                fontWeight: '600',
                color: styles.textPrimary,
                textAlign: 'center',
                letterSpacing: '1px'
              }}>
                {generatedPassword}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: `${styles.errorColor}15`,
                  border: `1px solid ${styles.errorColor}30`,
                  borderRadius: '6px',
                  color: styles.errorColor,
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: styles.textSecondary,
                  marginBottom: '6px'
                }}>
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '6px',
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter first name"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: styles.textSecondary,
                  marginBottom: '6px'
                }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '6px',
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter last name"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: styles.textSecondary,
                  marginBottom: '6px'
                }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '6px',
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter email address"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: styles.textSecondary,
                  marginBottom: '6px'
                }}>
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '6px',
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="clinician">Clinician</option>
                  <option value="administrator">Administrator</option>
                  <option value="nurse">Nurse</option>
                  <option value="resident">Resident</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: styles.textSecondary,
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading ? styles.bgAccent : styles.primaryColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loading && (
                    <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                  )}
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          )}

          {generatedPassword && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '16px'
            }}>
              <button
                onClick={handleClose}
                style={{
                  padding: '10px 20px',
                  backgroundColor: styles.primaryColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;