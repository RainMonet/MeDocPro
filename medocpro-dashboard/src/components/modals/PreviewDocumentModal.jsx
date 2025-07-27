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
    { value: 'individual', label: 'Individual Files', description: 'One .doc file per patient' },
    { value: 'combined', label: 'Combined File', description: 'All notes in one .doc file' },
    { value: 'pdf', label: 'PDF Export', description: 'Formatted PDF documents' }
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
        Output Format
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
const DocumentPreview = ({ 
  documents, 
  theme, 
  editedDocuments, 
  setEditedDocuments, 
  finalizedDocuments, 
  isEditMode, 
  setIsEditMode, 
  selectedDoc, 
  setSelectedDoc, 
  handleIndividualFinalize, 
  isFinalizing 
}) => {
  const styles = getThemeStyles(theme);

  if (!documents || documents.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: styles.textMuted
      }}>
        <div style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '500' }}>No documents to preview</div>
      </div>
    );
  }

  const currentDoc = documents[selectedDoc];

  // Navigation functions
  const goToPrevious = () => {
    setSelectedDoc(prev => prev > 0 ? prev - 1 : documents.length - 1);
  };

  const goToNext = () => {
    setSelectedDoc(prev => prev < documents.length - 1 ? prev + 1 : 0);
  };

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
          borderBottom: `1px solid ${styles.borderColor}`,
          scrollbarWidth: 'thin',
          scrollbarColor: `${styles.borderColor} ${styles.bgSecondary}`,
          // Custom scrollbar for webkit browsers
          '&::-webkit-scrollbar': {
            height: '6px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: styles.bgSecondary
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: styles.borderColor,
            borderRadius: '3px'
          }
        }}>
          {documents.map((doc, index) => (
            <button
              key={index}
              onClick={() => setSelectedDoc(index)}
              style={{
                padding: '12px 20px',
                backgroundColor: selectedDoc === index ? styles.bgPrimary : 'transparent',
                border: 'none',
                borderBottom: selectedDoc === index ? `2px solid ${styles.primaryColor}` : '2px solid transparent',
                fontSize: '12px',
                color: selectedDoc === index ? styles.textPrimary : styles.textMuted,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: selectedDoc === index ? '500' : 'normal',
                minWidth: '120px',
                maxWidth: '200px',
                flexShrink: 0,
                textAlign: 'center',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                borderRight: `1px solid ${styles.borderColor}40`
              }}
              onMouseEnter={(e) => {
                if (selectedDoc !== index) {
                  e.target.style.backgroundColor = `${styles.bgAccent}80`;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedDoc !== index) {
                  e.target.style.backgroundColor = 'transparent';
                }
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: styles.textPrimary
            }}>
              {currentDoc.template_name} - {currentDoc.patient_name}
            </div>
            
            {/* Navigation buttons */}
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
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = styles.bgAccent;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = styles.bgSecondary;
                  }}
                >
                  ← Previous
                </button>
                
                <span style={{
                  fontSize: '12px',
                  color: styles.textMuted,
                  fontWeight: '500'
                }}>
                  {selectedDoc + 1} of {documents.length}
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
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = styles.bgAccent;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = styles.bgSecondary;
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
            gap: '12px'
          }}>
            <span>Room: {currentDoc.room_number || 'N/A'}</span>
            {currentDoc.ai_enhanced && <span>AI Enhanced</span>}
            <span>Status: {currentDoc.status || 'Generated'}</span>
            {currentDoc.format && <span>Format: {currentDoc.format.toUpperCase()}</span>}
          </div>
        </div>

        {/* Document editing and finalization controls */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setIsEditMode(prev => ({ ...prev, [selectedDoc]: !prev[selectedDoc] }))}
            style={{
              padding: '6px 12px',
              backgroundColor: isEditMode[selectedDoc] ? styles.primaryColor : styles.bgSecondary,
              color: isEditMode[selectedDoc] ? 'white' : styles.textPrimary,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {isEditMode[selectedDoc] ? 'Done Editing' : 'Edit Document'}
          </button>
          
          <button
            onClick={() => handleIndividualFinalize(selectedDoc)}
            disabled={isFinalizing || finalizedDocuments[selectedDoc]}
            style={{
              padding: '6px 12px',
              backgroundColor: finalizedDocuments[selectedDoc] ? styles.successColor : styles.primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: (isFinalizing || finalizedDocuments[selectedDoc]) ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: (isFinalizing || finalizedDocuments[selectedDoc]) ? 0.6 : 1
            }}
          >
            {finalizedDocuments[selectedDoc] ? '✓ Finalized' : 
             isFinalizing ? 'Finalizing...' : 'Finalize This Document'}
          </button>
          
          {isEditMode[selectedDoc] && (
            <span style={{
              fontSize: '11px',
              color: styles.textMuted,
              fontStyle: 'italic'
            }}>
              Click "Done Editing" to save changes
            </span>
          )}
        </div>

        {/* Document content - editable or read-only */}
        {isEditMode[selectedDoc] ? (
          <textarea
            value={editedDocuments[selectedDoc] || ''}
            onChange={(e) => setEditedDocuments(prev => ({
              ...prev,
              [selectedDoc]: e.target.value
            }))}
            style={{
              width: '100%',
              minHeight: '300px',
              maxHeight: '400px',
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              lineHeight: '1.6',
              color: styles.textPrimary,
              backgroundColor: styles.bgSecondary,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '4px',
              padding: '12px',
              resize: 'vertical',
              outline: 'none'
            }}
            placeholder="Enter document content..."
          />
        ) : (
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            lineHeight: '1.6',
            color: styles.textPrimary,
            whiteSpace: 'pre-wrap',
            backgroundColor: styles.bgSecondary,
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '4px',
            padding: '12px',
            minHeight: '300px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {editedDocuments[selectedDoc] || currentDoc.populated_content || currentDoc.content || 'No content available'}
          </div>
        )}
      </div>
    </div>
  );
};

// Export options component
const ExportOptions = ({ onExport, onFinalize, isExporting, isFinalizing, theme, finalizedCount, totalDocuments, allFinalized }) => {
  const styles = getThemeStyles(theme);

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end'
    }}>
      <button
        onClick={() => onFinalize()}
        disabled={isExporting || isFinalizing || allFinalized}
        style={{
          padding: '10px 20px',
          backgroundColor: allFinalized ? styles.successColor : (finalizedCount > 0 ? styles.warningColor : styles.successColor),
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: (isExporting || isFinalizing || allFinalized) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: (isExporting || isFinalizing || allFinalized) ? 0.6 : 1
        }}
      >
        {isFinalizing ? (
          <>
            <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
            Finalizing...
          </>
        ) : allFinalized ? (
          `✓ All ${totalDocuments} Documents Finalized`
        ) : finalizedCount > 0 ? (
          `Finalize Remaining (${totalDocuments - finalizedCount})`
        ) : (
          '✓ Finalize All Documents'
        )}
      </button>
      
      <button
        onClick={() => onExport('download')}
        disabled={isExporting || isFinalizing}
        style={{
          padding: '10px 20px',
          backgroundColor: styles.primaryColor,
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: (isExporting || isFinalizing) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: (isExporting || isFinalizing) ? 0.6 : 1
        }}
      >
        {isExporting ? (
          <>
            <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
            Exporting...
          </>
        ) : (
          'Download Files'
        )}
      </button>

      <button
        onClick={() => onExport('email')}
        disabled={isExporting || isFinalizing}
        style={{
          padding: '10px 20px',
          backgroundColor: 'transparent',
          color: styles.textSecondary,
          border: `1px solid ${styles.borderColor}`,
          borderRadius: '6px',
          fontSize: '14px',
          cursor: (isExporting || isFinalizing) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: (isExporting || isFinalizing) ? 0.6 : 1
        }}
      >
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
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [editedDocuments, setEditedDocuments] = useState({});
  const [finalizedDocuments, setFinalizedDocuments] = useState({});
  const [isEditMode, setIsEditMode] = useState({});
  const [selectedDoc, setSelectedDoc] = useState(0);
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

  // Initialize edited documents state when documents change
  useEffect(() => {
    if (documents.length > 0) {
      const initialEdited = {};
      documents.forEach((doc, index) => {
        initialEdited[index] = doc.populated_content || doc.content || '';
      });
      setEditedDocuments(initialEdited);
      setSelectedDoc(0);
      setFinalizedDocuments({});
      setIsEditMode({});
    }
  }, [documents]);

  // Handle export
  const handleExport = async (exportType) => {
    setIsExporting(true);
    try {
      if (exportType === 'download') {
        // Get authentication token
        const token = localStorage.getItem('token');
        if (!token) {
          alert('❌ Authentication required. Please log in again.');
          return;
        }

        // Prepare download URL with documents data
        const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const documentsParam = encodeURIComponent(JSON.stringify(documents));
        const downloadUrl = `${apiBaseURL}/api/generate-documents/${batchInfo.batchId || 'unknown'}/download?format=${outputFormat}&documents=${documentsParam}`;
        
        console.log('Starting document download...', {
          batchId: batchInfo.batchId,
          format: outputFormat,
          documentCount: documents.length
        });

        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        
        // Add authorization header by fetching the file and creating a blob URL
        try {
          const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `Download failed: ${response.status}`);
          }

          // Get the filename from Content-Disposition header or use default
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `batch_documents_${batchInfo.batchId || 'export'}_${outputFormat}.zip`;
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch) {
              filename = filenameMatch[1].replace(/['"]/g, '');
            }
          }

          // Create blob and download
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Create and click download link
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = filename;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          // Clean up blob URL
          window.URL.revokeObjectURL(blobUrl);
          
          alert(`✅ Documents downloaded successfully!\nFormat: ${outputFormat}\nTotal files: ${documents.length}\nFilename: ${filename}`);
          
        } catch (fetchError) {
          console.error('Download fetch error:', fetchError);
          throw fetchError;
        }
        
      } else if (exportType === 'email') {
        // Email functionality - to be implemented
        alert(`📧 Email functionality coming soon!\n\nFor now, please use the download option and send the files manually.\nRecipients would receive ${documents.length} document(s).`);
      }
      
      // Close modal after successful export
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Unknown error occurred';
      if (errorMessage.includes('Authentication') || errorMessage.includes('401')) {
        alert('❌ Authentication expired. Please log in again and try the export.');
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        alert('❌ Network error. Please check your connection and try again.');
      } else {
        alert(`❌ Export failed: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to get document data for finalization
  const getDocumentData = (doc, index) => {
    return {
      patient_census_row_id: doc.patient_census_row_id || doc.patient_id,
      document_title: doc.title || doc.template_name || `Document for ${doc.patient_name || 'Unknown Patient'}`,
      document_content: editedDocuments[index] || doc.populated_content || doc.content || '',
      document_type: doc.workflow_type || doc.patient_workflow_type || doc.document_type || 'follow-up',
      template_id: doc.template_id || null,
      document_format: 'text',
      document_date: new Date().toISOString().split('T')[0],
      metadata: {
        batch_id: batchInfo.batchId,
        generated_at: new Date().toISOString(),
        original_format: doc.format || 'text',
        edited: editedDocuments[index] !== (doc.populated_content || doc.content)
      }
    };
  };

  // Handle individual document finalization
  const handleIndividualFinalize = async (docIndex) => {
    const doc = documents[docIndex];
    if (!doc) return;

    try {
      setIsFinalizing(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('❌ Authentication required. Please log in again.');
        return;
      }

      const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const finalizeData = getDocumentData(doc, docIndex);

      console.log('Finalizing individual document:', finalizeData);

      const response = await fetch(`${apiBaseURL}/api/finalize-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalizeData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Finalization failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Document finalized for ${doc.patient_name}:`, result);

      // Mark document as finalized
      setFinalizedDocuments(prev => ({
        ...prev,
        [docIndex]: result.document
      }));

      alert(`✅ Document finalized for ${doc.patient_name}!\n\nThe document is now saved and will be available for 7 days for backup download.`);

    } catch (error) {
      console.error('Individual finalization error:', error);
      alert(`❌ Failed to finalize document for ${doc.patient_name}: ${error.message}`);
    } finally {
      setIsFinalizing(false);
    }
  };

  // Handle bulk document finalization
  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        alert('❌ Authentication required. Please log in again.');
        return;
      }

      const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      console.log('Starting document finalization...', {
        batchId: batchInfo.batchId,
        documentCount: documents.length
      });

      // Finalize each document that hasn't been finalized yet
      for (let index = 0; index < documents.length; index++) {
        const doc = documents[index];
        
        // Skip if already finalized
        if (finalizedDocuments[index]) {
          successCount++;
          continue;
        }
        
        try {
          const finalizeData = getDocumentData(doc, index);

          const response = await fetch(`${apiBaseURL}/api/finalize-document`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(finalizeData)
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `Finalization failed: ${response.status}`);
          }

          const result = await response.json();
          console.log(`Document finalized for ${doc.patient_name}:`, result);
          
          // Mark document as finalized
          setFinalizedDocuments(prev => ({
            ...prev,
            [index]: result.document
          }));
          
          successCount++;

        } catch (docError) {
          console.error(`Error finalizing document for ${doc.patient_name}:`, docError);
          errorCount++;
          errors.push(`${doc.patient_name}: ${docError.message}`);
        }
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        alert(`✅ All ${successCount} documents finalized successfully!\n\nDocuments are now saved in your Recent Documents and will be available for 7 days for backup download.`);
        onClose(); // Close modal on complete success
      } else if (successCount > 0 && errorCount > 0) {
        alert(`⚠️ Finalization completed with some issues:\n\n✅ Successfully finalized: ${successCount} documents\n❌ Failed: ${errorCount} documents\n\nErrors:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`);
      } else {
        alert(`❌ Document finalization failed!\n\nAll ${errorCount} documents encountered errors:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}\n\nPlease try again or contact support.`);
      }

    } catch (error) {
      console.error('Finalization error:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Unknown error occurred';
      if (errorMessage.includes('Authentication') || errorMessage.includes('401')) {
        alert('❌ Authentication expired. Please log in again and try the finalization.');
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        alert('❌ Network error. Please check your connection and try again.');
      } else {
        alert(`❌ Finalization failed: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
      }
    } finally {
      setIsFinalizing(false);
    }
  };

  // Helper to get current document
  const currentDoc = documents[selectedDoc] || documents[0] || {};
  
  // Get finalization status
  const totalDocuments = documents.length;
  const finalizedCount = Object.keys(finalizedDocuments).length;
  const allFinalized = totalDocuments > 0 && finalizedCount === totalDocuments;

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
              Document Preview & Export
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
              Document Preview
            </label>
            <DocumentPreview 
              documents={documents} 
              theme={currentTheme}
              editedDocuments={editedDocuments}
              setEditedDocuments={setEditedDocuments}
              finalizedDocuments={finalizedDocuments}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
              selectedDoc={selectedDoc}
              setSelectedDoc={setSelectedDoc}
              handleIndividualFinalize={handleIndividualFinalize}
              isFinalizing={isFinalizing}
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
              onFinalize={handleFinalize}
              isExporting={isExporting}
              isFinalizing={isFinalizing}
              theme={currentTheme}
              finalizedCount={finalizedCount}
              totalDocuments={totalDocuments}
              allFinalized={allFinalized}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewDocumentModal;