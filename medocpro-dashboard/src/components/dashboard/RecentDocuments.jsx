import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

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

// Helper function to format date/time for display
const formatDocumentDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const docDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (docDate.getTime() === today.getTime()) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (docDate.getTime() === yesterday.getTime()) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
};

// Helper function to get document type display name
const getDocumentTypeDisplay = (type) => {
  switch(type) {
    case 'follow-up': return 'Follow-up Note';
    case 'admission': return 'Admission Note';
    case 'discharge': return 'Discharge Summary';
    default: return type || 'Clinical Note';
  }
};

// Individual document row component
const DocumentListItem = ({ document, theme, isSelected, onSelect, onView, loadingContent }) => {
  const [isHovered, setIsHovered] = useState(false);
  const styles = getThemeStyles(theme);

  const getStatusColor = (status) => {
    switch (status) {
      case 'finalized': return styles.successColor;
      case 'draft': return styles.warningColor;
      case 'pending': return styles.primaryColor;
      default: return styles.textMuted;
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'finalized': return 'FINALIZED';
      case 'draft': return 'DRAFT';
      case 'pending': return 'PENDING';
      default: return status?.toUpperCase() || 'UNKNOWN';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: `1px solid ${styles.borderColor}`,
        backgroundColor: isSelected ? `${styles.primaryColor}15` : (isHovered ? styles.bgAccent : 'transparent'),
        border: isSelected ? `1px solid ${styles.primaryColor}40` : '1px solid transparent',
        borderRadius: isSelected ? '4px' : '0',
        margin: isSelected ? '2px' : '0',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Checkbox */}
      <div style={{
        marginRight: '12px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(document.id);
          }}
          style={{
            width: '16px',
            height: '16px',
            accentColor: styles.primaryColor,
            cursor: 'pointer'
          }}
        />
      </div>

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
          {document.document_title}
        </div>
        <div style={{
          fontSize: '12px',
          color: styles.textMuted,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{formatDocumentDate(document.finalized_at)}</span>
          <span>•</span>
          <span>{getDocumentTypeDisplay(document.document_type)}</span>
          <span>•</span>
          <span>{document.patient_name}</span>
        </div>
      </div>

      {/* Status Indicator */}
      <div style={{
        fontSize: '11px',
        fontWeight: '500',
        color: getStatusColor(document.status),
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginLeft: '12px',
        marginRight: '12px'
      }}>
        {getStatusDisplay(document.status)}
      </div>

      {/* View Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(document);
        }}
        disabled={loadingContent}
        style={{
          padding: '4px 8px',
          backgroundColor: 'transparent',
          border: `1px solid ${styles.borderColor}`,
          borderRadius: '4px',
          fontSize: '11px',
          color: loadingContent ? styles.textMuted : styles.textPrimary,
          cursor: loadingContent ? 'wait' : 'pointer',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          opacity: loadingContent ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (!loadingContent) {
            e.target.style.backgroundColor = styles.primaryColor;
            e.target.style.color = 'white';
            e.target.style.borderColor = styles.primaryColor;
          }
        }}
        onMouseLeave={(e) => {
          if (!loadingContent) {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = styles.textPrimary;
            e.target.style.borderColor = styles.borderColor;
          }
        }}
      >
        {loadingContent ? '...' : 'View'}
      </button>
    </div>
  );
};

const RecentDocuments = ({ theme }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState('finalized_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('');
  const [currentTheme, setCurrentTheme] = useState(theme || document.documentElement.getAttribute('data-theme') || 'dark');
  const [selectedDocuments, setSelectedDocuments] = useState(new Set());
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingDocuments, setViewingDocuments] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  
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

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        limit: showAll ? '50' : '10',
        sort_by: sortBy,
        sort_order: sortOrder
      });
      
      if (filterType) {
        params.append('document_type', filterType);
      }
      
      const response = await apiService.get(`/api/recent-documents?${params.toString()}`);
      
      if (response.success) {
        setDocuments(response.documents || []);
      } else {
        throw new Error(response.error || 'Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching recent documents:', err);
      setError(err.message);
      // Set empty array on error so UI still renders
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents on mount and when filters change
  useEffect(() => {
    fetchDocuments();
  }, [showAll, sortBy, sortOrder, filterType]);

  // Selection handling functions
  const handleSelectDocument = (documentId) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDocuments.size === displayedDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(displayedDocuments.map(doc => doc.id)));
    }
  };

  const handleViewSelected = async () => {
    const selected = documents.filter(doc => selectedDocuments.has(doc.id));
    if (selected.length > 0) {
      setLoadingContent(true);
      try {
        // Fetch full content for selected documents
        const documentsWithContent = await fetchDocumentContent(selected);
        setViewingDocuments(documentsWithContent);
        setViewModalOpen(true);
      } catch (error) {
        console.error('Error loading documents for viewing:', error);
      } finally {
        setLoadingContent(false);
      }
    }
  };

  const handleViewSingle = async (document) => {
    setLoadingContent(true);
    try {
      // Fetch full content for single document
      const documentsWithContent = await fetchDocumentContent([document]);
      setViewingDocuments(documentsWithContent);
      setViewModalOpen(true);
    } catch (error) {
      console.error('Error loading document for viewing:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  // Fetch full document content for viewing
  const fetchDocumentContent = async (documentsToFetch) => {
    try {
      const documentsWithContent = await Promise.all(
        documentsToFetch.map(async (doc) => {
          // If document already has content, return as-is
          if (doc.document_content) {
            return doc;
          }
          
          // Fetch full document details including content
          try {
            const response = await apiService.get(`/api/recent-documents/${doc.id}`);
            if (response.success && response.document) {
              return response.document;
            } else {
              // If fetch fails, return document with placeholder content
              return { ...doc, document_content: 'Content could not be loaded.' };
            }
          } catch (error) {
            console.error(`Error fetching content for document ${doc.id}:`, error);
            return { ...doc, document_content: 'Error loading content.' };
          }
        })
      );
      
      return documentsWithContent;
    } catch (error) {
      console.error('Error fetching document content:', error);
      // Return original documents with placeholder content
      return documentsToFetch.map(doc => ({ 
        ...doc, 
        document_content: doc.document_content || 'Content could not be loaded.' 
      }));
    }
  };

  const styles = getThemeStyles(currentTheme);
  
  // Display logic for documents
  const displayedDocuments = showAll ? documents : documents.slice(0, 3);
  const hasMoreDocuments = documents.length > 3;

  return (
    <div 
      data-component="recent-documents"
      style={{
        backgroundColor: styles.bgPrimary,
        borderRadius: '8px',
        border: `1px solid ${styles.borderColor}`,
        overflow: 'hidden'
      }}
    >
      
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px 20px',
        borderBottom: `1px solid ${styles.borderColor}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: styles.textPrimary
          }}>
            Recent Documents
          </h3>
          
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {selectedDocuments.size > 0 && (
              <>
                <button
                  onClick={handleViewSelected}
                  disabled={loadingContent}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: loadingContent ? styles.bgAccent : styles.primaryColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: loadingContent ? 'wait' : 'pointer',
                    fontWeight: '500',
                    opacity: loadingContent ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {loadingContent ? 'Loading...' : `View Selected (${selectedDocuments.size})`}
                </button>
                <button
                  onClick={() => setSelectedDocuments(new Set())}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: currentTheme === 'dark' ? '#ffffff' : styles.primaryColor,
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = styles.bgAccent;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Subtitle with retention notice */}
        <div style={{
          fontSize: '13px',
          color: styles.textSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>Finalized documents stored for 7 days within the application</span>
          <RetentionInfoTooltip theme={currentTheme} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            
            {/* Sort dropdown */}
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('_');
                setSortBy(field);
                setSortOrder(order);
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: styles.bgSecondary,
                color: styles.textPrimary,
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="finalized_at_desc">Newest First</option>
              <option value="finalized_at_asc">Oldest First</option>
              <option value="patient_name_asc">Patient A-Z</option>
              <option value="patient_name_desc">Patient Z-A</option>
              <option value="document_type_asc">Type A-Z</option>
            </select>
            
            {/* Type filter dropdown */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '4px 8px',
                backgroundColor: styles.bgSecondary,
                color: styles.textPrimary,
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="">All Types</option>
              <option value="follow-up">Follow-up</option>
              <option value="admission">Admission</option>
              <option value="discharge">Discharge</option>
            </select>
          </div>
        </div>
        
        <div style={{
          fontSize: '12px',
          color: styles.textMuted,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Select All checkbox when documents are available */}
            {!loading && !error && displayedDocuments.length > 0 && (
              <>
                <input
                  type="checkbox"
                  checked={selectedDocuments.size === displayedDocuments.length && displayedDocuments.length > 0}
                  onChange={handleSelectAll}
                  style={{
                    width: '14px',
                    height: '14px',
                    accentColor: styles.primaryColor,
                    cursor: 'pointer'
                  }}
                />
                <span>Select All</span>
                <span>•</span>
              </>
            )}
            <span>
              {loading ? 'Loading...' : error ? 'Error loading documents' : 
               selectedDocuments.size > 0 ? 
               `${selectedDocuments.size} selected • ${showAll ? documents.length : Math.min(3, documents.length)} of ${documents.length} documents` :
               `${showAll ? documents.length : Math.min(3, documents.length)} of ${documents.length} documents`}
            </span>
          </div>
          {!loading && !error && documents.length > 0 && (
            <button
              onClick={() => fetchDocuments()}
              style={{
                padding: '2px 6px',
                backgroundColor: 'transparent',
                color: styles.textMuted,
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Document List */}
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        {loading ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: styles.textMuted
          }}>
            <div style={{ fontSize: '14px' }}>Loading documents...</div>
          </div>
        ) : error ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: styles.errorColor
          }}>
            <div style={{ fontSize: '14px' }}>Error loading documents</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {error}
            </div>
            <button
              onClick={() => fetchDocuments()}
              style={{
                marginTop: '12px',
                padding: '6px 12px',
                backgroundColor: styles.primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : displayedDocuments.length > 0 ? (
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            {displayedDocuments.map(document => (
              <DocumentListItem
                key={document.id}
                document={document}
                theme={currentTheme}
                isSelected={selectedDocuments.has(document.id)}
                onSelect={handleSelectDocument}
                onView={handleViewSingle}
                loadingContent={loadingContent}
              />
            ))}
          </div>
            
          {/* More button */}
          {hasMoreDocuments && !showAll && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowAll(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: currentTheme === 'dark' ? '#ffffff' : styles.primaryColor,
                  border: `1px solid ${styles.borderColor}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.bgAccent;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                Show {documents.length - 3} more documents
              </button>
            </div>
          )}
          
          {/* Show less button when all are displayed */}
          {showAll && hasMoreDocuments && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowAll(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: currentTheme === 'dark' ? '#ffffff' : styles.primaryColor,
                  border: `1px solid ${styles.borderColor}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.bgAccent;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                Show less
              </button>
            </div>
          )}
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: styles.textMuted
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.6 }}>📄</div>
            <div style={{ fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>
              {filterType ? `No ${getDocumentTypeDisplay(filterType).toLowerCase()} documents found` : 'No recent documents'}
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              Finalized documents will appear here after being saved during document generation
            </div>
          </div>
        )}
      </div>

      {/* View Documents Modal */}
      {viewModalOpen && (
        <ViewDocumentsModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setViewingDocuments([]);
            setLoadingContent(false);
          }}
          documents={viewingDocuments}
          theme={currentTheme}
        />
      )}
    </div>
  );
};

// Retention Information Tooltip Component
const RetentionInfoTooltip = ({ theme }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const styles = getThemeStyles(theme);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onClick={() => setShowTooltip(!showTooltip)}
        style={{
          fontSize: '14px',
          color: styles.primaryColor,
          cursor: 'pointer',
          userSelect: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: `1px solid ${styles.primaryColor}`,
          fontWeight: 'bold',
          transition: 'all 0.2s ease'
        }}
        onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
        title="Click for more information about document retention"
      >
        ?
      </span>
      
      {showTooltip && (
        <>
          {/* Modal overlay */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 9998
          }} onClick={() => setShowTooltip(false)} />
          
          {/* Tooltip modal */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            minWidth: '340px',
            maxWidth: '420px',
            backgroundColor: styles.bgPrimary,
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            fontSize: '13px',
            lineHeight: '1.4'
          }}>
            {/* Header with close button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px'
            }}>
              <div style={{
                fontWeight: '600',
                color: styles.textPrimary,
                fontSize: '16px'
              }}>
                7-Day Document Retention Policy
              </div>
              <button
                onClick={() => setShowTooltip(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: styles.textMuted,
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1',
                  marginLeft: '12px'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              color: styles.textSecondary,
              marginBottom: '16px'
            }}>
              Documents are automatically stored within MeDocPro for 7 days after finalization to provide quick access for review and reference. This temporary storage helps maintain application performance and manages data efficiently.
            </div>
            
            <div style={{
              fontWeight: '500',
              color: styles.textPrimary,
              marginBottom: '8px'
            }}>
              Long-term Storage Options:
            </div>
            
            <ul style={{
              margin: 0,
              paddingLeft: '16px',
              color: styles.textSecondary,
              marginBottom: '16px'
            }}>
              <li style={{ marginBottom: '6px' }}>
                <strong>Individual Download:</strong> Click "View" on any document, then save/print from your browser
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Bulk Export:</strong> Select multiple documents and use "View Selected" to review before saving
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>ZIP Backup:</strong> Use the document generation preview modal's "Download Files" button to export all documents as a ZIP file
              </li>
            </ul>
            
            <div style={{
              padding: '12px',
              backgroundColor: styles.bgSecondary,
              borderRadius: '6px',
              fontSize: '12px',
              color: styles.textMuted,
              fontStyle: 'italic',
              lineHeight: '1.4'
            }}>
              💡 <strong>Tip:</strong> Create regular ZIP backups of important documents to your preferred storage location (local drive, cloud storage, etc.) for permanent retention beyond the 7-day period.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// View Documents Modal Component (Read-only)
const ViewDocumentsModal = ({ isOpen, onClose, documents, theme }) => {
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
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

  // Reset to first document when documents change
  useEffect(() => {
    setCurrentDocIndex(0);
  }, [documents]);

  if (!isOpen || !documents || documents.length === 0) return null;

  const currentDoc = documents[currentDocIndex];

  const goToPrevious = () => {
    setCurrentDocIndex(prev => (prev > 0 ? prev - 1 : documents.length - 1));
  };

  const goToNext = () => {
    setCurrentDocIndex(prev => (prev < documents.length - 1 ? prev + 1 : 0));
  };

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
        maxWidth: '1000px',
        maxHeight: '90vh',
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
              View Documents
            </h2>
            <div style={{
              fontSize: '14px',
              color: styles.textSecondary
            }}>
              {documents.length} finalized document(s) • Read-only view
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

        {/* Document tabs when multiple documents */}
        {documents.length > 1 && (
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            backgroundColor: styles.bgSecondary,
            borderBottom: `1px solid ${styles.borderColor}`,
            padding: '0 20px'
          }}>
            {documents.map((doc, index) => (
              <button
                key={doc.id}
                onClick={() => setCurrentDocIndex(index)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: currentDocIndex === index ? styles.bgPrimary : 'transparent',
                  border: 'none',
                  borderBottom: currentDocIndex === index ? `2px solid ${styles.primaryColor}` : '2px solid transparent',
                  fontSize: '12px',
                  color: currentDocIndex === index ? styles.textPrimary : styles.textMuted,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: currentDocIndex === index ? '500' : 'normal',
                  minWidth: '120px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                {doc.patient_name}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {/* Document info header */}
          <div style={{
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: `1px solid ${styles.borderColor}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px'
            }}>
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '600',
                  color: styles.textPrimary,
                  marginBottom: '4px'
                }}>
                  {currentDoc.document_title}
                </h3>
                <div style={{
                  fontSize: '14px',
                  color: styles.textSecondary,
                  marginBottom: '8px'
                }}>
                  {currentDoc.patient_name} • Room {currentDoc.room_number || 'N/A'}
                </div>
              </div>

              {/* Navigation when multiple documents */}
              {documents.length > 1 && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={goToPrevious}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: styles.bgSecondary,
                      border: `1px solid ${styles.borderColor}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: styles.textPrimary,
                      fontWeight: '500'
                    }}
                  >
                    ← Previous
                  </button>
                  
                  <span style={{
                    fontSize: '12px',
                    color: styles.textMuted,
                    fontWeight: '500'
                  }}>
                    {currentDocIndex + 1} of {documents.length}
                  </span>
                  
                  <button
                    onClick={goToNext}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: styles.bgSecondary,
                      border: `1px solid ${styles.borderColor}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: styles.textPrimary,
                      fontWeight: '500'
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
            
            <div style={{
              fontSize: '12px',
              color: styles.textMuted,
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <span>Type: {getDocumentTypeDisplay(currentDoc.document_type)}</span>
              <span>Date: {formatDocumentDate(currentDoc.finalized_at)}</span>
              <span>Status: {currentDoc.status?.toUpperCase() || 'FINALIZED'}</span>
              {currentDoc.template_name && <span>Template: {currentDoc.template_name}</span>}
            </div>
          </div>

          {/* Document content (read-only) */}
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            lineHeight: '1.6',
            color: styles.textPrimary,
            whiteSpace: 'pre-wrap',
            backgroundColor: styles.bgSecondary,
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '4px',
            padding: '16px',
            minHeight: '300px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {currentDoc.document_content || 'No content available'}
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
            Viewing {documents.length} finalized document(s) • Read-only mode
          </div>
          
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: styles.primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentDocuments;