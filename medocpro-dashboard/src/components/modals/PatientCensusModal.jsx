// Patient Census Management Modal - Backend-integrated version
import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PatientCensusModal.css';
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

// Patient workflow type configuration
const getWorkflowDisplay = (workflowType) => {
  const workflowConfig = {
    'follow-up': { icon: '', label: 'Follow-up', color: '#3b82f6' },
    'admission': { icon: '', label: 'Admission', color: '#10b981' },
    'discharge': { icon: '', label: 'Discharge', color: '#ef4444' }
  };
  return workflowConfig[workflowType] || workflowConfig['follow-up'];
};

// Individual patient row component for editing
const EditablePatientRow = ({ patient, onUpdate, onDelete, theme }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    patient_name: patient.patient_name || '',
    patient_id: patient.patient_id || '',
    room_number: patient.room_number || '',
    workflow_type: patient.workflow_type || patient.status || 'follow-up'
  });
  const styles = getThemeStyles(theme);
  const workflowDisplay = getWorkflowDisplay(patient.workflow_type || patient.status);

  const handleSave = async () => {
    try {
      await onUpdate(patient.id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving patient:', error);
      // Keep editing mode active if save fails
      // Error notification is handled by the parent component
    }
  };

  const handleCancel = () => {
    setEditData({
      patient_name: patient.patient_name || '',
      patient_id: patient.patient_id || '',
      room_number: patient.room_number || '',
      workflow_type: patient.workflow_type || patient.status || 'follow-up'
    });
    setIsEditing(false);
  };

  return (
    <tr style={{ 
      backgroundColor: isEditing ? styles.bgAccent : 'transparent',
      borderBottom: `1px solid ${styles.borderColor}`
    }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontSize: '14px' }}>{workflowDisplay.icon}</span>
          {isEditing ? (
            <select
              value={editData.workflow_type}
              onChange={(e) => setEditData(prev => ({ ...prev, workflow_type: e.target.value }))}
              style={{
                padding: '4px 8px',
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '4px',
                backgroundColor: styles.bgPrimary,
                color: styles.textPrimary,
                fontSize: '12px'
              }}
            >
              <option value="follow-up">Follow-up</option>
              <option value="admission">Admission</option>
              <option value="discharge">Discharge</option>
            </select>
          ) : (
            <span style={{
              fontSize: '12px',
              color: workflowDisplay.color,
              fontWeight: '500'
            }}>
              {workflowDisplay.label}
            </span>
          )}
        </div>
      </td>
      
      <td style={{ padding: '12px 16px' }}>
        {isEditing ? (
          <input
            type="text"
            value={editData.patient_name}
            onChange={(e) => setEditData(prev => ({ ...prev, patient_name: e.target.value }))}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '4px',
              backgroundColor: styles.bgPrimary,
              color: styles.textPrimary,
              fontSize: '13px'
            }}
          />
        ) : (
          <span style={{ color: styles.textPrimary, fontSize: '13px', fontWeight: '500' }}>
            {patient.patient_name || 'Unknown Patient'}
          </span>
        )}
      </td>
      
      <td style={{ padding: '12px 16px' }}>
        {isEditing ? (
          <input
            type="text"
            value={editData.patient_id}
            onChange={(e) => setEditData(prev => ({ ...prev, patient_id: e.target.value }))}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '4px',
              backgroundColor: styles.bgPrimary,
              color: styles.textPrimary,
              fontSize: '13px'
            }}
          />
        ) : (
          <span style={{ color: styles.textSecondary, fontSize: '12px' }}>
            {patient.patient_id || 'No ID'}
          </span>
        )}
      </td>
      
      <td style={{ padding: '12px 16px' }}>
        {isEditing ? (
          <input
            type="text"
            value={editData.room_number}
            onChange={(e) => setEditData(prev => ({ ...prev, room_number: e.target.value }))}
            placeholder="Room #"
            style={{
              width: '80px',
              padding: '6px 8px',
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '4px',
              backgroundColor: styles.bgPrimary,
              color: styles.textPrimary,
              fontSize: '13px'
            }}
          />
        ) : (
          <span style={{ color: styles.textSecondary, fontSize: '12px' }}>
            {patient.room_number || '-'}
          </span>
        )}
      </td>
      
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                style={{
                  padding: '4px 8px',
                  backgroundColor: styles.successColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                ✓ Save
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: '4px 8px',
                  backgroundColor: styles.bgAccent,
                  color: styles.textPrimary,
                  border: `1px solid ${styles.borderColor}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
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
                Edit
              </button>
              <button
                onClick={() => onDelete(patient.id)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'transparent',
                  color: styles.errorColor,
                  border: `1px solid ${styles.errorColor}30`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

// Main Patient Census Modal Component
const PatientCensusModal = ({ isOpen, onClose, theme = 'dark', onDataChange }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({ total: 0, followUp: 0, admission: 0, discharge: 0 });
  const dataChangeTimeoutRef = useRef(null);
  
  // Sorting states
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'type'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  
  // Add patient form visibility
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form states for adding new patients
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientId, setNewPatientId] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newWorkflowType, setNewWorkflowType] = useState('follow-up');
  
  const styles = getThemeStyles(theme);

  // Calculate stats from current patients
  const calculateStats = useCallback((patientList) => {
    const total = patientList.length;
    const workflowCounts = patientList.reduce((acc, patient) => {
      let workflowType = patient.workflow_type || patient.status || 'follow-up';
      // Treat 'active' patients as 'follow-up' for statistics
      if (workflowType === 'active') {
        workflowType = 'follow-up';
      }
      acc[workflowType] = (acc[workflowType] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total,
      followUp: workflowCounts['follow-up'] || 0,
      admission: workflowCounts['admission'] || 0,
      discharge: workflowCounts['discharge'] || 0
    };
  }, []);

  // Load patient census data
  const loadCensusData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      console.log('No authentication token available, skipping census load in modal');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Use API service which handles token refresh automatically
      const data = await apiService.getPatientCensusToday();
      
      if (data.success && data.census) {
        const patientList = data.census.rows || [];
        setPatients(patientList);
        setStats(calculateStats(patientList));
      } else {
        setError('Failed to load patient census');
      }
    } catch (err) {
      console.error('Census loading error:', err);
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError('Session expired. Please log in again.');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setError('Network error loading census');
      }
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Cleanup timeouts when modal closes
  useEffect(() => {
    return () => {
      if (dataChangeTimeoutRef.current) {
        clearTimeout(dataChangeTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to check if token is expired and handle auth errors
  const checkAndRefreshToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Session expired. Please log in again.', 'error');
      setTimeout(() => window.location.reload(), 2000);
      return false;
    }
    return true;
  };

  // Add new patient
  const handleAddPatient = async () => {
    if (!newPatientName.trim() || !newPatientId.trim()) {
      showNotification('Please enter both patient name and ID', 'error');
      return;
    }

    try {
      // First get today's census to get the correct census ID
      const censusData = await apiService.getPatientCensusToday();
      if (!censusData.success || !censusData.census) {
        showNotification('Failed to get census information', 'error');
        return;
      }

      const censusId = censusData.census.id;

      const patientData = {
        patient_name: newPatientName.trim(),
        patient_id: newPatientId.trim(),
        room_number: newRoomNumber.trim() || null,
        workflow_type: newWorkflowType,
        status: newWorkflowType,  // Keep status for backward compatibility
        data_fields: {}
      };

      const data = await apiService.addPatientToCensus(censusId, patientData);
      
      if (data.success) {
        // Add the new patient to local state and update stats
        const newPatient = {
          id: data.patient_id || Date.now(), // Use returned ID or fallback
          patient_name: newPatientName.trim(),
          patient_id: newPatientId.trim(),
          room_number: newRoomNumber.trim() || null,
          workflow_type: newWorkflowType,
          status: newWorkflowType
        };
        
        const updatedPatients = [...patients, newPatient];
        setPatients(updatedPatients);
        setStats(calculateStats(updatedPatients));
        
        setNewPatientName('');
        setNewPatientId('');
        setNewRoomNumber('');
        setNewWorkflowType('follow-up');
        setShowAddForm(false);
        showNotification('Patient added successfully!', 'success');
        
        // Debounce parent component notification to avoid excessive API calls
        if (onDataChange) {
          if (dataChangeTimeoutRef.current) {
            clearTimeout(dataChangeTimeoutRef.current);
          }
          dataChangeTimeoutRef.current = setTimeout(() => {
            onDataChange();
          }, 500); // Wait 500ms before notifying parent
        }
      } else {
        showNotification(data.error || 'Failed to add patient', 'error');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        showNotification('Session expired. Please log in again.', 'error');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showNotification('Network error adding patient', 'error');
      }
    }
  };

  // Update patient
  const handleUpdatePatient = async (patientId, updates) => {
    console.log('handleUpdatePatient called with:', { patientId, updates });
    
    try {
      const data = await apiService.updatePatientInCensus(patientId, updates);
      console.log('Response data:', data);
      
      if (data.success) {
        // Update local state and recalculate stats
        const updatedPatients = patients.map(patient => 
          patient.id === patientId ? { ...patient, ...updates } : patient
        );
        setPatients(updatedPatients);
        setStats(calculateStats(updatedPatients));
        showNotification('Patient updated successfully!', 'success');
        
        // Debounce parent component notification to avoid excessive API calls
        if (onDataChange) {
          if (dataChangeTimeoutRef.current) {
            clearTimeout(dataChangeTimeoutRef.current);
          }
          dataChangeTimeoutRef.current = setTimeout(() => {
            onDataChange();
          }, 500); // Wait 500ms before notifying parent
        }
      } else {
        showNotification(data.error || 'Failed to update patient', 'error');
        throw new Error(data.error || 'Failed to update patient');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        showNotification('Session expired. Please log in again.', 'error');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showNotification('Network error updating patient', 'error');
      }
      throw error; // Re-throw to let EditablePatientRow handle it
    }
  };

  // Delete patient
  const handleDeletePatient = async (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    if (window.confirm(`Are you sure you want to remove ${patient.patient_name} from the census?`)) {
      try {
        const data = await apiService.deletePatientFromCensus(patientId);
        
        if (data.success) {
          // Update local state and recalculate stats
          const updatedPatients = patients.filter(p => p.id !== patientId);
          setPatients(updatedPatients);
          setStats(calculateStats(updatedPatients));
          showNotification('Patient removed from census', 'success');
          
          // Notify parent component of data change
          if (onDataChange) {
            onDataChange();
          }
        } else {
          showNotification('Failed to remove patient', 'error');
        }
      } catch (error) {
        console.error('Error deleting patient:', error);
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          showNotification('Session expired. Please log in again.', 'error');
          setTimeout(() => window.location.reload(), 2000);
        } else {
          showNotification('Network error removing patient', 'error');
        }
      }
    }
  };

  // Sort patients function
  const sortPatients = (patientsToSort) => {
    return [...patientsToSort].sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'name') {
        // Extract last name for sorting (assumes "Last, First" format)
        aValue = (a.patient_name || '').split(',')[0].trim().toLowerCase();
        bValue = (b.patient_name || '').split(',')[0].trim().toLowerCase();
      } else if (sortBy === 'type') {
        aValue = a.workflow_type || a.status || 'follow-up';
        bValue = b.workflow_type || b.status || 'follow-up';
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Get sorted patients
  const sortedPatients = sortPatients(patients);

  useEffect(() => {
    if (isOpen) {
      loadCensusData();
    }
  }, [isOpen, loadCensusData]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content patient-census-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: styles.modalBackground,
          border: `1px solid ${styles.borderColor}`,
          borderRadius: '8px',
          maxWidth: '900px',
          width: '90vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: theme === 'dark' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${styles.borderColor}`,
          backgroundColor: styles.bgSecondary,
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: styles.textPrimary
            }}>
              Patient Census Management
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: styles.textMuted,
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              ×
            </button>
          </div>

          {/* Stats and Sort Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              gap: '20px'
            }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: styles.textPrimary }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '12px', color: styles.textMuted }}>Total Patients</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {stats.followUp}
              </div>
              <div style={{ fontSize: '12px', color: styles.textMuted }}>Follow-up</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                {stats.admission}
              </div>
              <div style={{ fontSize: '12px', color: styles.textMuted }}>Admission</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                {stats.discharge}
              </div>
              <div style={{ fontSize: '12px', color: styles.textMuted }}>Discharge</div>
            </div>
            </div>
            
            {/* Sort Controls and Add Patient Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  fontSize: '12px',
                  color: styles.textMuted,
                  fontWeight: '500'
                }}>
                  Sort by:
                </span>
                <button
                  onClick={() => handleSort('name')}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: sortBy === 'name' ? styles.primaryColor : 'transparent',
                    color: sortBy === 'name' ? 'white' : styles.textSecondary,
                    border: `1px solid ${sortBy === 'name' ? styles.primaryColor : styles.borderColor}`,
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('type')}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: sortBy === 'type' ? styles.primaryColor : 'transparent',
                    color: sortBy === 'type' ? 'white' : styles.textSecondary,
                    border: `1px solid ${sortBy === 'type' ? styles.primaryColor : styles.borderColor}`,
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
              
              {/* Add Patient Button */}
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: styles.primaryColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Add Patient
              </button>
            </div>
          </div>
          
          {/* Add Patient Form */}
          {showAddForm && (
            <div style={{
              padding: '16px',
              backgroundColor: styles.bgSecondary,
              borderRadius: '8px',
              border: `1px solid ${styles.borderColor}`,
              marginTop: '20px'
            }}>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: styles.textPrimary
              }}>
                Add New Patient
              </h4>
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 2 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: styles.textSecondary,
                    marginBottom: '4px'
                  }}>
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="Last, First M."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${styles.borderColor}`,
                      borderRadius: '6px',
                      backgroundColor: styles.bgPrimary,
                      color: styles.textPrimary,
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: styles.textSecondary,
                    marginBottom: '4px'
                  }}>
                    Patient ID
                  </label>
                  <input
                    type="text"
                    value={newPatientId}
                    onChange={(e) => setNewPatientId(e.target.value)}
                    placeholder="PT001"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${styles.borderColor}`,
                      borderRadius: '6px',
                      backgroundColor: styles.bgPrimary,
                      color: styles.textPrimary,
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: styles.textSecondary,
                    marginBottom: '4px'
                  }}>
                    Room #
                  </label>
                  <input
                    type="text"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder="101"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${styles.borderColor}`,
                      borderRadius: '6px',
                      backgroundColor: styles.bgPrimary,
                      color: styles.textPrimary,
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: styles.textSecondary,
                    marginBottom: '4px'
                  }}>
                    Workflow
                  </label>
                  <select
                    value={newWorkflowType}
                    onChange={(e) => setNewWorkflowType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${styles.borderColor}`,
                      borderRadius: '6px',
                      backgroundColor: styles.bgPrimary,
                      color: styles.textPrimary,
                      fontSize: '13px'
                    }}
                  >
                    <option value="follow-up">Follow-up</option>
                    <option value="admission">Admission</option>
                    <option value="discharge">Discharge</option>
                  </select>
                </div>
                <button
                  onClick={handleAddPatient}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: styles.primaryColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewPatientName('');
                    setNewPatientId('');
                    setNewRoomNumber('');
                    setNewWorkflowType('follow-up');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: styles.textSecondary,
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Notification */}
        {notification && (
          <div style={{
            padding: '12px 24px',
            backgroundColor: notification.type === 'error' ? 
              `${styles.errorColor}15` : `${styles.successColor}15`,
            borderBottom: `1px solid ${notification.type === 'error' ? 
              styles.errorColor : styles.successColor}30`,
            color: notification.type === 'error' ? styles.errorColor : styles.successColor,
            fontSize: '13px'
          }}>
            {notification.message}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '12px 24px',
            backgroundColor: `${styles.errorColor}15`,
            borderBottom: `1px solid ${styles.errorColor}30`,
            color: styles.errorColor,
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        {/* Patient List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{
              padding: '40px',
              textAlign: 'center'
            }}>
              <div className="loading-spinner" style={{ 
                width: '32px', 
                height: '32px',
                margin: '0 auto 16px'
              }}></div>
              <div style={{ color: styles.textMuted }}>Loading patient census...</div>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: styles.bgSecondary,
                  borderBottom: `2px solid ${styles.borderColor}`
                }}>
                  <th 
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: styles.textPrimary,
                      cursor: 'pointer',
                      userSelect: 'none',
                      position: 'relative'
                    }}
                    onClick={() => handleSort('type')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Workflow Type
                      <span style={{ 
                        opacity: sortBy === 'type' ? 1 : 0.3,
                        fontSize: '10px'
                      }}>
                        {sortBy === 'type' && sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    </div>
                  </th>
                  <th 
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: styles.textPrimary,
                      cursor: 'pointer',
                      userSelect: 'none',
                      position: 'relative'
                    }}
                    onClick={() => handleSort('name')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Patient Name
                      <span style={{ 
                        opacity: sortBy === 'name' ? 1 : 0.3,
                        fontSize: '10px'
                      }}>
                        {sortBy === 'name' && sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    </div>
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: styles.textPrimary
                  }}>
                    Patient ID
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: styles.textPrimary
                  }}>
                    Room
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: styles.textPrimary
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPatients.length > 0 ? (
                  sortedPatients.map(patient => (
                    <EditablePatientRow
                      key={patient.id}
                      patient={patient}
                      onUpdate={handleUpdatePatient}
                      onDelete={handleDeletePatient}
                      theme={theme}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: styles.textMuted
                      }}
                    >
                      <div style={{ fontSize: '16px', marginBottom: '12px', fontWeight: '500', color: styles.textMuted }}>No Data</div>
                      <div>No patients in census</div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        Add patients using the form above
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientCensusModal;