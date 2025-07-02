// Patient Census Management Modal - Backend-integrated version
import React, { useState, useEffect, useCallback } from 'react';
import './PatientCensusModal.css';

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
    'follow-up': { icon: '🔄', label: 'Follow-up', color: '#3b82f6' },
    'admission': { icon: '🏥', label: 'Admission', color: '#10b981' },
    'discharge': { icon: '🏠', label: 'Discharge', color: '#ef4444' }
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

  const handleSave = () => {
    onUpdate(patient.id, editData);
    setIsEditing(false);
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
                ✕ Cancel
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
                ✏️ Edit
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
                🗑️ Remove
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
  
  // Form states for adding new patients
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientId, setNewPatientId] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newWorkflowType, setNewWorkflowType] = useState('follow-up');
  
  const styles = getThemeStyles(theme);

  // Load patient census data
  const loadCensusData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:5001/api/patient-census/today', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success && data.census) {
        setPatients(data.census.rows || []);
        
        // Calculate stats
        const total = data.census.rows?.length || 0;
        const workflowCounts = (data.census.rows || []).reduce((acc, patient) => {
          const workflowType = patient.workflow_type || patient.status || 'follow-up';
          acc[workflowType] = (acc[workflowType] || 0) + 1;
          return acc;
        }, {});
        
        setStats({
          total,
          followUp: workflowCounts['follow-up'] || 0,
          admission: workflowCounts['admission'] || 0,
          discharge: workflowCounts['discharge'] || 0
        });
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

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Add new patient
  const handleAddPatient = async () => {
    if (!newPatientName.trim() || !newPatientId.trim()) {
      showNotification('Please enter both patient name and ID', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/patient-census/1/rows', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patient_name: newPatientName.trim(),
          patient_id: newPatientId.trim(),
          room_number: newRoomNumber.trim() || null,
          workflow_type: newWorkflowType,
          status: newWorkflowType,  // Keep status for backward compatibility
          data_fields: {}
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewPatientName('');
        setNewPatientId('');
        setNewRoomNumber('');
        setNewWorkflowType('follow-up');
        showNotification('Patient added successfully!', 'success');
        loadCensusData(); // Refresh the list
        
        // Notify parent component of data change
        if (onDataChange) {
          onDataChange();
        }
      } else {
        showNotification(data.error || 'Failed to add patient', 'error');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      showNotification('Network error adding patient', 'error');
    }
  };

  // Update patient
  const handleUpdatePatient = async (patientId, updates) => {
    try {
      const response = await fetch(`http://localhost:5001/api/patient-census/rows/${patientId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setPatients(prev => prev.map(patient => 
          patient.id === patientId ? { ...patient, ...updates } : patient
        ));
        showNotification('Patient updated successfully!', 'success');
        
        // Notify parent component of data change
        if (onDataChange) {
          onDataChange();
        }
      } else {
        showNotification(data.error || 'Failed to update patient', 'error');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      showNotification('Network error updating patient', 'error');
    }
  };

  // Delete patient
  const handleDeletePatient = async (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    if (window.confirm(`Are you sure you want to remove ${patient.patient_name} from the census?`)) {
      try {
        const response = await fetch(`http://localhost:5001/api/patient-census/rows/${patientId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (data.success) {
          // Update local state
          setPatients(prev => prev.filter(p => p.id !== patientId));
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
        showNotification('Network error removing patient', 'error');
      }
    }
  };

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
          backgroundColor: styles.bgPrimary,
          border: `1px solid ${styles.borderColor}`,
          maxWidth: '900px',
          width: '90vw',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 20px 24px',
          borderBottom: `1px solid ${styles.borderColor}`,
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
              fontSize: '20px',
              fontWeight: '600',
              color: styles.textPrimary
            }}>
              👥 Patient Census Management
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: '8px 12px',
                backgroundColor: 'transparent',
                color: styles.textMuted,
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '20px'
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

          {/* Add Patient Form */}
          <div style={{
            padding: '16px',
            backgroundColor: styles.bgSecondary,
            borderRadius: '8px',
            border: `1px solid ${styles.borderColor}`
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
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ➕ Add
              </button>
            </div>
          </div>
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
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: styles.textPrimary
                  }}>
                    Workflow Type
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: styles.textPrimary
                  }}>
                    Patient Name
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
                {patients.length > 0 ? (
                  patients.map(patient => (
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
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
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