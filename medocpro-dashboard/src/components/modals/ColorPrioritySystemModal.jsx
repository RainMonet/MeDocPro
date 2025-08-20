import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  warningColor: theme === 'dark' ? '#f59e0b' : '#cd853f',
  errorColor: theme === 'dark' ? '#ef4444' : '#a0522d'
});

// Default color priority configuration
const getDefaultColorConfig = () => [
  { 
    value: 'red', 
    color: '#ef4444', 
    name: 'High Priority', 
    description: 'Urgent attention needed',
    customName: '',
    customDescription: ''
  },
  { 
    value: 'orange', 
    color: '#f59e0b', 
    name: 'Medical Review', 
    description: 'Requires medical review',
    customName: '',
    customDescription: ''
  },
  { 
    value: 'purple', 
    color: '#8b5cf6', 
    name: 'Legal Status', 
    description: 'Legal status attention',
    customName: '',
    customDescription: ''
  },
  { 
    value: 'blue', 
    color: '#3b82f6', 
    name: 'Different Provider', 
    description: 'Assigned to different provider',
    customName: '',
    customDescription: ''
  },
  { 
    value: 'pink', 
    color: '#ec4899', 
    name: 'Family Contact', 
    description: 'Family meeting or contact needed',
    customName: '',
    customDescription: ''
  },
  { 
    value: 'green', 
    color: '#10b981', 
    name: 'Discharge Planning', 
    description: 'Ready for discharge planning',
    customName: '',
    customDescription: ''
  }
];

const ColorPrioritySystemModal = ({ isOpen, onClose, theme = 'dark' }) => {
  const styles = getThemeStyles(theme);
  const [colorConfig, setColorConfig] = useState(() => getDefaultColorConfig());
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('colorPriorityConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        // Merge with defaults to ensure all colors exist
        const defaultConfig = getDefaultColorConfig();
        const mergedConfig = defaultConfig.map(defaultItem => {
          const savedItem = parsed.find(item => item.value === defaultItem.value);
          return savedItem ? { ...defaultItem, ...savedItem } : defaultItem;
        });
        setColorConfig(mergedConfig);
      }
    } catch (error) {
      console.error('Failed to load color priority configuration:', error);
    }
  }, []);

  // Save configuration
  const saveConfiguration = () => {
    try {
      localStorage.setItem('colorPriorityConfig', JSON.stringify(colorConfig));
      setHasChanges(false);
      
      // Show success feedback
      const originalText = document.querySelector('.save-button')?.textContent;
      const saveButton = document.querySelector('.save-button');
      if (saveButton) {
        saveButton.textContent = 'Saved!';
        setTimeout(() => {
          if (saveButton) saveButton.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to save color priority configuration:', error);
    }
  };

  // Update color configuration
  const updateColorConfig = (colorValue, field, value) => {
    setColorConfig(prev => prev.map(item => 
      item.value === colorValue 
        ? { ...item, [field]: value }
        : item
    ));
    setHasChanges(true);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setColorConfig(getDefaultColorConfig());
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10010,
        padding: '20px'
      }}
    >
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{
          backgroundColor: styles.bgPrimary,
          border: `1px solid ${styles.borderColor}`,
          maxWidth: '700px',
          width: '90vw',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 20px 24px',
          borderBottom: `1px solid ${styles.borderColor}`,
          flexShrink: 0,
          backgroundColor: styles.bgSecondary
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: styles.textPrimary
            }}>
              Color Priority System Settings
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: '8px 12px',
                backgroundColor: 'transparent',
                color: styles.textMuted,
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = styles.borderColor;
                e.target.style.color = styles.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = styles.textMuted;
              }}
            >
              ✕ Close
            </button>
          </div>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: styles.textSecondary
          }}>
            Customize the meaning and descriptions for each priority color. These settings persist across days unless manually changed.
          </p>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '24px'
        }}>
          {/* Color Configuration List */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: styles.textPrimary
            }}>
              Priority Color Definitions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {colorConfig.map((colorItem) => (
                <div
                  key={colorItem.value}
                  style={{
                    padding: '16px',
                    backgroundColor: styles.bgSecondary,
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: colorItem.color,
                        border: `2px solid ${colorItem.color}`,
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '600',
                        color: styles.textPrimary
                      }}>
                        {colorItem.customName || colorItem.name}
                      </h4>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: styles.textSecondary,
                      marginBottom: '6px'
                    }}>
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={colorItem.customName}
                      onChange={(e) => updateColorConfig(colorItem.value, 'customName', e.target.value)}
                      placeholder={colorItem.name}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${styles.borderColor}`,
                        borderRadius: '6px',
                        backgroundColor: styles.bgPrimary,
                        color: styles.textPrimary,
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{
                      fontSize: '11px',
                      color: styles.textMuted,
                      marginTop: '4px'
                    }}>
                      Leave empty to use default name: "{colorItem.name}"
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: styles.textSecondary,
                      marginBottom: '6px'
                    }}>
                      Description
                    </label>
                    <textarea
                      value={colorItem.customDescription}
                      onChange={(e) => updateColorConfig(colorItem.value, 'customDescription', e.target.value)}
                      placeholder={colorItem.description}
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '8px 12px',
                        border: `1px solid ${styles.borderColor}`,
                        borderRadius: '6px',
                        backgroundColor: styles.bgPrimary,
                        color: styles.textPrimary,
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{
                      fontSize: '11px',
                      color: styles.textMuted,
                      marginTop: '4px'
                    }}>
                      Leave empty to use default: "{colorItem.description}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Instructions */}
          <div style={{
            padding: '16px',
            backgroundColor: `${styles.primaryColor}10`,
            border: `1px solid ${styles.primaryColor}30`,
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: styles.textPrimary
            }}>
              How to Use Color Priorities
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '12px',
              color: styles.textSecondary,
              lineHeight: '1.5'
            }}>
              <li>Click the colored dot next to any patient name in the Patient Census</li>
              <li>Select a priority color that matches your workflow needs</li>
              <li>Use the "Color" sort button to group patients by priority level</li>
              <li>Priority assignments persist until manually changed or patient is discharged</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: `1px solid ${styles.borderColor}`,
          backgroundColor: styles.bgSecondary,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={resetToDefaults}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: styles.textSecondary,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = styles.bgAccent;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Reset to Defaults
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: styles.textSecondary,
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              className="save-button"
              onClick={saveConfiguration}
              disabled={!hasChanges}
              style={{
                padding: '8px 16px',
                backgroundColor: hasChanges ? styles.successColor : styles.bgAccent,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: hasChanges ? 'pointer' : 'not-allowed',
                opacity: hasChanges ? 1 : 0.6,
                transition: 'all 0.2s ease'
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ColorPrioritySystemModal;