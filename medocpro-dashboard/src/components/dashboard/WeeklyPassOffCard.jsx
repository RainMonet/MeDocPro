import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../../services/api';

const WeeklyPassOffCard = ({ 
  timeRange = 'week', 
  className = '' 
}) => {
  const [passOffData, setPassOffData] = useState({
    patients: [],
    summary: null,
    weekPeriod: ''
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Load weekly pass-off data
  const loadPassOffData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found, using sample data');
        setPassOffData(generateSamplePassOffData());
        return;
      }
      
      // Use apiService for consistent API calls
      const result = await apiService.get('/api/weekly-pass-off-summary');
      
      if (result.success) {
        setPassOffData({
          patients: result.patients || [],
          summary: result.summary || null,
          weekPeriod: result.week_period || 'Current Week'
        });
      } else {
        throw new Error(result.error || 'Failed to load pass-off data');
      }
      
    } catch (error) {
      console.error('Error loading pass-off data:', error);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // If it's an authentication error, show specific message
      if (error.message.includes('Authentication') || error.message.includes('token') || error.message.includes('401')) {
        setError('Authentication required - Please log in to view pass-off data');
      } else {
        setError(`API Error: ${error.message}`);
      }
      
      // Fallback to sample data for development
      setPassOffData(generateSamplePassOffData());
    } finally {
      setLoading(false);
    }
  };

  // Generate sample pass-off data
  const generateSamplePassOffData = () => {
    const samplePatients = [
      {
        id: 'p001',
        name: 'Sarah Chen',
        room: '101A',
        age: 34,
        admissionDate: '2024-01-05',
        primaryDiagnosis: 'Major Depressive Disorder',
        currentCondition: 'stable',
        keyIssues: ['Mild anxiety episodes', 'Sleep disturbances'],
        medications: ['Sertraline 50mg daily', 'Trazodone 25mg PRN'],
        lastAssessment: 'Mood improved, engaging in therapy sessions',
        riskFactors: 'Low suicide risk, compliant with treatment',
        weeklyProgress: 'Good engagement, mood stabilizing',
        urgentConcerns: null,
        nextActions: 'Continue current medications, monitor sleep'
      },
      {
        id: 'p002',
        name: 'Michael Rodriguez',
        room: '102B',
        age: 67,
        admissionDate: '2024-01-03',
        primaryDiagnosis: 'Bipolar I Disorder',
        currentCondition: 'monitoring',
        keyIssues: ['Mood swings', 'Medication compliance'],
        medications: ['Lithium 900mg BID', 'Quetiapine 200mg HS'],
        lastAssessment: 'Manic episode subsiding, increased insight',
        riskFactors: 'Moderate risk, history of non-compliance',
        weeklyProgress: 'Significant improvement in mood stability',
        urgentConcerns: 'Monitor lithium levels',
        nextActions: 'Lab work Monday, continue mood tracking'
      },
      {
        id: 'p003',
        name: 'Emma Thompson',
        room: '103A',
        age: 42,
        admissionDate: '2024-01-04',
        primaryDiagnosis: 'PTSD with Depression',
        currentCondition: 'stable',
        keyIssues: ['Nightmares', 'Hypervigilance', 'Social withdrawal'],
        medications: ['Prazosin 2mg HS', 'Venlafaxine 150mg daily'],
        lastAssessment: 'Trauma processing improving, less reactive',
        riskFactors: 'Low risk, strong family support',
        weeklyProgress: 'Participating in group therapy',
        urgentConcerns: null,
        nextActions: 'Continue trauma-focused therapy'
      },
      {
        id: 'p004',
        name: 'David Kim',
        room: '104B',
        age: 55,
        admissionDate: '2024-01-02',
        primaryDiagnosis: 'Alcohol Use Disorder',
        currentCondition: 'critical',
        keyIssues: ['Withdrawal symptoms', 'Liver function concerns'],
        medications: ['Thiamine 100mg daily', 'Lorazepam taper schedule'],
        lastAssessment: 'Withdrawal managed, craving intense',
        riskFactors: 'High relapse risk, limited support system',
        weeklyProgress: 'Medically stable, psychologically fragile',
        urgentConcerns: 'Close monitoring for withdrawal complications',
        nextActions: 'Continue detox protocol, addiction counseling'
      },
      {
        id: 'p005',
        name: 'Lisa Johnson',
        room: '105A',
        age: 28,
        admissionDate: '2024-01-06',
        primaryDiagnosis: 'Generalized Anxiety Disorder',
        currentCondition: 'stable',
        keyIssues: ['Panic attacks', 'Work-related stress'],
        medications: ['Escitalopram 10mg daily', 'Propranolol PRN'],
        lastAssessment: 'Anxiety decreased, learning coping skills',
        riskFactors: 'Low risk, high motivation for recovery',
        weeklyProgress: 'Excellent response to CBT techniques',
        urgentConcerns: null,
        nextActions: 'Discharge planning, outpatient referral'
      },
      {
        id: 'p006',
        name: 'Robert Wilson',
        room: '106B',
        age: 71,
        admissionDate: '2024-01-01',
        primaryDiagnosis: 'Dementia with Behavioral Symptoms',
        currentCondition: 'monitoring',
        keyIssues: ['Agitation', 'Confusion', 'Wandering behavior'],
        medications: ['Memantine 10mg BID', 'Risperidone 0.5mg PRN'],
        lastAssessment: 'Less agitated with routine, family concerned',
        riskFactors: 'Fall risk, requires constant supervision',
        weeklyProgress: 'Behavioral interventions showing benefit',
        urgentConcerns: 'Family meeting needed for long-term care',
        nextActions: 'Social work consultation, care coordination'
      }
    ];

    return {
      patients: samplePatients,
      summary: {
        totalPatients: samplePatients.length,
        stablePatients: samplePatients.filter(p => p.currentCondition === 'stable').length,
        monitoringPatients: samplePatients.filter(p => p.currentCondition === 'monitoring').length,
        criticalPatients: samplePatients.filter(p => p.currentCondition === 'critical').length,
        urgentConcerns: samplePatients.filter(p => p.urgentConcerns).length,
        averageLengthOfStay: 4.2,
        dischargesPlanned: 1
      },
      weekPeriod: 'January 8-14, 2024'
    };
  };

  // Load data on component mount
  useEffect(() => {
    loadPassOffData();
  }, []);

  // Get condition status styling
  const getConditionStyling = (condition) => {
    switch (condition) {
      case 'critical':
        return {
          color: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        };
      case 'monitoring':
        return {
          color: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        };
      case 'stable':
        return {
          color: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        };
      default:
        return {
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)'
        };
    }
  };

  // Calculate length of stay
  const calculateLengthOfStay = (admissionDate) => {
    const admission = new Date(admissionDate);
    const today = new Date();
    const diffTime = Math.abs(today - admission);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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

  if (loading) {
    return (
      <div 
        className={`stat-card system-status ${className}`}
        style={{ 
          backgroundColor: styles.cardBackground,
          border: `1px solid ${styles.borderColor}`,
          borderRadius: 'var(--radius-lg, 12px)',
          padding: 'var(--space-6, 24px)',
          color: styles.textColor,
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 'var(--space-4, 16px)'
        }}
      >
        <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
        <div style={{ fontSize: 'var(--font-size-sm, 14px)', color: styles.textMuted }}>
          Loading weekly pass-off summary...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`stat-card system-status ${className}`}
        style={{ 
          backgroundColor: styles.cardBackground,
          border: `1px solid #ef4444`,
          borderRadius: 'var(--radius-lg, 12px)',
          padding: 'var(--space-6, 24px)',
          color: styles.textColor,
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 'var(--space-4, 16px)'
        }}
      >
        <div style={{ 
          fontSize: 'var(--font-size-lg, 18px)', 
          fontWeight: '600', 
          color: '#ef4444' 
        }}>
          Error Loading Pass-Off Data
        </div>
        <div style={{ 
          fontSize: 'var(--font-size-sm, 14px)', 
          color: styles.textMuted,
          marginBottom: 'var(--space-4, 16px)'
        }}>
          {error}
        </div>
        <button
          onClick={loadPassOffData}
          style={{
            padding: 'var(--space-2, 8px) var(--space-4, 16px)',
            backgroundColor: styles.accentColor,
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md, 6px)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm, 14px)',
            fontWeight: '500'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`stat-card system-status ${className}`}
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
              Weekly Pass-Off Summary
            </h3>
            <p style={{ 
              margin: 0, 
              color: styles.textMuted,
              fontSize: 'var(--font-size-sm, 14px)'
            }}>
              {passOffData.weekPeriod} • Comprehensive patient handoff for weekend coverage
            </p>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {passOffData.summary && (
        <div className="status-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'var(--space-3, 12px)',
          marginBottom: 'var(--space-6, 24px)',
          padding: 'var(--space-4, 16px)',
          backgroundColor: styles.backgroundColor,
          borderRadius: 'var(--radius-lg, 8px)',
          border: `1px solid ${styles.borderColor}`
        }}>
          <div className="status-item" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-xl, 20px)', fontWeight: '700', color: styles.accentColor }}>
              {passOffData.summary.totalPatients}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs, 12px)', color: styles.textMuted, textTransform: 'uppercase', fontWeight: '500' }}>
              Total Patients
            </div>
          </div>
          <div className="status-item" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-xl, 20px)', fontWeight: '700', color: '#10b981' }}>
              {passOffData.summary.stablePatients}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs, 12px)', color: styles.textMuted, textTransform: 'uppercase', fontWeight: '500' }}>
              Stable
            </div>
          </div>
          <div className="status-item" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-xl, 20px)', fontWeight: '700', color: '#f59e0b' }}>
              {passOffData.summary.monitoringPatients}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs, 12px)', color: styles.textMuted, textTransform: 'uppercase', fontWeight: '500' }}>
              Monitor
            </div>
          </div>
          <div className="status-item" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-xl, 20px)', fontWeight: '700', color: '#ef4444' }}>
              {passOffData.summary.criticalPatients}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs, 12px)', color: styles.textMuted, textTransform: 'uppercase', fontWeight: '500' }}>
              Critical
            </div>
          </div>
          <div className="status-item" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-xl, 20px)', fontWeight: '700', color: styles.textColor }}>
              {passOffData.summary.averageLengthOfStay}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs, 12px)', color: styles.textMuted, textTransform: 'uppercase', fontWeight: '500' }}>
              Avg LOS (days)
            </div>
          </div>
        </div>
      )}

      {/* Patient Details */}
      <div className="patient-list" style={{ 
        maxHeight: selectedPatient ? 'none' : '600px', 
        overflowY: selectedPatient ? 'visible' : 'auto',
        paddingRight: selectedPatient ? '0' : 'var(--space-2, 8px)'
      }}>
        {passOffData.patients.length === 0 ? (
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
              fontSize: 'var(--font-size-lg, 18px)', 
              marginBottom: 'var(--space-2, 8px)', 
              fontWeight: '600',
              color: styles.textMuted
            }}>
              No Pass-Off Data Available
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: 'var(--font-size-sm, 14px)',
              color: styles.textMuted
            }}>
              No patients found for this week's pass-off summary
            </p>
          </div>
        ) : selectedPatient ? (
          // Detailed patient view
          <div className="patient-detail" style={{
            backgroundColor: styles.backgroundColor,
            borderRadius: 'var(--radius-lg, 8px)',
            padding: 'var(--space-6, 24px)',
            border: `1px solid ${styles.borderColor}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 'var(--space-4, 16px)'
            }}>
              <div>
                <h4 style={{
                  margin: '0 0 var(--space-1, 4px) 0',
                  fontSize: 'var(--font-size-lg, 18px)',
                  fontWeight: '600',
                  color: styles.textColor
                }}>
                  {selectedPatient.name}
                </h4>
                <div style={{
                  fontSize: 'var(--font-size-sm, 14px)',
                  color: styles.textMuted,
                  marginBottom: 'var(--space-2, 8px)'
                }}>
                  Room {selectedPatient.room} • Age {selectedPatient.age} • {calculateLengthOfStay(selectedPatient.admissionDate)} days
                </div>
                <span 
                  style={{
                    padding: 'var(--space-1, 4px) var(--space-2, 8px)',
                    borderRadius: 'var(--radius-md, 6px)',
                    fontSize: 'var(--font-size-xs, 12px)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    ...getConditionStyling(selectedPatient.currentCondition)
                  }}
                >
                  {selectedPatient.currentCondition}
                </span>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--font-size-lg, 18px)',
                  cursor: 'pointer',
                  color: styles.textMuted,
                  padding: 'var(--space-1, 4px)'
                }}
              >
                ✕
              </button>
            </div>

            <div className="patient-sections" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-6, 24px)',
              marginTop: 'var(--space-4, 16px)'
            }}>
              <div>
                <h5 style={{
                  margin: '0 0 var(--space-2, 8px) 0',
                  fontSize: 'var(--font-size-base, 16px)',
                  fontWeight: '600',
                  color: styles.accentColor
                }}>
                  Clinical Information
                </h5>
                <div style={{ fontSize: 'var(--font-size-sm, 14px)', lineHeight: '1.5' }}>
                  <div style={{ marginBottom: 'var(--space-2, 8px)' }}>
                    <strong>Primary Diagnosis:</strong> {selectedPatient.primaryDiagnosis}
                  </div>
                  <div style={{ marginBottom: 'var(--space-2, 8px)' }}>
                    <strong>Admission Date:</strong> {new Date(selectedPatient.admissionDate).toLocaleDateString()}
                  </div>
                  <div style={{ marginBottom: 'var(--space-2, 8px)' }}>
                    <strong>Key Issues:</strong>
                    <ul style={{ margin: 'var(--space-1, 4px) 0', paddingLeft: 'var(--space-4, 16px)' }}>
                      {selectedPatient.keyIssues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ marginBottom: 'var(--space-2, 8px)' }}>
                    <strong>Current Medications:</strong>
                    <ul style={{ margin: 'var(--space-1, 4px) 0', paddingLeft: 'var(--space-4, 16px)' }}>
                      {selectedPatient.medications.map((med, index) => (
                        <li key={index}>{med}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h5 style={{
                  margin: '0 0 var(--space-2, 8px) 0',
                  fontSize: 'var(--font-size-base, 16px)',
                  fontWeight: '600',
                  color: styles.accentColor
                }}>
                  Care Summary
                </h5>
                <div style={{ fontSize: 'var(--font-size-sm, 14px)', lineHeight: '1.5' }}>
                  <div style={{ marginBottom: 'var(--space-3, 12px)' }}>
                    <strong>Last Assessment:</strong>
                    <div style={{ 
                      marginTop: 'var(--space-1, 4px)',
                      padding: 'var(--space-2, 8px)',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md, 6px)',
                      fontStyle: 'italic'
                    }}>
                      {selectedPatient.lastAssessment}
                    </div>
                  </div>
                  <div style={{ marginBottom: 'var(--space-3, 12px)' }}>
                    <strong>Weekly Progress:</strong>
                    <div style={{ marginTop: 'var(--space-1, 4px)' }}>
                      {selectedPatient.weeklyProgress}
                    </div>
                  </div>
                  <div style={{ marginBottom: 'var(--space-3, 12px)' }}>
                    <strong>Risk Factors:</strong>
                    <div style={{ marginTop: 'var(--space-1, 4px)' }}>
                      {selectedPatient.riskFactors}
                    </div>
                  </div>
                  {selectedPatient.urgentConcerns && (
                    <div style={{ 
                      marginBottom: 'var(--space-3, 12px)',
                      padding: 'var(--space-2, 8px)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderLeft: '3px solid #ef4444',
                      borderRadius: 'var(--radius-md, 6px)'
                    }}>
                      <strong style={{ color: '#ef4444' }}>Urgent Concerns:</strong>
                      <div style={{ marginTop: 'var(--space-1, 4px)', color: '#ef4444' }}>
                        {selectedPatient.urgentConcerns}
                      </div>
                    </div>
                  )}
                  <div>
                    <strong>Next Actions:</strong>
                    <div style={{ marginTop: 'var(--space-1, 4px)' }}>
                      {selectedPatient.nextActions}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Patient list view
          <div className="patient-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-4, 16px)'
          }}>
            {passOffData.patients.map(patient => (
              <div
                key={patient.id}
                className="patient-card"
                onClick={() => setSelectedPatient(patient)}
                style={{
                  padding: 'var(--space-4, 16px)',
                  backgroundColor: styles.backgroundColor,
                  borderRadius: 'var(--radius-lg, 8px)',
                  border: `1px solid ${styles.borderColor}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = 'var(--shadow-md)';
                  e.target.style.borderColor = styles.accentColor;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'var(--shadow-sm)';
                  e.target.style.borderColor = styles.borderColor;
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 'var(--space-2, 8px)'
                }}>
                  <div>
                    <h4 style={{
                      margin: '0 0 var(--space-1, 4px) 0',
                      fontSize: 'var(--font-size-base, 16px)',
                      fontWeight: '600',
                      color: styles.textColor
                    }}>
                      {patient.name}
                    </h4>
                    <div style={{
                      fontSize: 'var(--font-size-sm, 14px)',
                      color: styles.textMuted
                    }}>
                      Room {patient.room} • Age {patient.age}
                    </div>
                  </div>
                  <span 
                    style={{
                      padding: 'var(--space-1, 4px) var(--space-2, 8px)',
                      borderRadius: 'var(--radius-md, 6px)',
                      fontSize: 'var(--font-size-xs, 12px)',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      ...getConditionStyling(patient.currentCondition)
                    }}
                  >
                    {patient.currentCondition}
                  </span>
                </div>
                
                <div style={{
                  fontSize: 'var(--font-size-sm, 14px)',
                  color: styles.textSecondary,
                  marginBottom: 'var(--space-2, 8px)'
                }}>
                  <strong>Diagnosis:</strong> {patient.primaryDiagnosis}
                </div>
                
                <div style={{
                  fontSize: 'var(--font-size-sm, 14px)',
                  color: styles.textSecondary,
                  marginBottom: 'var(--space-2, 8px)'
                }}>
                  <strong>LOS:</strong> {calculateLengthOfStay(patient.admissionDate)} days
                </div>
                
                {patient.urgentConcerns && (
                  <div style={{
                    fontSize: 'var(--font-size-xs, 12px)',
                    color: '#ef4444',
                    fontWeight: '600',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    padding: 'var(--space-1, 4px) var(--space-2, 8px)',
                    borderRadius: 'var(--radius-md, 6px)',
                    marginTop: 'var(--space-2, 8px)'
                  }}>
                    ⚠️ Urgent: {patient.urgentConcerns}
                  </div>
                )}
                
                <div style={{
                  position: 'absolute',
                  bottom: 'var(--space-2, 8px)',
                  right: 'var(--space-2, 8px)',
                  fontSize: 'var(--font-size-xs, 12px)',
                  color: styles.textMuted,
                  fontWeight: '500'
                }}>
                  Click for details →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with generation info */}
      <div className="trend-summary status-badge" style={{
        marginTop: 'var(--space-4, 16px)',
        padding: 'var(--space-3, 12px)',
        backgroundColor: styles.backgroundColor,
        borderRadius: 'var(--radius-lg, 8px)',
        fontSize: 'var(--font-size-xs, 12px)',
        border: `1px solid ${styles.borderColor}`,
        boxShadow: 'var(--shadow-sm)',
        textAlign: 'center',
        color: styles.textMuted
      }}>
        Generated {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} • 
        Weekend Coverage Pass-Off Summary • 
        {passOffData.summary?.urgentConcerns > 0 && (
          <span style={{ color: '#ef4444', fontWeight: '600' }}>
            {passOffData.summary.urgentConcerns} Urgent Concerns
          </span>
        )}
        {passOffData.summary?.urgentConcerns === 0 && (
          <span style={{ color: '#10b981' }}>No Urgent Concerns</span>
        )}
      </div>
    </div>
  );
};

export default WeeklyPassOffCard;