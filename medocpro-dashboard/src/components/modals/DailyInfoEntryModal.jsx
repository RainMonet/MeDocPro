import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/api';

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
const DEFAULT_TEMPLATE = `{{last_name}}, {{first_name}}:

CC: {{chief_complaint}}

Prior to evaluation, patient was observed {{clinical_observations}}. He has been {{medication_compliance}} with {{reported_side_effects}}. At the moment, he is reporting {{current_mood}} {{suicidal_ideation}} {{homicidal_ideation}} {{perceptual_disturbances}}. He reports sleeping {{sleep_quality}} and is feeling {{energy_level}}. No other new complaints were offered today. No acute events were reported overnight.

ASSESSMENT:
{{clinical_assessment}}

—-----------------------------------------------`;

// Parse template to identify placeholders and static text
const parseTemplateInline = (template, fieldValues = {}, theme = 'dark') => {
  const styles = getThemeStyles(theme);
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

    const placeholderName = match[1].trim();
    const fieldType = getFieldType(placeholderName);
    const value = fieldValues[placeholderName] || '';
    const hasValue = Boolean(value.trim());

    // Add placeholder as interactive element
    parts.push({
      type: 'placeholder',
      name: placeholderName,
      content: match[0],
      fieldType,
      value,
      hasValue,
      placeholder: getPlaceholderText(placeholderName)
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

// Get placeholder text based on field name
const getPlaceholderText = (placeholderName) => {
  const name = placeholderName.toLowerCase();
  
  const placeholderMap = {
    'last_name': 'Last name',
    'first_name': 'First name', 
    'chief_complaint': "Patient's primary concern...",
    'clinical_observations': 'Clinical observations during evaluation...',
    'medication_compliance': 'e.g., compliant, non-compliant',
    'reported_side_effects': 'Reported side effects',
    'current_mood': 'e.g., denying SI',
    'suicidal_ideation': 'e.g., denying SI',
    'homicidal_ideation': 'e.g., denying HI', 
    'perceptual_disturbances': 'Any hallucinations or perceptual issues',
    'sleep_quality': 'Sleep quality/pattern',
    'energy_level': 'Energy level/motivation',
    'clinical_assessment': 'Clinical assessment and plan...'
  };
  
  return placeholderMap[name] || placeholderName.replace(/_/g, ' ');
};

// Determine field type based on placeholder name
const getFieldType = (placeholderName) => {
  const name = placeholderName.toLowerCase();
  
  if (name.includes('assessment') || name.includes('chief_complaint') || 
      name.includes('clinical_observations') || name.includes('side_effects') || 
      name.includes('perceptual_disturbances')) {
    return 'textarea';
  }
  
  if (name.includes('first_name') || name.includes('last_name')) {
    return 'readonly'; // Auto-filled from patient data
  }
  
  return 'input'; // Short text fields
};

// Inline input field component
const InlineField = ({ placeholder, value, onChange, theme }) => {
  const styles = getThemeStyles(theme);
  const { fieldType, name, hasValue } = placeholder;
  
  if (fieldType === 'readonly') {
    return (
      <span style={{
        color: styles.primaryColor,
        backgroundColor: 'transparent',
        padding: '2px 4px',
        borderRadius: '3px',
        fontSize: '14px',
        fontWeight: '500',
        borderBottom: `1px solid ${styles.primaryColor}`
      }}>
        {value || name.replace(/_/g, ' ')}
      </span>
    );
  }

  const baseInputStyles = {
    backgroundColor: hasValue ? 'transparent' : styles.bgSecondary,
    border: hasValue ? 'none' : `1px solid ${styles.borderColor}`,
    borderBottom: hasValue ? `2px solid ${styles.primaryColor}` : `1px dashed ${styles.borderColor}`,
    borderRadius: hasValue ? '0' : '4px',
    padding: hasValue ? '2px 4px' : '6px 8px',
    color: hasValue ? styles.textPrimary : styles.textMuted,
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontWeight: hasValue ? '500' : '400'
  };

  if (fieldType === 'textarea') {
    return (
      <div style={{ 
        display: 'block',
        width: '100%',
        maxWidth: '100%',
        margin: '2px 0'
      }}>
        <textarea
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder.placeholder}
          style={{
            ...baseInputStyles,
            width: '100%',
            maxWidth: '100%',
            minWidth: '200px',
            minHeight: hasValue ? 'auto' : '60px',
            resize: 'vertical',
            display: 'block',
            boxSizing: 'border-box',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
          rows={hasValue ? Math.max(2, value.split('\n').length) : 3}
        />
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(name, e.target.value)}
      placeholder={placeholder.placeholder}
      style={{
        ...baseInputStyles,
        minWidth: hasValue ? `${Math.min(Math.max(value.length * 8, 80), 400)}px` : '120px',
        maxWidth: '100%',
        width: 'auto',
        display: 'inline-block',
        boxSizing: 'border-box',
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
      }}
    />
  );
};

// Template renderer with inline editing
const InlineTemplateRenderer = ({ template, fieldValues, onChange, theme }) => {
  const parts = parseTemplateInline(template, fieldValues, theme);
  const styles = getThemeStyles(theme);

  return (
    <div style={{
      backgroundColor: styles.bgPrimary,
      border: `1px solid ${styles.borderColor}`,
      borderRadius: '8px',
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.6',
      color: styles.textPrimary,
      whiteSpace: 'pre-wrap',
      minHeight: '400px'
    }}>
      {parts.map((part, index) => {
        if (part.type === 'static') {
          return (
            <span key={index} style={{ color: styles.textPrimary }}>
              {part.content}
            </span>
          );
        } else if (part.type === 'placeholder') {
          return (
            <InlineField
              key={index}
              placeholder={part}
              value={part.value}
              onChange={onChange}
              theme={theme}
            />
          );
        }
        return null;
      })}
    </div>
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
  // Sort patients alphabetically by last name
  const sortedPatients = [...patients].sort((a, b) => {
    const getLastName = (patient) => {
      const name = patient.patient_name || '';
      // Handle "Last, First" format
      const parts = name.split(', ');
      return parts[0] || name; // Return last name or full name if no comma
    };
    
    const lastNameA = getLastName(a).toLowerCase();
    const lastNameB = getLastName(b).toLowerCase();
    return lastNameA.localeCompare(lastNameB);
  });

  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);
  const [fieldValues, setFieldValues] = useState({});
  const [previousValues, setPreviousValues] = useState({});
  const [completionStatus, setCompletionStatus] = useState({});
  const [rolloverInfo, setRolloverInfo] = useState(null); // Track if data was carried over
  const [templateParts, setTemplateParts] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [backendDataLoaded, setBackendDataLoaded] = useState(false);
  const [loadingDailyInfo, setLoadingDailyInfo] = useState(false);
  const [backendErrors, setBackendErrors] = useState(0);
  const [isBackendDown, setIsBackendDown] = useState(false);
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

  // CRITICAL: Prevent data loss on page unload
  useEffect(() => {
    if (isOpen) {
      const handleBeforeUnload = (event) => {
        // Check if there's unsaved data
        const hasUnsavedData = Object.keys(fieldValues).some(patientId => 
          Object.keys(fieldValues[patientId] || {}).some(field => 
            field !== 'last_name' && field !== 'first_name' && fieldValues[patientId][field]
          )
        );
        
        if (hasUnsavedData) {
          preserveAllDataToLocalStorage();
          event.preventDefault();
          event.returnValue = 'You have unsaved daily information. Your data will be preserved, but are you sure you want to leave?';
        }
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isOpen, fieldValues]);

  // Load available templates only when modal is open to avoid overloading backend
  useEffect(() => {
    if (!isOpen) return;
    
    const loadTemplates = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No authentication token available, skipping templates load');
          return;
        }
        
        const response = await fetch(`${apiService.baseURL}/api/templates/top-used`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
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
  }, [isOpen]);

  // Load full template content when template is selected
  useEffect(() => {
    const loadTemplateContent = async () => {
      if (selectedTemplate && !selectedTemplate.content) {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          const response = await fetch(`http://localhost:5000/api/templates/${selectedTemplate.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.template && data.template.content) {
              setSelectedTemplate(prev => ({
                ...prev,
                content: data.template.content
              }));
              console.log('Loaded template content:', data.template.content);
            }
          } else {
            console.error('Failed to load template content');
            // Fallback to default template
            setSelectedTemplate(prev => ({
              ...prev,
              content: DEFAULT_TEMPLATE
            }));
          }
        } catch (error) {
          console.error('Error loading template content:', error);
          // Fallback to default template
          setSelectedTemplate(prev => ({
            ...prev,
            content: DEFAULT_TEMPLATE
          }));
        }
      }
    };
    
    loadTemplateContent();
  }, [selectedTemplate?.id]);

  // Load existing daily information entries from backend
  const loadExistingDailyInfo = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || patients.length === 0) return;

    setLoadingDailyInfo(true);
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const loadedFieldValues = {};
      const loadedCompletionStatus = {};

      // First, try to get a summary of which patients have data to avoid loading empty entries
      console.log(`Checking for existing daily info entries for ${sortedPatients.length} patients on ${today}`);
      
      // Load only the first few patients initially for faster UI response
      const priorityPatients = sortedPatients.slice(0, 5); // Load first 5 patients immediately
      const remainingPatients = sortedPatients.slice(5); // Load remaining patients in background
      
      // Load priority patients first
      const priorityPromises = priorityPatients.map(async (patient) => {
        try {
          const response = await fetch(`http://localhost:5000/api/daily-info/${patient.id}?date=${today}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(3000) // Faster timeout for priority patients
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.entries && result.entries.length > 0) {
              const latestEntry = result.entries[0];
              console.log(`Found entry for patient ${patient.id}:`, latestEntry);
              loadedFieldValues[patient.id] = latestEntry.field_values || {};
              loadedCompletionStatus[patient.id] = latestEntry.status === 'completed' || latestEntry.status === 'signed';
              
              // Check if this data was carried over from previous day
              if (latestEntry.notes && latestEntry.notes.includes('Carried over from')) {
                if (!rolloverInfo) {
                  setRolloverInfo({
                    hasRollover: true,
                    message: latestEntry.notes,
                    count: 1
                  });
                } else {
                  setRolloverInfo(prev => ({
                    ...prev,
                    count: prev.count + 1
                  }));
                }
              }
              
              // Set the template if one was used
              if (latestEntry.template_id && !selectedTemplate) {
                const template = availableTemplates.find(t => t.id === latestEntry.template_id);
                if (template) {
                  setSelectedTemplate(template);
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error loading daily info for patient ${patient.id}:`, error);
        }
      });
      
      // Wait for priority patients to load first
      await Promise.all(priorityPromises);
      
      // Set initial data for priority patients immediately
      if (Object.keys(loadedFieldValues).length > 0) {
        console.log('Priority patients loaded, setting initial data...');
        setFieldValues(loadedFieldValues);
        setCompletionStatus(loadedCompletionStatus);
        setBackendDataLoaded(true);
      }
      
      // Load remaining patients in background (if any)
      if (remainingPatients.length > 0) {
        console.log(`Loading remaining ${remainingPatients.length} patients in background...`);
        
        // Process remaining patients SEQUENTIALLY to prevent backend overload
        console.log('Loading remaining patients ONE BY ONE to prevent backend crashes...');
        
        for (let i = 0; i < remainingPatients.length; i++) {
          const patient = remainingPatients[i];
          console.log(`Loading patient ${i+1}/${remainingPatients.length}: ${patient.id}`);
          
          try {
            const response = await fetch(`http://localhost:5000/api/daily-info/${patient.id}?date=${today}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(8000) // Longer timeout for individual requests
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.entries && result.entries.length > 0) {
                const latestEntry = result.entries[0];
                console.log(`Found entry for patient ${patient.id}:`, latestEntry);
                loadedFieldValues[patient.id] = latestEntry.field_values || {};
                loadedCompletionStatus[patient.id] = latestEntry.status === 'completed' || latestEntry.status === 'signed';
                
                // Update state immediately for each patient
                setFieldValues(prev => ({ ...prev, [patient.id]: latestEntry.field_values || {} }));
                setCompletionStatus(prev => ({ ...prev, [patient.id]: latestEntry.status === 'completed' || latestEntry.status === 'signed' }));
              }
            }
          } catch (error) {
            console.error(`Error loading daily info for patient ${patient.id}:`, error);
          }
          
          // Wait between each request to prevent overwhelming backend
          if (i < remainingPatients.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay between each request
          }
        }
      }

      // Final merge with localStorage data (localStorage takes precedence for unsaved changes)
      console.log('Final backend data loaded. Processing merge...');
      console.log('Final loadedFieldValues:', loadedFieldValues);
      console.log('Final loadedCompletionStatus:', loadedCompletionStatus);

      // Merge with localStorage data (localStorage takes precedence for unsaved changes)
      const savedData = localStorage.getItem('dailyInfoEntryData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Merge backend data with localStorage data (localStorage takes precedence)
          const mergedFieldValues = { ...loadedFieldValues, ...(parsedData.fieldValues || {}) };
          const mergedCompletionStatus = { ...loadedCompletionStatus, ...(parsedData.completionStatus || {}) };
          
          console.log('FINAL MERGE PROCESS:');
          console.log('Backend loadedFieldValues:', loadedFieldValues);
          console.log('localStorage parsedData.fieldValues:', parsedData.fieldValues);
          console.log('Merged result:', mergedFieldValues);
          
          // Update with final merged data
          setFieldValues(prev => ({ ...prev, ...mergedFieldValues }));
          setCompletionStatus(prev => ({ ...prev, ...mergedCompletionStatus }));
          console.log('Final merge completed');
          
          // Debug: Log what we're setting
          console.log('Setting fieldValues to:', mergedFieldValues);
          console.log('Patient 133 data in merged result:', mergedFieldValues[133]);
        } catch (error) {
          console.error('Error parsing localStorage data:', error);
          setFieldValues(prev => ({ ...prev, ...loadedFieldValues }));
          setCompletionStatus(prev => ({ ...prev, ...loadedCompletionStatus }));
        }
      } else {
        console.log('FINAL BACKEND ONLY LOAD:');
        console.log('Backend loadedFieldValues:', loadedFieldValues);
        console.log('Setting fieldValues to:', loadedFieldValues);
        
        // Update with final backend data
        setFieldValues(prev => ({ ...prev, ...loadedFieldValues }));
        setCompletionStatus(prev => ({ ...prev, ...loadedCompletionStatus }));
        console.log('Final backend load completed:', { loadedFieldValues, loadedCompletionStatus });
      }

    } catch (error) {
      console.error('Error loading existing daily information:', error);
      // Fall back to localStorage only
      const savedData = localStorage.getItem('dailyInfoEntryData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFieldValues(parsedData.fieldValues || {});
          setCompletionStatus(parsedData.completionStatus || {});
          console.log('Fallback: Loaded daily info data from localStorage only');
        } catch (error) {
          console.error('Error loading daily info data from localStorage:', error);
        }
      }
    } finally {
      setLoadingDailyInfo(false);
    }
  }, [sortedPatients, availableTemplates]);

  // Reset state when modal opens to ensure fresh data load
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened - clearing state for fresh data load');
      
      // CRITICAL: Check for session expiration recovery
      const sessionExpiredData = localStorage.getItem('sessionExpiredData');
      if (sessionExpiredData) {
        try {
          const expiredData = JSON.parse(sessionExpiredData);
          if (expiredData.preserved) {
            alert(`🔄 Data Recovery: Your daily information for ${expiredData.patientCount} patients has been preserved from your previous session. Data was saved at ${new Date(expiredData.timestamp).toLocaleString()}.`);
            localStorage.removeItem('sessionExpiredData'); // Clear the flag
          }
        } catch (error) {
          console.error('Error checking session expiration data:', error);
        }
      }
      
      setFieldValues({});
      setCompletionStatus({});
      setCurrentPatientIndex(0);
      setRolloverInfo(null);
      setLastSaved(null);
      setBackendDataLoaded(false);
      setLoadingDailyInfo(false);
      // Clear localStorage to ensure we get fresh data from backend
      localStorage.removeItem('dailyInfoEntryData');
    }
  }, [isOpen]);

  // Load existing daily information when modal opens and patients are available
  useEffect(() => {
    console.log('Daily info loading effect triggered:', { 
      isOpen, 
      patientsLength: patients.length, 
      loadingTemplates,
      availableTemplatesLength: availableTemplates.length 
    });
    
    // Only load when modal first opens, not on patient changes
    if (isOpen && sortedPatients.length > 0 && !loadingTemplates && !backendDataLoaded) {
      console.log('Loading existing daily info from backend...');
      console.log('Patient count:', sortedPatients.length);
      console.log('First few patients:', sortedPatients.slice(0, 3));
      console.log('Available templates:', availableTemplates.length);
      loadExistingDailyInfo();
    }
  }, [isOpen, sortedPatients.length, loadingTemplates, backendDataLoaded]);

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

  // Auto-fill patient name fields when patient changes (only if no meaningful data exists)
  useEffect(() => {
    if (sortedPatients[currentPatientIndex] && backendDataLoaded) {
      const patient = sortedPatients[currentPatientIndex];
      const [lastName, firstName] = (patient.patient_name || '').split(', ');
      
      setFieldValues(prev => {
        const existingData = prev[patient.id] || {};
        
        // Check if there's meaningful data (not just auto-filled names)
        const meaningfulFields = Object.keys(existingData).filter(key => 
          key !== 'last_name' && key !== 'first_name'
        );
        
        console.log(`Auto-fill check for patient ${patient.id}:`, {
          existingData,
          meaningfulFields,
          meaningfulFieldsCount: meaningfulFields.length,
          backendDataLoaded
        });
        
        // Only auto-fill if there's no meaningful data beyond just names AND no existing data at all
        if (meaningfulFields.length === 0 && Object.keys(existingData).length === 0) {
          console.log(`Auto-filling name fields for patient ${patient.id}: ${lastName}, ${firstName}`);
          return {
            ...prev,
            [patient.id]: {
              ...existingData,
              'last_name': lastName || '',
              'first_name': firstName || ''
            }
          };
        }
        
        // If there's meaningful data OR existing data, don't override anything
        console.log(`Skipping auto-fill for patient ${patient.id} - existing data found:`, existingData);
        return prev;
      });
    }
  }, [currentPatientIndex, sortedPatients, backendDataLoaded]);

  // Handle field changes
  const handleFieldChange = (fieldName, value) => {
    const patientId = sortedPatients[currentPatientIndex]?.id;
    if (!patientId) return;

    console.log(`Field changed: ${fieldName} = "${value}" for patient ${patientId}`);

    setFieldValues(prev => {
      const newFieldValues = {
        ...prev,
        [patientId]: {
          ...prev[patientId],
          [fieldName]: value
        }
      };
      console.log('Updated fieldValues:', newFieldValues);
      return newFieldValues;
    });

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

  // Debug function to manually clear localStorage
  const debugClearStorage = () => {
    clearPersistedData();
    setFieldValues({});
    setCompletionStatus({});
    alert('Cleared localStorage and reset modal state');
  };

  // CRITICAL: Preserve all current data to localStorage
  const preserveAllDataToLocalStorage = () => {
    try {
      const allData = {
        fieldValues: fieldValues,
        completionStatus: completionStatus,
        selectedTemplate: selectedTemplate,
        currentPatientIndex: currentPatientIndex,
        timestamp: new Date().toISOString(),
        preserved: true // Flag to indicate data was preserved due to session expiration
      };
      
      localStorage.setItem('dailyInfoEntryData', JSON.stringify(allData));
      localStorage.setItem('sessionExpiredData', JSON.stringify({
        preserved: true,
        timestamp: new Date().toISOString(),
        patientCount: Object.keys(fieldValues).length
      }));
      
      console.log('🔒 Data preserved to localStorage due to session expiration');
    } catch (error) {
      console.error('Failed to preserve data to localStorage:', error);
    }
  };

  // Handle save
  const handleSave = async () => {
    try {
      const currentPatient = sortedPatients[currentPatientIndex];
      if (!currentPatient) return;

      const currentPatientValues = fieldValues[currentPatient.id] || {};
      const token = localStorage.getItem('token');
      
      // CRITICAL: Preserve data BEFORE checking auth
      preserveAllDataToLocalStorage();
      
      if (!token) {
        alert('❌ Session expired. Your data has been preserved locally. Please log in again to save to server.');
        return;
      }
      
      // Save to backend API
      const response = await fetch(`${apiService.baseURL}/api/daily-info`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_census_row_id: currentPatient.id,
          template_id: selectedTemplate?.id || null,
          field_values: currentPatientValues,
          status: 'completed',
          notes: `Daily information entry for ${currentPatient.patient_name}`
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
          
          // Clear localStorage data for this patient since it's now saved
          const savedData = JSON.parse(localStorage.getItem('dailyInfoEntryData') || '{}');
          if (savedData.fieldValues && savedData.fieldValues[currentPatient.id]) {
            delete savedData.fieldValues[currentPatient.id];
            localStorage.setItem('dailyInfoEntryData', JSON.stringify(savedData));
          }
          
          // Show success message
          alert(`✅ Daily information saved successfully for ${currentPatient.patient_name}!`);
        } else {
          throw new Error(result.error || 'Failed to save');
        }
      } else if (response.status === 401 || response.status === 403) {
        // CRITICAL: Session expired - preserve data and inform user
        preserveAllDataToLocalStorage();
        alert('❌ Session expired. Your data has been preserved locally. Please log in again to save to server.');
        return;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving daily info:', error);
      
      // Check if it's a network/auth error
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
        preserveAllDataToLocalStorage();
        alert('❌ Session expired. Your data has been preserved locally. Please log in again to save to server.');
      } else {
        alert(`❌ Error saving daily information: ${error.message}`);
      }
    }
  };

  // Auto-save data to backend
  const autoSaveData = async (patientId, fieldData) => {
    // Skip if backend is down
    if (isBackendDown) {
      console.log('Backend is down, skipping auto-save');
      return;
    }
    
    try {
      setIsAutoSaving(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const patient = sortedPatients.find(p => p.id === patientId);
      if (!patient) return;
      
      // Only save if there's actual data (not just auto-filled names)
      const hasRealData = Object.keys(fieldData).some(field => 
        field !== 'last_name' && field !== 'first_name' && fieldData[field]
      );
      
      if (!hasRealData) return;
      
      console.log(`Auto-saving data for patient ${patientId}:`, fieldData);
      
      const response = await fetch(`${apiService.baseURL}/api/daily-info`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_census_row_id: patientId,
          template_id: selectedTemplate?.id || null,
          field_values: fieldData,
          status: 'draft',
          notes: `Auto-saved daily information for ${patient.patient_name}`
        }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Auto-save successful for patient ${patientId}:`, result.action);
        setLastSaved(new Date());
        setBackendErrors(0); // Reset error count on success
        setIsBackendDown(false);
      } else if (response.status === 401 || response.status === 403) {
        // Session expired during auto-save - silently preserve data
        console.warn('Session expired during auto-save, preserving data locally');
        setIsBackendDown(true); // Stop further auto-save attempts
        return;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      
      // Check for authentication errors
      if (error.message.includes('401') || error.message.includes('403')) {
        console.warn('Session expired during auto-save, stopping auto-save');
        setIsBackendDown(true);
        return;
      }
      
      // Track other backend errors
      const newErrorCount = backendErrors + 1;
      setBackendErrors(newErrorCount);
      
      // If we have multiple consecutive errors, assume backend is down
      if (newErrorCount >= 3) {
        setIsBackendDown(true);
        console.warn('Backend appears to be down, disabling auto-save for 30 seconds');
        setTimeout(() => {
          setIsBackendDown(false);
          setBackendErrors(0);
        }, 30000);
      }
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Auto-save when field values change (debounced per patient)
  useEffect(() => {
    console.log('Auto-save effect triggered');
    
    // Only save if modal is open and we have data
    if (!isOpen || Object.keys(fieldValues).length === 0) {
      return;
    }
    
    // Create separate timeouts for each patient to avoid saving all at once
    const timeouts = {};
    
    Object.keys(fieldValues).forEach(patientId => {
      const patientData = fieldValues[patientId];
      
      // Only save if there's actual data (not just auto-filled names)
      const hasRealData = patientData && Object.keys(patientData).some(field => 
        field !== 'last_name' && field !== 'first_name' && patientData[field]
      );
      
      if (hasRealData) {
        timeouts[patientId] = setTimeout(() => {
          console.log(`Auto-saving patient ${patientId}`);
          autoSaveData(parseInt(patientId), patientData);
        }, 5000); // Increased to 5 seconds to prevent backend overload
      }
    });
    
    return () => {
      console.log('Clearing auto-save timeouts');
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, [fieldValues, selectedTemplate, isOpen]);

  // Handle modal close
  const handleClose = async () => {
    console.log('handleClose called');
    
    try {
      // CRITICAL: Always preserve data before closing
      preserveAllDataToLocalStorage();
      
      // Save any unsaved data before closing
      const hasUnsavedData = Object.keys(fieldValues).some(patientId => 
        Object.keys(fieldValues[patientId] || {}).some(field => 
          field !== 'last_name' && field !== 'first_name' && fieldValues[patientId][field]
        )
      );

      if (hasUnsavedData) {
        console.log('Saving data before closing modal...');
        
        // Check for valid token first
        const token = localStorage.getItem('token');
        if (!token) {
          alert('⚠️ Session expired. Your data has been preserved locally and will be restored when you log back in.');
          onClose();
          return;
        }
        
        // Save all patient data with timeout
        const savePromises = Object.keys(fieldValues).map(patientId => {
          const patientData = fieldValues[patientId];
          if (patientData && Object.keys(patientData).length > 0) {
            return Promise.race([
              autoSaveData(parseInt(patientId), patientData),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Save timeout')), 3000)
              )
            ]);
          }
          return Promise.resolve();
        });
        
        try {
          await Promise.all(savePromises);
          console.log('All data saved successfully');
          
          // Clear state after successful save to prevent stale data
          setFieldValues({});
          setCompletionStatus({});
          setBackendDataLoaded(false);
          console.log('Data saved and state cleared, closing modal');
        } catch (error) {
          console.error('Error saving data:', error);
          
          // Don't block closing on save errors - give user option
          const shouldForceClose = window.confirm(
            'Failed to save some data. Do you want to close anyway?\n\n' +
            'Click "OK" to close and lose unsaved changes.\n' +
            'Click "Cancel" to stay in the modal.'
          );
          
          if (!shouldForceClose) {
            console.log('User chose to stay in modal');
            return; // Don't close the modal
          }
          
          // Force close - clear state
          setFieldValues({});
          setCompletionStatus({});
          setBackendDataLoaded(false);
        }
      }
      
      console.log('Calling onClose()');
      onClose();
    } catch (error) {
      console.error('Error in handleClose:', error);
      // Force close even if there's an error
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentPatient = sortedPatients[currentPatientIndex];
  const currentPatientValues = fieldValues[currentPatient?.id] || {};
  const currentPatientPrevious = previousValues[currentPatient?.id] || {};

  // Debug logging
  console.log('Current patient:', currentPatient);
  console.log('All fieldValues:', fieldValues);
  console.log('Current patient ID:', currentPatient?.id);
  console.log('FieldValues for current patient ID:', fieldValues[currentPatient?.id]);
  console.log('Current patient values:', currentPatientValues);

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
        {sortedPatients.length > 0 && (
          <PatientNavigation
            patients={sortedPatients}
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
          padding: '20px',
          maxHeight: 'calc(90vh - 200px)',
          overflowX: 'hidden',
          overflowY: 'auto'
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

              {/* Rollover Information */}
              {rolloverInfo && rolloverInfo.hasRollover && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: currentTheme === 'dark' ? '#2a4d3a' : '#f0f9ff',
                  border: `1px solid ${currentTheme === 'dark' ? '#16a34a' : '#0ea5e9'}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    fontSize: '16px',
                    color: currentTheme === 'dark' ? '#16a34a' : '#0ea5e9'
                  }}>
                    ℹ️
                  </div>
                  <div style={{
                    flex: 1,
                    fontSize: '14px',
                    color: styles.textPrimary
                  }}>
                    <strong>Data Carried Over:</strong> Daily information for {rolloverInfo.count} patient{rolloverInfo.count > 1 ? 's' : ''} has been automatically carried over from the previous day. You can review and update the information as needed.
                  </div>
                </div>
              )}

              {/* Dynamic Template Renderer */}
              {selectedTemplate ? (
                <div>
                  
                  {/* Loading and Debug info */}
                  <div style={{
                    fontSize: '12px',
                    color: styles.textMuted,
                    marginBottom: '8px',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {loadingDailyInfo && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: styles.primaryColor
                      }}>
                        <div className="loading-spinner" style={{ width: '12px', height: '12px' }}></div>
                        Loading daily info...
                      </div>
                    )}
                    <span>Template Content: {selectedTemplate.content ? 'Available' : 'Not loaded'}</span>
                    {selectedTemplate.content && ` (${selectedTemplate.content.length} chars)`}
                  </div>
                  
                  {/* Template Content with Interactive Fields */}
                  <div style={{
                    backgroundColor: styles.bgPrimary,
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '8px',
                    padding: '20px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: styles.textPrimary,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}>
                    {(selectedTemplate.content || DEFAULT_TEMPLATE)
                      .split(/(\{\{[^}]+\}\})/)
                      .map((part, index) => {
                        // Check if this part is a placeholder
                        const placeholderMatch = part.match(/\{\{([^}]+)\}\}/);
                        
                        if (placeholderMatch) {
                          const fieldName = placeholderMatch[1].trim();
                          const fieldType = getFieldType(fieldName);
                          const value = currentPatientValues[fieldName] || '';
                          
                          if (fieldType === 'readonly') {
                            // Auto-filled fields (patient name, etc.)
                            return (
                              <span
                                key={index}
                                style={{
                                  color: styles.primaryColor,
                                  fontWeight: '600',
                                  backgroundColor: styles.bgSecondary,
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  border: `1px solid ${styles.primaryColor}`
                                }}
                              >
                                {value || fieldName.replace(/_/g, ' ')}
                              </span>
                            );
                          } else if (fieldType === 'textarea') {
                            // Multi-line text areas
                            return (
                              <textarea
                                key={index}
                                value={value}
                                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                                placeholder={`Enter ${fieldName.replace(/_/g, ' ')}...`}
                                style={{
                                  backgroundColor: value ? 'transparent' : styles.bgSecondary,
                                  border: value ? 'none' : `1px dashed ${styles.borderColor}`,
                                  borderBottom: value ? `2px solid ${styles.primaryColor}` : `1px dashed ${styles.borderColor}`,
                                  borderRadius: value ? '0' : '4px',
                                  padding: value ? '4px 6px' : '8px',
                                  color: value ? styles.textPrimary : styles.textMuted,
                                  fontSize: '14px',
                                  fontFamily: 'monospace',
                                  outline: 'none',
                                  transition: 'all 0.2s ease',
                                  fontWeight: value ? '500' : '400',
                                  width: '100%',
                                  maxWidth: '100%',
                                  minWidth: '200px',
                                  minHeight: value ? 'auto' : '60px',
                                  resize: 'vertical',
                                  display: 'block',
                                  verticalAlign: 'top',
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  boxSizing: 'border-box'
                                }}
                                rows={value ? Math.max(2, value.split('\n').length) : 3}
                              />
                            );
                          } else {
                            // Single-line inputs
                            return (
                              <input
                                key={index}
                                type="text"
                                value={value}
                                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                                placeholder={`Enter ${fieldName.replace(/_/g, ' ')}...`}
                                style={{
                                  backgroundColor: value ? 'transparent' : styles.bgSecondary,
                                  border: value ? 'none' : `1px dashed ${styles.borderColor}`,
                                  borderBottom: value ? `2px solid ${styles.primaryColor}` : `1px dashed ${styles.borderColor}`,
                                  borderRadius: value ? '0' : '4px',
                                  padding: value ? '2px 4px' : '6px 8px',
                                  color: value ? styles.textPrimary : styles.textMuted,
                                  fontSize: '14px',
                                  fontFamily: 'monospace',
                                  outline: 'none',
                                  transition: 'all 0.2s ease',
                                  fontWeight: value ? '500' : '400',
                                  minWidth: value ? `${Math.min(Math.max(value.length * 8, 80), 400)}px` : '120px',
                                  maxWidth: '100%',
                                  width: 'auto',
                                  boxSizing: 'border-box',
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word'
                                }}
                              />
                            );
                          }
                        } else {
                          // Static text
                          return (
                            <span key={index} style={{ color: styles.textPrimary }}>
                              {part}
                            </span>
                          );
                        }
                      })}
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
            color: styles.textMuted,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Use Ctrl+← / Ctrl+→ to navigate between patients</span>
              {isAutoSaving && (
                <span style={{ color: styles.primaryColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div className="loading-spinner" style={{ width: '12px', height: '12px' }} />
                  Auto-saving...
                </span>
              )}
              {lastSaved && !isAutoSaving && (
                <span style={{ color: styles.successColor }}>
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
            <button
              onClick={debugClearStorage}
              style={{
                padding: '4px 8px',
                backgroundColor: styles.errorColor,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Debug: Clear Storage
            </button>
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
              Close
            </button>
            <button
              onClick={async () => {
                await handleSave();
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: styles.primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Save
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