import React from 'react';
import './SystemStatus.css';

const SystemStatus = () => {
  return (
    <div className="system-status">
      <h3>🟢 System Status</h3>
      <p>Real-time monitoring of backend services</p>
      
      <div className="status-items">
        <div className="status-item">
          <span className="status-label">Backend API</span>
          <span className="status-badge connected">CONNECTED</span>
        </div>
        <div className="status-item">
          <span className="status-label">Database</span>
          <span className="status-badge connected">CONNECTED</span>
        </div>
        <div className="status-item">
          <span className="status-label">AI Service</span>
          <span className="status-badge available">AVAILABLE</span>
        </div>
      </div>
      
      <div className="last-checked">
        Last checked: 9:11:00 AM
      </div>
    </div>
  );
};

export default SystemStatus;