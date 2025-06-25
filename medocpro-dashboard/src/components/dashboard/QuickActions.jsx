import React from 'react';
import './QuickActions.css';

const QuickActions = ({ onModalOpen }) => {
  return (
    <div className="quick-actions">
      <h3>⚡ Quick Actions</h3>
      <p>Common clinical documentation tasks</p>
      
      <div className="action-buttons">
        <button 
          className="action-btn" 
          onClick={() => onModalOpen('notes')}
        >
          <span className="action-icon">📝</span>
          <span className="action-label">New Progress Note</span>
        </button>
        <button 
          className="action-btn" 
          onClick={() => onModalOpen('assessments')}
        >
          <span className="action-icon">🧠</span>
          <span className="action-label">Initial Assessment</span>
        </button>
        <button 
          className="action-btn" 
          onClick={() => onModalOpen('treatment')}
        >
          <span className="action-icon">🎯</span>
          <span className="action-label">Treatment Plan</span>
        </button>
        <button 
          className="action-btn" 
          onClick={() => onModalOpen('mental')}
        >
          <span className="action-icon">🧠</span>
          <span className="action-label">Mental Status Exam</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActions;