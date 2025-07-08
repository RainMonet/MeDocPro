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
  successColor: theme === 'dark' ? '#10b981' : '#6b8e23',
  warningColor: theme === 'dark' ? '#f59e0b' : '#cd853f',
  errorColor: theme === 'dark' ? '#ef4444' : '#a0522d',
  primaryColor: theme === 'dark' ? '#3b82f6' : '#8b4513'
});

// Template selection component
const TemplateSelector = ({ onSelect, theme }) => {
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const styles = getThemeStyles(currentTheme);

  // Listen for theme changes
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setCurrentTheme(newTheme);
    };

    // Update theme on mount
    updateTheme();

    // Listen for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);
  
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load user's top 4 most used templates
  useEffect(() => {
    const loadUserTemplates = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/templates/top-used', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        } else {
          console.error('Failed to load user templates');
          // Fallback to default templates with usage counts
          setTemplates([
            { id: 1, name: 'Progress Note', category: 'progress', usage_count: 45 },
            { id: 2, name: 'Assessment', category: 'assessment', usage_count: 32 },
            { id: 3, name: 'Treatment Plan', category: 'treatment', usage_count: 28 },
            { id: 4, name: 'Discharge Summary', category: 'discharge', usage_count: 15 }
          ]);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        // Fallback to default templates with usage counts
        setTemplates([
          { id: 1, name: 'Progress Note', category: 'progress', usage_count: 45 },
          { id: 2, name: 'Assessment', category: 'assessment', usage_count: 32 },
          { id: 3, name: 'Treatment Plan', category: 'treatment', usage_count: 28 },
          { id: 4, name: 'Discharge Summary', category: 'discharge', usage_count: 15 }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserTemplates();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        marginBottom: '16px'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              padding: '12px',
              backgroundColor: styles.bgSecondary,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: 0.6
            }}
          >
            <div style={{ textAlign: 'left', width: '100%' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '500',
                color: styles.textMuted
              }}>
                Loading...
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px',
      marginBottom: '16px'
    }}>
      {templates.map(template => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          style={{
            padding: '12px',
            backgroundColor: hoveredTemplate === template.id ? styles.bgAccent : styles.bgSecondary,
            border: `1px solid ${hoveredTemplate === template.id ? styles.primaryColor : styles.borderColor}`,
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            color: styles.textPrimary
          }}
          onMouseEnter={() => setHoveredTemplate(template.id)}
          onMouseLeave={() => setHoveredTemplate(null)}
        >
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '500',
              color: styles.textPrimary
            }}>
              {template.name}
            </div>
            <div style={{
              fontSize: '11px',
              color: styles.textMuted,
              textTransform: 'capitalize',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{template.category}</span>
              <span style={{ 
                fontSize: '10px',
                color: styles.textMuted,
                fontWeight: '600'
              }}>
                {template.usage_count ? `${template.usage_count} uses` : 'New'}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

// Export format selector
const ExportFormatSelector = ({ value, onChange, theme }) => {
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [hoveredFormat, setHoveredFormat] = useState(null);
  const styles = getThemeStyles(currentTheme);

  // Listen for theme changes
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setCurrentTheme(newTheme);
    };

    // Update theme on mount
    updateTheme();

    // Listen for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);
  const formats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'Word' },
    { value: 'txt', label: 'Text' }
  ];

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: '500',
        color: styles.textSecondary,
        marginBottom: '6px'
      }}>
        Export Format
      </label>
      <div style={{
        display: 'flex',
        gap: '6px'
      }}>
        {formats.map(format => (
          <button
            key={format.value}
            onClick={() => onChange(format.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: value === format.value ? styles.primaryColor : 
                             (hoveredFormat === format.value ? styles.bgAccent : styles.bgSecondary),
              color: value === format.value ? 'white' : styles.textSecondary,
              border: `1px solid ${value === format.value ? styles.primaryColor : styles.borderColor}`,
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={() => {
              if (value !== format.value) {
                setHoveredFormat(format.value);
              }
            }}
            onMouseLeave={() => {
              if (value !== format.value) {
                setHoveredFormat(null);
              }
            }}
          >
            {format.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Batch Documentation Generation Card
const BatchDocumentationCard = ({ 
  selectedPatients = [], 
  onGenerate, 
  theme = 'dark',
  onOpenTemplateEditor,
  onOpenTemplateLibrary 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [aiEnhancement, setAiEnhancement] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);
  
  const styles = getThemeStyles(currentTheme);

  // Listen for theme changes
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setCurrentTheme(newTheme);
    };

    // Update theme on mount
    updateTheme();

    // Listen for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  // Handle document generation
  const handleGenerate = async () => {
    if (!selectedTemplate || selectedPatients.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      // Call backend API for document generation
      const response = await fetch('http://localhost:5001/api/generate-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          patients: selectedPatients,
          exportFormat,
          aiEnhancement
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Call parent handler with generated documents
          if (onGenerate) {
            onGenerate({
              template: selectedTemplate,
              patients: selectedPatients,
              exportFormat,
              aiEnhancement,
              documents: result.documents,
              batchId: result.batch_id,
              totalCount: result.total_count
            });
          }
        } else {
          throw new Error(result.message || 'Failed to generate documents');
        }
      } else {
        throw new Error('Network error');
      }
    } catch (error) {
      console.error('Error generating documents:', error);
      alert('❌ Error generating documents. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset when patients change
  useEffect(() => {
    if (selectedPatients.length === 0) {
      setSelectedTemplate(null);
    }
  }, [selectedPatients]);

  return (
    <div 
      data-component="batch-documentation"
      style={{
        backgroundColor: styles.bgPrimary,
        borderRadius: '8px',
        border: `1px solid ${styles.borderColor}`,
        overflow: 'hidden'
      }}>
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
            Batch Documentation
          </h3>
          <button
            onClick={onOpenTemplateEditor}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              color: styles.textSecondary,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            New Template
          </button>
        </div>
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: styles.textSecondary
        }}>
          Generate documents for {selectedPatients.length} selected patient{selectedPatients.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {selectedPatients.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: styles.textMuted
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👆</div>
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>
              Select patients from the census
            </div>
            <div style={{ fontSize: '12px' }}>
              Choose patients to generate documents for
            </div>
          </div>
        ) : (
          <div>
            {/* Template Selection */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: styles.textSecondary
                }}>
                  Select Template
                </label>
                <button
                  onClick={() => {
                    if (onOpenTemplateLibrary) {
                      onOpenTemplateLibrary();
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    color: currentTheme === 'dark' ? '#ffffff' : styles.primaryColor,
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '4px',
                    fontSize: '11px',
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
                  Template Library
                </button>
              </div>
              <TemplateSelector 
                onSelect={handleTemplateSelect}
                theme={currentTheme}
              />
              {selectedTemplate && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: `${styles.successColor}15`,
                  border: `1px solid ${styles.successColor}30`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: styles.successColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  Selected: {selectedTemplate.name}
                </div>
              )}
            </div>

            {/* Export Format */}
            <ExportFormatSelector
              value={exportFormat}
              onChange={setExportFormat}
              theme={currentTheme}
            />

            {/* AI Enhancement Toggle */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: styles.bgSecondary,
              borderRadius: '6px',
              border: `1px solid ${styles.borderColor}`
            }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: styles.textPrimary
                }}>
                  AI Enhancement
                </div>
                <div style={{
                  fontSize: '11px',
                  color: styles.textMuted
                }}>
                  Improve language and clinical terminology
                </div>
              </div>
              <button
                onClick={() => setAiEnhancement(!aiEnhancement)}
                style={{
                  width: '40px',
                  height: '20px',
                  backgroundColor: aiEnhancement ? styles.successColor : styles.bgAccent,
                  border: 'none',
                  borderRadius: '10px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: aiEnhancement ? '22px' : '2px',
                  transition: 'all 0.2s ease'
                }} />
              </button>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedTemplate || isGenerating}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: selectedTemplate ? styles.primaryColor : styles.bgAccent,
                color: selectedTemplate ? 'white' : styles.textMuted,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: selectedTemplate ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isGenerating ? (
                <>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                  Generating...
                </>
              ) : (
                <>
                  Generate {selectedPatients.length} Document{selectedPatients.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDocumentationCard;