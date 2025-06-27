import React, { useState, useEffect, useCallback } from 'react';

// Helper function for theme-aware styling
const getThemeStyles = (theme) => ({
  textPrimary: theme === 'dark' ? '#f1f5f9' : '#1f2937',
  textSecondary: theme === 'dark' ? '#cbd5e1' : '#6b7280',
  textMuted: theme === 'dark' ? '#94a3b8' : '#9ca3af',
  bgPrimary: theme === 'dark' ? '#1e293b' : 'white',
  bgSecondary: theme === 'dark' ? '#0f172a' : '#f8fafc',
  bgAccent: theme === 'dark' ? '#374151' : '#f3f4f6',
  borderColor: theme === 'dark' ? '#475569' : '#e5e7eb',
  inputBg: theme === 'dark' ? '#374151' : 'white'
});

// Patient status icons and colors
const getStatusDisplay = (status) => {
  const statusConfig = {
    active: { icon: '🟢', label: 'Active', color: '#10b981' },
    admitted: { icon: '🆕', label: 'New Admission', color: '#3b82f6' },
    discharged: { icon: '🏠', label: 'Discharged', color: '#6b7280' },
    transferred: { icon: '🔄', label: 'Transferred', color: '#f59e0b' }
  };
  return statusConfig[status] || statusConfig.active;
};

// Editable cell component
const EditableCell = ({ value, onChange, onBlur, field, isEditing, theme = 'dark' }) => {
  const [editValue, setEditValue] = useState(value || '');
  const styles = getThemeStyles(theme);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSubmit = () => {
    onChange(field, editValue);
    onBlur();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      onBlur();
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={handleKeyPress}
        autoFocus
        style={{
          width: '100%',
          padding: '4px 8px',
          border: `1px solid ${styles.borderColor}`,
          borderRadius: '4px',
          backgroundColor: styles.inputBg,
          color: styles.textPrimary,
          fontSize: '13px'
        }}
      />
    );
  }

  return (
    <div
      onClick={() => onChange(field, editValue)}
      style={{
        padding: '6px 8px',
        minHeight: '20px',
        cursor: 'pointer',
        borderRadius: '4px',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = styles.bgAccent}
      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
    >
      {value || <span style={{ color: styles.textMuted, fontStyle: 'italic' }}>Click to edit</span>}
    </div>
  );
};

// Individual patient row component
const PatientRow = ({ 
  row, 
  columns, 
  onUpdateRow, 
  onDeleteRow, 
  onPopulateFromScratch, 
  scratchNotes,
  theme = 'dark' 
}) => {
  const [editingCell, setEditingCell] = useState(null);
  const [showScratchMenu, setShowScratchMenu] = useState(false);
  const styles = getThemeStyles(theme);
  const statusDisplay = getStatusDisplay(row.status);

  const handleCellUpdate = (field, value) => {
    if (field === 'room_number' || field === 'patient_name' || field === 'patient_id') {
      // Update basic fields
      onUpdateRow(row.id, { [field]: value });
    } else {
      // Update data fields
      const updatedDataFields = { ...row.data_fields, [field]: value };
      onUpdateRow(row.id, { data_fields: updatedDataFields });
    }
    setEditingCell(null);
  };

  const handleStatusChange = (newStatus) => {
    onUpdateRow(row.id, { status: newStatus });
  };

  const populateFromScratchNote = (scratchNote) => {
    onPopulateFromScratch(row.id, scratchNote.id);
    setShowScratchMenu(false);
  };

  return (
    <tr style={{ 
      borderBottom: `1px solid ${styles.borderColor}`,
      transition: 'background-color 0.2s ease'
    }}>
      {/* Status Column */}
      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{statusDisplay.icon}</span>
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{
              padding: '4px 8px',
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '4px',
              backgroundColor: styles.inputBg,
              color: styles.textPrimary,
              fontSize: '12px'
            }}
          >
            <option value="active">Active</option>
            <option value="admitted">Admitted</option>
            <option value="discharged">Discharged</option>
            <option value="transferred">Transferred</option>
          </select>
        </div>
      </td>

      {/* Room Number */}
      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
        <EditableCell
          value={row.room_number}
          field="room_number"
          isEditing={editingCell === 'room_number'}
          onChange={() => setEditingCell('room_number')}
          onBlur={() => setEditingCell(null)}
          theme={theme}
        />
      </td>

      {/* Patient Name */}
      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
        <EditableCell
          value={row.patient_name}
          field="patient_name"
          isEditing={editingCell === 'patient_name'}
          onChange={() => setEditingCell('patient_name')}
          onBlur={() => setEditingCell(null)}
          theme={theme}
        />
      </td>

      {/* Dynamic Data Fields */}
      {columns.map(column => (
        <td key={column} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
          <EditableCell
            value={row.data_fields?.[column]}
            field={column}
            isEditing={editingCell === column}
            onChange={handleCellUpdate}
            onBlur={() => setEditingCell(null)}
            theme={theme}
          />
        </td>
      ))}

      {/* Actions Column */}
      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', gap: '4px', position: 'relative' }}>
          <button
            onClick={() => setShowScratchMenu(!showScratchMenu)}
            disabled={scratchNotes.length === 0}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: scratchNotes.length > 0 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(156, 163, 175, 0.2)',
              color: styles.textPrimary,
              cursor: scratchNotes.length > 0 ? 'pointer' : 'not-allowed',
              opacity: scratchNotes.length > 0 ? 1 : 0.5
            }}
          >
            📝 Import
          </button>
          
          <button
            onClick={() => onDeleteRow(row.id)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: styles.textPrimary,
              cursor: 'pointer'
            }}
          >
            🗑️
          </button>

          {/* Scratch Notes Menu */}
          {showScratchMenu && scratchNotes.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              zIndex: 100,
              backgroundColor: styles.bgPrimary,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '6px',
              padding: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              minWidth: '200px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: styles.textPrimary,
                marginBottom: '8px',
                paddingBottom: '4px',
                borderBottom: `1px solid ${styles.borderColor}`
              }}>
                Import from Scratch Notes
              </div>
              {scratchNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => populateFromScratchNote(note)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    marginBottom: '4px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    color: styles.textPrimary,
                    cursor: 'pointer',
                    fontSize: '11px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = styles.bgAccent}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <div style={{ fontWeight: '500' }}>
                    {note.title || 'Untitled Note'}
                  </div>
                  <div style={{ color: styles.textMuted, fontSize: '10px' }}>
                    {note.patient_hint} • {note.visual_age_stage}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

// Column management component
const ColumnManager = ({ columns, onAddColumn, onRemoveColumn, theme = 'dark' }) => {
  const [newColumnName, setNewColumnName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const styles = getThemeStyles(theme);

  const handleAddColumn = () => {
    if (newColumnName.trim() && !columns.includes(newColumnName.trim())) {
      onAddColumn(newColumnName.trim());
      setNewColumnName('');
      setShowAddForm(false);
    }
  };

  const commonColumns = [
    'chief_complaint',
    'assessment',
    'treatment_plan',
    'medications',
    'vitals',
    'allergies',
    'diagnosis',
    'discharge_plan'
  ];

  return (
    <div style={{ 
      padding: '16px',
      backgroundColor: styles.bgSecondary,
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h4 style={{ 
          margin: 0, 
          fontSize: '14px', 
          fontWeight: '600',
          color: styles.textPrimary
        }}>
          📊 Census Columns ({columns.length})
        </h4>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            color: styles.textPrimary,
            cursor: 'pointer'
          }}
        >
          ➕ Add Column
        </button>
      </div>

      {/* Current Columns */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {columns.map(column => (
          <div
            key={column}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              backgroundColor: styles.bgPrimary,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '12px',
              fontSize: '11px'
            }}
          >
            <span style={{ color: styles.textPrimary }}>{column}</span>
            <button
              onClick={() => onRemoveColumn(column)}
              style={{
                border: 'none',
                background: 'none',
                color: styles.textMuted,
                cursor: 'pointer',
                fontSize: '10px',
                padding: '0 2px'
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add Column Form */}
      {showAddForm && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <input
            type="text"
            placeholder="Column name (e.g., chief_complaint)"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
            style={{
              flex: 1,
              padding: '6px 8px',
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '4px',
              backgroundColor: styles.inputBg,
              color: styles.textPrimary,
              fontSize: '12px'
            }}
          />
          <button
            onClick={handleAddColumn}
            disabled={!newColumnName.trim()}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: newColumnName.trim() ? '#10b981' : 'rgba(156, 163, 175, 0.3)',
              color: 'white',
              cursor: newColumnName.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Add
          </button>
        </div>
      )}

      {/* Quick Add Common Columns */}
      <div>
        <div style={{ 
          fontSize: '12px', 
          color: styles.textMuted,
          marginBottom: '6px'
        }}>
          Quick add:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {commonColumns
            .filter(col => !columns.includes(col))
            .map(column => (
              <button
                key={column}
                onClick={() => onAddColumn(column)}
                style={{
                  padding: '3px 6px',
                  fontSize: '10px',
                  border: `1px solid ${styles.borderColor}`,
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: styles.textSecondary,
                  cursor: 'pointer'
                }}
              >
                {column}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

// Main Patient Census Table component
const PatientCensusTable = ({ 
  scratchNotes = [], 
  onGenerateTemplate, 
  onCensusUpdate,
  theme = 'dark' 
}) => {
  const [census, setCensus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customColumns, setCustomColumns] = useState([]);
  const styles = getThemeStyles(theme);

  // Load today's census
  const loadTodaysCensus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/patient-census/today', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setCensus(data.census);
        setCustomColumns(data.census.column_headers || []);
      } else {
        setError(data.error || 'Failed to load census');
      }
    } catch (err) {
      setError('Network error loading census');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new patient row
  const addPatientRow = async () => {
    if (!census) return;

    try {
      const response = await fetch(`http://localhost:5001/api/patient-census/${census.id}/rows`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          status: 'active',
          data_fields: {}
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCensus(prev => ({
          ...prev,
          rows: [...prev.rows, data.row]
        }));
        
        // Notify parent component to refresh census stats
        if (onCensusUpdate) {
          onCensusUpdate();
        }
      } else {
        setError(data.error || 'Failed to add patient');
      }
    } catch (err) {
      setError('Network error adding patient');
    }
  };

  // Update patient row
  const updatePatientRow = async (rowId, updates) => {
    try {
      const response = await fetch(`http://localhost:5001/api/patient-census/rows/${rowId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      
      if (data.success) {
        setCensus(prev => ({
          ...prev,
          rows: prev.rows.map(row => 
            row.id === rowId ? data.row : row
          )
        }));
        
        // Notify parent component to refresh census stats
        if (onCensusUpdate) {
          onCensusUpdate();
        }
      } else {
        setError(data.error || 'Failed to update patient');
      }
    } catch (err) {
      setError('Network error updating patient');
    }
  };

  // Delete patient row
  const deletePatientRow = async (rowId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/patient-census/rows/${rowId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCensus(prev => ({
          ...prev,
          rows: prev.rows.filter(row => row.id !== rowId)
        }));
      } else {
        setError('Failed to delete patient');
      }
    } catch (err) {
      setError('Network error deleting patient');
    }
  };

  // Populate row from scratch note
  const populateFromScratchNote = async (rowId, scratchNoteId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/patient-census/rows/${rowId}/populate-from-scratch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scratch_note_id: scratchNoteId })
      });

      const data = await response.json();
      
      if (data.success) {
        setCensus(prev => ({
          ...prev,
          rows: prev.rows.map(row => 
            row.id === rowId ? data.row : row
          )
        }));
      } else {
        setError(data.error || 'Failed to populate from scratch note');
      }
    } catch (err) {
      setError('Network error populating data');
    }
  };

  // Generate template for selected patients
  const generateTemplateForPatients = (selectedPatients) => {
    if (onGenerateTemplate) {
      onGenerateTemplate(selectedPatients);
    }
  };

  useEffect(() => {
    loadTodaysCensus();
    // Refresh every 5 minutes
    const interval = setInterval(loadTodaysCensus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadTodaysCensus]);

  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: styles.bgPrimary,
        borderRadius: '8px'
      }}>
        <div className="loading-spinner" style={{ 
          width: '32px', 
          height: '32px',
          margin: '0 auto 16px'
        }}></div>
        <div style={{ color: styles.textMuted }}>Loading patient census...</div>
      </div>
    );
  }

  if (!census) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: styles.bgPrimary,
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏥</div>
        <h4 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '16px',
          color: styles.textPrimary
        }}>
          No census found
        </h4>
        <p style={{ 
          margin: 0, 
          fontSize: '13px',
          color: styles.textSecondary
        }}>
          Census data will be created automatically when needed
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: styles.bgPrimary,
      borderRadius: '8px',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '600',
            color: styles.textPrimary
          }}>
            🏥 Patient Census - {new Date(census.census_date).toLocaleDateString()}
          </h3>
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: '12px',
            color: styles.textSecondary
          }}>
            {census.current_census_count} active patients • 
            Last updated: {new Date(census.last_updated).toLocaleTimeString()}
          </p>
        </div>
        
        <button
          onClick={addPatientRow}
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
          ➕ Add Patient
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '4px solid #ef4444',
          color: '#ef4444',
          marginBottom: '16px',
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      {/* Column Manager */}
      <ColumnManager
        columns={customColumns}
        onAddColumn={(column) => setCustomColumns(prev => [...prev, column])}
        onRemoveColumn={(column) => setCustomColumns(prev => prev.filter(c => c !== column))}
        theme={theme}
      />

      {/* Census Table */}
      <div style={{ 
        overflowX: 'auto',
        border: `1px solid ${styles.borderColor}`,
        borderRadius: '8px'
      }}>
        <table style={{ 
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: styles.bgPrimary
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
                color: styles.textPrimary,
                minWidth: '120px'
              }}>
                Status
              </th>
              <th style={{ 
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: styles.textPrimary,
                minWidth: '80px'
              }}>
                Room
              </th>
              <th style={{ 
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: styles.textPrimary,
                minWidth: '150px'
              }}>
                Patient
              </th>
              {customColumns.map(column => (
                <th key={column} style={{ 
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: styles.textPrimary,
                  minWidth: '120px'
                }}>
                  {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </th>
              ))}
              <th style={{ 
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: styles.textPrimary,
                minWidth: '100px'
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {census.rows?.length ? (
              census.rows.map(row => (
                <PatientRow
                  key={row.id}
                  row={row}
                  columns={customColumns}
                  onUpdateRow={updatePatientRow}
                  onDeleteRow={deletePatientRow}
                  onPopulateFromScratch={populateFromScratchNote}
                  scratchNotes={scratchNotes}
                  theme={theme}
                />
              ))
            ) : (
              <tr>
                <td 
                  colSpan={4 + customColumns.length}
                  style={{ 
                    padding: '40px',
                    textAlign: 'center',
                    color: styles.textMuted
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                  <div>No patients in census</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Click "Add Patient" to start building today's census
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Template Generation */}
      {census.rows?.length > 0 && (
        <div style={{ 
          marginTop: '20px',
          padding: '16px',
          backgroundColor: styles.bgSecondary,
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <button
            onClick={() => generateTemplateForPatients(census.rows.filter(r => r.status === 'active'))}
            style={{
              padding: '10px 20px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            📄 Generate Documentation for Active Patients ({census.current_census_count})
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientCensusTable;