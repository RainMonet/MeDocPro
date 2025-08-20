// medocpro-dashboard/src/components/modals/KeyboardShortcutsModal.jsx
import React, { useEffect, useState } from 'react';

const KeyboardShortcutsModal = ({ isOpen, onClose, theme = 'dark' }) => {
  // Force component refresh - cache buster
  const [refreshKey] = useState(Date.now());
  // Theme-aware colors
  const getThemeStyles = () => ({
    textPrimary: theme === 'dark' ? '#f1f5f9' : '#2d1810',
    textSecondary: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
    textMuted: theme === 'dark' ? '#94a3b8' : '#8b7355',
    bgPrimary: theme === 'dark' ? '#1e293b' : '#faf8f3',
    bgSecondary: theme === 'dark' ? '#0f172a' : '#f4f1eb',
    bgAccent: theme === 'dark' ? '#374151' : '#ede8df',
    borderColor: theme === 'dark' ? '#475569' : '#d4c4a8',
    primaryColor: theme === 'dark' ? '#3b82f6' : '#8b4513'
  });

  const styles = getThemeStyles();

  // Keyboard shortcuts configuration
  const shortcutCategories = [
    {
      category: 'Navigation',
      shortcuts: [
        { keys: ['Alt', 'W'], description: 'Open Clinical Workspace', action: 'switch-to-workspace' },
        { keys: ['Alt', 'D'], description: 'Open Dashboard', action: 'switch-to-dashboard' },
        { keys: ['Alt', 'S'], description: 'Toggle Sidebar', action: 'toggle-sidebar' },
        { keys: ['Alt', 'T'], description: 'Toggle Theme (Dark/Light)', action: 'toggle-theme' },
        { keys: ['Escape'], description: 'Close Current Modal', action: 'close-modal' }
      ]
    },
    {
      category: 'Patient Management',
      shortcuts: [
        { keys: ['Alt', 'P'], description: 'Open Patient Census', action: 'open-patient-census' },
        { keys: ['Alt', 'I'], description: 'Open Daily Information Entry', action: 'open-daily-info' },
        { keys: ['Ctrl', 'A'], description: 'Select All Patients', action: 'select-all-patients' },
        { keys: ['Alt', 'N'], description: 'Sort Patients by Name', action: 'sort-by-name' },
        { keys: ['Alt', 'R'], description: 'Refresh Patient Data', action: 'refresh-patients' }
      ]
    },
    {
      category: 'Templates & Documents',
      shortcuts: [
        { keys: ['Alt', 'E'], description: 'Open Template Editor', action: 'open-template-editor' },
        { keys: ['Alt', 'L'], description: 'Open Template Library', action: 'open-template-library' },
        { keys: ['Alt', 'G'], description: 'Generate Documents', action: 'generate-documents' },
        { keys: ['Ctrl', 'S'], description: 'Save Template (in editor)', action: 'save-template' }
      ]
    },
    {
      category: 'AI & Enhancement',
      shortcuts: [
        { keys: ['Alt', 'A'], description: 'Open AI Enhancement Settings', action: 'open-ai-settings' },
        { keys: ['Alt', 'C'], description: 'Open AI Chatbot', action: 'open-ai-chat' },
        { keys: ['Ctrl', 'Enter'], description: 'Enhance Selected Text with AI', action: 'enhance-text' }
      ]
    },
    {
      category: 'Settings & Tools',
      shortcuts: [
        { keys: ['Alt', 'K'], description: 'Open Keyboard Shortcuts', action: 'open-keyboard-shortcuts' },
        { keys: ['Alt', 'U'], description: 'Open Accessibility Settings', action: 'open-accessibility' },
        { keys: ['Alt', 'Q'], description: 'Open Quote Ticker Settings', action: 'open-quote-ticker' },
        { keys: ['Alt', 'B'], description: 'Open Provider Absence Manager', action: 'open-provider-absence' },
        { keys: ['Alt', 'O'], description: 'Open Color Priority System', action: 'open-color-priority' },
        { keys: ['Alt', 'H'], description: 'Open Audit Logging', action: 'open-audit-logging' }
      ]
    },
    {
      category: 'Advanced Navigation',
      shortcuts: [
        { keys: ['F1'], description: 'Show AI Agent Help (in Clinical Workspace)', action: 'show-ai-help' },
        { keys: ['F2'], description: 'Focus Patient Census Section', action: 'focus-patient-census' },
        { keys: ['F3'], description: 'Focus Batch Documentation Section', action: 'focus-batch-docs' },
        { keys: ['F4'], description: 'Open Daily Info Modal (if available)', action: 'open-daily-info-f4' },
        { keys: ['F5'], description: 'Refresh All Data', action: 'refresh-all-data' },
        { keys: ['Tab'], description: 'Navigate Between Focusable Elements', action: 'tab-navigation' },
        { keys: ['Shift', 'Tab'], description: 'Navigate Backwards Between Elements', action: 'shift-tab-navigation' }
      ]
    }
  ];

  // Global keyboard shortcut handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in form inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const { ctrlKey, shiftKey, altKey, key } = event;

      // Find matching shortcut
      for (const category of shortcutCategories) {
        for (const shortcut of category.shortcuts) {
          if (matchesShortcut(shortcut.keys, { ctrlKey, shiftKey, altKey, key })) {
            event.preventDefault();
            executeShortcut(shortcut.action);
            return;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Check if current key combination matches a shortcut
  const matchesShortcut = (keys, current) => {
    const hasCtrl = keys.includes('Ctrl') ? current.ctrlKey : !current.ctrlKey;
    const hasShift = keys.includes('Shift') ? current.shiftKey : !current.shiftKey;
    const hasAlt = keys.includes('Alt') ? current.altKey : !current.altKey;
    
    const keyMatch = keys.some(k => 
      !['Ctrl', 'Shift', 'Alt'].includes(k) && (
        k.toLowerCase() === current.key.toLowerCase() || 
        k === current.key
      )
    );

    return hasCtrl && hasShift && hasAlt && keyMatch;
  };

  // Execute shortcut actions
  const executeShortcut = (action) => {
    console.log('🎹 Executing keyboard shortcut:', action);

    switch (action) {
      case 'switch-to-workspace':
        window.dispatchEvent(new CustomEvent('switchView', { detail: 'workspace' }));
        break;
      case 'switch-to-dashboard':
        window.dispatchEvent(new CustomEvent('switchView', { detail: 'dashboard' }));
        break;
      case 'toggle-sidebar':
        window.dispatchEvent(new CustomEvent('toggleSidebar'));
        break;
      case 'toggle-theme':
        window.dispatchEvent(new CustomEvent('toggleTheme'));
        break;
      case 'close-modal':
        if (onClose) onClose();
        break;
      case 'open-patient-census':
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modalType: 'patient-census' } }));
        break;
      case 'open-daily-info':
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modalType: 'daily-info-entry' } }));
        break;
      case 'open-template-editor':
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modalType: 'template-editor' } }));
        break;
      case 'open-template-library':
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modalType: 'template-library' } }));
        break;
      case 'open-ai-settings':
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modalType: 'ai-assistant-settings' } }));
        break;
      case 'open-ai-chat':
        window.dispatchEvent(new CustomEvent('openAIChat'));
        break;
      case 'open-keyboard-shortcuts':
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modalType: 'keyboard-shortcuts' } }));
        break;
      case 'open-accessibility':
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modalType: 'accessibility' } }));
        break;
      case 'open-quote-ticker':
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modalType: 'quote-ticker' } }));
        break;
      case 'open-provider-absence':
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modalType: 'provider-absence' } }));
        break;
      case 'open-color-priority':
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modalType: 'color-priority-system' } }));
        break;
      case 'open-audit-logging':
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modalType: 'audit-logging' } }));
        break;
      case 'show-ai-help':
        if (window.MeDocProAPI?.getCapabilities) {
          console.log('🤖 MeDocPro AI Agent Capabilities:', window.MeDocProAPI.getCapabilities());
        }
        break;
      case 'focus-patient-census':
        const censusElement = document.querySelector('#patient-census-section') || document.querySelector('[data-ai-component="patient-census-card"]');
        if (censusElement) censusElement.focus();
        break;
      case 'focus-batch-docs':
        const batchElement = document.querySelector('#batch-documentation-section') || document.querySelector('[data-ai-component="batch-documentation-card"]');
        if (batchElement) batchElement.focus();
        break;
      case 'open-daily-info-f4':
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modalType: 'daily-info-entry' } }));
        break;
      case 'refresh-all-data':
        if (window.MeDocProAPI?.clinicalWorkspace?.actions?.refreshCensus) {
          window.MeDocProAPI.clinicalWorkspace.actions.refreshCensus();
        }
        if (window.MeDocProAPI?.clinicalWorkspace?.actions?.refreshRecentDocuments) {
          window.MeDocProAPI.clinicalWorkspace.actions.refreshRecentDocuments();
        }
        break;
      case 'tab-navigation':
      case 'shift-tab-navigation':
        // These are handled natively by the browser
        break;
      case 'select-all-patients':
        if (window.MeDocProAPI?.patientCensus?.actions?.selectAll) {
          window.MeDocProAPI.patientCensus.actions.selectAll();
        }
        break;
      case 'sort-by-name':
        if (window.MeDocProAPI?.patientCensus?.actions?.sortByName) {
          window.MeDocProAPI.patientCensus.actions.sortByName();
        }
        break;
      case 'refresh-patients':
        if (window.MeDocProAPI?.patientCensus?.actions?.refresh) {
          window.MeDocProAPI.patientCensus.actions.refresh();
        }
        break;
      case 'generate-documents':
        window.dispatchEvent(new CustomEvent('generateDocuments'));
        break;
      case 'save-template':
        window.dispatchEvent(new CustomEvent('saveTemplate'));
        break;
      case 'enhance-text':
        window.dispatchEvent(new CustomEvent('enhanceText'));
        break;
      default:
        console.warn('Unknown shortcut action:', action);
    }
  };

  // Format key combination for display
  const formatKeys = (keys) => {
    return keys.map(key => (
      <kbd 
        key={key}
        style={{
          backgroundColor: styles.bgAccent,
          color: styles.textPrimary,
          padding: '2px 6px',
          margin: '0 2px',
          borderRadius: '3px',
          fontSize: '11px',
          fontFamily: 'monospace',
          border: `1px solid ${styles.borderColor}`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
      >
        {key}
      </kbd>
    ));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div 
        key={refreshKey} // Force refresh with unique key
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: styles.bgPrimary,
          borderRadius: '12px',
          width: '90%',
          maxWidth: '800px',
          height: '600px', // Fixed pixel height
          maxHeight: '80vh', // Fallback for very small screens
          overflow: 'hidden',
          border: `1px solid ${styles.borderColor}`,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: `1px solid ${styles.borderColor}`,
          backgroundColor: styles.bgSecondary
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '600',
            color: styles.textPrimary
          }}>
            Keyboard Shortcuts
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: styles.textMuted,
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = styles.textPrimary;
              e.target.style.backgroundColor = styles.bgAccent;
            }}
            onMouseLeave={(e) => {
              e.target.style.color = styles.textMuted;
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, // Take remaining space
          overflowY: 'auto', // Auto scroll
          padding: '20px 24px 40px 24px', // Normal padding with moderate bottom space
          boxSizing: 'border-box'
        }}>
          <p style={{
            color: styles.textSecondary,
            marginBottom: '24px',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            Use these keyboard shortcuts to navigate MeDocPro more efficiently. Shortcuts work globally unless you're typing in a text field.
          </p>

          {shortcutCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} style={{ marginBottom: '32px' }}>
              <h3 style={{
                color: styles.primaryColor,
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '16px',
                borderBottom: `1px solid ${styles.borderColor}`,
                paddingBottom: '8px'
              }}>
                {category.category}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {category.shortcuts.map((shortcut, shortcutIndex) => (
                  <div 
                    key={shortcutIndex}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: styles.bgSecondary,
                      borderRadius: '8px',
                      border: `1px solid ${styles.borderColor}`
                    }}
                  >
                    <span style={{
                      color: styles.textPrimary,
                      fontSize: '14px',
                      flex: 1
                    }}>
                      {shortcut.description}
                    </span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {formatKeys(shortcut.keys)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Footer note */}
          <div style={{
            marginTop: '32px',
            marginBottom: '20px', // Add bottom margin
            padding: '16px',
            backgroundColor: styles.bgAccent,
            borderRadius: '8px',
            boxShadow: `inset 0 0 0 1px ${styles.borderColor}`, // Use inset shadow instead of border
            border: 'none' // Remove border that was causing clipping
          }}>
            <p style={{
              color: styles.textSecondary,
              fontSize: '12px',
              margin: 0,
              lineHeight: '1.4'
            }}>
              <strong style={{ color: styles.textPrimary }}>Note:</strong> Some shortcuts may not work if the target feature is not available in the current context or if you're in an input field. Press <kbd style={{ backgroundColor: styles.bgPrimary, padding: '1px 4px', borderRadius: '2px' }}>Esc</kbd> to close any modal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;