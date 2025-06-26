import React, { useState, useEffect, useCallback } from 'react';

// Visual aging system for scratch notes
const getVisualAgeStyles = (ageStage, theme = 'dark') => {
  const baseStyles = {
    transition: 'all 0.3s ease',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    position: 'relative',
    overflow: 'hidden'
  };

  const ageStyles = {
    fresh: {
      backgroundColor: theme === 'dark' ? '#064e3b' : '#f0fdf4',
      borderLeft: '4px solid #10b981',
      color: theme === 'dark' ? '#d1fae5' : '#065f46',
      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)'
    },
    aging: {
      backgroundColor: theme === 'dark' ? '#451a03' : '#fffbeb',
      borderLeft: '4px solid #f59e0b',
      color: theme === 'dark' ? '#fde68a' : '#92400e',
      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)'
    },
    mature: {
      backgroundColor: theme === 'dark' ? '#7c2d12' : '#fff7ed',
      borderLeft: '4px solid #ea580c',
      color: theme === 'dark' ? '#fed7aa' : '#9a3412',
      boxShadow: '0 2px 4px rgba(234, 88, 12, 0.1)'
    },
    expiring: {
      backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
      borderLeft: '4px solid #ef4444',
      color: theme === 'dark' ? '#fca5a5' : '#991b1b',
      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
      animation: 'gentle-pulse 2s infinite'
    },
    expired: {
      backgroundColor: theme === 'dark' ? '#450a0a' : '#fef1f1',
      borderLeft: '4px solid #b91c1c',
      color: theme === 'dark' ? '#f87171' : '#7f1d1d',
      opacity: '0.7',
      animation: 'burn-warning 1s infinite'
    }
  };

  return { ...baseStyles, ...ageStyles[ageStage] };
};

// Icons for different note types
const NoteTypeIcon = ({ type }) => {
  const icons = {
    clinical: '🩺',
    phone: '📞',
    idea: '💡',
    reminder: '⏰',
    observation: '👁️'
  };
  return <span style={{ fontSize: '16px', marginRight: '8px' }}>{icons[type] || '📝'}</span>;
};

// Countdown timer component
const CountdownTimer = ({ hoursUntilExpiration, ageStage }) => {
  const formatTime = (hours) => {
    if (hours <= 0) return 'Expired';
    
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    
    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${remainingHours}h`;
  };

  const getTimerColor = (stage) => {
    const colors = {
      fresh: '#10b981',
      aging: '#f59e0b', 
      mature: '#ea580c',
      expiring: '#ef4444',
      expired: '#b91c1c'
    };
    return colors[stage] || '#6b7280';
  };

  const progressPercentage = Math.max(0, Math.min(100, (hoursUntilExpiration / 168) * 100)); // 168 hours = 7 days

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      fontSize: '12px',
      color: getTimerColor(ageStage),
      fontWeight: '500'
    }}>
      <span>⏱️</span>
      <span>{formatTime(hoursUntilExpiration)}</span>
      <div style={{
        width: '60px',
        height: '4px',
        backgroundColor: 'rgba(156, 163, 175, 0.3)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progressPercentage}%`,
          height: '100%',
          backgroundColor: getTimerColor(ageStage),
          transition: 'width 0.3s ease',
          borderRadius: '2px'
        }} />
      </div>
    </div>
  );
};

// Individual scratch note component
const ScratchNoteCard = ({ note, onEdit, onDelete, onTransferToCensus, onPromote, theme = 'dark' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const ageStyles = getVisualAgeStyles(note.visual_age_stage, theme);

  const handleQuickAction = (action) => {
    switch (action) {
      case 'census':
        onTransferToCensus(note);
        break;
      case 'template':
        onPromote(note, 'template');
        break;
      case 'delete':
        onDelete(note);
        break;
      default:
        break;
    }
  };

  return (
    <div style={ageStyles}>
      {/* Note Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '4px'
          }}>
            <NoteTypeIcon type={note.note_type} />
            <h4 style={{ 
              margin: 0, 
              fontSize: '14px', 
              fontWeight: '600',
              color: 'inherit'
            }}>
              {note.title || 'Untitled Note'}
            </h4>
            {note.patient_hint && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500'
              }}>
                {note.patient_hint}
              </span>
            )}
          </div>
          
          <CountdownTimer 
            hoursUntilExpiration={note.hours_until_expiration}
            ageStage={note.visual_age_stage}
          />
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '4px',
          flexShrink: 0,
          marginLeft: '12px'
        }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Note Content */}
      <div style={{
        fontSize: '13px',
        lineHeight: '1.4',
        marginBottom: isExpanded ? '12px' : '0',
        maxHeight: isExpanded ? 'none' : '60px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {note.content}
        {!isExpanded && note.content.length > 100 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            background: 'linear-gradient(to right, transparent, currentColor)',
            padding: '0 4px',
            fontSize: '11px'
          }}>
            ...
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {isExpanded && (
        <div style={{
          display: 'flex',
          gap: '6px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => handleQuickAction('census')}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            📊 → Census
          </button>
          <button
            onClick={() => handleQuickAction('template')}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            📄 → Template
          </button>
          <button
            onClick={onEdit}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => handleQuickAction('delete')}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
};

// Main Scratch Pad component
const ScratchPad = ({ theme = 'dark', onTransferToCensus, onCreateTemplate }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    note_type: 'clinical',
    patient_hint: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load scratch notes
  const loadNotes = useCallback(async () => {
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
  }, []);

  // Create new scratch note
  const createNote = async () => {
    if (!newNote.content.trim()) return;
    
    try {
      const response = await fetch('/api/scratch-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotes(prev => [data.scratch_note, ...prev]);
        setNewNote({ title: '', content: '', note_type: 'clinical', patient_hint: '' });
        setIsCreating(false);
      } else {
        setError(data.error || 'Failed to create note');
      }
    } catch (err) {
      setError('Network error creating note');
    }
  };

  const deleteNote = async (note) => {
    try {
      const response = await fetch(`/api/scratch-notes/${note.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setNotes(prev => prev.filter(n => n.id !== note.id));
      }
    } catch (err) {
      setError('Failed to delete note');
    }
  };

  useEffect(() => {
    loadNotes();
    // Refresh every 5 minutes to update countdown timers
    const interval = setInterval(loadNotes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNotes]);

  const containerStyles = {
    padding: '20px',
    backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
    borderRadius: '8px',
    maxHeight: '600px',
    overflowY: 'auto'
  };

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Loading scratch pad...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
      }}>
        <div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '600',
            color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
          }}>
            📝 Clinical Scratch Pad
          </h3>
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: '12px',
            color: '#6b7280'
          }}>
            Notes auto-expire in 7 days • {notes.length} active notes
          </p>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          ➕ New Note
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '4px solid #ef4444',
          color: '#ef4444',
          marginBottom: '16px',
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      {/* New Note Form */}
      {isCreating && (
        <div style={{
          ...getVisualAgeStyles('fresh', theme),
          marginBottom: '16px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Note title (optional)"
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'inherit',
                fontSize: '13px',
                marginBottom: '8px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <select
                value={newNote.note_type}
                onChange={(e) => setNewNote(prev => ({ ...prev, note_type: e.target.value }))}
                style={{
                  padding: '6px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'inherit',
                  fontSize: '12px'
                }}
              >
                <option value="clinical">🩺 Clinical</option>
                <option value="phone">📞 Phone Call</option>
                <option value="idea">💡 Idea</option>
                <option value="reminder">⏰ Reminder</option>
                <option value="observation">👁️ Observation</option>
              </select>
              <input
                type="text"
                placeholder="Patient hint (room/name)"
                value={newNote.patient_hint}
                onChange={(e) => setNewNote(prev => ({ ...prev, patient_hint: e.target.value }))}
                style={{
                  flex: 1,
                  padding: '6px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'inherit',
                  fontSize: '12px'
                }}
              />
            </div>
            <textarea
              placeholder="Write your clinical notes here..."
              value={newNote.content}
              onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '8px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'inherit',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={createNote}
              disabled={!newNote.content.trim()}
              style={{
                padding: '6px 12px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: newNote.content.trim() ? 'pointer' : 'not-allowed',
                opacity: newNote.content.trim() ? 1 : 0.5
              }}
            >
              Save Note
            </button>
            <button
              onClick={() => setIsCreating(false)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'inherit',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div>
        {notes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>No scratch notes yet</h4>
            <p style={{ margin: 0, fontSize: '13px' }}>
              Create your first clinical note to get started
            </p>
          </div>
        ) : (
          notes.map(note => (
            <ScratchNoteCard
              key={note.id}
              note={note}
              onEdit={() => {/* TODO: Implement edit */}}
              onDelete={deleteNote}
              onTransferToCensus={onTransferToCensus}
              onPromote={onCreateTemplate}
              theme={theme}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ScratchPad;