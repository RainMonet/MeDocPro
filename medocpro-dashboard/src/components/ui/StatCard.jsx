// medocpro-dashboard/src/components/ui/StatCard.jsx
import React from 'react';
import './StatCard.css';

/**
 * StatCard - Clinical statistics display component
 * Used in psychiatric dashboard for key metrics display
 * HIPAA Compliance: Displays aggregated, non-PHI statistics only
 */
const StatCard = ({ 
  icon = { background: '#0066cc', symbol: '📊' }, 
  value = '0', 
  label = 'Statistic', 
  change = '', 
  trend = 'positive' 
}) => {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: icon.background }}>
        {icon.symbol}
      </div>
      <div className="stat-number">{value}</div>
      <div className="stat-label">{label}</div>
      {change && (
        <div className={`stat-change ${trend}`}>{change}</div>
      )}
    </div>
  );
};

export default StatCard;