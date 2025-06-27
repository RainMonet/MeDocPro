import React, { useState, useEffect } from 'react';

// Visual aging color system matching scratch pad
const getAgeStageDisplay = (ageStage) => {
  const stageConfig = {
    fresh: { 
      color: '#10b981', 
      bgColor: 'rgba(16, 185, 129, 0.1)', 
      icon: '🟢', 
      label: 'Fresh',
      description: 'Just created'
    },
    aging: { 
      color: '#f59e0b', 
      bgColor: 'rgba(245, 158, 11, 0.1)', 
      icon: '🟡', 
      label: 'Aging',
      description: '2-3 days old'
    },
    mature: { 
      color: '#ea580c', 
      bgColor: 'rgba(234, 88, 12, 0.1)', 
      icon: '🟠', 
      label: 'Mature',
      description: '4-5 days old'
    },
    expiring: { 
      color: '#ef4444', 
      bgColor: 'rgba(239, 68, 68, 0.1)', 
      icon: '🔴', 
      label: 'Expiring',
      description: 'Burns soon!'
    },
    expired: { 
      color: '#b91c1c', 
      bgColor: 'rgba(185, 28, 28, 0.1)', 
      icon: '💀', 
      label: 'Expired',
      description: 'Auto-deleted'
    }
  };
  return stageConfig[ageStage] || stageConfig.fresh;
};

// Group notes by day
const groupNotesByDay = (notes) => {
  const groups = {};
  const today = new Date();
  
  notes.forEach(note => {
    const createdDate = new Date(note.created_at);
    const daysDiff = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
    
    let dayKey;
    if (daysDiff === 0) {
      dayKey = 'Today';
    } else if (daysDiff === 1) {
      dayKey = 'Yesterday';
    } else {
      dayKey = `${daysDiff} days ago`;
    }
    
    if (!groups[dayKey]) {
      groups[dayKey] = [];
    }
    groups[dayKey].push(note);
  });
  
  return groups;
};

// Individual day row component
const DayRow = ({ dayLabel, notes, onClick }) => {
  if (!notes || notes.length === 0) return null;
  
  // Group notes by age stage for this day
  const stageGroups = {};
  notes.forEach(note => {
    const stage = note.visual_age_stage;
    if (!stageGroups[stage]) {
      stageGroups[stage] = [];
    }
    stageGroups[stage].push(note);
  });
  
  // Get the most critical stage for this day
  const stages = ['expired', 'expiring', 'mature', 'aging', 'fresh'];
  const criticalStage = stages.find(stage => stageGroups[stage]?.length > 0) || 'fresh';
  const stageDisplay = getAgeStageDisplay(criticalStage);
  
  return (
    <div 
      onClick={() => onClick && onClick(notes)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        marginBottom: '8px',
        backgroundColor: stageDisplay.bgColor,
        borderLeft: `4px solid ${stageDisplay.color}`,
        borderRadius: '6px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.target.style.backgroundColor = stageDisplay.bgColor.replace('0.1', '0.15');
          e.target.style.transform = 'translateX(2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.target.style.backgroundColor = stageDisplay.bgColor;
          e.target.style.transform = 'translateX(0)';
        }
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '2px'
        }}>
          {dayLabel} ({notes.length} note{notes.length !== 1 ? 's' : ''})
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          {Object.entries(stageGroups).map(([stage, stageNotes]) => (
            <span key={stage} style={{ marginRight: '8px' }}>
              {getAgeStageDisplay(stage).icon} {stageNotes.length}
            </span>
          ))}
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: '500',
          color: stageDisplay.color
        }}>
          {stageDisplay.icon} {stageDisplay.label}
        </span>
        {onClick && (
          <span style={{
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}>
            →
          </span>
        )}
      </div>
    </div>
  );
};

// Summary stats component
const SummaryStats = ({ notes }) => {
  const totalNotes = notes.length;
  const expiringToday = notes.filter(n => n.days_until_expiration === 0).length;
  const expiringSoon = notes.filter(n => n.days_until_expiration <= 1 && n.days_until_expiration > 0).length;
  const transferred = notes.filter(n => n.transferred_to_census).length;
  
  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      borderRadius: '6px',
      marginTop: '8px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>📝</span>
          <span style={{ color: 'var(--text-primary)' }}>
            <strong>{totalNotes}</strong> total notes
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>📊</span>
          <span style={{ color: 'var(--text-primary)' }}>
            <strong>{transferred}</strong> transferred
          </span>
        </div>
        
        {expiringToday > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            gridColumn: '1 / -1',
            padding: '4px 8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '4px'
          }}>
            <span style={{ fontSize: '16px' }}>🔥</span>
            <span style={{ color: '#ef4444', fontWeight: '500' }}>
              <strong>{expiringToday}</strong> note{expiringToday !== 1 ? 's' : ''} expire{expiringToday === 1 ? 's' : ''} today!
            </span>
          </div>
        )}
        
        {expiringSoon > 0 && expiringToday === 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            gridColumn: '1 / -1',
            padding: '4px 8px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '4px'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span style={{ color: '#f59e0b', fontWeight: '500' }}>
              <strong>{expiringSoon}</strong> note{expiringSoon !== 1 ? 's' : ''} expire{expiringSoon === 1 ? 's' : ''} tomorrow
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Clinical Notes Overview component
const ClinicalNotesOverview = ({ onOpenClinicalWorkflow }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load scratch notes
  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scratch-notes');
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.scratch_notes || []);
      } else {
        setError(data.error || 'Failed to load notes');
      }
    } catch (err) {
      setError('Network error loading notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
    // Refresh every 2 minutes
    const interval = setInterval(loadNotes, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDayClick = (dayNotes) => {
    if (onOpenClinicalWorkflow) {
      onOpenClinicalWorkflow('scratch');
    }
  };

  const groupedNotes = groupNotesByDay(notes);
  const dayKeys = Object.keys(groupedNotes).sort((a, b) => {
    // Sort by recency (Today, Yesterday, 2 days ago, etc.)
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    
    const daysA = parseInt(a.match(/(\d+) days ago/)?.[1] || '0');
    const daysB = parseInt(b.match(/(\d+) days ago/)?.[1] || '0');
    return daysA - daysB;
  });

  if (loading) {
    return (
      <div className="system-status" style={{ minHeight: '200px' }}>
        <h3>📝 Clinical Notes Overview</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100px',
          color: 'var(--text-muted)'
        }}>
          <div className="loading-spinner" style={{ width: '20px', height: '20px', marginRight: '8px' }}></div>
          Loading notes...
        </div>
      </div>
    );
  }

  return (
    <div className="system-status" style={{ minHeight: '200px' }}>
      <h3>📝 Clinical Notes Overview</h3>
      <p>Daily scratch notes with visual burn indicators</p>
      
      {error && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '3px solid #ef4444',
          borderRadius: '4px',
          marginBottom: '12px',
          fontSize: '13px',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}

      <div className="status-grid">
        {notes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>No clinical notes yet</div>
            <div style={{ fontSize: '12px' }}>
              Create your first scratch note to track clinical observations
            </div>
            {onOpenClinicalWorkflow && (
              <button
                onClick={() => onOpenClinicalWorkflow('scratch')}
                style={{
                  marginTop: '12px',
                  padding: '6px 12px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Create First Note
              </button>
            )}
          </div>
        ) : (
          <>
            {dayKeys.map(dayKey => (
              <DayRow
                key={dayKey}
                dayLabel={dayKey}
                notes={groupedNotes[dayKey]}
                onClick={handleDayClick}
              />
            ))}
            
            <SummaryStats notes={notes} />
          </>
        )}
      </div>

      <div className="last-checked">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default ClinicalNotesOverview;