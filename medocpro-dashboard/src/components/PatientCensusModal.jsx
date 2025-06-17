// medocpro-dashboard/src/components/PatientCensusModal.jsx
import React, { useState, useEffect } from 'react';
import './PatientCensusModal.css';

// Patient data management class
class PatientCensusManager {
  constructor() {
    this.patients = [
      {
        id: 'PT001',
        name: 'Anderson, Sarah M.',
        status: 'active',
        time: '09:00 AM',
        timestamp: new Date('2024-01-01 09:00')
      },
      {
        id: 'PT002',
        name: 'Johnson, Michael R.',
        status: 'active',
        time: '10:30 AM',
        timestamp: new Date('2024-01-01 10:30')
      },
      {
        id: 'PT003',
        name: 'Williams, Emma L.',
        status: 'pending',
        time: '11:15 AM',
        timestamp: new Date('2024-01-01 11:15')
      },
      {
        id: 'PT004',
        name: 'Brown, David K.',
        status: 'complete',
        time: '02:00 PM',
        timestamp: new Date('2024-01-01 14:00')
      }
    ];
    
    this.draggedElement = null;
    this.currentSort = 'name';
    this.onUpdate = null;
  }

  setUpdateCallback(callback) {
    this.onUpdate = callback;
  }

  triggerUpdate() {
    if (this.onUpdate) {
      this.onUpdate();
    }
  }

  addPatient(name, id, status) {
    if (!name || !id) {
      return { success: false, message: 'Please enter both patient name and ID' };
    }

    if (!name.includes(',')) {
      return { success: false, message: 'Please enter name in format: Last, First' };
    }

    if (this.patients.some(p => p.id.toLowerCase() === id.toLowerCase())) {
      return { success: false, message: 'Patient ID already exists' };
    }

    const now = new Date();
    const newPatient = {
      id: id,
      name: name,
      status: status,
      time: now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      timestamp: now
    };

    this.patients.push(newPatient);
    this.triggerUpdate();
    return { success: true, message: `Added ${name} to census` };
  }

  deletePatient(index) {
    if (index >= 0 && index < this.patients.length) {
      const patient = this.patients[index];
      this.patients.splice(index, 1);
      this.triggerUpdate();
      return { success: true, message: `Removed ${patient.name} from census` };
    }
    return { success: false, message: 'Patient not found' };
  }

  reorderPatients(draggedIndex, targetIndex) {
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      const draggedPatient = this.patients[draggedIndex];
      this.patients.splice(draggedIndex, 1);
      this.patients.splice(targetIndex, 0, draggedPatient);
      this.triggerUpdate();
      return true;
    }
    return false;
  }

  sortPatients(criteria) {
    this.currentSort = criteria;

    switch (criteria) {
      case 'name':
        this.patients.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'id':
        this.patients.sort((a, b) => a.id.localeCompare(b.id));
        break;
      case 'status':
        this.patients.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case 'time':
        this.patients.sort((a, b) => a.timestamp - b.timestamp);
        break;
    }

    this.triggerUpdate();
  }

  getStats() {
    const total = this.patients.length;
    const statusCounts = this.patients.reduce((acc, patient) => {
      acc[patient.status] = (acc[patient.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      active: statusCounts.active || 0,
      pending: statusCounts.pending || 0,
      complete: statusCounts.complete || 0,
      followUp: statusCounts['follow-up'] || 0
    };
  }

  exportCensus() {
    const data = this.patients.map(p => ({
      ID: p.id,
      Name: p.name,
      Status: p.status,
      Time: p.time
    }));

    const csv = this.convertToCSV(data);
    this.downloadCSV(csv, 'patient-census.csv');
    return { success: true, message: 'Census exported successfully' };
  }

  convertToCSV(data) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }

  downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

// Global patient census manager instance
const patientCensus = new PatientCensusManager();

// Notification Component
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type}`}>
      {message}
    </div>
  );
};

// Main Patient Census Modal Component
const PatientCensusModal = ({ isOpen, onClose }) => {
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({});
  const [currentSort, setCurrentSort] = useState('name');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [notification, setNotification] = useState(null);

  // Form states
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientId, setNewPatientId] = useState('');
  const [newPatientStatus, setNewPatientStatus] = useState('active');
  const [nameError, setNameError] = useState('');
  const [idError, setIdError] = useState('');

  useEffect(() => {
    // Set up the update callback
    patientCensus.setUpdateCallback(() => {
      updateData();
    });
    
    updateData();
  }, []);

  const updateData = () => {
    setPatients([...patientCensus.patients]);
    setStats(patientCensus.getStats());
    setCurrentSort(patientCensus.currentSort);
    setLastUpdated(new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleAddPatient = () => {
    setNameError('');
    setIdError('');

    const result = patientCensus.addPatient(newPatientName, newPatientId, newPatientStatus);
    
    if (result.success) {
      setNewPatientName('');
      setNewPatientId('');
      setNewPatientStatus('active');
      showNotification(result.message, 'success');
    } else {
      if (result.message.includes('name')) {
        setNameError(result.message);
      } else if (result.message.includes('ID')) {
        setIdError(result.message);
      } else {
        showNotification(result.message, 'error');
      }
    }
  };

  const handleDeletePatient = (index) => {
    const patient = patients[index];
    if (window.confirm(`Are you sure you want to remove ${patient.name} from the census?`)) {
      const result = patientCensus.deletePatient(index);
      if (result.success) {
        showNotification(result.message, 'success');
      }
    }
  };

  const handleSort = (criteria) => {
    patientCensus.sortPatients(criteria);
  };

  const handleExport = () => {
    const result = patientCensus.exportCensus();
    if (result.success) {
      showNotification(result.message, 'success');
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.target.closest('.patient-item')?.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.target.closest('.patient-item')?.classList.remove('drag-over');
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (patientCensus.reorderPatients(draggedIndex, targetIndex)) {
      showNotification('Patient order updated', 'success');
    }
    
    // Clean up drag classes
    document.querySelectorAll('.patient-item').forEach(item => {
      item.classList.remove('drag-over', 'dragging');
    });
    setDraggedIndex(null);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedIndex(null);
    
    // Clean up any remaining drag classes
    document.querySelectorAll('.patient-item').forEach(item => {
      item.classList.remove('drag-over');
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('patient-census-modal-overlay')) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div 
        className={`patient-census-modal-overlay ${isOpen ? 'active' : ''}`}
        onClick={handleBackdropClick}
      >
        <div className="patient-census-modal">
          <div className="modal-header">
            <h2 className="modal-title">
              👥 Patient Census Management
            </h2>
            <p className="modal-subtitle">Manage your patient list with drag-and-drop organization</p>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {/* Census Statistics */}
            <div className="census-stats">
              <div className="census-stat-card">
                <div className="census-stat-number">{stats.total || 0}</div>
                <div className="census-stat-label">Total Patients</div>
              </div>
              <div className="census-stat-card">
                <div className="census-stat-number">{stats.active || 0}</div>
                <div className="census-stat-label">Active</div>
              </div>
              <div className="census-stat-card">
                <div className="census-stat-number">{stats.pending || 0}</div>
                <div className="census-stat-label">Pending</div>
              </div>
              <div className="census-stat-card">
                <div className="census-stat-number">{stats.complete || 0}</div>
                <div className="census-stat-label">Complete</div>
              </div>
            </div>

            {/* Controls */}
            <div className="census-controls">
              <div className="add-patient-form">
                <div style={{ flex: 1 }}>
                  <input 
                    type="text" 
                    className={`patient-input ${nameError ? 'error' : ''}`}
                    placeholder="Patient Name (Last, First)" 
                    maxLength="50"
                    value={newPatientName}
                    onChange={(e) => {
                      setNewPatientName(e.target.value);
                      setNameError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPatient()}
                  />
                  {nameError && <div className="validation-message show">{nameError}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <input 
                    type="text" 
                    className={`patient-input ${idError ? 'error' : ''}`}
                    placeholder="Patient ID" 
                    maxLength="20"
                    value={newPatientId}
                    onChange={(e) => {
                      setNewPatientId(e.target.value);
                      setIdError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPatient()}
                  />
                  {idError && <div className="validation-message show">{idError}</div>}
                </div>
                <select 
                  className="patient-input"
                  value={newPatientStatus}
                  onChange={(e) => setNewPatientStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="complete">Complete</option>
                  <option value="follow-up">Follow-up</option>
                </select>
                <button className="add-btn" onClick={handleAddPatient}>Add Patient</button>
              </div>
              <div className="sort-controls">
                <span className="sort-label">Sort by:</span>
                {['name', 'id', 'status', 'time'].map(criteria => (
                  <button 
                    key={criteria}
                    className={`sort-btn ${currentSort === criteria ? 'active' : ''}`}
                    onClick={() => handleSort(criteria)}
                  >
                    {criteria.charAt(0).toUpperCase() + criteria.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient List */}
            <div className="patient-list">
              {patients.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <div className="empty-title">No patients in census</div>
                  <div className="empty-description">Add your first patient using the form above</div>
                </div>
              ) : (
                patients.map((patient, index) => (
                  <div 
                    key={patient.id}
                    className="patient-item" 
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="drag-handle">⋮⋮</div>
                    <div className="patient-info">
                      <div className="patient-name">{patient.name}</div>
                      <div className="patient-id">{patient.id}</div>
                      <div className={`patient-status status-${patient.status}`}>
                        {patient.status.replace('-', ' ')}
                      </div>
                      <div className="patient-time">{patient.time}</div>
                    </div>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDeletePatient(index)}
                      title="Remove patient"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="modal-footer">
            <div className="footer-info">
              HIPAA-compliant patient management • Last updated: {lastUpdated}
            </div>
            <div className="footer-actions">
              <button className="btn-secondary" onClick={handleExport}>
                Export
              </button>
              <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientCensusModal;