import React, { useState, useEffect, useCallback } from 'react';

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

// Template with your actual format
const DEFAULT_TEMPLATE = `{{last name}}, {{first name}}:

CC:  

{{chief complaint}}

Prior to evaluation, patient was observed {{observation}}.  He has been {{compliance}} with {{side effects}}.  At the moment, he is reporting {{mood}} {{SI}} {{HI}} {{perceptual disturbances}}.  He reports sleeping {{sleep}} and is feeling {{energy}}.  No other new complaints were offered today.  No acute events were reported overnight.

{{assessment}}

—-----------------------------------------------`;

// Parse template to identify placeholders and static text
const parseTemplate = (template) => {
  const parts = [];
  let currentIndex = 0;
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  let match;

  while ((match = placeholderRegex.exec(template)) !== null) {
    // Add static text before this placeholder
    if (match.index > currentIndex) {
      parts.push({
        type: 'static',
        content: template.slice(currentIndex, match.index)
      });
    }

    // Add placeholder
    parts.push({
      type: 'placeholder',
      name: match[1].trim(),
      content: match[0]
    });

    currentIndex = match.index + match[0].length;
  }

  // Add remaining static text
  if (currentIndex < template.length) {
    parts.push({
      type: 'static',
      content: template.slice(currentIndex)
    });
  }

  return parts;
};

// Determine field type based on placeholder name
const getFieldType = (placeholderName) => {
  const name = placeholderName.toLowerCase();
  
  if (name.includes('assessment') || name.includes('chief complaint') || 
      name.includes('side effects') || name.includes('perceptual disturbances')) {
    return 'textarea';
  }
  
  if (name.includes('first name') || name.includes('last name')) {
    return 'readonly'; // Auto-filled from patient data
  }
  
  return 'input'; // Short text fields
};

// Individual field component
const PlaceholderField = ({ placeholder, value, onChange, previousValue, theme }) => {
  const styles = getThemeStyles(theme);
  const fieldType = getFieldType(placeholder.name);
  const hasChanged = value !== previousValue;
  
  if (fieldType === 'readonly') {
    return (
      <span style={{
        color: styles.textMuted,
        backgroundColor: styles.bgSecondary,
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '14px',
        fontStyle: 'italic'
      }}>
        {value || `[${placeholder.name}]`}
      </span>
    );
  }

  const commonStyles = {
    padding: '8px 12px',
    border: `2px solid ${hasChanged ? styles.warningColor : styles.borderColor}`,
    borderRadius: '6px',
    backgroundColor: styles.bgPrimary,
    color: styles.textPrimary,
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  if (fieldType === 'textarea') {
    return (
      <div style={{ margin: '4px 0' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          color: styles.textMuted,
          marginBottom: '4px',
          fontWeight: '500'
        }}>
          {placeholder.name}
          {hasChanged && <span style={{ color: styles.warningColor }}> (changed)</span>}
        </label>
        <textarea
          value={value || ''}
          onChange={(e) => onChange(placeholder.name, e.target.value)}
          placeholder={previousValue || `Enter ${placeholder.name}...`}
          style={{
            ...commonStyles,
            width: '100%',
            minHeight: '80px',
            resize: 'vertical'
          }}
        />
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(placeholder.name, e.target.value)}
      placeholder={previousValue || `Enter ${placeholder.name}...`}
      style={{
        ...commonStyles,
        minWidth: '120px',
        margin: '0 4px'
      }}
    />
  );
};

// Patient navigation component
const PatientNavigation = ({ patients, currentIndex, onNavigate, completionStatus, theme }) => {
  const styles = getThemeStyles(theme);
  const currentPatient = patients[currentIndex];
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: `1px solid ${styles.borderColor}`,
      backgroundColor: styles.bgSecondary
    }}>
      {/* Patient Info */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          color: styles.textPrimary,
          marginBottom: '4px'
        }}>
          {currentPatient?.patient_name || 'Unknown Patient'}
        </div>
        <div style={{
          fontSize: '12px',
          color: styles.textMuted
        }}>
          Room {currentPatient?.room_number} • {currentPatient?.patient_id} • 
          Progress: {currentIndex + 1} of {patients.length}
        </div>
      </div>

      {/* Navigation Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          disabled={currentIndex === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: currentIndex === 0 ? styles.bgAccent : styles.primaryColor,
            color: currentIndex === 0 ? styles.textMuted : 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ← Previous
        </button>

        <div style={{
          padding: '8px 16px',
          backgroundColor: styles.bgAccent,
          borderRadius: '6px',
          fontSize: '14px',
          color: styles.textSecondary
        }}>
          {Object.values(completionStatus).filter(Boolean).length} / {patients.length} completed
        </div>

        <button
          onClick={() => onNavigate(currentIndex + 1)}
          disabled={currentIndex === patients.length - 1}
          style={{
            padding: '8px 16px',
            backgroundColor: currentIndex === patients.length - 1 ? styles.bgAccent : styles.primaryColor,
            color: currentIndex === patients.length - 1 ? styles.textMuted : 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: currentIndex === patients.length - 1 ? 'not-allowed' : 'pointer'
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

// Main Daily Info Entry Modal Component
const DailyInfoEntryModal = ({ isOpen, onClose, patients = [], theme = 'dark' }) => {
  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);
  const [fieldValues, setFieldValues] = useState({});
  const [previousValues, setPreviousValues] = useState({});
  const [completionStatus, setCompletionStatus] = useState({});
  const [templateParts, setTemplateParts] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
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

  // Load available templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/templates/top-used', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAvailableTemplates(data.templates || []);
        } else {
          console.error('Failed to load templates');
          // Fallback to default templates
          setAvailableTemplates([
            { 
              id: 1, 
              name: 'Progress Note', 
              category: 'progress',
              placeholders: [
                { key: 'patient_name', description: 'Patient full name', type: 'text', example: 'John Smith' },
                { key: 'date_of_service', description: 'Date of service', type: 'date', example: '2024-07-08' },
                { key: 'chief_complaint', description: 'Chief complaint', type: 'text', example: 'Feeling depressed' },
                { key: 'assessment', description: 'Clinical assessment', type: 'text', example: 'Major depressive disorder, stable' },
                { key: 'plan', description: 'Treatment plan', type: 'text', example: 'Continue current medications' }
              ]
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        // Fallback to default templates
        setAvailableTemplates([
          { 
            id: 1, 
            name: 'Progress Note', 
            category: 'progress',
            placeholders: [
              { key: 'patient_name', description: 'Patient full name', type: 'text', example: 'John Smith' },
              { key: 'date_of_service', description: 'Date of service', type: 'date', example: '2024-07-08' },
              { key: 'chief_complaint', description: 'Chief complaint', type: 'text', example: 'Feeling depressed' },
              { key: 'assessment', description: 'Clinical assessment', type: 'text', example: 'Major depressive disorder, stable' },
              { key: 'plan', description: 'Treatment plan', type: 'text', example: 'Continue current medications' }
            ]
          }
        ]);
      } finally {
        setLoadingTemplates(false);
      }
    };
    
    loadTemplates();
  }, []);

  // Parse selected template when it changes
  useEffect(() => {
    if (selectedTemplate && selectedTemplate.content) {
      setTemplateParts(parseTemplate(selectedTemplate.content));
    } else if (selectedTemplate && selectedTemplate.placeholders) {
      // Use placeholders to create template parts
      const parts = selectedTemplate.placeholders.map(placeholder => ({
        type: 'placeholder',
        name: placeholder.key,
        description: placeholder.description,
        example: placeholder.example,
        dataType: placeholder.type
      }));
      setTemplateParts(parts);
    } else {
      setTemplateParts([]);
    }
  }, [selectedTemplate]);

  // Load persisted data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('dailyInfoEntryData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFieldValues(parsedData.fieldValues || {});
        setCompletionStatus(parsedData.completionStatus || {});
        console.log('Loaded daily info data from localStorage:', parsedData);
      } catch (error) {
        console.error('Error loading daily info data from localStorage:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever fieldValues or completionStatus changes
  useEffect(() => {
    if (Object.keys(fieldValues).length > 0 || Object.keys(completionStatus).length > 0) {
      const dataToSave = {
        fieldValues,
        completionStatus,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('dailyInfoEntryData', JSON.stringify(dataToSave));
      console.log('Saved daily info data to localStorage');
    }
  }, [fieldValues, completionStatus]);

  // Auto-fill patient name fields when patient changes
  useEffect(() => {
    if (patients[currentPatientIndex]) {
      const patient = patients[currentPatientIndex];
      const [lastName, firstName] = (patient.patient_name || '').split(', ');
      
      setFieldValues(prev => ({
        ...prev,
        [patient.id]: {
          ...prev[patient.id],
          'last name': lastName || '',
          'first name': firstName || ''
        }
      }));
    }
  }, [currentPatientIndex, patients]);

  // Handle field changes
  const handleFieldChange = (fieldName, value) => {
    const patientId = patients[currentPatientIndex]?.id;
    if (!patientId) return;

    setFieldValues(prev => ({
      ...prev,
      [patientId]: {
        ...prev[patientId],
        [fieldName]: value
      }
    }));

    // Mark patient as having data
    setCompletionStatus(prev => ({
      ...prev,
      [patientId]: true
    }));
  };

  // Navigate between patients
  const handleNavigate = (newIndex) => {
    if (newIndex >= 0 && newIndex < patients.length) {
      setCurrentPatientIndex(newIndex);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleNavigate(currentPatientIndex - 1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNavigate(currentPatientIndex + 1);
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentPatientIndex]);

  // Clear localStorage data
  const clearPersistedData = () => {
    localStorage.removeItem('dailyInfoEntryData');
    console.log('Cleared daily info data from localStorage');
  };

  // Handle save
  const handleSave = async () => {
    try {
      const currentPatient = patients[currentPatientIndex];
      if (!currentPatient) return;

      const currentPatientValues = fieldValues[currentPatient.id] || {};
      
      // Save to backend API
      const response = await fetch('http://localhost:5001/api/daily-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: currentPatient.id,
          field_values: currentPatientValues
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Mark as completed
          setCompletionStatus(prev => ({
            ...prev,
            [currentPatient.id]: true
          }));
          
          // Show success message
          alert(`✅ Daily information saved successfully for ${currentPatient.patient_name}!`);
        } else {
          throw new Error(result.message || 'Failed to save');
        }
      } else {
        throw new Error('Network error');
      }
    } catch (error) {
      console.error('Error saving daily info:', error);
      alert('❌ Error saving daily information. Please try again.');
    }
  };

  // Handle modal close
  const handleClose = () => {
    // Ask user if they want to clear unsaved data
    const hasUnsavedData = Object.keys(fieldValues).some(patientId => 
      Object.keys(fieldValues[patientId] || {}).some(field => 
        field !== 'last name' && field !== 'first name' && fieldValues[patientId][field]
      )
    );

    if (hasUnsavedData) {
      const shouldClear = window.confirm(
        'You have unsaved changes. Do you want to clear all data?\n\n' +
        'Click "OK" to clear all data and close.\n' +
        'Click "Cancel" to keep data for next time.'
      );
      
      if (shouldClear) {
        clearPersistedData();
        setFieldValues({});
        setCompletionStatus({});
      }
    }
    
    onClose();
  };

  if (!isOpen) return null;

  const currentPatient = patients[currentPatientIndex];
  const currentPatientValues = fieldValues[currentPatient?.id] || {};
  const currentPatientPrevious = previousValues[currentPatient?.id] || {};

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
        width: '90%',
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
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: styles.textPrimary
          }}>
            Daily Information Entry
          </h2>
          <button
            onClick={handleClose}
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

        {/* Patient Navigation */}
        {patients.length > 0 && (
          <PatientNavigation
            patients={patients}
            currentIndex={currentPatientIndex}
            onNavigate={handleNavigate}
            completionStatus={completionStatus}
            theme={currentTheme}
          />
        )}

        {/* Template Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {patients.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: styles.textMuted,
              padding: '40px'
            }}>
              No patients available for data entry.
            </div>
          ) : (
            <>
              {/* Template Selection */}
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: styles.bgSecondary,
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '8px'
              }}>
                <h4 style={{
                  margin: 0,
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: styles.textPrimary
                }}>
                  Select Template
                </h4>
                {loadingTemplates ? (
                  <div style={{
                    color: styles.textMuted,
                    fontSize: '14px'
                  }}>
                    Loading templates...
                  </div>
                ) : (
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const templateId = parseInt(e.target.value);
                      const template = availableTemplates.find(t => t.id === templateId);
                      setSelectedTemplate(template || null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${styles.borderColor}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: styles.bgPrimary,
                      color: styles.textPrimary,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select a template...</option>
                    {availableTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.category})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Template Fields */}
              {selectedTemplate ? (
                <div style={{
                  padding: '16px',
                  backgroundColor: styles.bgPrimary,
                  border: `1px solid ${styles.borderColor}`,
                  borderRadius: '8px'
                }}>
                  <h4 style={{
                    margin: 0,
                    marginBottom: '16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: styles.textPrimary
                  }}>
                    {selectedTemplate.name} - Patient Information
                  </h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '16px'
                  }}>
                    {templateParts.map((part, index) => (
                      <div key={index}>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: styles.textSecondary,
                          marginBottom: '6px'
                        }}>
                          {part.description || part.name}
                        </label>
                        <input
                          type={part.dataType === 'date' ? 'date' : part.dataType === 'number' ? 'number' : 'text'}
                          value={currentPatientValues[part.name] || ''}
                          onChange={(e) => handleFieldChange(part.name, e.target.value)}
                          placeholder={part.example || `Enter ${part.name}`}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: `1px solid ${styles.borderColor}`,
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: styles.bgSecondary,
                            color: styles.textPrimary,
                            outline: 'none'
                          }}
                        />
                        {part.example && (
                          <div style={{
                            fontSize: '11px',
                            color: styles.textMuted,
                            marginTop: '4px',
                            fontStyle: 'italic'
                          }}>
                            Example: {part.example}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: styles.textMuted,
                  border: `1px dashed ${styles.borderColor}`,
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                    Select a Template
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    Choose a template above to begin entering patient information
                  </div>
                </div>
              )}
            </>
          )}
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
            Use Ctrl+← / Ctrl+→ to navigate between patients
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={handleClose}
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
            <button
              onClick={async () => {
                await handleSave();
                // Move to next patient if available
                if (currentPatientIndex < patients.length - 1) {
                  handleNavigate(currentPatientIndex + 1);
                }
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: styles.successColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyInfoEntryModal;