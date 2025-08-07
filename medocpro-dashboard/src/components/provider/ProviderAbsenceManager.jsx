// src/components/provider/ProviderAbsenceManager.jsx

import React, { useState, useEffect } from 'react';
import './ProviderAbsenceManager.css';

const ProviderAbsenceManager = () => {
  const [absences, setAbsences] = useState([]);
  const [cleanupStatus, setCleanupStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState(null);

  // Form state for creating new absence
  const [formData, setFormData] = useState({
    user_id: '',
    provider_name: '',
    start_date: '',
    end_date: '',
    planned_return_date: '',
    absence_type: 'vacation',
    reason: '',
    emergency_contact: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Load absences and cleanup status in parallel
      const [absencesResponse, statusResponse] = await Promise.all([
        fetch('/api/provider-absence?status=all', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Failed to fetch absences:', err);
          throw new Error('Backend server not responding - Please ensure the backend is running');
        }),
        fetch('/api/provider-absence/cleanup-status', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Failed to fetch cleanup status:', err);
          throw new Error('Backend server not responding - Please ensure the backend is running');
        })
      ]);

      if (!absencesResponse.ok || !statusResponse.ok) {
        const errorText = await absencesResponse.text();
        console.error('Response error:', errorText);
        
        if (errorText.includes('<!doctype') || errorText.includes('<html')) {
          throw new Error('Backend server returned HTML instead of JSON - Check if the server is running and routes are configured');
        }
        
        throw new Error(`HTTP Error: ${absencesResponse.status} ${absencesResponse.statusText}`);
      }

      // Check if response is actually JSON
      const absencesText = await absencesResponse.text();
      const statusText = await statusResponse.text();
      
      let absencesData, statusData;
      
      try {
        absencesData = JSON.parse(absencesText);
        statusData = JSON.parse(statusText);
      } catch (jsonErr) {
        console.error('JSON Parse Error:', jsonErr);
        console.error('Absences Response:', absencesText.substring(0, 200));
        console.error('Status Response:', statusText.substring(0, 200));
        throw new Error('Server returned invalid JSON - Backend may not be running or routes may not be configured');
      }

      if (absencesData.success && statusData.success) {
        setAbsences(absencesData.absences || []);
        setCleanupStatus(statusData.cleanup_status || {});
      } else {
        throw new Error(absencesData.error || statusData.error || 'API returned error response');
      }
    } catch (err) {
      console.error('Error loading provider absence data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAbsence = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/provider-absence', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('<!doctype') || errorText.includes('<html')) {
          throw new Error('Backend server returned HTML - Check if the server is running');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error('JSON Parse Error in create:', jsonErr);
        console.error('Response text:', responseText.substring(0, 200));
        throw new Error('Server returned invalid JSON response');
      }
      
      if (data.success) {
        // Reset form and reload data
        setFormData({
          user_id: '',
          provider_name: '',
          start_date: '',
          end_date: '',
          planned_return_date: '',
          absence_type: 'vacation',
          reason: '',
          emergency_contact: ''
        });
        setShowCreateForm(false);
        await loadData();
      } else {
        setError(data.error || 'Failed to create absence');
      }
    } catch (err) {
      console.error('Error creating absence:', err);
      setError(err.message);
    }
  };

  const handleCompleteAbsence = async (absenceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/provider-absence/${absenceId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('<!doctype') || errorText.includes('<html')) {
          throw new Error('Backend server returned HTML - Check if the server is running');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error('JSON Parse Error in complete:', jsonErr);
        throw new Error('Server returned invalid JSON response');
      }
      
      if (data.success) {
        await loadData();
      } else {
        setError(data.error || 'Failed to complete absence');
      }
    } catch (err) {
      console.error('Error completing absence:', err);
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (absence) => {
    if (absence.is_active) {
      return <span className="badge badge-active">Active</span>;
    } else if (absence.status === 'completed') {
      return <span className="badge badge-completed">Completed</span>;
    } else if (absence.status === 'cancelled') {
      return <span className="badge badge-cancelled">Cancelled</span>;
    }
    return <span className="badge badge-inactive">Inactive</span>;
  };

  if (loading) {
    return (
      <div className="provider-absence-manager">
        <div className="loading">Loading provider absence data...</div>
      </div>
    );
  }

  return (
    <div className="provider-absence-manager">
      <div className="header">
        <h2>Provider Absence Management</h2>
        <p className="subtitle">Manage time-off periods to prevent data cleanup during extended absences</p>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          {error.includes('Backend server') && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              <strong>To fix this:</strong>
              <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                <li>Make sure the backend server is running with <code>dev-start.bat</code> or <code>python dev-start.py</code></li>
                <li>Check that the database has been initialized with <code>python manage.py init-database</code></li>
                <li>Verify that the provider absence routes are working</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Cleanup Status Summary */}
      {cleanupStatus && (
        <div className="cleanup-status">
          <h3>Data Retention Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <label>Cleanup Status:</label>
              <span className={cleanupStatus.is_paused ? 'status-paused' : 'status-active'}>
                {cleanupStatus.is_paused ? '⏸️ Paused' : '🔄 Active'}
              </span>
            </div>
            <div className="status-item">
              <label>Retention Period:</label>
              <span>{cleanupStatus.effective_retention_period}</span>
            </div>
            <div className="status-item">
              <label>Active Absences:</label>
              <span>{cleanupStatus.active_absences_count}</span>
            </div>
            <div className="status-item">
              <label>Long-term Absences:</label>
              <span>{cleanupStatus.long_term_absences_count}</span>
            </div>
          </div>
        </div>
      )}

      {/* Create New Absence */}
      <div className="create-absence-section">
        <button 
          className="btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ Create New Absence'}
        </button>

        {showCreateForm && (
          <form className="create-absence-form" onSubmit={handleCreateAbsence}>
            <div className="form-grid">
              <div className="form-group">
                <label>Provider ID:</label>
                <input
                  type="number"
                  value={formData.user_id}
                  onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Provider Name:</label>
                <input
                  type="text"
                  value={formData.provider_name}
                  onChange={(e) => setFormData({...formData, provider_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date (optional):</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Absence Type:</label>
                <select
                  value={formData.absence_type}
                  onChange={(e) => setFormData({...formData, absence_type: e.target.value})}
                  required
                >
                  <option value="vacation">Vacation</option>
                  <option value="medical">Medical Leave</option>
                  <option value="emergency">Emergency</option>
                  <option value="sabbatical">Sabbatical</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Emergency Contact:</label>
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                  placeholder="Contact information during absence"
                />
              </div>
            </div>
            <div className="form-group full-width">
              <label>Reason (optional):</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Additional notes about the absence"
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Create Absence</button>
              <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Absences List */}
      <div className="absences-list">
        <h3>Current and Recent Absences</h3>
        
        {absences.length === 0 ? (
          <div className="no-data">No provider absences found.</div>
        ) : (
          <div className="absences-table">
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Days</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {absences.map(absence => (
                  <tr key={absence.id} className={absence.is_active ? 'active-absence' : ''}>
                    <td>
                      <div className="provider-info">
                        <strong>{absence.provider_name}</strong>
                        {absence.emergency_contact && (
                          <small>Contact: {absence.emergency_contact}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="absence-type">{absence.absence_type}</span>
                    </td>
                    <td>{formatDate(absence.start_date)}</td>
                    <td>{formatDate(absence.end_date) || 'Indefinite'}</td>
                    <td>{getStatusBadge(absence)}</td>
                    <td>
                      {absence.days_remaining !== null ? (
                        <span>{absence.days_remaining} remaining</span>
                      ) : (
                        <span>Indefinite</span>
                      )}
                    </td>
                    <td>
                      {absence.is_active && (
                        <button
                          className="btn-small btn-complete"
                          onClick={() => handleCompleteAbsence(absence.id)}
                        >
                          Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Retention Impact */}
      <div className="retention-impact">
        <h3>Data Retention Impact</h3>
        <div className="impact-info">
          <p>
            <strong>How it works:</strong> When a provider is marked as absent for more than 7 days, 
            the system automatically pauses data cleanup to ensure patient information remains 
            available upon return.
          </p>
          <ul>
            <li>Standard retention: 7 days</li>
            <li>During absence: Cleanup paused or extended based on settings</li>
            <li>Clinical entries (signed/completed) are always preserved</li>
            <li>Draft entries older than retention period are normally cleaned up</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProviderAbsenceManager;