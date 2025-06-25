import React from 'react';
import './RecentDocuments.css';

const RecentDocuments = () => {
  return (
    <div className="recent-documents">
      <h3>Recent Documents</h3>
      <div className="document-item">
        <span className="document-icon">📝</span>
        <div className="document-info">
          <span className="document-title">Progress Note - Anderson, S.</span>
          <span className="document-date">Today, 2:30 PM</span>
        </div>
      </div>
    </div>
  );
};

export default RecentDocuments;