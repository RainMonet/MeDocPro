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
  bgHover: theme === 'dark' ? '#475569' : '#d4c4a8',
  borderColor: theme === 'dark' ? '#475569' : '#d4c4a8',
  primaryColor: theme === 'dark' ? '#3b82f6' : '#8b4513',
  successColor: theme === 'dark' ? '#10b981' : '#6b8e23',
  warningColor: theme === 'dark' ? '#f59e0b' : '#cd853f',
  errorColor: theme === 'dark' ? '#ef4444' : '#a0522d'
});

// Patient workflow type configuration - matches PatientCensusModal
const getWorkflowDisplay = (workflowType) => {
  const workflowConfig = {
    'follow-up': { icon: '', label: 'Follow-up', color: '#3b82f6' },
    'admission': { icon: '', label: 'Admission', color: '#10b981' },
    'discharge': { icon: '', label: 'Discharge', color: '#ef4444' }
  };
  return workflowConfig[workflowType] || workflowConfig['follow-up'];
};

// Completion status remains simple - patients are either completed or not

// Color priority system for patient management
// ENHANCED: Colors persist day-to-day using patient names as keys (rollover-safe)
// Completion status resets daily (as requested)
const getColorOptions = () => {
  // Default color configuration
  const defaultOptions = [
    { name: 'None', value: '', color: 'transparent', description: 'No special priority' },
    { name: 'High Priority', value: 'red', color: '#ef4444', description: 'Urgent attention needed' },
    { name: 'Medical Review', value: 'orange', color: '#f59e0b', description: 'Requires medical review' },
    { name: 'Different Provider', value: 'blue', color: '#3b82f6', description: 'Assigned to different provider' },
    { name: 'Legal Status', value: 'purple', color: '#8b5cf6', description: 'Legal status attention' },
    { name: 'Discharge Planning', value: 'green', color: '#10b981', description: 'Ready for discharge planning' },
    { name: 'Family Contact', value: 'pink', color: '#ec4899', description: 'Family meeting or contact needed' }
  ];

  try {
    // Load custom configuration from localStorage
    const savedConfig = localStorage.getItem('colorPriorityConfig');
    if (savedConfig) {
      const customConfig = JSON.parse(savedConfig);
      
      // Update names and descriptions from custom config while keeping default structure
      return defaultOptions.map(defaultOption => {
        if (defaultOption.value === '') return defaultOption; // Skip "None" option
        
        const customOption = customConfig.find(item => item.value === defaultOption.value);
        if (customOption) {
          return {
            ...defaultOption,
            name: customOption.customName.trim() || defaultOption.name,
            description: customOption.customDescription.trim() || defaultOption.description
          };
        }
        return defaultOption;
      });
    }
  } catch (error) {
    console.error('Failed to load color priority configuration:', error);
  }

  return defaultOptions;
};

// Individual patient row component
const PatientListItem = ({ patient, isSelected, onSelect, onStatusChange, onCompletionToggle, onColorChange, theme }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showCompletedText, setShowCompletedText] = useState(true);
  const styles = getThemeStyles(theme);
  const workflowDisplay = getWorkflowDisplay(patient.workflow_type || patient.status || 'follow-up');
  const colorOptions = getColorOptions();
  const currentColor = colorOptions.find(c => c.value === patient.priorityColor) || colorOptions[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColorDropdown && !event.target.closest('.color-dropdown-container')) {
        setShowColorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorDropdown]);

  // Handle responsive "Completed" text based on window width
  useEffect(() => {
    const handleResize = () => {
      // Hide "Completed" text when window is too narrow to prevent overlap with color dots
      // Use 900px as breakpoint - provides comfortable spacing for patient name + color dot + completed text + workflow
      setShowCompletedText(window.innerWidth > 900);
    };

    // Set initial state
    handleResize();

    // Listen for window resize events with throttling for better performance
    let timeoutId;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', throttledResize);
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const getBackgroundColor = () => {
    if (isSelected) return `${styles.primaryColor}15`;
    if (isHovered) return styles.bgAccent;
    
    // Add subtle background tint based on priority color
    if (currentColor.color !== 'transparent' && currentColor.color) {
      return `${currentColor.color}08`; // Very light tint
    }
    
    return 'transparent';
  };

  return (
    <div
      className="patient-list-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: `1px solid ${styles.borderColor}`,
        borderLeft: currentColor.color !== 'transparent' && currentColor.color 
          ? `4px solid ${currentColor.color}` 
          : '4px solid transparent',
        backgroundColor: getBackgroundColor(),
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onClick={() => onSelect(patient.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Checkbox */}
      <div
        className={`patient-checkbox ${isSelected ? 'selected' : ''}`}
        style={{
          width: '18px',
          height: '18px',
          border: `2px solid ${isSelected ? '#3b82f6' : styles.borderColor}`,
          borderRadius: '4px',
          backgroundColor: isSelected ? '#3b82f6' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px',
          flexShrink: 0
        }}
      >
        {isSelected && (
          <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
        )}
      </div>

      {/* Priority Color Indicator - aligned with checkbox */}
      <div className="color-dropdown-container" style={{ 
        position: 'relative',
        marginRight: '12px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowColorDropdown(!showColorDropdown);
          }}
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: currentColor.color || styles.borderColor,
            border: `2px solid ${currentColor.color === 'transparent' ? styles.borderColor : currentColor.color}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: showColorDropdown ? 'scale(1.1)' : 'scale(1)'
          }}
          title={currentColor.description}
        />
        
        {/* Color Dropdown */}
        {showColorDropdown && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '0',
            backgroundColor: styles.bgPrimary,
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '200px',
            padding: '4px'
          }}>
            {colorOptions.map((colorOption) => (
              <div
                key={colorOption.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onColorChange(patient.id, colorOption.value);
                  setShowColorDropdown(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  backgroundColor: currentColor.value === colorOption.value ? styles.bgAccent : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (currentColor.value !== colorOption.value) {
                    e.target.style.backgroundColor = styles.bgSecondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentColor.value !== colorOption.value) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: colorOption.color,
                    border: `1px solid ${colorOption.color === 'transparent' ? styles.borderColor : colorOption.color}`,
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: styles.textPrimary
                  }}>
                    {colorOption.name}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: styles.textMuted
                  }}>
                    {colorOption.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}>
          <span style={{
            fontWeight: '500',
            color: styles.textPrimary,
            fontSize: '14px'
          }}>
            {patient.patient_name || 'Unknown Patient'}
          </span>
        </div>
        
        {/* Additional patient data */}
        {patient.data_fields?.chief_complaint && (
          <div style={{
            fontSize: '12px',
            color: styles.textSecondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {patient.data_fields.chief_complaint}
          </div>
        )}
      </div>

      {/* Completion Checkbox */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: showCompletedText ? '8px' : '0px',
          marginRight: '12px'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onCompletionToggle(patient.id);
        }}
      >
        {showCompletedText && (
          <span style={{
            fontSize: '12px',
            color: styles.textSecondary,
            fontWeight: '500'
          }}>
            Completed
          </span>
        )}
        <div
          className={`completion-checkbox ${patient.completed ? 'completed' : ''}`}
          style={{
            width: '20px',
            height: '20px',
            border: `2px solid ${patient.completed ? styles.successColor : styles.borderColor}`,
            borderRadius: '4px',
            backgroundColor: patient.completed ? styles.successColor : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {patient.completed && (
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
          )}
        </div>
      </div>

      {/* Workflow Type Indicator */}
      <div
        className="workflow-indicator"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '6px',
          backgroundColor: `${workflowDisplay.color}15`,
          border: `1px solid ${workflowDisplay.color}30`
        }}
        onClick={(e) => {
          e.stopPropagation();
          onStatusChange(patient.id);
        }}
      >
        <span style={{
          fontSize: '11px',
          fontWeight: '500',
          color: workflowDisplay.color
        }}>
          {workflowDisplay.label}
        </span>
      </div>
    </div>
  );
};

// Main Patient Census Card Component
const PatientCensusCard = ({ 
  theme = 'dark', 
  onBulkGenerate,
  onOpenCensusModal,
  onSelectedPatientsChange,
  refreshKey = 0  // Add refresh key prop to trigger re-renders
}) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatients, setSelectedPatients] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'workflow'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
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

  // Sort patients function
  const sortPatients = (patientList) => {
    return [...patientList].sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'name') {
        // Extract last name for sorting (assuming format "Last, First")
        const getLastName = (name) => {
          const parts = name.split(',');
          return parts[0].trim().toLowerCase();
        };
        
        const aName = getLastName(a.patient_name || '');
        const bName = getLastName(b.patient_name || '');
        compareValue = aName.localeCompare(bName);
      } else if (sortBy === 'workflow') {
        // Sort by workflow type with explicit ordering
        const workflowOrder = { 'follow-up': 0, 'admission': 1, 'discharge': 2 };
        const aWorkflow = a.workflow_type || a.status || 'follow-up';
        const bWorkflow = b.workflow_type || b.status || 'follow-up';
        
        const aOrder = workflowOrder[aWorkflow] !== undefined ? workflowOrder[aWorkflow] : 0;
        const bOrder = workflowOrder[bWorkflow] !== undefined ? workflowOrder[bWorkflow] : 0;
        
        compareValue = aOrder - bOrder;
        
        // If same workflow type, sort by name as secondary sort
        if (compareValue === 0) {
          const getLastName = (name) => {
            const parts = name.split(',');
            return parts[0].trim().toLowerCase();
          };
          const aName = getLastName(a.patient_name || '');
          const bName = getLastName(b.patient_name || '');
          compareValue = aName.localeCompare(bName);
        }
      } else if (sortBy === 'completion') {
        // Sort by completion status
        const aCompleted = a.completed || false;
        const bCompleted = b.completed || false;
        
        // Completed patients first (1) or last (0) depending on sort order
        const aValue = aCompleted ? 1 : 0;
        const bValue = bCompleted ? 1 : 0;
        
        compareValue = bValue - aValue; // Completed first in ascending order
        
        // If same completion status, sort by name as secondary sort
        if (compareValue === 0) {
          const getLastName = (name) => {
            const parts = name.split(',');
            return parts[0].trim().toLowerCase();
          };
          const aName = getLastName(a.patient_name || '');
          const bName = getLastName(b.patient_name || '');
          compareValue = aName.localeCompare(bName);
        }
      } else if (sortBy === 'color') {
        // Sort by priority color with specific ordering
        const colorOrder = { 
          'red': 0,        // High priority first
          'orange': 1,     // Medical review 
          'purple': 2,     // Legal status
          'blue': 3,       // Different provider
          'pink': 4,       // Family contact
          'green': 5,      // Discharge planning
          '': 6            // No color last
        };
        
        const aColor = a.priorityColor || '';
        const bColor = b.priorityColor || '';
        
        const aOrder = colorOrder[aColor] !== undefined ? colorOrder[aColor] : 6;
        const bOrder = colorOrder[bColor] !== undefined ? colorOrder[bColor] : 6;
        
        compareValue = aOrder - bOrder;
        
        // If same color, sort by name as secondary sort
        if (compareValue === 0) {
          const getLastName = (name) => {
            const parts = name.split(',');
            return parts[0].trim().toLowerCase();
          };
          const aName = getLastName(a.patient_name || '');
          const bName = getLastName(b.patient_name || '');
          compareValue = aName.localeCompare(bName);
        }
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  };

  // Function to load completion status with daily reset
  const loadCompletionStatus = async (token) => {
    try {
      const today = new Date().toDateString();
      const savedCompletions = localStorage.getItem('patientCompletions');
      const completionMap = savedCompletions ? JSON.parse(savedCompletions) : {};
      const todayCompletions = {};
      
      // Only load today's completions, ignore old data
      Object.keys(completionMap).forEach(patientId => {
        const completionData = completionMap[patientId];
        if (completionData && typeof completionData === 'object' && completionData.date === today) {
          todayCompletions[patientId] = completionData.completed;
        } else if (typeof completionData === 'boolean') {
          // Legacy format - assume it's old, don't carry over
          todayCompletions[patientId] = false;
        } else {
          todayCompletions[patientId] = false;
        }
      });
      
      return todayCompletions;
    } catch (error) {
      console.warn('Failed to load completion status:', error);
      return {};
    }
  };

  // Function to load patient priority colors (persistent across days using patient names)
  const loadPatientColors = () => {
    try {
      const savedColors = localStorage.getItem('patientPriorityColors');
      return savedColors ? JSON.parse(savedColors) : {};
    } catch (error) {
      console.warn('Failed to load patient colors:', error);
      return {};
    }
  };

  // Migration function to convert old ID-based colors to name-based (one-time)
  const migrateOldColorStorage = (patients) => {
    try {
      const savedColors = localStorage.getItem('patientPriorityColors');
      if (!savedColors) return;
      
      const colorMap = JSON.parse(savedColors);
      let migrationNeeded = false;
      const newColorMap = {};
      
      // Check if we have any numeric keys (old ID-based storage)
      Object.keys(colorMap).forEach(key => {
        const isNumericKey = /^\d+$/.test(key);
        if (isNumericKey) {
          // Find patient with this ID
          const patient = patients.find(p => p.id.toString() === key);
          if (patient && patient.patient_name) {
            const patientKey = patient.patient_name.trim().toLowerCase();
            newColorMap[patientKey] = colorMap[key];
            migrationNeeded = true;
            console.log(`Migrated color for patient ID ${key} → '${patient.patient_name}' (key: '${patientKey}')`);
          }
        } else {
          // Keep existing name-based entries
          newColorMap[key] = colorMap[key];
        }
      });
      
      // Save updated mapping if migration occurred
      if (migrationNeeded) {
        localStorage.setItem('patientPriorityColors', JSON.stringify(newColorMap));
        console.log('Color storage migration completed');
      }
    } catch (error) {
      console.warn('Failed to migrate old color storage:', error);
    }
  };

  // Function to save patient priority colors (using patient name as key for rollover persistence)
  const savePatientColor = (patientId, color) => {
    try {
      // Find patient name for this ID
      const patient = patients.find(p => p.id === patientId);
      if (!patient || !patient.patient_name) {
        console.warn(`Cannot save color for patient ${patientId}: patient name not found`);
        return;
      }

      const patientKey = patient.patient_name.trim().toLowerCase(); // Normalize patient name
      const savedColors = localStorage.getItem('patientPriorityColors');
      const colorMap = savedColors ? JSON.parse(savedColors) : {};
      
      if (color) {
        colorMap[patientKey] = color;
      } else {
        delete colorMap[patientKey]; // Remove if no color selected
      }
      
      localStorage.setItem('patientPriorityColors', JSON.stringify(colorMap));
      console.log(`Saved priority color '${color}' for patient '${patient.patient_name}' (key: '${patientKey}')`);
    } catch (error) {
      console.warn('Failed to save patient color:', error);
    }
  };

  // Function to save completion status with daily reset
  const saveCompletionStatus = (patientId, completed) => {
    try {
      const today = new Date().toDateString();
      const savedCompletions = localStorage.getItem('patientCompletions');
      const completionMap = savedCompletions ? JSON.parse(savedCompletions) : {};
      
      // Store with date stamp for daily reset
      completionMap[patientId] = {
        completed: completed,
        date: today
      };
      
      localStorage.setItem('patientCompletions', JSON.stringify(completionMap));
    } catch (error) {
      console.warn('Failed to save completion status:', error);
    }
  };

  // Load patient census data with completion status
  const loadPatients = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No authentication token available, skipping patient load');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Load patient census data
      const response = await fetch(`${apiService.baseURL}/api/patient-census/today`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success && data.census) {
        // Load completion status and colors from localStorage
        const completionStatusMap = await loadCompletionStatus(token);
        
        // Migrate old ID-based color storage to name-based (one-time)
        migrateOldColorStorage(data.census.rows);
        
        // Load colors after potential migration
        const colorMap = loadPatientColors();
        
        // Use existing workflow_type or status, ensure consistency and add completion status and colors
        const patientsWithStatus = data.census.rows.map(patient => {
          const workflowType = patient.workflow_type || patient.status || 'follow-up';
          
          // Normalize workflow type to ensure it's one of the valid options
          const validWorkflowTypes = ['follow-up', 'admission', 'discharge'];
          const normalizedWorkflowType = validWorkflowTypes.includes(workflowType) ? workflowType : 'follow-up';
          
          // Map priority color by patient name (for rollover persistence)
          const patientKey = patient.patient_name ? patient.patient_name.trim().toLowerCase() : '';
          const priorityColor = patientKey ? (colorMap[patientKey] || '') : '';
          
          return {
            ...patient,
            workflow_type: normalizedWorkflowType,
            completed: completionStatusMap[patient.id] || false,
            priorityColor: priorityColor
          };
        });
        
        // Debug: Log workflow type distribution
        const workflowCounts = patientsWithStatus.reduce((acc, patient) => {
          acc[patient.workflow_type] = (acc[patient.workflow_type] || 0) + 1;
          return acc;
        }, {});
        console.log('Workflow type distribution:', workflowCounts);
        
        // Debug: Log completion status distribution
        const completionCounts = patientsWithStatus.reduce((acc, patient) => {
          const status = patient.completed ? 'completed' : 'not_completed';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        console.log('Completion status distribution:', completionCounts);
        
        // Debug: Log color persistence mapping
        const colorCounts = patientsWithStatus.reduce((acc, patient) => {
          const color = patient.priorityColor || 'none';
          acc[color] = (acc[color] || 0) + 1;
          return acc;
        }, {});
        console.log('Priority color distribution:', colorCounts);
        console.log('Color mapping details:', patientsWithStatus.filter(p => p.priorityColor).map(p => ({
          name: p.patient_name,
          id: p.id,
          color: p.priorityColor
        })));
        
        setPatients(sortPatients(patientsWithStatus));
      } else {
        setError('Failed to load patient census');
      }
    } catch (err) {
      console.error('Census loading error:', err);
      setError('Network error loading census');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle patient selection
  const handlePatientSelect = (patientId) => {
    setSelectedPatients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      
      // Notify parent of selection change
      if (onSelectedPatientsChange) {
        const selectedPatientData = patients.filter(p => newSet.has(p.id));
        onSelectedPatientsChange(selectedPatientData);
      }
      
      return newSet;
    });
  };

  // Handle select all/none
  const handleSelectAll = () => {
    const newSelection = selectedPatients.size === patients.length 
      ? new Set() 
      : new Set(patients.map(p => p.id));
    
    setSelectedPatients(newSelection);
    
    // Notify parent of selection change
    if (onSelectedPatientsChange) {
      const selectedPatientData = patients.filter(p => newSelection.has(p.id));
      onSelectedPatientsChange(selectedPatientData);
    }
  };

  // Handle completion toggle
  const handleCompletionToggle = (patientId) => {
    setPatients(prev => prev.map(patient => {
      if (patient.id === patientId) {
        const newCompleted = !patient.completed;
        // Save to localStorage
        saveCompletionStatus(patientId, newCompleted);
        return { ...patient, completed: newCompleted };
      }
      return patient;
    }));
  };

  // Handle priority color change
  const handleColorChange = (patientId, color) => {
    setPatients(prev => prev.map(patient => {
      if (patient.id === patientId) {
        // Save to localStorage
        savePatientColor(patientId, color);
        return { ...patient, priorityColor: color };
      }
      return patient;
    }));
  };

  // Handle workflow type change
  const handleStatusChange = async (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const workflowTypes = ['follow-up', 'admission', 'discharge'];
    const currentIndex = workflowTypes.indexOf(patient.workflow_type || patient.status || 'follow-up');
    const nextIndex = (currentIndex + 1) % workflowTypes.length;
    const newWorkflowType = workflowTypes[nextIndex];

    try {
      // Update in backend
      const response = await fetch(`${apiService.baseURL}/api/patient-census/rows/${patientId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_type: newWorkflowType,
          status: newWorkflowType  // Keep both for compatibility
        })
      });

      if (response.ok) {
        // Update local state only if backend update succeeded
        setPatients(prev => prev.map(pat => {
          if (pat.id === patientId) {
            return { ...pat, workflow_type: newWorkflowType, status: newWorkflowType };
          }
          return pat;
        }));
      } else {
        console.error('Failed to update patient workflow type');
      }
    } catch (error) {
      console.error('Error updating patient workflow type:', error);
    }
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Change sort field and reset to ascending
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // Re-sort patients when sort options change
  useEffect(() => {
    setPatients(prev => {
      const sorted = sortPatients(prev);
      
      // Debug: Log sort results when sorting by workflow
      if (sortBy === 'workflow') {
        console.log('Sorting by workflow type:', {
          sortBy,
          sortOrder,
          totalPatients: prev.length,
          sortedPatients: sorted.length,
          workflowGroups: sorted.reduce((acc, patient) => {
            acc[patient.workflow_type] = (acc[patient.workflow_type] || 0) + 1;
            return acc;
          }, {})
        });
      }
      
      return sorted;
    });
  }, [sortBy, sortOrder]);

  useEffect(() => {
    loadPatients();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadPatients, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadPatients, refreshKey]); // Add refreshKey as dependency

  if (loading) {
    return (
      <div style={{
        backgroundColor: styles.bgPrimary,
        borderRadius: '8px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div className="loading-spinner" style={{ 
          width: '32px', 
          height: '32px',
          margin: '0 auto 16px'
        }}></div>
        <div style={{ color: styles.textMuted, fontSize: '14px' }}>
          Loading patient census...
        </div>
      </div>
    );
  }

  return (
    <div 
      data-component="patient-census"
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
          marginBottom: '12px'
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: styles.textPrimary
            }}>
              Patient Census
            </h3>
            <div style={{
              fontSize: '11px',
              color: styles.textMuted,
              marginTop: '2px'
            }}>
              {selectedPatients.size} of {patients.length} selected
            </div>
          </div>
          <button
            onClick={onOpenCensusModal}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: currentTheme === 'dark' ? '#ffffff' : styles.primaryColor,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
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
            Manage
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: `${styles.errorColor}15`,
            borderLeft: `4px solid ${styles.errorColor}`,
            color: styles.errorColor,
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '12px'
          }}>
            {error}
          </div>
        )}

        {/* Controls Container */}
        <div style={{
          backgroundColor: styles.bgSecondary,
          border: `1px solid ${styles.borderColor}`,
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '8px'
        }}>
          {/* Section Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            paddingBottom: '6px',
            borderBottom: `1px solid ${styles.borderColor}`
          }}>
            <div style={{
              width: '3px',
              height: '14px',
              backgroundColor: styles.primaryColor,
              marginRight: '8px',
              borderRadius: '2px'
            }}></div>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: styles.textPrimary,
              letterSpacing: '0.025em'
            }}>
              Patient Organization
            </span>
          </div>

          {/* Controls Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {/* Sort Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexWrap: 'wrap'
            }}>
              <span style={{
                fontSize: '10px',
                color: styles.textMuted,
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginRight: '6px'
              }}>
                Sort:
              </span>
              <button
                onClick={() => handleSortChange('name')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: sortBy === 'name' ? styles.primaryColor : styles.bgPrimary,
                  color: sortBy === 'name' ? '#ffffff' : styles.textSecondary,
                  border: `1px solid ${sortBy === 'name' ? styles.primaryColor : styles.borderColor}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (sortBy !== 'name') {
                    e.target.style.backgroundColor = styles.bgAccent;
                    e.target.style.borderColor = styles.primaryColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortBy !== 'name') {
                    e.target.style.backgroundColor = styles.bgPrimary;
                    e.target.style.borderColor = styles.borderColor;
                  }
                }}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortChange('workflow')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: sortBy === 'workflow' ? styles.primaryColor : styles.bgPrimary,
                  color: sortBy === 'workflow' ? '#ffffff' : styles.textSecondary,
                  border: `1px solid ${sortBy === 'workflow' ? styles.primaryColor : styles.borderColor}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (sortBy !== 'workflow') {
                    e.target.style.backgroundColor = styles.bgAccent;
                    e.target.style.borderColor = styles.primaryColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortBy !== 'workflow') {
                    e.target.style.backgroundColor = styles.bgPrimary;
                    e.target.style.borderColor = styles.borderColor;
                  }
                }}
              >
                Type {sortBy === 'workflow' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortChange('completion')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: sortBy === 'completion' ? styles.primaryColor : styles.bgPrimary,
                  color: sortBy === 'completion' ? '#ffffff' : styles.textSecondary,
                  border: `1px solid ${sortBy === 'completion' ? styles.primaryColor : styles.borderColor}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (sortBy !== 'completion') {
                    e.target.style.backgroundColor = styles.bgAccent;
                    e.target.style.borderColor = styles.primaryColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortBy !== 'completion') {
                    e.target.style.backgroundColor = styles.bgPrimary;
                    e.target.style.borderColor = styles.borderColor;
                  }
                }}
              >
                Status {sortBy === 'completion' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortChange('color')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: sortBy === 'color' ? styles.primaryColor : styles.bgPrimary,
                  color: sortBy === 'color' ? '#ffffff' : styles.textSecondary,
                  border: `1px solid ${sortBy === 'color' ? styles.primaryColor : styles.borderColor}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (sortBy !== 'color') {
                    e.target.style.backgroundColor = styles.bgAccent;
                    e.target.style.borderColor = styles.primaryColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortBy !== 'color') {
                    e.target.style.backgroundColor = styles.bgPrimary;
                    e.target.style.borderColor = styles.borderColor;
                  }
                }}
              >
                Priority {sortBy === 'color' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>

            {/* Selection Controls */}
            <button
              onClick={handleSelectAll}
              style={{
                padding: '4px 12px',
                backgroundColor: styles.bgPrimary,
                color: styles.textSecondary,
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = styles.bgAccent;
                e.target.style.borderColor = styles.primaryColor;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = styles.bgPrimary;
                e.target.style.borderColor = styles.borderColor;
              }}
            >
              {selectedPatients.size === patients.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {patients.length > 0 ? (
          patients.map(patient => (
            <PatientListItem
              key={patient.id}
              patient={patient}
              isSelected={selectedPatients.has(patient.id)}
              onSelect={handlePatientSelect}
              onStatusChange={handleStatusChange}
              onCompletionToggle={handleCompletionToggle}
              onColorChange={handleColorChange}
              theme={currentTheme}
            />
          ))
        ) : (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: styles.textMuted
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '14px' }}>No patients in census</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Click "Manage" to add patients
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientCensusCard;