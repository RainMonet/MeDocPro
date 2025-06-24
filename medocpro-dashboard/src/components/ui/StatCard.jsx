// medocpro-dashboard/src/components/ui/StatCard.jsx - Updated
import React from 'react';
import './StatCard.css';

const StatCard = ({ value, label, change, trend }) => {
  return (
    <div className="stat-card">
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change && (
          <div className={`stat-change ${trend}`}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;