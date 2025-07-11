import React, { useState, useEffect, useCallback } from 'react';

import TemplateLibrary from './templates/TemplateLibrary';

// Utility function to validate template data
const validateTemplateData = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate || 'name' in data) {
    const name = data.name?.trim();
    if (!name) {
      errors.push('Template name is required');
    } else if (name.length > 200) {
      errors.push('Template name must be 200 characters or less');
    }
  }
  
  if (!isUpdate || 'content' in data) {
    const content = data.content?.trim();
    if (!content) {
      errors.push('Template content is required');
    } else if (content.length > 50000) {
      errors.push('Template content must be 50,000 characters or less');
    }
  }
  
  return errors;
};

// Template Categories Configuration
const TEMPLATE_CATEGORIES = {
  'progress': { name: 'Progress Notes', color: '#10b981', icon: 'file-text' },
  'assessment': { name: 'Psychiatric Assessment', color: '#0066cc', icon: 'clipboard' },
  'treatment': { name: 'Treatment Plans', color: '#8b5cf6', icon: 'target' },
  'intake': { name: 'Intake Forms', color: '#f59e0b', icon: 'user-plus' },
  'discharge': { name: 'Discharge Summaries', color: '#ef4444', icon: 'log-out' },
  'custom': { name: 'Custom Documentation', color: '#64748b', icon: 'edit' }
};

// Close Icon Component
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// Theme-aware style helpers - consistent with other modals
const getThemeStyles = (theme) => ({
  textPrimary: theme === 'dark' ? '#f1f5f9' : '#2d1810',
  textSecondary: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
  textMuted: theme === 'dark' ? '#94a3b8' : '#8b7355',
  bgPrimary: theme === 'dark' ? '#1e293b' : '#faf8f3',
  bgSecondary: theme === 'dark' ? '#0f172a' : '#f4f1eb',
  bgAccent: theme === 'dark' ? '#374151' : '#ede8df',
  borderColor: theme === 'dark' ? '#475569' : '#d4c4a8',
  primaryColor: theme === 'dark' ? '#3b82f6' : '#8b4513',
  inputBg: theme === 'dark' ? '#0f172a' : '#faf8f3',
  modalBackground: theme === 'dark' ? '#1e293b' : '#faf8f3'
});

// Placeholder Management Component
const PlaceholderManager = ({ placeholders, onPlaceholdersChange, theme }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlaceholder, setNewPlaceholder] = useState({
    key: '',
    description: '',
    example: '',
    type: 'text'
  });

  const styles = getThemeStyles(theme);

  const addPlaceholder = () => {
    const { key, description, example, type } = newPlaceholder;
    
    if (!key.trim() || !description.trim()) {
      alert('Please fill in required placeholder fields (Key and Description)');
      return;
    }

    if (placeholders.some(p => p.key === key.trim())) {
      alert('Placeholder key already exists');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(key.trim())) {
      alert('Placeholder key can only contain letters, numbers, and underscores');
      return;
    }

    const placeholder = {
      key: key.trim(),
      description: description.trim(),
      example: example.trim(),
      type
    };

    onPlaceholdersChange([...placeholders, placeholder]);
    
    setNewPlaceholder({ key: '', description: '', example: '', type: 'text' });
    setShowAddForm(false);
  };

  const removePlaceholder = (index) => {
    if (window.confirm('Are you sure you want to remove this placeholder?')) {
      const updated = placeholders.filter((_, i) => i !== index);
      onPlaceholdersChange(updated);
    }
  };

  return (
    <div className="card" style={{ 
      marginBottom: '20px',
      backgroundColor: styles.bgPrimary,
      border: `1px solid ${styles.borderColor}`
    }}>
      <div className="card-header" style={{ 
        background: styles.bgSecondary,
        color: styles.textPrimary,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${styles.borderColor}`,
        padding: '16px 20px'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Placeholder Management</h3>
        <button 
          className="btn btn-sm"
          style={{ 
            background: styles.primaryColor, 
            color: 'white', 
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '13px'
          }}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          + Add Placeholder
        </button>
      </div>
      <div className="card-content">
        <div className="alert alert-warning">
          <strong>HIPAA Notice:</strong> Templates with PHI placeholders are for development/testing only. Never use real patient data in templates.
        </div>

        {showAddForm && (
          <div style={{
            backgroundColor: styles.bgSecondary,
            border: `1px solid ${styles.primaryColor}`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h4 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: styles.textPrimary
              }}>
                Add New Placeholder
              </h4>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: styles.textMuted,
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '4px'
                }}
                onClick={() => {
                  setShowAddForm(false);
                  setNewPlaceholder({ key: '', description: '', example: '', type: 'text' });
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: styles.textSecondary,
                  marginBottom: '6px'
                }}>
                  Placeholder Key
                </label>
                <input
                  type="text"
                  value={newPlaceholder.key}
                  onChange={(e) => setNewPlaceholder(prev => ({ ...prev, key: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: styles.inputBg,
                    color: styles.textPrimary,
                    outline: 'none'
                  }}
                  placeholder="e.g., patient_name"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: styles.textSecondary,
                  marginBottom: '6px'
                }}>
                  Type
                </label>
                <select
                  value={newPlaceholder.type}
                  onChange={(e) => setNewPlaceholder(prev => ({ ...prev, type: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: styles.inputBg,
                    color: styles.textPrimary,
                    outline: 'none'
                  }}
                >
                  <option value="text">Text</option>
                  <option value="date">Date</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: styles.textSecondary,
                marginBottom: '6px'
              }}>
                Description
              </label>
              <input
                type="text"
                value={newPlaceholder.description}
                onChange={(e) => setNewPlaceholder(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${styles.borderColor}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: styles.inputBg,
                  color: styles.textPrimary,
                  outline: 'none'
                }}
                placeholder="Brief description of what this placeholder represents"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: styles.textSecondary,
                marginBottom: '6px'
              }}>
                Example
              </label>
              <input
                type="text"
                value={newPlaceholder.example}
                onChange={(e) => setNewPlaceholder(prev => ({ ...prev, example: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${styles.borderColor}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: styles.inputBg,
                  color: styles.textPrimary,
                  outline: 'none'
                }}
                placeholder="Example value (optional)"
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: styles.textMuted,
                  border: `1px solid ${styles.borderColor}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onClick={() => {
                  setShowAddForm(false);
                  setNewPlaceholder({ key: '', description: '', example: '', type: 'text' });
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: '8px 16px',
                  background: styles.primaryColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onClick={addPlaceholder}
              >
                Create Placeholder
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '8px' }}>
          {placeholders.length === 0 ? (
            <p style={{ textAlign: 'center', color: styles.textMuted, padding: '20px' }}>
              No placeholders defined
            </p>
          ) : (
            placeholders.map((placeholder, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 100px auto',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: placeholder.type === 'phi' 
                    ? (theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2') 
                    : styles.bgSecondary,
                  borderRadius: '6px',
                  borderLeft: `3px solid ${placeholder.type === 'phi' ? '#ef4444' : styles.borderColor}`
                }}
              >
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#0066cc',
                  background: styles.inputBg,
                  padding: '4px 6px',
                  borderRadius: '3px',
                  border: `1px solid ${styles.borderColor}`
                }}>
                  {`{{${placeholder.key}}}`}
                </div>
                <div style={{ fontSize: '12px', color: styles.textSecondary }}>
                  {placeholder.description}
                </div>
                <div style={{ 
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: placeholder.type === 'phi' 
                    ? (theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2') 
                    : (theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe'),
                  color: placeholder.type === 'phi' ? '#dc2626' : '#1e40af',
                  textAlign: 'center'
                }}>
                  {placeholder.type.toUpperCase()}
                </div>
                <button
                  className="btn btn-sm"
                  style={{ background: 'none', border: 'none', color: '#ef4444', padding: '4px' }}
                  onClick={() => removePlaceholder(index)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Main Template Editor Modal Component
const TemplateEditor = ({ isOpen, initialTemplate, onSave, onCancel, theme = 'dark' }) => {
  const [template, setTemplate] = useState({
    name: '',
    category: 'progress',
    version: '1.0',
    content: '',
    placeholders: [
      { key: 'patient_name', description: "Patient's full name", example: 'Doe, John', type: 'phi' },
      { key: 'date_of_service', description: 'Date of service', example: new Date().toLocaleDateString(), type: 'date' },
      { key: 'provider_name', description: 'Healthcare provider name', example: 'Dr. Smith', type: 'text' }
    ],
    aiEnhancementZones: [],
    ...initialTemplate
  });

  const [validationErrors, setValidationErrors] = useState([]);
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'ai', 'preview'
  const [editingPlaceholder, setEditingPlaceholder] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlaceholder, setSelectedPlaceholder] = useState('');
  const [newPlaceholder, setNewPlaceholder] = useState({
    key: '',
    description: '',
    example: '',
    type: 'text'
  });

  const styles = getThemeStyles(theme);

  // Reset template when modal opens/closes or initialTemplate changes
  useEffect(() => {
    if (isOpen) {
      setTemplate({
        name: '',
        category: 'progress',
        version: '1.0',
        content: '',
        placeholders: [
          { key: 'patient_name', description: "Patient's full name", example: 'Doe, John', type: 'phi' },
          { key: 'date_of_service', description: 'Date of service', example: new Date().toLocaleDateString(), type: 'date' },
          { key: 'provider_name', description: 'Healthcare provider name', example: 'Dr. Smith', type: 'text' }
        ],
        aiEnhancementZones: [],
        ...initialTemplate
      });
      setValidationErrors([]);
    }
  }, [isOpen, initialTemplate]);

  // Insert text at cursor position
  const insertText = useCallback((text) => {
    const textarea = document.getElementById('templateContent');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;
    
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    
    setTemplate(prev => ({ ...prev, content: newValue }));
    
    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  }, []);

  // Validate and save template
  const handleSave = useCallback(() => {
    const errors = validateTemplateData(template);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      onSave(template);
    }
  }, [template, onSave]);

  // Load sample template content
  const loadSampleTemplate = useCallback((type) => {
    const samples = {
      progress: `PROGRESS NOTE

Date: {{date_of_service}}
Patient: {{patient_name}}
Provider: {{provider_name}}

CHIEF COMPLAINT:
{{chief_complaint}}

PRESENT ILLNESS:
{{present_illness}}

MENTAL STATUS EXAMINATION:
- Appearance: {{appearance}}
- Mood: {{mood}}
- Affect: {{affect}}
- Speech: {{speech}}
- Thought Process: {{thought_process}}
- Thought Content: {{thought_content}}
- Cognition: {{cognition}}
- Insight: {{insight}}
- Judgment: {{judgment}}

ASSESSMENT:
{{assessment}}

PLAN:
{{treatment_plan}}

Provider: {{provider_signature}}`,

      assessment: `PSYCHIATRIC ASSESSMENT

Date: {{date_of_service}}
Patient: {{patient_name}}
Examiner: {{examiner_name}}

IDENTIFYING INFORMATION:
{{patient_demographics}}

CHIEF COMPLAINT:
{{chief_complaint}}

HISTORY OF PRESENT ILLNESS:
{{present_illness_history}}

PAST PSYCHIATRIC HISTORY:
{{past_psychiatric_history}}

MEDICAL HISTORY:
{{medical_history}}

SOCIAL HISTORY:
{{social_history}}

FAMILY HISTORY:
{{family_history}}

MENTAL STATUS EXAMINATION:
{{mental_status_exam}}

ASSESSMENT:
{{clinical_assessment}}

PLAN:
{{treatment_recommendations}}

Examiner: {{examiner_signature}}`,

      plan: `TREATMENT PLAN

Patient: {{patient_name}}
Date: {{plan_date}}
Provider: {{provider_name}}

PRIMARY DIAGNOSIS:
{{primary_diagnosis}}

SECONDARY DIAGNOSIS:
{{secondary_diagnosis}}

TREATMENT GOALS:
1. {{goal_1}}
2. {{goal_2}}
3. {{goal_3}}

INTERVENTIONS:
Psychotherapy: {{therapy_type}}
Frequency: {{therapy_frequency}}
Medications: {{medication_plan}}

MEASURABLE OBJECTIVES:
{{measurable_objectives}}

TARGET DATES:
Short-term (30 days): {{short_term_targets}}
Medium-term (90 days): {{medium_term_targets}}
Long-term (6 months): {{long_term_targets}}

DISCHARGE CRITERIA:
{{discharge_criteria}}

Provider: {{provider_signature}}`
    };

    if (samples[type]) {
      setTemplate(prev => ({ ...prev, content: samples[type] }));
    }
  }, []);

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95vw',
          height: '90vh',
          maxWidth: '1200px',
          padding: '0',
          backgroundColor: styles.bgPrimary,
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header Section - Consistent with other modals */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: `1px solid ${styles.borderColor}`,
          backgroundColor: styles.bgSecondary,
          flexShrink: 0
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '600',
            color: styles.textPrimary
          }}>
            {initialTemplate ? 'Edit Template' : 'Create New Template'}
          </h2>
          <button 
            className="modal-close" 
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: styles.textMuted,
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          borderBottom: `1px solid ${styles.borderColor}`,
          padding: '0 24px',
          display: 'flex',
          gap: '0',
          background: styles.bgSecondary
        }}>
          {[
            { id: 'content', label: 'Template Content' },
            { id: 'placeholders', label: 'Placeholders Management' },
            { id: 'preview', label: 'Preview' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${styles.primaryColor}` : '2px solid transparent',
                background: activeTab === tab.id ? styles.bgPrimary : 'transparent',
                color: activeTab === tab.id ? styles.primaryColor : styles.textSecondary,
                padding: '12px 16px',
                fontWeight: '500',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Content - Scrollable */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
          background: styles.bgPrimary,
          color: styles.textPrimary
        }}>
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="alert alert-danger">
              <strong>Validation Errors:</strong>
              <ul style={{ margin: '8px 0 0 20px' }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <>
              {/* Template Information */}
              <div className="card" style={{ 
                marginBottom: '20px',
                backgroundColor: styles.bgPrimary,
                border: `1px solid ${styles.borderColor}`
              }}>
                <div className="card-header" style={{ 
                  background: styles.bgSecondary,
                  color: styles.textPrimary,
                  borderBottom: `1px solid ${styles.borderColor}`,
                  padding: '16px 20px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Template Information</h3>
                </div>
                <div className="card-content">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label className="form-label">Template Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Progress Note - Psychiatric Evaluation"
                        value={template.name}
                        onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label">Category</label>
                      <select
                        className="form-input"
                        value={template.category}
                        onChange={(e) => setTemplate(prev => ({ ...prev, category: e.target.value }))}
                      >
                        {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                          <option key={key} value={key}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Content Editor */}
              <div className="card" style={{ 
                marginBottom: '20px',
                backgroundColor: styles.bgPrimary,
                border: `1px solid ${styles.borderColor}`
              }}>
                <div className="card-header" style={{ 
                  background: styles.bgSecondary, 
                  borderBottom: `1px solid ${styles.borderColor}`,
                  padding: '16px 20px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: styles.textMuted, textTransform: 'uppercase' }}>
                      Placeholders:
                    </span>
                    <select
                      value={selectedPlaceholder}
                      onChange={(e) => setSelectedPlaceholder(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: `1px solid ${styles.borderColor}`,
                        borderRadius: '4px',
                        backgroundColor: styles.inputBg,
                        color: styles.textPrimary,
                        fontSize: '13px',
                        minWidth: '180px'
                      }}
                    >
                      <option value="">Select a placeholder...</option>
                      {template.placeholders && template.placeholders.map((placeholder, index) => (
                        <option key={index} value={placeholder.key}>
                          {placeholder.key} - {placeholder.description}
                        </option>
                      ))}
                    </select>
                    <button 
                      className="btn btn-sm"
                      style={{
                        padding: '4px 12px',
                        backgroundColor: selectedPlaceholder ? styles.primaryColor : styles.bgAccent,
                        color: selectedPlaceholder ? 'white' : styles.textMuted,
                        border: `1px solid ${selectedPlaceholder ? styles.primaryColor : styles.borderColor}`,
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: selectedPlaceholder ? 'pointer' : 'not-allowed',
                        opacity: selectedPlaceholder ? 1 : 0.6
                      }}
                      disabled={!selectedPlaceholder}
                      onClick={() => {
                        if (selectedPlaceholder) {
                          insertText(`{{${selectedPlaceholder}}}`);
                          setSelectedPlaceholder('');
                        }
                      }}
                    >
                      Insert
                    </button>
                  </div>
                </div>
                
                <textarea
                  id="templateContent"
                  style={{
                    minHeight: '300px',
                    padding: '16px',
                    border: 'none',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    fontFamily: 'monospace',
                    outline: 'none',
                    width: '100%',
                    backgroundColor: styles.inputBg,
                    color: styles.textPrimary
                  }}
                  placeholder="Begin creating your clinical template here. Use {{placeholder_name}} syntax to insert dynamic fields..."
                  value={template.content}
                  onChange={(e) => setTemplate(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
            </>
          )}

          {/* Placeholders Management Tab */}
          {activeTab === 'placeholders' && (
            <div>
              {/* Header */}
              <div style={{
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: `1px solid ${styles.borderColor}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '18px', 
                    fontWeight: '600',
                    color: styles.textPrimary,
                    marginBottom: '6px'
                  }}>
                    Saved Placeholders
                  </h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: styles.textSecondary, 
                    margin: 0 
                  }}>
                    Manage your template placeholders and dynamic fields
                  </p>
                </div>
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: styles.primaryColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    alignSelf: 'flex-start'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '1';
                  }}
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingPlaceholder(null);
                    setEditingIndex(null);
                  }}
                >
                  + Add New Placeholder
                </button>
              </div>

              {/* Placeholders Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {template.placeholders && template.placeholders.length > 0 ? (
                  template.placeholders.map((placeholder, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: styles.bgSecondary,
                        border: `1px solid ${styles.borderColor}`,
                        borderRadius: '6px',
                        padding: '12px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = styles.primaryColor;
                        e.currentTarget.style.backgroundColor = styles.bgAccent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = styles.borderColor;
                        e.currentTarget.style.backgroundColor = styles.bgSecondary;
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: '4px' }}>
                            <code style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: styles.primaryColor,
                              backgroundColor: `${styles.primaryColor}15`,
                              padding: '1px 4px',
                              borderRadius: '3px',
                              fontFamily: 'monospace'
                            }}>
                              {`{{${placeholder.key}}}`}
                            </code>
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: styles.textPrimary,
                            marginBottom: '4px',
                            fontWeight: '500',
                            lineHeight: '1.3'
                          }}>
                            {placeholder.description}
                          </div>
                          {placeholder.example && (
                            <div style={{
                              fontSize: '11px',
                              color: styles.textMuted,
                              fontStyle: 'italic',
                              lineHeight: '1.2'
                            }}>
                              Example: {placeholder.example}
                            </div>
                          )}
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '6px',
                          flexShrink: 0
                        }}>
                          <button
                            style={{
                              padding: '2px 6px',
                              fontSize: '10px',
                              backgroundColor: 'transparent',
                              color: styles.primaryColor,
                              border: `1px solid ${styles.primaryColor}`,
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            onClick={() => {
                              setEditingPlaceholder({ ...placeholder });
                              setEditingIndex(index);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            style={{
                              padding: '2px 6px',
                              fontSize: '10px',
                              backgroundColor: 'transparent',
                              color: styles.textMuted,
                              border: `1px solid ${styles.borderColor}`,
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            onClick={() => {
                              // Delete placeholder functionality
                              const updatedPlaceholders = template.placeholders.filter((_, i) => i !== index);
                              setTemplate(prev => ({ ...prev, placeholders: updatedPlaceholders }));
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '48px 24px',
                    color: styles.textMuted
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                      No Placeholders Yet
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      Create your first placeholder to get started
                    </div>
                  </div>
                )}
              </div>

              {/* Add New Placeholder Card */}
              {showAddForm && (
                <div style={{
                  backgroundColor: styles.bgSecondary,
                  border: `1px solid ${styles.primaryColor}`,
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      color: styles.textPrimary
                    }}>
                      Add New Placeholder
                    </h4>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: styles.textMuted,
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px'
                      }}
                      onClick={() => {
                        setShowAddForm(false);
                        setNewPlaceholder({
                          key: '',
                          description: '',
                          example: '',
                          type: 'text'
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: styles.textSecondary,
                        marginBottom: '6px'
                      }}>
                        Placeholder Key
                      </label>
                      <input
                        type="text"
                        value={newPlaceholder.key}
                        onChange={(e) => setNewPlaceholder(prev => ({ ...prev, key: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: `1px solid ${styles.borderColor}`,
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: styles.inputBg,
                          color: styles.textPrimary,
                          outline: 'none'
                        }}
                        placeholder="e.g., patient_name"
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: styles.textSecondary,
                        marginBottom: '6px'
                      }}>
                        Type
                      </label>
                      <select
                        value={newPlaceholder.type}
                        onChange={(e) => setNewPlaceholder(prev => ({ ...prev, type: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: `1px solid ${styles.borderColor}`,
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: styles.inputBg,
                          color: styles.textPrimary,
                          outline: 'none'
                        }}
                      >
                        <option value="text">Text</option>
                        <option value="date">Date</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: styles.textSecondary,
                      marginBottom: '6px'
                    }}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={newPlaceholder.description}
                      onChange={(e) => setNewPlaceholder(prev => ({ ...prev, description: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${styles.borderColor}`,
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: styles.inputBg,
                        color: styles.textPrimary,
                        outline: 'none'
                      }}
                      placeholder="Brief description of what this placeholder represents"
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: styles.textSecondary,
                      marginBottom: '6px'
                    }}>
                      Example
                    </label>
                    <input
                      type="text"
                      value={newPlaceholder.example}
                      onChange={(e) => setNewPlaceholder(prev => ({ ...prev, example: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${styles.borderColor}`,
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: styles.inputBg,
                        color: styles.textPrimary,
                        outline: 'none'
                      }}
                      placeholder="Example value (optional)"
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: styles.textMuted,
                        border: `1px solid ${styles.borderColor}`,
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onClick={() => {
                        setShowAddForm(false);
                        setNewPlaceholder({
                          key: '',
                          description: '',
                          example: '',
                          type: 'text'
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: styles.primaryColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onClick={() => {
                        // Validate required fields
                        if (!newPlaceholder.key.trim() || !newPlaceholder.description.trim()) {
                          alert('Please fill in both the placeholder key and description fields.');
                          return;
                        }

                        // Check for duplicate keys
                        if (template.placeholders && template.placeholders.some(p => p.key === newPlaceholder.key.trim())) {
                          alert('A placeholder with this key already exists.');
                          return;
                        }

                        // Add the new placeholder
                        const placeholder = {
                          key: newPlaceholder.key.trim(),
                          description: newPlaceholder.description.trim(),
                          example: newPlaceholder.example.trim(),
                          type: newPlaceholder.type
                        };

                        setTemplate(prev => ({
                          ...prev,
                          placeholders: [...(prev.placeholders || []), placeholder]
                        }));

                        // Reset form and close
                        setNewPlaceholder({
                          key: '',
                          description: '',
                          example: '',
                          type: 'text'
                        });
                        setShowAddForm(false);
                      }}
                    >
                      Create Placeholder
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Placeholder Card */}
              {editingPlaceholder && (
                <div style={{
                  backgroundColor: styles.bgSecondary,
                  border: `1px solid ${styles.primaryColor}`,
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      color: styles.textPrimary
                    }}>
                      Edit Placeholder
                    </h4>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: styles.textMuted,
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px'
                      }}
                      onClick={() => {
                        setEditingPlaceholder(null);
                        setEditingIndex(null);
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: styles.textSecondary,
                        marginBottom: '6px'
                      }}>
                        Placeholder Key
                      </label>
                      <input
                        type="text"
                        value={editingPlaceholder.key}
                        onChange={(e) => setEditingPlaceholder(prev => ({ ...prev, key: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: `1px solid ${styles.borderColor}`,
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: styles.inputBg,
                          color: styles.textPrimary,
                          outline: 'none'
                        }}
                        placeholder="e.g., patient_name"
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: styles.textSecondary,
                        marginBottom: '6px'
                      }}>
                        Type
                      </label>
                      <select
                        value={editingPlaceholder.type || 'text'}
                        onChange={(e) => setEditingPlaceholder(prev => ({ ...prev, type: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: `1px solid ${styles.borderColor}`,
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: styles.inputBg,
                          color: styles.textPrimary,
                          outline: 'none'
                        }}
                      >
                        <option value="text">Text</option>
                        <option value="date">Date</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: styles.textSecondary,
                      marginBottom: '6px'
                    }}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={editingPlaceholder.description}
                      onChange={(e) => setEditingPlaceholder(prev => ({ ...prev, description: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${styles.borderColor}`,
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: styles.inputBg,
                        color: styles.textPrimary,
                        outline: 'none'
                      }}
                      placeholder="Brief description of what this placeholder represents"
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: styles.textSecondary,
                      marginBottom: '6px'
                    }}>
                      Example
                    </label>
                    <input
                      type="text"
                      value={editingPlaceholder.example || ''}
                      onChange={(e) => setEditingPlaceholder(prev => ({ ...prev, example: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${styles.borderColor}`,
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: styles.inputBg,
                        color: styles.textPrimary,
                        outline: 'none'
                      }}
                      placeholder="Example value (optional)"
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: styles.textMuted,
                        border: `1px solid ${styles.borderColor}`,
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onClick={() => {
                        setEditingPlaceholder(null);
                        setEditingIndex(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: styles.primaryColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onClick={() => {
                        // Update the placeholder in the template
                        const updatedPlaceholders = [...template.placeholders];
                        updatedPlaceholders[editingIndex] = editingPlaceholder;
                        setTemplate(prev => ({ ...prev, placeholders: updatedPlaceholders }));
                        
                        // Clear editing state
                        setEditingPlaceholder(null);
                        setEditingIndex(null);
                      }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="card" style={{ 
              backgroundColor: styles.bgPrimary,
              border: `1px solid ${styles.borderColor}`
            }}>
              <div className="card-header" style={{ 
                background: styles.bgSecondary,
                color: styles.textPrimary,
                borderBottom: `1px solid ${styles.borderColor}`,
                padding: '16px 20px'
              }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Template Preview</h3>
                <p style={{ fontSize: '13px', color: styles.textSecondary, margin: '4px 0 0 0' }}>
                  Preview how your template will appear when populated
                </p>
              </div>
              <div className="card-content">
                <div style={{
                  background: styles.bgSecondary,
                  border: `1px solid ${styles.borderColor}`,
                  borderRadius: '8px',
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  minHeight: '300px',
                  color: styles.textPrimary
                }}>
                  {template.content || 'No content to preview. Switch to Content tab to add template content.'}
                </div>
                
                {template.placeholders.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: styles.textPrimary }}>
                      Available Placeholders:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                      {template.placeholders.map((placeholder, index) => (
                        <div key={index} style={{
                          padding: '12px',
                          background: styles.bgAccent,
                          border: `1px solid ${styles.borderColor}`,
                          borderRadius: '6px',
                          fontSize: '12px',
                          borderLeft: `3px solid ${placeholder.type === 'phi' ? styles.errorColor : styles.primaryColor}`
                        }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: styles.primaryColor,
                            fontFamily: 'monospace',
                            marginBottom: '4px'
                          }}>
                            {`{{${placeholder.key}}}`}
                          </div>
                          <div style={{ 
                            color: styles.textSecondary,
                            fontSize: '11px',
                            marginBottom: '4px'
                          }}>
                            {placeholder.description}
                          </div>
                          <div style={{ 
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            background: placeholder.type === 'phi' 
                              ? (theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2') 
                              : (theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe'),
                            color: placeholder.type === 'phi' ? styles.errorColor : styles.primaryColor,
                            textAlign: 'center',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            display: 'inline-block'
                          }}>
                            {placeholder.type}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer - Hidden on placeholders tab */}
        {activeTab !== 'placeholders' && (
          <div style={{
            padding: '20px 24px',
            borderTop: `1px solid ${styles.borderColor}`,
            background: styles.bgSecondary,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            flexShrink: 0
          }}>
            <button 
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: styles.textSecondary,
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                background: styles.primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {initialTemplate ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateEditor;