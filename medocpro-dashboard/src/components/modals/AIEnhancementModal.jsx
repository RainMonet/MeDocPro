import React from 'react';
import { createPortal } from 'react-dom';
import AIEnhancement from '../templates/AIEnhancement';

// Helper function for theme-aware styling
const getThemeStyles = (theme = 'dark') => ({
  textPrimary: theme === 'dark' ? '#f1f5f9' : '#2d1810',
  textSecondary: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
  textMuted: theme === 'dark' ? '#94a3b8' : '#8b7355',
  bgPrimary: theme === 'dark' ? '#1e293b' : '#faf8f3',
  bgSecondary: theme === 'dark' ? '#0f172a' : '#f4f1eb',
  borderColor: theme === 'dark' ? '#475569' : '#d4c4a8',
});

const AIEnhancementModal = ({ isOpen, onClose, theme = 'dark' }) => {
  const styles = getThemeStyles(theme);

  console.log('AIEnhancementModal: isOpen =', isOpen, 'theme =', theme);

  if (!isOpen) {
    console.log('AIEnhancementModal: Not open, returning null');
    return null;
  }

  console.log('AIEnhancementModal: Rendering modal...');

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
        zIndex: 10010
      }}
    >
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{
          backgroundColor: styles.bgPrimary,
          border: `1px solid ${styles.borderColor}`,
          maxWidth: '800px',
          width: '90vw',
          maxHeight: '80vh',
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
              AI Enhancement Settings
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
            Configure Ollama AI enhancement settings and text processing options
          </p>
        </div>

        {/* AI Enhancement Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '0'
        }}>
          <AIEnhancement
            content=""
            onEnhancedContent={(enhancedContent) => {
              // This is a settings modal, so we don't need to handle enhanced content
              console.log('AI Enhancement settings updated');
            }}
            isVisible={true}
            theme={theme}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AIEnhancementModal;