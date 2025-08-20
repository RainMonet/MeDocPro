// StatCard Tooltips Component
import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const useWeeklyAverages = () => {
  const [weeklyAverages, setWeeklyAverages] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWeeklyAverages = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        console.log('Loading weekly averages from API...');
        const response = await fetch(`${apiService.baseURL}/api/patient-census/history?days=7`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('API response data:', data);
          
          // Handle the actual API response structure from patient-census/history
          let historyData = data.census_history || [];
          
          if (data.success && historyData && historyData.length > 0) {
            // Calculate averages from the available historical data
            console.log('Census history data:', historyData);
            
            const totals = historyData.reduce((acc, day) => {
              // Use the actual API response field names
              acc.total += day.census_count || 0;  // Use census_count for total active patients
              acc.admissions += day.admission_count || 0;  // Direct admission count from API
              acc.followUps += day.census_count - day.admission_count || 0;  // Follow-ups = total - new admissions
              acc.discharges += day.discharge_count || 0;  // Direct discharge count from API
              return acc;
            }, { total: 0, admissions: 0, followUps: 0, discharges: 0 });

            const averages = {
              total: (totals.total / historyData.length).toFixed(1),
              admissions: (totals.admissions / historyData.length).toFixed(1),
              followUps: (totals.followUps / historyData.length).toFixed(1),
              discharges: (totals.discharges / historyData.length).toFixed(1)
            };

            console.log('Calculated averages from real data:', averages);
            setWeeklyAverages(averages);
            setIsLoading(false);
          } else {
            console.log('No census history data found or API call unsuccessful');
            // No historical data available
            setWeeklyAverages(null);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to load weekly averages:', error);
        // Set null so tooltips show "Historical data unavailable"
        setWeeklyAverages(null);
        setIsLoading(false);
      }
    };

    loadWeeklyAverages();
  }, []);

  return { weeklyAverages, isLoading };
};

const StatCardTooltip = ({ show, content, position }) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg)',
        fontSize: '12px',
        fontWeight: '500',
        zIndex: 10000,
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}
    >
      {content}
    </div>
  );
};

const withTooltip = (WrappedComponent) => {
  return React.forwardRef((props, ref) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const { weeklyAverages, isLoading } = useWeeklyAverages();

    const handleMouseEnter = (e, tooltipType) => {
      // Call original onMouseEnter if it exists
      if (props.onMouseEnter) {
        props.onMouseEnter(e);
      }

      // Show tooltip with loading state or data
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });

      let content = '';
      
      if (isLoading) {
        content = 'Loading historical averages...';
      } else if (weeklyAverages) {
        switch (tooltipType) {
          case 'total':
            content = `Recent average: ${weeklyAverages.total} patients/day`;
            break;
          case 'admissions':
            content = `Recent average: ${weeklyAverages.admissions} new admissions/day`;
            break;
          case 'followUps':
            content = `Recent average: ${weeklyAverages.followUps} follow-up patients/day`;
            break;
          case 'discharges':
            content = `Recent average: ${weeklyAverages.discharges} discharges/day`;
            break;
          default:
            content = 'Historical data unavailable';
        }
      } else {
        content = 'Historical data unavailable';
      }

      setShowTooltip(content);
    };

    const handleMouseLeave = (e) => {
      // Call original onMouseLeave if it exists
      if (props.onMouseLeave) {
        props.onMouseLeave(e);
      }

      setShowTooltip(false);
    };

    return (
      <>
        <WrappedComponent
          {...props}
          ref={ref}
          onMouseEnter={(e) => handleMouseEnter(e, props.tooltipType)}
          onMouseLeave={handleMouseLeave}
        />
        <StatCardTooltip
          show={showTooltip}
          content={showTooltip}
          position={tooltipPosition}
        />
      </>
    );
  });
};

export { useWeeklyAverages, StatCardTooltip, withTooltip };