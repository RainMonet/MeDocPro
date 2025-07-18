import React, { useState, useEffect, useCallback } from 'react';

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

// Individual patient row component
const PatientListItem = ({ patient, isSelected, onSelect, onStatusChange, theme }) => {
  const [isHovered, setIsHovered] = useState(false);
  const styles = getThemeStyles(theme);
  const workflowDisplay = getWorkflowDisplay(patient.workflow_type || patient.status || 'follow-up');

  const getBackgroundColor = () => {
    if (isSelected) return `${styles.primaryColor}15`;
    if (isHovered) return styles.bgAccent;
    return 'transparent';
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: `1px solid ${styles.borderColor}`,
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
          <span style={{
            fontSize: '12px',
            color: styles.textMuted,
            backgroundColor: styles.bgSecondary,
            padding: '2px 6px',
            borderRadius: '10px'
          }}>
            {patient.patient_id || 'No ID'}
          </span>
          {patient.room_number && (
            <span style={{
              fontSize: '12px',
              color: styles.textMuted
            }}>
              Room {patient.room_number}
            </span>
          )}
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

      {/* Workflow Type Indicator */}
      <div
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
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  };

  // Load patient census data
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
      
      const response = await fetch('http://localhost:5000/api/patient-census/today', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success && data.census) {
        // Use existing workflow_type or status, ensure consistency
        const patientsWithStatus = data.census.rows.map(patient => {
          const workflowType = patient.workflow_type || patient.status || 'follow-up';
          
          // Normalize workflow type to ensure it's one of the valid options
          const validWorkflowTypes = ['follow-up', 'admission', 'discharge'];
          const normalizedWorkflowType = validWorkflowTypes.includes(workflowType) ? workflowType : 'follow-up';
          
          return {
            ...patient,
            workflow_type: normalizedWorkflowType
          };
        });
        
        // Debug: Log workflow type distribution
        const workflowCounts = patientsWithStatus.reduce((acc, patient) => {
          acc[patient.workflow_type] = (acc[patient.workflow_type] || 0) + 1;
          return acc;
        }, {});
        console.log('Workflow type distribution:', workflowCounts);
        
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
      const response = await fetch(`http://localhost:5000/api/patient-census/rows/${patientId}`, {
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
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: styles.textPrimary
          }}>
            Patient Census
          </h3>
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

        {/* Sort, Selection Controls and Status */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          marginBottom: '4px'
        }}>
          {/* Sort and Select Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ color: styles.textMuted, fontSize: '11px' }}>Sort:</span>
            <button
              onClick={() => handleSortChange('name')}
              style={{
                padding: '0 6px',
                backgroundColor: sortBy === 'name' ? styles.primaryColor : 'transparent',
                color: sortBy === 'name' ? '#ffffff' : styles.textSecondary,
                border: 'none',
                borderRadius: '3px',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                lineHeight: '1',
                height: '14px'
              }}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('workflow')}
              style={{
                padding: '0 6px',
                backgroundColor: sortBy === 'workflow' ? styles.primaryColor : 'transparent',
                color: sortBy === 'workflow' ? '#ffffff' : styles.textSecondary,
                border: 'none',
                borderRadius: '3px',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                lineHeight: '1',
                height: '14px'
              }}
            >
              Type {sortBy === 'workflow' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={handleSelectAll}
              style={{
                padding: '0 6px',
                backgroundColor: 'transparent',
                color: styles.textSecondary,
                border: 'none',
                borderRadius: '3px',
                fontSize: '10px',
                cursor: 'pointer',
                lineHeight: '1',
                height: '14px'
              }}
            >
              {selectedPatients.size === patients.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Selection Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10px'
          }}>
            <span style={{ color: styles.textMuted }}>
              {selectedPatients.size} of {patients.length} selected
            </span>
            <span style={{ color: styles.textMuted, fontSize: '9px' }}>|</span>
            <span style={{ color: styles.textMuted, fontSize: '9px' }}>
              Selection synced with batch generation
            </span>
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