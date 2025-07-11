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

// Document format selector component
const FormatSelector = ({ value, onChange, theme }) => {
  const styles = getThemeStyles(theme);
  const formats = [
    { value: 'individual', label: 'Individual Files', description: 'One .doc file per patient', icon: '📄' },
    { value: 'combined', label: 'Combined File', description: 'All notes in one .doc file', icon: '📚' },
    { value: 'pdf', label: 'PDF Export', description: 'Formatted PDF documents', icon: '📋' }
  ];

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: styles.textPrimary,
        marginBottom: '8px'
      }}>
        📦 Output Format
      </label>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '8px'
      }}>
        {formats.map(format => (
          <button
            key={format.value}
            onClick={() => onChange(format.value)}
            style={{
              padding: '12px',
              backgroundColor: value === format.value ? `${styles.primaryColor}20` : styles.bgSecondary,
              border: `2px solid ${value === format.value ? styles.primaryColor : styles.borderColor}`,
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '16px' }}>{format.icon}</span>
              <span style={{
                fontSize: '13px',
                fontWeight: '500',
                color: value === format.value ? styles.primaryColor : styles.textPrimary
              }}>
                {format.label}
              </span>
            </div>
            <div style={{
              fontSize: '11px',
              color: styles.textMuted,
              lineHeight: '1.3'
            }}>
              {format.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Document preview component
const DocumentPreview = ({ documents, theme }) => {
  const styles = getThemeStyles(theme);
  const [selectedDoc, setSelectedDoc] = useState(0);

  if (!documents || documents.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: styles.textMuted
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <div>No documents to preview</div>
      </div>
    );
  }

  const currentDoc = documents[selectedDoc];

  return (
    <div style={{
      border: `1px solid ${styles.borderColor}`,
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '20px'
    }}>
      {/* Document tabs */}
      {documents.length > 1 && (
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          backgroundColor: styles.bgSecondary,
          borderBottom: `1px solid ${styles.borderColor}`
        }}>
          {documents.map((doc, index) => (
            <button
              key={index}
              onClick={() => setSelectedDoc(index)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedDoc === index ? styles.bgPrimary : 'transparent',
                border: 'none',
                borderBottom: selectedDoc === index ? `2px solid ${styles.primaryColor}` : '2px solid transparent',
                fontSize: '12px',
                color: selectedDoc === index ? styles.textPrimary : styles.textMuted,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: selectedDoc === index ? '500' : 'normal'
              }}
            >
              {doc.patient_name}
            </button>
          ))}
        </div>
      )}

      {/* Document content */}
      <div style={{
        padding: '20px',
        backgroundColor: styles.bgPrimary,
        minHeight: '300px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <div style={{
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${styles.borderColor}`
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: styles.textPrimary,
            marginBottom: '4px'
          }}>
            {currentDoc.template_name} - {currentDoc.patient_name}
          </div>
          <div style={{
            fontSize: '12px',
            color: styles.textMuted,
            display: 'flex',
            gap: '12px'
          }}>
            <span>Format: {currentDoc.format.toUpperCase()}</span>
            {currentDoc.ai_enhanced && <span>✨ AI Enhanced</span>}
            <span>Generated: {new Date(currentDoc.generated_at).toLocaleString()}</span>
          </div>
        </div>

        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: '14px',
          lineHeight: '1.6',
          color: styles.textPrimary,
          whiteSpace: 'pre-wrap'
        }}>
          {currentDoc.content}
        </div>
      </div>
    </div>
  );
};

// Export options component
const ExportOptions = ({ onExport, isExporting, theme }) => {
  const styles = getThemeStyles(theme);

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end'
    }}>
      <button
        onClick={() => onExport('download')}
        disabled={isExporting}
        style={{
          padding: '10px 20px',
          backgroundColor: styles.primaryColor,
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: isExporting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: isExporting ? 0.6 : 1
        }}
      >
        {isExporting ? (
          <>
            <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
            Exporting...
          </>
        ) : (
          <>
            <span>💾</span>
            Download Files
          </>
        )}
      </button>

      <button
        onClick={() => onExport('email')}
        disabled={isExporting}
        style={{
          padding: '10px 20px',
          backgroundColor: 'transparent',
          color: styles.textSecondary,
          border: `1px solid ${styles.borderColor}`,
          borderRadius: '6px',
          fontSize: '14px',
          cursor: isExporting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: isExporting ? 0.6 : 1
        }}
      >
        <span>📧</span>
        Email Documents
      </button>
    </div>
  );
};

// Main Preview Document Modal Component
const PreviewDocumentModal = ({ 
  isOpen, 
  onClose, 
  documents = [], 
  batchInfo = {},
  theme = 'dark' 
}) => {
  const [outputFormat, setOutputFormat] = useState('individual');
  const [isExporting, setIsExporting] = useState(false);
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

  // Handle export
  const handleExport = async (exportType) => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (exportType === 'download') {
        alert(`📁 Documents exported successfully!\nFormat: ${outputFormat}\nTotal files: ${documents.length}`);
      } else if (exportType === 'email') {
        alert(`📧 Documents sent via email!\nRecipients will receive ${documents.length} document(s).`);
      }
      
      // Close modal after successful export
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Error exporting documents. Please try again.');
    } finally {
      setIsExporting(false);
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
        width: '95%',
        maxWidth: '1200px',
        maxHeight: '95vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px',
          borderBottom: `1px solid ${styles.borderColor}`
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: styles.textPrimary,
              marginBottom: '4px'
            }}>
              📋 Document Preview & Export
            </h2>
            <div style={{
              fontSize: '14px',
              color: styles.textSecondary
            }}>
              {batchInfo.totalCount || documents.length} document(s) generated • Batch ID: {batchInfo.batchId || 'N/A'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: styles.textMuted,
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {/* Format Selector */}
          <FormatSelector
            value={outputFormat}
            onChange={setOutputFormat}
            theme={currentTheme}
          />

          {/* Document Preview */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: styles.textPrimary,
              marginBottom: '8px'
            }}>
              📄 Document Preview
            </label>
            <DocumentPreview 
              documents={documents} 
              theme={currentTheme}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderTop: `1px solid ${styles.borderColor}`,
          backgroundColor: styles.bgSecondary
        }}>
          <div style={{
            fontSize: '12px',
            color: styles.textMuted
          }}>
            Ready to export {documents.length} document(s) in {outputFormat} format
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: styles.textSecondary,
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <ExportOptions
              onExport={handleExport}
              isExporting={isExporting}
              theme={currentTheme}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewDocumentModal;