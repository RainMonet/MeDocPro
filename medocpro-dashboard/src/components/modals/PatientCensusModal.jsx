// medocpro-dashboard/src/components/PatientCensusModal.jsx - FIXED LAYOUT VERSION
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
      return { success: true, message: 'Patient order updated' };
    }
    return { success: false, message: 'Invalid reorder operation' };
  }

  sortPatients(criteria) {
    this.currentSort = criteria;
    
    this.patients.sort((a, b) => {
      switch (criteria) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'id':
          return a.id.localeCompare(b.id);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'time':
          return a.timestamp - b.timestamp;
        default:
          return 0;
      }
    });
    
    this.triggerUpdate();
    return { success: true, message: `Sorted by ${criteria}` };
  }

  getStats() {
    const stats = {
      total: this.patients.length,
      active: 0,
      pending: 0,
      complete: 0
    };

    this.patients.forEach(patient => {
      if (stats.hasOwnProperty(patient.status)) {
        stats[patient.status]++;
      }
    });

    return stats;
  }

  exportCensus() {
    try {
      const csvHeader = 'Patient ID,Patient Name,Status,Time\n';
      const csvData = this.patients.map(patient => 
        `"${patient.id}","${patient.name}","${patient.status}","${patient.time}"`
      ).join('\n');
      
      const csvContent = csvHeader + csvData;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `patient-census-${new Date().toISOString().split('T')[0]}.csv`;
      
      this.downloadFile(blob, filename);
      return { success: true, message: 'Census exported successfully' };
    } catch (error) {
      return { success: false, message: 'Export failed' };
    }
  }

  downloadFile(blob, filename) {
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
  const [statusFilter, setStatusFilter] = useState('Active');

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

  const handleAddPatient = async () => {
    if (!newPatientName || !newPatientId) {
      showNotification('Please enter both patient name and ID', 'error');
      return;
    }

    try {
      // First get today's census
      const censusResponse = await fetch('http://localhost:5001/api/patient-census/today', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const censusData = await censusResponse.json();
      
      if (!censusData.success) {
        showNotification('Failed to load census', 'error');
        return;
      }

      // Add patient to the census
      const addResponse = await fetch(`http://localhost:5001/api/patient-census/${censusData.census.id}/rows`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patient_name: newPatientName,
          patient_id: newPatientId,
          status: 'active',
          data_fields: {}
        })
      });

      const addData = await addResponse.json();
      
      if (addData.success) {
        setNewPatientName('');
        setNewPatientId('');
        showNotification('Patient added successfully!', 'success');
        
        // Update the local manager for immediate UI feedback
        patientCensus.addPatient(newPatientName, newPatientId, 'active');
      } else {
        showNotification(addData.error || 'Failed to add patient', 'error');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      showNotification('Network error adding patient', 'error');
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
              Patient Census Management
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

            {/* Patient Controls */}
            <div className="patient-controls">
              <div className="search-filters">
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="Patient Name (Last, First)" 
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPatient()}
                />
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="Patient ID" 
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPatient()}
                />
                <select 
                  className="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>
              
              <button className="add-patient-btn" onClick={handleAddPatient}>
                Add Patient
              </button>
              
              <div className="sort-controls">
                <span className="sort-label">Sort by:</span>
                {['Name', 'Id', 'Status', 'Time'].map(criteria => (
                  <button 
                    key={criteria}
                    className={`sort-btn ${currentSort === criteria.toLowerCase() ? 'active' : ''}`}
                    onClick={() => handleSort(criteria.toLowerCase())}
                  >
                    {criteria}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient List */}
            <div className="patient-list">
              {patients.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 20px', 
                  color: 'var(--text-muted)' 
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.6 }}>👥</div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    marginBottom: '8px', 
                    color: 'var(--text-primary)' 
                  }}>
                    No patients in census
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    Add your first patient using the form above
                  </div>
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
                    </div>
                    
                    <div className={`patient-status ${patient.status}`}>
                      {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                    </div>
                    
                    <div className="patient-time">{patient.time}</div>
                    
                    <button 
                      className="remove-patient" 
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
              <button className="export-btn" onClick={handleExport}>
                Export
              </button>
              <button className="done-btn" onClick={onClose}>Done</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientCensusModal;