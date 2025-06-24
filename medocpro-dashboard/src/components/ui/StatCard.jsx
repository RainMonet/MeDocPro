// medocpro-dashboard/src/components/ui/StatCard.jsx - FINAL SOLUTION
import React from 'react';
import './StatCard.css';

const StatCard = ({ icon, value, label, change, trend }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: icon.background }}>
        {icon.symbol}
      </div>
      <div className="stat-number">{value}</div>
      <div className="stat-label">{label}</div>
      {change && (
        <div className={`stat-change ${trend || 'positive'}`}>
          {change}
        </div>
      )}
    </div>
  );
};

export default StatCard;