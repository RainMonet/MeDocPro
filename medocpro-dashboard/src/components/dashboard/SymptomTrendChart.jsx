import React, { useState, useEffect, useMemo } from 'react';

const SymptomTrendChart = ({ 
  timeRange = '7d', 
  symptomData = [],
  patientData = [],
  className = '' 
}) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState(new Set(['all']));
  const [viewMode, setViewMode] = useState('aggregate'); // 'aggregate' or 'individual'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(
    document.documentElement.getAttribute('data-theme') || 'dark'
  );

  // Theme detection following existing app patterns
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setCurrentTheme(newTheme);
    };
    
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    return () => observer.disconnect();
  }, []);

  // Symptom type definitions with beautiful color schemes
  const symptomTypes = {
    pain: {
      name: 'Pain',
      colors: ['#ff9999', '#ff6b6b', '#ee5a24', '#c0392b'],
      icon: 'P',
      description: 'Physical discomfort and pain levels'
    },
    mood: {
      name: 'Mood',
      colors: ['#e17055', '#6c5ce7', '#a29bfe', '#fd79a8'],
      icon: 'M',
      description: 'Emotional state and mental wellness'
    },
    energy: {
      name: 'Energy',
      colors: ['#fdcb6e', '#f39c12', '#e67e22', '#d35400'],
      icon: 'E',
      description: 'Energy levels and fatigue'
    },
    sleep: {
      name: 'Sleep',
      colors: ['#74b9ff', '#0984e3', '#2d3436', '#636e72'],
      icon: 'S',
      description: 'Sleep quality and duration'
    },
    appetite: {
      name: 'Appetite',
      colors: ['#55a3ff', '#00b894', '#00cec9', '#81ecec'],
      icon: 'A',
      description: 'Eating patterns and appetite'
    },
    cognitive: {
      name: 'Cognitive',
      colors: ['#a29bfe', '#6c5ce7', '#5f3dc4', '#7950f2'],
      icon: 'C',
      description: 'Mental clarity and focus'
    }
  };

  // Generate sample patients if none provided
  const generateSamplePatients = () => {
    return [
      { id: 'p001', name: 'Sarah Chen', initials: 'SC', age: 34, room: '101A' },
      { id: 'p002', name: 'Michael Rodriguez', initials: 'MR', age: 67, room: '102B' },
      { id: 'p003', name: 'Emma Thompson', initials: 'ET', age: 42, room: '103A' },
      { id: 'p004', name: 'David Kim', initials: 'DK', age: 55, room: '104B' },
      { id: 'p005', name: 'Lisa Johnson', initials: 'LJ', age: 28, room: '105A' },
      { id: 'p006', name: 'Robert Wilson', initials: 'RW', age: 71, room: '106B' }
    ];
  };

  // Generate sample data for multiple patients with realistic admission patterns
  const generateSampleData = () => {
    const days = 7;
    const patients = generateSamplePatients();
    const data = [];
    
    patients.forEach(patient => {
      // All patients start on Monday (day 1, where 0 is Sunday)
      const admissionDay = 1; // Monday
      
      Object.keys(symptomTypes).forEach(symptomKey => {
        for (let day = 0; day < days; day++) {
          let intensity = 0; // Default to 0 (no data)
          
          // Only generate data from admission day onwards
          if (day >= admissionDay) {
            const daysInCare = day - admissionDay;
            let baseIntensity;
            
            // Different patterns per patient for realism
            switch (patient.id) {
              case 'p001': // Sarah - recovering well, admitted Tuesday
                if (admissionDay <= day) {
                  baseIntensity = Math.max(0, 0.8 - (daysInCare / (days - admissionDay)) * 0.6);
                }
                break;
              case 'p002': // Michael - chronic condition, stable, admitted Sunday
                baseIntensity = 0.4 + Math.sin((daysInCare / (days - admissionDay)) * Math.PI * 2) * 0.2;
                break;
              case 'p003': // Emma - improving mood/energy, persistent pain, admitted Thursday
                if (symptomKey === 'pain') {
                  baseIntensity = 0.7 + (Math.random() - 0.5) * 0.2;
                } else {
                  baseIntensity = Math.min(1, (daysInCare / Math.max(1, days - admissionDay)) * 0.6 + 0.2);
                }
                break;
              case 'p004': // David - variable symptoms, admitted Monday
                baseIntensity = 0.3 + Math.random() * 0.5;
                break;
              case 'p005': // Lisa - young, mild symptoms, admitted Friday
                baseIntensity = 0.1 + Math.random() * 0.3;
                break;
              case 'p006': // Robert - elderly, multiple issues, admitted Wednesday
                baseIntensity = 0.5 + Math.sin((daysInCare / Math.max(1, days - admissionDay)) * Math.PI) * 0.3 + Math.random() * 0.2;
                break;
              default:
                baseIntensity = Math.random() * 0.8;
            }
            
            const randomVariation = (Math.random() - 0.5) * 0.15;
            intensity = Math.max(0, Math.min(1, baseIntensity + randomVariation));
          }
          
          data.push({
            day,
            symptom: symptomKey,
            intensity,
            patientId: patient.id,
            patientName: patient.name,
            admissionDay,
            hasData: day >= admissionDay,
            timestamp: new Date(Date.now() - (days - day) * 24 * 60 * 60 * 1000),
            notes: intensity > 0 ? `${symptomTypes[symptomKey].name} level: ${Math.round(intensity * 10)}/10` : 'No data - not admitted'
          });
        }
      });
    });
    
    return data;
  };

  const data = symptomData.length > 0 ? symptomData : generateSampleData();
  const patients = patientData.length > 0 ? patientData : generateSamplePatients();

  // Filter data based on view mode
  const getDisplayData = () => {
    if (viewMode === 'individual' && selectedPatient) {
      return data.filter(entry => entry.patientId === selectedPatient);
    }
    
    // For aggregate view, average all patients' data
    if (viewMode === 'aggregate') {
      const aggregated = {};
      
      data.forEach(entry => {
        const key = `${entry.symptom}-${entry.day}`;
        if (!aggregated[key]) {
          aggregated[key] = {
            ...entry,
            intensities: [],
            patientCount: 0
          };
        }
        aggregated[key].intensities.push(entry.intensity);
        aggregated[key].patientCount++;
      });
      
      // Calculate averages
      return Object.values(aggregated).map(entry => ({
        ...entry,
        intensity: entry.intensities.reduce((sum, val) => sum + val, 0) / entry.intensities.length,
        notes: `Average across ${entry.patientCount} patients: ${Math.round((entry.intensities.reduce((sum, val) => sum + val, 0) / entry.intensities.length) * 10)}/10`
      }));
    }
    
    return data;
  };

  const displayData = getDisplayData();

  // Generate AI analysis data for symptom trends
  const generateAIAnalysisData = (symptomKey, intensities) => {
    // Simulate AI analysis results - in production, this would come from backend
    const confidence = intensities.map(intensity => {
      // Higher confidence for stable readings, lower for erratic ones
      const variance = Math.abs(intensity - (intensities.reduce((a, b) => a + b, 0) / intensities.length));
      return Math.max(0.3, 1 - variance * 2);
    });

    // Detect anomalies (values significantly different from neighboring values)
    const anomalies = intensities.map((intensity, index) => {
      if (index === 0 || index === intensities.length - 1) return false;
      const prev = intensities[index - 1];
      const next = intensities[index + 1];
      const avgNeighbor = (prev + next) / 2;
      return Math.abs(intensity - avgNeighbor) > 0.4; // Threshold for anomaly detection
    });

    // Calculate trend strength for each point
    const trends = intensities.map((intensity, index) => {
      if (index < 2) return 0;
      const recentValues = intensities.slice(Math.max(0, index - 2), index + 1);
      const slope = (recentValues[recentValues.length - 1] - recentValues[0]) / recentValues.length;
      return Math.abs(slope);
    });

    // Overall analysis flags
    const hasSignificantTrend = trends.some(trend => trend > 0.3);
    const hasAnomalies = anomalies.some(anomaly => anomaly);
    
    // Calculate trend direction and magnitude
    const overallTrend = (intensities[intensities.length - 1] - intensities[0]) / intensities.length;
    const trendDirection = overallTrend > 0.1 ? 'increasing' : overallTrend < -0.1 ? 'decreasing' : 'stable';
    
    return {
      confidence,
      anomalies,
      trends,
      hasSignificantTrend,
      hasAnomalies,
      trendDirection,
      trendMagnitude: Math.abs(overallTrend),
      avgIntensity: intensities.reduce((a, b) => a + b, 0) / intensities.length,
      variability: Math.sqrt(intensities.reduce((sum, intensity) => {
        const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
        return sum + Math.pow(intensity - mean, 2);
      }, 0) / intensities.length)
    };
  };

  // Enhanced gradient strip creation with AI analysis indicators
  const createGradientStrip = (symptomKey, intensities, aiAnalysisData = {}) => {
    const colors = symptomTypes[symptomKey].colors;
    
    // Convert hex to rgba for opacity control
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Enhanced color mapping with AI confidence indicators
    const gradientStops = intensities.map((intensity, index) => {
      const position = (index / (intensities.length - 1)) * 100;
      
      // AI Analysis enhancements
      const aiConfidence = aiAnalysisData.confidence?.[index] || 0.8; // Default confidence
      const isAnomalous = aiAnalysisData.anomalies?.[index] || false;
      const trendStrength = aiAnalysisData.trends?.[index] || 0;
      
      // Enhanced color selection with high contrast
      let colorIndex, color, alpha;
      
      // Use more dramatic color and alpha mapping for higher contrast
      if (intensity < 0.1) {
        colorIndex = 0; // Lightest color
        alpha = 0.05; // Nearly transparent
        color = colors[colorIndex];
      } else if (intensity < 0.3) {
        colorIndex = 0; // Still light color
        alpha = 0.25; // Light but visible
        color = colors[colorIndex];
      } else if (intensity < 0.5) {
        colorIndex = 1; // Medium-light color
        alpha = 0.5; // Medium opacity
        color = colors[colorIndex];
      } else if (intensity < 0.7) {
        colorIndex = 2; // Medium-dark color
        alpha = 0.75; // Strong opacity
        color = colors[colorIndex];
      } else {
        colorIndex = 3; // Darkest color from palette
        alpha = 1.0; // Full opacity for maximum contrast
        color = colors[colorIndex];
      }
      
      // Apply AI analysis modifiers
      if (isAnomalous) {
        // Add red overlay for anomalies
        const anomalyRed = '#ff4757';
        const baseColor = hexToRgba(color, alpha);
        const anomalyOverlay = hexToRgba(anomalyRed, 0.3);
        color = anomalyRed; // Use red for anomalous data points
        alpha = Math.max(alpha, 0.6); // Increase visibility
      }
      
      // Adjust opacity based on AI confidence
      alpha *= Math.max(0.3, aiConfidence); // Low confidence = lower opacity
      
      // Trend strength indicator (subtle color shift)
      if (trendStrength > 0.5) {
        // Strengthen colors for significant trends
        alpha = Math.max(alpha, 0.7);
        colorIndex = Math.min(colors.length - 1, colorIndex + 1);
        color = colors[colorIndex];
      }
      
      return `${hexToRgba(color, alpha)} ${position}%`;
    }).join(', ');

    // Create base gradient
    let gradient = `linear-gradient(90deg, ${gradientStops})`;
    
    // Add AI analysis overlay patterns
    if (aiAnalysisData.hasSignificantTrend) {
      // Add subtle diagonal pattern for trending data
      gradient = `
        linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%),
        ${gradient}
      `;
    }
    
    if (aiAnalysisData.hasAnomalies) {
      // Add subtle warning pattern
      gradient = `
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(255, 71, 87, 0.1) 10px,
          rgba(255, 71, 87, 0.1) 12px
        ),
        ${gradient}
      `;
    }

    return gradient;
  };

  // Create step pattern for daily symptom data (no interpolation between days)
  const createStepPattern = (symptomKey, intensities, symptomEntries) => {
    // Create step-like path that stretches across the full width with multiple days of data
    let pathCommands = [];
    let hasStarted = false;
    let lastY = null;
    
    intensities.forEach((intensity, index) => {
      const x = (index / (intensities.length - 1)) * 100;
      const y = 50 - (intensity * 40); // Center around 50%, vary by intensity
      
      // Check if this day has actual data
      const hasData = symptomEntries[index]?.hasData !== false && intensity > 0;
      
      if (hasData) {
        if (!hasStarted) {
          // First data point - move to position
          pathCommands.push(`M ${x} ${y}`);
          hasStarted = true;
          lastY = y;
        } else {
          // Subsequent data points - create step pattern
          // First draw horizontal line to maintain previous value
          pathCommands.push(`L ${x} ${lastY}`);
          // Then draw vertical line to new value if it changed
          if (Math.abs(y - lastY) > 1) { // Only draw vertical if there's a meaningful change
            pathCommands.push(`L ${x} ${y}`);
          }
          lastY = y;
        }
        
        // If this is the last data point, extend line to the end
        if (index === intensities.length - 1) {
          pathCommands.push(`L 100 ${y}`);
        }
      } else if (hasStarted && lastY !== null) {
        // Continue the line horizontally for days without data (maintaining last value)
        pathCommands.push(`L ${x} ${lastY}`);
        
        // If this is the last day, extend to full width
        if (index === intensities.length - 1) {
          pathCommands.push(`L 100 ${lastY}`);
        }
      }
    });

    const svgPath = pathCommands.join(' ');

    // Only render if there's actual data to show
    if (!hasStarted || pathCommands.length === 0) {
      return null;
    }

    return (
      <svg 
        width="100%" 
        height="60" 
        className="step-overlay"
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <path
          d={svgPath}
          stroke="#ffffff"
          strokeWidth="2"
          fill="none"
          opacity="0.8"
        />
        {/* Add dots for actual data points */}
        {intensities.map((intensity, index) => {
          const hasData = symptomEntries[index]?.hasData !== false && intensity > 0;
          if (!hasData) return null;
          
          const x = (index / (intensities.length - 1)) * 100;
          const y = 50 - (intensity * 40);
          
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={y}
              r="2"
              fill="#ffffff"
              opacity="0.9"
            />
          );
        })}
      </svg>
    );
  };

  // Group data by symptom and day
  const groupedData = useMemo(() => {
    const grouped = {};
    
    displayData.forEach(entry => {
      if (!grouped[entry.symptom]) {
        grouped[entry.symptom] = [];
      }
      grouped[entry.symptom][entry.day] = entry;
    });

    return grouped;
  }, [displayData]);

  // Use CSS custom properties following app design system
  const styles = {
    backgroundColor: 'var(--bg-secondary)',
    textColor: 'var(--text-primary)',
    borderColor: 'var(--border-light, rgba(203, 213, 225, 0.3))',
    cardBackground: 'var(--bg-primary)',
    accentColor: 'var(--color-primary)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--text-muted)'
  };

  return (
    <>
      <style>{`
        .symptom-strip:hover .symptom-hover-overlay {
          opacity: 1 !important;
          visibility: visible !important;
        }
      `}</style>
      <div 
        className={`stat-card system-status ${className}`}
        data-view-mode={viewMode}
        style={{ 
          backgroundColor: styles.cardBackground,
          border: `1px solid ${styles.borderColor}`,
          borderRadius: 'var(--radius-lg, 12px)',
          padding: 'var(--space-6, 24px)',
          color: styles.textColor,
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease'
        }}
      >
      {/* Header */}
      <div className="chart-header" style={{ marginBottom: 'var(--space-6, 24px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3, 12px)' }}>
          <div>
            <h3 style={{ 
              color: styles.accentColor, 
              margin: '0 0 var(--space-2, 8px) 0',
              fontSize: 'var(--font-size-lg, 18px)',
              fontWeight: '600'
            }}>
              Symptom Trends Analysis
            </h3>
            <p style={{ 
              margin: 0, 
              color: styles.textMuted,
              fontSize: 'var(--font-size-sm, 14px)'
            }}>
              {viewMode === 'aggregate' 
                ? 'Visual tracking of symptoms for all patients over the past 7 days' 
                : selectedPatient 
                  ? `Visual tracking of ${patients.find(p => p.id === selectedPatient)?.name || 'Selected Patient'}'s symptoms over the past 7 days`
                  : 'Select a patient to view individual trends'
              }
            </p>
          </div>
          
        </div>
      </div>

      {/* Individual Patient Info Card */}
      {viewMode === 'individual' && selectedPatient && (
        <div className="status-badge-large" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3, 12px)',
          marginBottom: 'var(--space-4, 16px)',
          padding: 'var(--space-3, 12px) var(--space-4, 16px)',
          backgroundColor: 'rgba(var(--color-primary-rgb, 59, 130, 246), 0.1)',
          border: `1px solid rgba(var(--color-primary-rgb, 59, 130, 246), 0.3)`,
          borderRadius: 'var(--radius-lg, 8px)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: styles.accentColor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-sm, 14px)',
            fontWeight: '600',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {patients.find(p => p.id === selectedPatient)?.initials}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ 
              margin: '0 0 var(--space-1, 4px) 0', 
              fontSize: 'var(--font-size-base, 16px)', 
              color: styles.textColor,
              fontWeight: '600'
            }}>
              {patients.find(p => p.id === selectedPatient)?.name}
            </h4>
            <p style={{ 
              margin: 0, 
              fontSize: 'var(--font-size-xs, 12px)', 
              color: styles.textMuted
            }}>
              Room {patients.find(p => p.id === selectedPatient)?.room} • Age {patients.find(p => p.id === selectedPatient)?.age} • Individual Analysis
            </p>
          </div>
          <div style={{
            fontSize: 'var(--font-size-sm, 14px)',
            color: styles.textMuted,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Patient
          </div>
        </div>
      )}


      {/* View Mode Toggle - Text Only */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        marginBottom: 'var(--space-2, 8px)' 
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-4, 16px)', alignItems: 'baseline' }}>
          <button
            onClick={() => setViewMode('aggregate')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0',
              fontSize: 'var(--font-size-sm, 14px)',
              fontWeight: viewMode === 'aggregate' ? '700' : '400',
              color: styles.textColor,
              cursor: 'pointer',
              transition: 'font-weight 0.2s ease'
            }}
          >
            All Patients
          </button>
          <button
            onClick={() => setViewMode('individual')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0',
              fontSize: 'var(--font-size-sm, 14px)',
              fontWeight: viewMode === 'individual' ? '700' : '400',
              color: styles.textColor,
              cursor: 'pointer',
              transition: 'font-weight 0.2s ease'
            }}
          >
            Individual
          </button>
        </div>
        
        {/* Patient Selector */}
        {viewMode === 'individual' && (
          <select
            value={selectedPatient || ''}
            onChange={(e) => setSelectedPatient(e.target.value)}
            style={{
              padding: 'var(--space-2, 8px)',
              fontSize: 'var(--font-size-xs, 11px)',
              border: `1px solid ${styles.borderColor}`,
              borderRadius: 'var(--radius-md, 6px)',
              backgroundColor: styles.backgroundColor,
              color: styles.textColor,
              minWidth: '160px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <option value="">Select Patient...</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name} - Room {patient.room}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Time axis - moved to top */}
      <div className="time-axis" style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-2, 8px)',
        padding: '0 var(--space-3, 12px)',
        fontSize: 'var(--font-size-xs, 11px)',
        color: styles.textMuted,
        fontWeight: '500'
      }}>
        {Array.from({ length: 7 }, (_, i) => {
          // Start from Sunday (0) and go through Saturday (6)
          const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
          const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const adjustedDate = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
          adjustedDate.setDate(adjustedDate.getDate() - adjustedDate.getDay() + i); // Adjust to start from Sunday
          
          return (
            <span key={i}>
              {adjustedDate.toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
          );
        })}
      </div>

      {/* Symptom Strips */}
      <div className="symptom-strips" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--space-3, 12px)' 
      }}>
        {viewMode === 'individual' && !selectedPatient ? (
          <div className="empty-state" style={{
            textAlign: 'center',
            padding: 'var(--space-8, 40px) var(--space-6, 20px)',
            backgroundColor: styles.backgroundColor,
            borderRadius: 'var(--radius-lg, 8px)',
            border: `2px dashed ${styles.borderColor}`,
            color: styles.textColor,
            opacity: 0.7
          }}>
            <div style={{ 
              fontSize: 'var(--font-size-lg, 24px)', 
              marginBottom: 'var(--space-4, 16px)', 
              fontWeight: '600', 
              color: styles.accentColor,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Patient
            </div>
            <h4 style={{ 
              margin: '0 0 var(--space-2, 8px) 0', 
              fontSize: 'var(--font-size-base, 16px)',
              fontWeight: '600',
              color: styles.textColor
            }}>
              Select a Patient
            </h4>
            <p style={{ 
              margin: 0, 
              fontSize: 'var(--font-size-sm, 13px)',
              color: styles.textMuted,
              lineHeight: '1.5'
            }}>
              Choose a patient from the dropdown above to view their individual symptom trends
            </p>
          </div>
        ) : (
          Object.entries(groupedData)
            .filter(([symptomKey]) => selectedSymptoms.has('all') || selectedSymptoms.has(symptomKey))
            .map(([symptomKey, symptomEntries]) => {
            const intensities = Array.from({ length: 7 }, (_, day) => 
              symptomEntries[day]?.intensity || 0
            );

            // Generate AI analysis for this symptom
            const aiAnalysis = generateAIAnalysisData(symptomKey, intensities);

            return (
              <div 
                key={symptomKey}
                className="symptom-strip"
                style={{
                  position: 'relative',
                  height: '60px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: createGradientStrip(symptomKey, intensities, aiAnalysis),
                  border: `1px solid ${symptomTypes[symptomKey].colors[1]}40`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: aiAnalysis.hasAnomalies 
                    ? '0 0 8px rgba(255, 71, 87, 0.3)' 
                    : aiAnalysis.hasSignificantTrend 
                      ? '0 0 6px rgba(59, 130, 246, 0.2)' 
                      : 'var(--shadow-sm)'
                }}
                title={`${symptomTypes[symptomKey].name} Analysis
Trend: ${aiAnalysis.trendDirection} (${Math.round(aiAnalysis.trendMagnitude * 100)}%)
Avg Intensity: ${Math.round(aiAnalysis.avgIntensity * 10)}/10
Variability: ${aiAnalysis.variability.toFixed(2)}
${aiAnalysis.hasAnomalies ? '⚠️ Anomalies detected' : ''}
${aiAnalysis.hasSignificantTrend ? '📈 Significant trend' : ''}`}
              >

                {/* Enhanced day markers with AI confidence indicators */}
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '8px',
                  display: 'flex',
                  gap: '2px'
                }}>
                  {intensities.map((intensity, dayIndex) => {
                    const confidence = aiAnalysis.confidence[dayIndex];
                    const isAnomalous = aiAnalysis.anomalies[dayIndex];
                    const trendStrength = aiAnalysis.trends[dayIndex];
                    
                    return (
                      <div
                        key={dayIndex}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isAnomalous 
                            ? '#ff4757' 
                            : trendStrength > 0.5 
                              ? '#3b82f6'
                              : intensity > 0.5 ? '#fff' : 'rgba(255,255,255,0.5)',
                          opacity: Math.max(0.3, confidence),
                          border: isAnomalous ? '1px solid #ff6b6b' : 'none',
                          boxShadow: isAnomalous ? '0 0 3px rgba(255, 71, 87, 0.5)' : 'none'
                        }}
                        title={`Day ${dayIndex + 1}
Intensity: ${Math.round(intensity * 10)}/10
Confidence: ${Math.round(confidence * 100)}%
${isAnomalous ? 'Anomaly detected' : ''}
${trendStrength > 0.5 ? 'Strong trend' : ''}`}
                      />
                    );
                  })}
                </div>

                {/* CSS-only hover overlay with symptom description */}
                <div 
                  className="symptom-hover-overlay"
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    opacity: '0',
                    visibility: 'hidden',
                    transition: 'opacity 0.2s ease, visibility 0.2s ease',
                    pointerEvents: 'none'
                  }}
                >
                  <div style={{
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    textAlign: 'center',
                    padding: '0 16px',
                    lineHeight: '1.4',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                  }}>
                    <div style={{ 
                      fontSize: '16px', 
                      marginBottom: '4px',
                      color: '#ffffff'
                    }}>
                      {symptomTypes[symptomKey].name}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      opacity: '0.9',
                      fontWeight: '400'
                    }}>
                      {symptomTypes[symptomKey].description}
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>


      {/* Enhanced Statistics summary with AI insights */}
      <div className="trend-summary status-badge" style={{
        marginTop: 'var(--space-4, 16px)',
        padding: 'var(--space-3, 12px)',
        backgroundColor: styles.backgroundColor,
        borderRadius: 'var(--radius-lg, 8px)',
        fontSize: 'var(--font-size-xs, 12px)',
        border: `1px solid ${styles.borderColor}`,
        boxShadow: 'var(--shadow-sm)'
      }}>
        {(() => {
          // Calculate AI analysis summary across all visible symptoms
          const visibleSymptoms = Object.entries(groupedData)
            .filter(([symptomKey]) => selectedSymptoms.has('all') || selectedSymptoms.has(symptomKey));
          
          const aiSummary = visibleSymptoms.reduce((acc, [symptomKey, symptomEntries]) => {
            const intensities = Array.from({ length: 7 }, (_, day) => 
              symptomEntries[day]?.intensity || 0
            );
            const analysis = generateAIAnalysisData(symptomKey, intensities);
            
            acc.totalAnomalies += analysis.hasAnomalies ? 1 : 0;
            acc.totalTrends += analysis.hasSignificantTrend ? 1 : 0;
            acc.avgConfidence += analysis.confidence.reduce((a, b) => a + b, 0) / analysis.confidence.length;
            acc.symptomCount += 1;
            
            return acc;
          }, { totalAnomalies: 0, totalTrends: 0, avgConfidence: 0, symptomCount: 0 });
          
          if (aiSummary.symptomCount > 0) {
            aiSummary.avgConfidence = aiSummary.avgConfidence / aiSummary.symptomCount;
          }

          return viewMode === 'aggregate' ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap', 
              gap: 'var(--space-2, 8px)',
              color: styles.textColor
            }}>
              <span>Population: <strong>{patients.length} patients</strong></span>
              <span style={{ 
                color: aiSummary.totalAnomalies > 0 ? '#ff6b6b' : styles.textColor 
              }}>
                AI Anomalies: <strong>{aiSummary.totalAnomalies}</strong>
              </span>
              <span style={{ 
                color: aiSummary.totalTrends > 0 ? '#3b82f6' : styles.textColor 
              }}>
                Trends: <strong>{aiSummary.totalTrends}</strong>
              </span>
              <span>
                AI Confidence: <strong>{Math.round(aiSummary.avgConfidence * 100)}%</strong>
              </span>
            </div>
          ) : selectedPatient ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap', 
              gap: 'var(--space-2, 8px)',
              color: styles.textColor
            }}>
              <span>Patient: <strong>{patients.find(p => p.id === selectedPatient)?.name}</strong></span>
              <span>Room: <strong>{patients.find(p => p.id === selectedPatient)?.room}</strong></span>
              <span style={{ 
                color: aiSummary.totalAnomalies > 0 ? '#ff6b6b' : styles.textColor 
              }}>
                Anomalies: <strong>{aiSummary.totalAnomalies}</strong>
              </span>
              <span style={{ 
                color: aiSummary.totalTrends > 0 ? '#3b82f6' : styles.textColor 
              }}>
                Trends: <strong>{aiSummary.totalTrends}</strong>
              </span>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              color: styles.textMuted,
              fontStyle: 'italic'
            }}>
              Select a patient to view individual symptom trends and AI analysis
            </div>
          );
        })()}
      </div>
      </div>
    </>
  );
};

export default SymptomTrendChart;