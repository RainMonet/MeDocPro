import React, { useState, useEffect } from 'react';

// Helper function for theme-aware styling (matches PatientCensusCard)
const getThemeStyles = (theme = 'dark') => ({
  textPrimary: theme === 'dark' ? '#f1f5f9' : '#2d1810',
  textSecondary: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
  textMuted: theme === 'dark' ? '#94a3b8' : '#8b7355',
  bgPrimary: theme === 'dark' ? '#1e293b' : '#faf8f3',
  bgSecondary: theme === 'dark' ? '#0f172a' : '#f4f1eb',
  bgAccent: theme === 'dark' ? '#374151' : '#ede8df',
  bgHover: theme === 'dark' ? '#475569' : '#d4c4a8',
  borderColor: theme === 'dark' ? '#475569' : '#d4c4a8',
  primaryColor: theme === 'dark' ? '#3b82f6' : '#8b4513',
  successColor: theme === 'dark' ? '#10b981' : '#6b8e23',
  warningColor: theme === 'dark' ? '#f59e0b' : '#cd853f',
  errorColor: theme === 'dark' ? '#ef4444' : '#a0522d'
});

// Sample document data
const sampleDocuments = [
  {
    id: 1,
    title: 'Progress Note - Anderson, S.',
    type: 'Progress Note',
    date: 'Today, 2:30 PM',
    status: 'completed'
  },
  {
    id: 2,
    title: 'Assessment - Chen, M.',
    type: 'Psychiatric Assessment',
    date: 'Today, 11:45 AM',
    status: 'completed'
  },
  {
    id: 3,
    title: 'Treatment Plan - Johnson, R.',
    type: 'Treatment Plan',
    date: 'Yesterday, 4:15 PM',
    status: 'draft'
  },
  {
    id: 4,
    title: 'Discharge Summary - Williams, T.',
    type: 'Discharge Summary',
    date: 'Yesterday, 1:20 PM',
    status: 'completed'
  }
];

// Individual document row component
const DocumentListItem = ({ document, theme }) => {
  const [isHovered, setIsHovered] = useState(false);
  const styles = getThemeStyles(theme);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return styles.successColor;
      case 'draft': return styles.warningColor;
      case 'pending': return styles.primaryColor;
      default: return styles.textMuted;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: `1px solid ${styles.borderColor}`,
        backgroundColor: isHovered ? styles.bgAccent : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Document Type Indicator */}
      <div style={{
        fontSize: '12px',
        fontWeight: '500',
        marginRight: '12px',
        minWidth: '24px',
        textAlign: 'center',
        color: styles.primaryColor
      }}>
        DOC
      </div>

      {/* Document Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '500',
          color: styles.textPrimary,
          marginBottom: '2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {document.title}
        </div>
        <div style={{
          fontSize: '12px',
          color: styles.textMuted,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{document.date}</span>
          <span>•</span>
          <span>{document.type}</span>
        </div>
      </div>

      {/* Status Indicator */}
      <div style={{
        fontSize: '11px',
        fontWeight: '500',
        color: getStatusColor(document.status),
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginLeft: '12px'
      }}>
        {document.status}
      </div>
    </div>
  );
};

const RecentDocuments = ({ theme }) => {
  const [showAll, setShowAll] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme || document.documentElement.getAttribute('data-theme') || 'dark');
  
  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
          setCurrentTheme(newTheme);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  // Update theme when prop changes
  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [theme]);

  const styles = getThemeStyles(currentTheme);
  
  // Display logic for documents
  const displayedDocuments = showAll ? sampleDocuments : sampleDocuments.slice(0, 3);
  const hasMoreDocuments = sampleDocuments.length > 3;

  return (
    <div style={{
      backgroundColor: styles.bgPrimary,
      borderRadius: '8px',
      border: `1px solid ${styles.borderColor}`,
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Gradient top border */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, ${styles.primaryColor}, ${styles.warningColor})`,
        zIndex: 1
      }} />
      
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px 20px',
        borderBottom: `1px solid ${styles.borderColor}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: styles.textPrimary
          }}>
            Recent Documents
          </h3>
          <button
            style={{
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            View All
          </button>
        </div>
        
        <div style={{
          fontSize: '12px',
          color: styles.textMuted
        }}>
          {showAll ? sampleDocuments.length : Math.min(3, sampleDocuments.length)} of {sampleDocuments.length} documents
        </div>
      </div>

      {/* Document List */}
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        {displayedDocuments.length > 0 ? (
          <>
            {displayedDocuments.map(document => (
              <DocumentListItem
                key={document.id}
                document={document}
                theme={currentTheme}
              />
            ))}
            
            {/* More button */}
            {hasMoreDocuments && !showAll && (
              <div style={{
                padding: '12px 16px',
                borderTop: `1px solid ${styles.borderColor}`,
                textAlign: 'center'
              }}>
                <button
                  onClick={() => setShowAll(true)}
                  style={{
                    background: 'none',
                    border: `1px solid ${styles.borderColor}`,
                    color: styles.textSecondary,
                    padding: '6px 16px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = styles.bgAccent;
                    e.target.style.borderColor = styles.primaryColor;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = styles.borderColor;
                  }}
                >
                  Show {sampleDocuments.length - 3} more documents
                </button>
              </div>
            )}
            
            {/* Show less button when all are displayed */}
            {showAll && hasMoreDocuments && (
              <div style={{
                padding: '12px 16px',
                borderTop: `1px solid ${styles.borderColor}`,
                textAlign: 'center'
              }}>
                <button
                  onClick={() => setShowAll(false)}
                  style={{
                    background: 'none',
                    border: `1px solid ${styles.borderColor}`,
                    color: styles.textSecondary,
                    padding: '6px 16px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = styles.bgAccent;
                    e.target.style.borderColor = styles.primaryColor;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = styles.borderColor;
                  }}
                >
                  Show less
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: styles.textMuted
          }}>
            <div style={{ fontSize: '14px' }}>No recent documents</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Documents will appear here after creation
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentDocuments;