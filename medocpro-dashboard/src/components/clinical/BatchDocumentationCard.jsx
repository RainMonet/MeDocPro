import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

// Custom toggle switch implemented with pure div styling - no CSS conflicts

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
  const [selectedTemplate, setSelectedTemplate] = useState('');
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
  
  // Load all available templates
  useEffect(() => {
    const loadAllTemplates = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No authentication token available, skipping templates load');
          return;
        }
        
        const response = await fetch(`${apiService.baseURL}/api/templates`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Load all templates and sort by name
          const allTemplates = (data.templates || []).sort((a, b) => a.name.localeCompare(b.name));
          setTemplates(allTemplates);
        } else {
          console.error('Failed to load templates');
          // Fallback to default templates (using actual database IDs)
          setTemplates([
            { id: 6, name: 'Daily Progress Note', category: 'progress' },
            { id: 8, name: 'Initial Assessment', category: 'assessment' },
            { id: 9, name: 'Discharge Summary', category: 'discharge' },
            { id: 4, name: 'Progress Note', category: 'progress' },
            { id: 5, name: 'Treatment Plan', category: 'treatment' },
            { id: 6, name: 'Crisis Assessment', category: 'crisis' },
            { id: 7, name: 'Group Therapy Note', category: 'therapy' },
            { id: 8, name: 'Medication Review', category: 'medication' }
          ]);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        // Fallback to default templates
        setTemplates([
          { id: 1, name: 'Assessment', category: 'assessment' },
          { id: 2, name: 'Discharge Summary', category: 'discharge' },
          { id: 3, name: 'Initial Evaluation', category: 'evaluation' },
          { id: 4, name: 'Progress Note', category: 'progress' },
          { id: 5, name: 'Treatment Plan', category: 'treatment' },
          { id: 6, name: 'Crisis Assessment', category: 'crisis' },
          { id: 7, name: 'Group Therapy Note', category: 'therapy' },
          { id: 8, name: 'Medication Review', category: 'medication' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllTemplates();
  }, []);

  const handleTemplateSelect = (event) => {
    const templateId = event.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id.toString() === templateId);
      if (template) {
        onSelect(template);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: styles.textPrimary,
          marginBottom: '8px'
        }}>
          Select Template:
        </label>
        <select
          disabled
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: styles.bgSecondary,
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '8px',
            fontSize: '14px',
            color: styles.textMuted,
            cursor: 'not-allowed'
          }}
        >
          <option>Loading templates...</option>
        </select>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: styles.textPrimary,
        marginBottom: '8px'
      }}>
        Select Template:
      </label>
      <select
        value={selectedTemplate}
        onChange={handleTemplateSelect}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: styles.bgSecondary,
          border: `1px solid ${selectedTemplate ? styles.primaryColor : styles.borderColor}`,
          borderRadius: '8px',
          fontSize: '14px',
          color: styles.textPrimary,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${encodeURIComponent(styles.textMuted)}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
      >
        <option value="">Choose a template...</option>
        {templates.map(template => (
          <option key={template.id} value={template.id}>
            {template.name} ({template.category})
          </option>
        ))}
      </select>
      {selectedTemplate && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: styles.bgAccent,
          border: `1px solid ${styles.primaryColor}`,
          borderRadius: '6px',
          fontSize: '12px',
          color: styles.textSecondary
        }}>
          ✓ Selected: {templates.find(t => t.id.toString() === selectedTemplate)?.name}
        </div>
      )}
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
  const [aiEnhancementAvailable, setAiEnhancementAvailable] = useState(true);
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);
  
  // Progress tracking state
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [progressStatus, setProgressStatus] = useState('');
  const [documents, setDocuments] = useState([]);
  const [abortController, setAbortController] = useState(null);
  
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

  // Handle document generation with progress simulation
  const handleGenerate = async () => {
    if (!selectedTemplate || selectedPatients.length === 0) {
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: selectedPatients.length });
    setProgressStatus('Initializing...');
    setDocuments([]);
    
    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);
    
    // Progress simulation function
    const simulateProgress = () => {
      let currentStep = 0;
      const totalSteps = selectedPatients.length;
      const stepNames = [
        'Loading patient data...',
        'Applying template...',
        aiEnhancement ? 'Enhancing with AI...' : 'Processing content...',
        'Generating document...',
        'Finalizing...'
      ];
      
      const progressInterval = setInterval(() => {
        if (currentStep < totalSteps) {
          currentStep += 0.2; // Slower, more realistic progress
          const wholeSteps = Math.floor(currentStep);
          const stepProgress = currentStep - wholeSteps;
          
          // Determine current step name based on progress
          let statusIndex = Math.min(Math.floor(stepProgress * stepNames.length), stepNames.length - 1);
          let patientName = selectedPatients[Math.min(wholeSteps, selectedPatients.length - 1)]?.patient_name || 'Patient';
          
          setProgress({ 
            current: Math.min(currentStep, totalSteps), 
            total: totalSteps 
          });
          setProgressStatus(`${stepNames[statusIndex]} (${patientName})`);
        }
      }, 300); // Update every 300ms for smooth progress
      
      return progressInterval;
    };
    
    // Start progress simulation
    const progressInterval = simulateProgress();
    
    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        alert('❌ Authentication required. Please log in again.');
        return;
      }

      // Get AI settings for compute mode
      const aiSettings = JSON.parse(localStorage.getItem('aiAssistantSettings') || '{}');
      const computeMode = aiSettings.computeMode || 'cpu';
      
      console.log(`🚀 Starting batch document generation with ${computeMode.toUpperCase()} mode`);
      
      // Set status to preparing
      setProgressStatus('Connecting to AI services...');
      
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 180000); // 3 minute timeout for multiple documents
      
      const response = await apiService.post('/api/generate-documents', {
        template: selectedTemplate,
        patients: selectedPatients,
        exportFormat,
        aiEnhancement,
        computeMode
      });
      
      clearTimeout(timeoutId);
      clearInterval(progressInterval);

      // Complete progress and show completion status
      setProgress({ current: selectedPatients.length, total: selectedPatients.length });
      setProgressStatus('Processing results...');

      const finalResult = response;
      console.log('🎉 Generation completed:', finalResult);
      
      if (finalResult.ai_enhancement_used) {
        console.log(`✅ AI Enhancement Success: Used ${computeMode.toUpperCase()} mode for ${finalResult.successful_count} documents`);
      } else if (finalResult.ai_enhancement_disabled) {
        console.log('⚠️ AI Enhancement was disabled due to recent failures');
      }

      if (finalResult && finalResult.success) {
        // Complete progress bar
        setProgressStatus('Generation complete!');
        
        // Short delay to show completion
        setTimeout(() => {
          // Show success message with details
          const { successful_count, failed_count, failed_patients } = finalResult;
          let message = `✅ Generated ${successful_count} document${successful_count !== 1 ? 's' : ''} successfully!`;
          
          // Show warning if AI enhancement was requested but disabled
          if (aiEnhancement && finalResult.ai_enhancement_disabled) {
            message += `\n\n⚠️ Note: AI enhancement is temporarily disabled due to recent failures. Documents generated without AI enhancement.`;
          } else if (aiEnhancement && !finalResult.ai_enhancement_used) {
            message += `\n\n⚠️ Note: AI enhancement was requested but not applied. Check server logs for details.`;
          }
          
          if (failed_count > 0) {
            message += `\n\n⚠️ ${failed_count} patient${failed_count !== 1 ? 's' : ''} failed:`;
            failed_patients.forEach(failure => {
              message += `\n• ${failure.patient_name}: ${failure.error}`;
            });
          }
          
          alert(message);
          
          // Call parent handler with generated documents
          if (onGenerate) {
            onGenerate({
              template: selectedTemplate,
              patients: selectedPatients,
              exportFormat,
              aiEnhancement,
              documents: finalResult.documents,
              batchId: finalResult.batch_id,
              totalCount: finalResult.total_count,
              successfulCount: finalResult.successful_count,
              failedCount: finalResult.failed_count,
              failedPatients: finalResult.failed_patients
            });
          }
        }, 500);
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      clearInterval(progressInterval);
      
      if (error.name === 'AbortError') {
        alert('Document generation was cancelled.');
      } else {
        console.error('Error generating documents:', error);
        // Check if it's a network/backend error
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('Server error')) {
          alert(`❌ Backend connection failed. The server may have restarted. Please try again.`);
        } else {
          alert(`❌ Error generating documents: ${error.message}`);
        }
      }
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsGenerating(false);
        setAbortController(null);
        setProgress({ current: 0, total: 0 });
        setProgressStatus('');
      }, 1000); // Brief delay to show final status
    }
  };

  // Handle cancellation
  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setProgressStatus('Cancelling...');
    }
  };

  // Check AI enhancement status
  const checkAiEnhancementStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${apiService.baseURL}/api/ai-enhancement-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const status = await response.json();
        setAiEnhancementAvailable(status.ai_enhancement_available);
        
        if (status.circuit_breaker_active) {
          const minutesLeft = Math.ceil(status.time_until_retry / 60);
          setAiStatusMessage(`Temporarily disabled (${minutesLeft}m remaining)`);
        } else if (!status.ollama_available) {
          setAiStatusMessage('AI service unavailable');
        } else {
          setAiStatusMessage('');
        }
        
        // Disable AI enhancement if not available
        if (!status.ai_enhancement_available && aiEnhancement) {
          setAiEnhancement(false);
        }
      }
    } catch (error) {
      console.error('Error checking AI enhancement status:', error);
      setAiEnhancementAvailable(false);
      setAiStatusMessage('Status check failed');
    }
  };

  // Check AI enhancement status on mount and when patients change
  useEffect(() => {
    checkAiEnhancementStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkAiEnhancementStatus, 30000);
    return () => clearInterval(interval);
  }, []);

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
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: styles.textPrimary,
          marginBottom: '8px'
        }}>
          Batch Documentation
        </h3>
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
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
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


            {/* AI Enhancement Toggle */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: styles.bgSecondary,
              borderRadius: '8px',
              border: `1px solid ${aiEnhancement && aiEnhancementAvailable ? styles.successColor : styles.borderColor}`,
              opacity: aiEnhancementAvailable ? 1 : 0.6,
              transition: 'all 0.3s ease',
              boxShadow: aiEnhancement && aiEnhancementAvailable ? `0 2px 8px ${styles.successColor}20` : 'none'
            }}>
              <div style={{ flex: 1, paddingRight: '16px' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: styles.textPrimary,
                  lineHeight: '1.4',
                  marginBottom: '4px'
                }}>
                  AI Enhancement {!aiEnhancementAvailable && '(Unavailable)'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: styles.textMuted,
                  lineHeight: '1.4'
                }}>
                  {aiStatusMessage || 'Improve language and clinical terminology'}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {/* Custom toggle switch component */}
                <div 
                  onClick={() => aiEnhancementAvailable && setAiEnhancement(!aiEnhancement)}
                  style={{
                    width: '44px',
                    height: '24px',
                    backgroundColor: aiEnhancement && aiEnhancementAvailable ? styles.successColor : '#64748b',
                    borderRadius: '12px',
                    position: 'relative',
                    cursor: aiEnhancementAvailable ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    opacity: aiEnhancementAvailable ? 1 : 0.5,
                    boxShadow: 'rgba(0, 0, 0, 0.2) 0px 1px 2px inset',
                    transform: 'translateZ(0)' // Force hardware acceleration
                  }}
                >
                  {/* Toggle thumb */}
                  <div 
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: aiEnhancement && aiEnhancementAvailable ? '22px' : '2px',
                      transition: 'all 0.2s ease',
                      boxShadow: 'rgba(0, 0, 0, 0.3) 0px 1px 3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: 'translateZ(0)' // Force hardware acceleration
                    }}>
                    {/* Optional checkmark */}
                    {aiEnhancement && aiEnhancementAvailable && (
                      <div style={{
                        fontSize: '10px',
                        color: styles.successColor,
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {isGenerating && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: styles.textSecondary,
                    fontWeight: '500'
                  }}>
                    Progress: {progress.current} / {progress.total}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: styles.textMuted
                  }}>
                    {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                  </div>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: styles.bgSecondary,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: `1px solid ${styles.borderColor}`
                }}>
                  <div style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: styles.primaryColor,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{
                  fontSize: '11px',
                  color: styles.textMuted,
                  marginTop: '4px'
                }}>
                  {progressStatus}
                </div>
              </div>
            )}

            {/* Generate/Cancel Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleGenerate}
                disabled={!selectedTemplate || isGenerating}
                style={{
                  flex: isGenerating ? 1 : 1,
                  padding: '12px 16px',
                  backgroundColor: selectedTemplate ? styles.primaryColor : styles.bgAccent,
                  color: selectedTemplate ? 'white' : styles.textMuted,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: selectedTemplate && !isGenerating ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: isGenerating ? 0.7 : 1
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
              
              {isGenerating && (
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: styles.errorColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDocumentationCard;