import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import apiService from '../../services/api';

// Helper function for theme-aware styling
const getThemeStyles = (theme = 'dark') => ({
  textPrimary: theme === 'dark' ? '#f1f5f9' : '#2d1810',
  textSecondary: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
  textMuted: theme === 'dark' ? '#94a3b8' : '#8b7355',
  bgPrimary: theme === 'dark' ? '#1e293b' : '#faf8f3',
  bgSecondary: theme === 'dark' ? '#0f172a' : '#f4f1eb',
  bgAccent: theme === 'dark' ? '#374151' : '#ede8df',
  borderColor: theme === 'dark' ? '#475569' : '#d4c4a8',
  primaryColor: theme === 'dark' ? '#3b82f6' : '#8b4513',
  successColor: theme === 'dark' ? '#10b981' : '#6b8e23',
  warningColor: theme === 'dark' ? '#f59e0b' : '#cd853f',
  errorColor: theme === 'dark' ? '#ef4444' : '#a0522d'
});

// Format timestamp for display
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  // Handle UTC timestamps properly
  const utcString = timestamp && !timestamp.endsWith('Z') && !timestamp.includes('+') 
    ? timestamp + 'Z' 
    : timestamp;
  
  const date = new Date(utcString);
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Individual audit log entry component
const AuditLogEntry = ({ log, theme }) => {
  const styles = getThemeStyles(theme);
  
  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: `1px solid ${styles.borderColor}`,
      backgroundColor: styles.bgPrimary,
      fontSize: '13px',
      lineHeight: '1.4'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '6px'
      }}>
        <div style={{
          fontWeight: '600',
          color: styles.textPrimary,
          flex: 1
        }}>
          {log.action}
        </div>
        <div style={{
          fontSize: '11px',
          color: styles.textMuted,
          whiteSpace: 'nowrap',
          marginLeft: '12px'
        }}>
          {formatTimestamp(log.timestamp)}
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '4px'
      }}>
        <div style={{ color: styles.textSecondary }}>
          <strong>User:</strong> {log.user_id || 'System'}
        </div>
        {log.resource_type && (
          <div style={{ color: styles.textSecondary }}>
            <strong>Resource:</strong> {log.resource_type}
            {log.resource_id && ` (ID: ${log.resource_id})`}
          </div>
        )}
      </div>
      
      {log.details && (
        <div style={{
          fontSize: '12px',
          color: styles.textMuted,
          backgroundColor: styles.bgSecondary,
          padding: '6px 8px',
          borderRadius: '4px',
          marginTop: '6px',
          fontFamily: 'monospace'
        }}>
          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
        </div>
      )}
    </div>
  );
};

// Date range selector component
const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange, theme }) => {
  const styles = getThemeStyles(theme);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      marginBottom: '20px',
      padding: '16px',
      backgroundColor: styles.bgSecondary,
      borderRadius: '8px',
      border: `1px solid ${styles.borderColor}`
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <label style={{
          fontSize: '12px',
          fontWeight: '600',
          color: styles.textPrimary
        }}>
          Start Date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          max={today}
          style={{
            padding: '8px 12px',
            backgroundColor: styles.bgPrimary,
            color: styles.textPrimary,
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '6px',
            fontSize: '13px'
          }}
        />
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <label style={{
          fontSize: '12px',
          fontWeight: '600',
          color: styles.textPrimary
        }}>
          End Date
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          max={today}
          style={{
            padding: '8px 12px',
            backgroundColor: styles.bgPrimary,
            color: styles.textPrimary,
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '6px',
            fontSize: '13px'
          }}
        />
      </div>
    </div>
  );
};

// Main Audit Logging Modal Component
const AuditLoggingModal = ({ isOpen, onClose, theme = 'dark' }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTheme, setCurrentTheme] = useState(theme);
  
  // Date range state - default to last 30 days
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  
  const styles = getThemeStyles(currentTheme);

  // Listen for theme changes
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setCurrentTheme(newTheme);
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  // Fetch audit logs from API
  const fetchAuditLogs = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before end date');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const data = await apiService.getAuditLogs({ 
        start_date: startDate, 
        end_date: endDate 
      });
      
      if (data.success) {
        setAuditLogs(data.logs || []);
      } else {
        setError(data.error || 'Failed to fetch audit logs');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Network error while fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Export audit logs as TXT file
  const exportAuditLogs = () => {
    if (auditLogs.length === 0) {
      alert('No audit logs to export');
      return;
    }

    const exportContent = [
      `MeDocPro Audit Log Export`,
      `Generated: ${new Date().toLocaleString()}`,
      `Date Range: ${startDate} to ${endDate}`,
      `Total Records: ${auditLogs.length}`,
      '',
      '=' .repeat(80),
      ''
    ];

    auditLogs.forEach((log, index) => {
      exportContent.push(`${index + 1}. ${log.action}`);
      exportContent.push(`   Timestamp: ${formatTimestamp(log.timestamp)}`);
      exportContent.push(`   User: ${log.user_id || 'System'}`);
      
      if (log.resource_type) {
        exportContent.push(`   Resource: ${log.resource_type}${log.resource_id ? ` (ID: ${log.resource_id})` : ''}`);
      }
      
      if (log.details) {
        const detailsStr = typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2);
        exportContent.push(`   Details: ${detailsStr}`);
      }
      
      exportContent.push(''); // Empty line between entries
    });

    const blob = new Blob([exportContent.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medocpro-audit-logs-${startDate}-to-${endDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load audit logs when modal opens or date range changes
  useEffect(() => {
    if (isOpen && startDate && endDate) {
      fetchAuditLogs();
    }
  }, [isOpen, startDate, endDate]);

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10020
    }}>
      <div style={{
        backgroundColor: styles.bgPrimary,
        borderRadius: '12px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: `1px solid ${styles.borderColor}`,
          backgroundColor: styles.bgSecondary
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: styles.textPrimary
            }}>
              Audit Logging
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              color: styles.textMuted
            }}>
              View and export system audit logs for compliance and monitoring
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: styles.textMuted,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = styles.bgAccent;
              e.target.style.color = styles.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = styles.textMuted;
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '20px'
        }}>
          {/* Date Range Selector */}
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            theme={currentTheme}
          />

          {/* Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{
              fontSize: '14px',
              color: styles.textMuted
            }}>
              {loading ? (
                'Loading audit logs...'
              ) : error ? (
                <span style={{ color: styles.errorColor }}>{error}</span>
              ) : (
                `${auditLogs.length} audit log entries found`
              )}
            </div>
            
            <button
              onClick={exportAuditLogs}
              disabled={loading || auditLogs.length === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: auditLogs.length > 0 ? styles.primaryColor : styles.bgAccent,
                color: auditLogs.length > 0 ? 'white' : styles.textMuted,
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: auditLogs.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease'
              }}
            >
              Export as TXT
            </button>
          </div>

          {/* Audit Log List */}
          <div style={{
            flex: 1,
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {loading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: styles.textMuted
              }}>
                Loading audit logs...
              </div>
            ) : error ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: styles.errorColor,
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>Error Loading Logs</div>
                  <div style={{ fontSize: '14px' }}>{error}</div>
                </div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: styles.textMuted,
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>No Audit Logs Found</div>
                  <div style={{ fontSize: '14px' }}>No audit log entries found for the selected date range</div>
                </div>
              </div>
            ) : (
              <div style={{
                flex: 1,
                overflowY: 'auto',
                // Custom scrollbar styling
                scrollbarWidth: 'thin',
                scrollbarColor: `${styles.borderColor} transparent`
              }}>
                {auditLogs.map((log, index) => (
                  <AuditLogEntry
                    key={index}
                    log={log}
                    theme={currentTheme}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AuditLoggingModal;