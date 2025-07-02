import React, { useState, useEffect } from 'react';

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

// Text size control component
const TextSizeControl = ({ value, onChange, theme }) => {
  const styles = getThemeStyles(theme);
  const sizes = [
    { value: 'small', label: 'Small', size: '12px' },
    { value: 'medium', label: 'Medium', size: '14px' },
    { value: 'large', label: 'Large', size: '16px' },
    { value: 'extra-large', label: 'Extra Large', size: '18px' }
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: styles.textPrimary,
        marginBottom: '12px'
      }}>
        Text Size
      </label>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px'
      }}>
        {sizes.map(size => (
          <button
            key={size.value}
            onClick={() => onChange(size.value)}
            style={{
              padding: '12px 16px',
              backgroundColor: value === size.value ? styles.primaryColor : styles.bgSecondary,
              color: value === size.value ? 'white' : styles.textPrimary,
              border: `1px solid ${value === size.value ? styles.primaryColor : styles.borderColor}`,
              borderRadius: '6px',
              fontSize: size.size,
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {size.label}
          </button>
        ))}
      </div>
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        color: styles.textMuted
      }}>
        Preview: <span style={{ fontSize: value === 'small' ? '12px' : value === 'medium' ? '14px' : value === 'large' ? '16px' : '18px' }}>
          Sample text in {value} size
        </span>
      </div>
    </div>
  );
};

// Font family control component
const FontFamilyControl = ({ value, onChange, theme }) => {
  const styles = getThemeStyles(theme);
  const fonts = [
    { value: 'sans-serif', label: 'Sans-Serif', family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { value: 'serif', label: 'Serif', family: 'Georgia, "Times New Roman", serif' }
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: styles.textPrimary,
        marginBottom: '12px'
      }}>
        Font Family
      </label>
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        {fonts.map(font => (
          <button
            key={font.value}
            onClick={() => onChange(font.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: value === font.value ? styles.primaryColor : styles.bgSecondary,
              color: value === font.value ? 'white' : styles.textPrimary,
              border: `1px solid ${value === font.value ? styles.primaryColor : styles.borderColor}`,
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: font.family,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {font.label}
          </button>
        ))}
      </div>
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        color: styles.textMuted,
        fontFamily: value === 'serif' ? 'Georgia, "Times New Roman", serif' : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        Preview: Sample text in {value} font
      </div>
    </div>
  );
};

// Toggle switch component
const ToggleSwitch = ({ checked, onChange, label, description, theme }) => {
  const styles = getThemeStyles(theme);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      padding: '16px',
      backgroundColor: styles.bgSecondary,
      borderRadius: '8px',
      border: `1px solid ${styles.borderColor}`
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: styles.textPrimary,
          marginBottom: '4px'
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '12px',
          color: styles.textMuted
        }}>
          {description}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '48px',
          height: '24px',
          backgroundColor: checked ? styles.successColor : styles.bgAccent,
          border: 'none',
          borderRadius: '12px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          backgroundColor: 'white',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: checked ? '26px' : '2px',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }} />
      </button>
    </div>
  );
};

// Voice control component
const VoiceControl = ({ enabled, onChange, theme }) => {
  const styles = getThemeStyles(theme);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if speech synthesis is supported
    setIsSupported('speechSynthesis' in window);
  }, []);

  const testVoice = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Voice navigation is now enabled. I will announce page changes and button actions.');
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <ToggleSwitch
        checked={enabled}
        onChange={onChange}
        label="🔊 Text-to-Voice Navigation"
        description={isSupported ? "Announces page changes and button actions" : "Not supported in this browser"}
        theme={theme}
      />
      {enabled && isSupported && (
        <button
          onClick={testVoice}
          style={{
            padding: '8px 12px',
            backgroundColor: styles.bgAccent,
            color: styles.textPrimary,
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            marginLeft: '16px'
          }}
        >
          Test Voice
        </button>
      )}
    </div>
  );
};

// Main Accessibility Modal Component
const AccessibilityModal = ({ isOpen, onClose, theme = 'dark' }) => {
  const [settings, setSettings] = useState({
    textSize: 'medium',
    fontFamily: 'sans-serif',
    highContrast: false,
    voiceNavigation: false
  });

  const styles = getThemeStyles(theme);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  // Apply settings to the document
  const applySettings = (newSettings) => {
    const root = document.documentElement;
    
    // Apply text size
    const sizeMap = {
      'small': '12px',
      'medium': '14px', 
      'large': '16px',
      'extra-large': '18px'
    };
    root.style.setProperty('--base-font-size', sizeMap[newSettings.textSize]);
    
    // Apply font family
    const fontMap = {
      'sans-serif': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'serif': 'Georgia, "Times New Roman", serif'
    };
    root.style.setProperty('--font-family', fontMap[newSettings.fontFamily]);
    
    // Apply high contrast
    if (newSettings.highContrast) {
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.removeAttribute('data-high-contrast');
    }
    
    // Set voice navigation flag for other components to use
    root.setAttribute('data-voice-navigation', newSettings.voiceNavigation);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    const defaultSettings = {
      textSize: 'medium',
      fontFamily: 'sans-serif', 
      highContrast: false,
      voiceNavigation: false
    };
    setSettings(defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: styles.bgPrimary,
          border: `1px solid ${styles.borderColor}`,
          maxWidth: '500px',
          width: '90vw',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 20px 24px',
          borderBottom: `1px solid ${styles.borderColor}`,
          flexShrink: 0
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
              ♿ Accessibility Options
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
                cursor: 'pointer'
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
            Customize your experience for better accessibility
          </p>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          <TextSizeControl
            value={settings.textSize}
            onChange={(value) => updateSetting('textSize', value)}
            theme={theme}
          />

          <FontFamilyControl
            value={settings.fontFamily}
            onChange={(value) => updateSetting('fontFamily', value)}
            theme={theme}
          />

          <ToggleSwitch
            checked={settings.highContrast}
            onChange={(value) => updateSetting('highContrast', value)}
            label="🎨 High Contrast Mode"
            description="Increases color contrast for better visibility"
            theme={theme}
          />

          <VoiceControl
            enabled={settings.voiceNavigation}
            onChange={(value) => updateSetting('voiceNavigation', value)}
            theme={theme}
          />

          {/* Reset Button */}
          <div style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: `1px solid ${styles.borderColor}`
          }}>
            <button
              onClick={resetSettings}
              style={{
                padding: '10px 16px',
                backgroundColor: styles.bgAccent,
                color: styles.textPrimary,
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityModal;