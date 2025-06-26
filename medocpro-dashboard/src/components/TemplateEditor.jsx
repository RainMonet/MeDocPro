import React, { useState, useEffect, useCallback } from 'react';
import AIEnhancement from './templates/AIEnhancement';

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

// Placeholder Management Component
const PlaceholderManager = ({ placeholders, onPlaceholdersChange }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlaceholder, setNewPlaceholder] = useState({
    key: '',
    description: '',
    example: '',
    type: 'text'
  });

  const addPlaceholder = () => {
    const { key, description, example, type } = newPlaceholder;
    
    if (!key.trim() || !description.trim() || !example.trim()) {
      alert('Please fill in all placeholder fields');
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
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="card-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <h3 className="card-title">Placeholder Management</h3>
        <button 
          className="btn btn-sm"
          style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)' }}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          + Add Placeholder
        </button>
      </div>
      <div className="card-content">
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          <strong>HIPAA Notice:</strong> Templates with PHI placeholders are for development/testing only. Never use real patient data in templates.
        </div>

        {showAddForm && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: '12px',
            alignItems: 'end',
            padding: '16px',
            background: '#f1f5f9',
            borderRadius: '8px',
            border: '2px dashed #cbd5e0',
            marginBottom: '20px'
          }}>
            <div>
              <label className="form-label">Key</label>
              <input
                type="text"
                className="form-input"
                placeholder="patient_name"
                value={newPlaceholder.key}
                onChange={(e) => setNewPlaceholder(prev => ({ ...prev, key: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="Patient's full name"
                value={newPlaceholder.description}
                onChange={(e) => setNewPlaceholder(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Example</label>
              <input
                type="text"
                className="form-input"
                placeholder="Doe, John"
                value={newPlaceholder.example}
                onChange={(e) => setNewPlaceholder(prev => ({ ...prev, example: e.target.value }))}
              />
            </div>
            <button className="btn btn-primary" onClick={addPlaceholder}>
              Add
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gap: '8px' }}>
          {placeholders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
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
                  background: placeholder.type === 'phi' ? '#fef2f2' : '#f8fafc',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${placeholder.type === 'phi' ? '#ef4444' : '#e2e8f0'}`
                }}
              >
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#0066cc',
                  background: 'white',
                  padding: '4px 6px',
                  borderRadius: '3px',
                  border: '1px solid #e2e8f0'
                }}>
                  {`{{${placeholder.key}}}`}
                </div>
                <div style={{ fontSize: '12px', color: '#4a5568' }}>
                  {placeholder.description}
                </div>
                <div style={{ 
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: placeholder.type === 'phi' ? '#fee2e2' : '#dbeafe',
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
const TemplateEditor = ({ isOpen, initialTemplate, onSave, onCancel }) => {
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
  const [showAIEnhancement, setShowAIEnhancement] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'ai', 'preview'

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

  // Handle AI enhanced content
  const handleAIEnhancedContent = useCallback((enhancedContent) => {
    setTemplate(prev => ({ ...prev, content: enhancedContent }));
    setActiveTab('content'); // Switch back to content tab to show result
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
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={handleBackdropClick}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '1000px',
          maxHeight: '90vh',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              marginBottom: '4px',
              color: 'white'
            }}>
              {initialTemplate ? 'Edit Template' : 'Create New Template'}
            </h2>
            <p style={{ 
              fontSize: '14px', 
              opacity: 0.9,
              color: 'white'
            }}>
              Create comprehensive psychiatric documentation template
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          borderBottom: '1px solid #e2e8f0',
          padding: '0 32px',
          display: 'flex',
          gap: '0'
        }}>
          {[
            { id: 'content', label: 'Template Content', icon: '📝' },
            { id: 'ai', label: 'AI Enhancement', icon: '🤖' },
            { id: 'preview', label: 'Preview', icon: '👁️' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #0066cc' : '2px solid transparent',
                background: activeTab === tab.id ? '#f8fafc' : 'transparent',
                color: activeTab === tab.id ? '#0066cc' : '#64748b',
                padding: '12px 16px',
                fontWeight: '500',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Content - Scrollable */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 32px'
        }}>
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
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
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Template Information</h3>
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

              {/* Placeholder Manager */}
              <PlaceholderManager
                placeholders={template.placeholders}
                onPlaceholdersChange={(placeholders) => setTemplate(prev => ({ ...prev, placeholders }))}
              />

              {/* Template Content Editor */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                        Quick:
                      </span>
                      <button className="btn btn-sm btn-secondary" onClick={() => loadSampleTemplate('progress')}>
                        Progress
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => loadSampleTemplate('assessment')}>
                        Assessment
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => loadSampleTemplate('plan')}>
                        Plan
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                        Insert:
                      </span>
                      <button className="btn btn-sm btn-secondary" onClick={() => insertText('{{patient_name}}')}>
                        Patient
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => insertText('{{date_of_service}}')}>
                        Date
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => insertText('{{provider_name}}')}>
                        Provider
                      </button>
                    </div>
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
                    width: '100%'
                  }}
                  placeholder="Begin creating your clinical template here. Use {{placeholder_name}} syntax to insert dynamic fields..."
                  value={template.content}
                  onChange={(e) => setTemplate(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
            </>
          )}

          {/* AI Enhancement Tab */}
          {activeTab === 'ai' && (
            <AIEnhancement
              content={template.content}
              onEnhancedContent={handleAIEnhancedContent}
              isVisible={true}
            />
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Template Preview</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Preview how your template will appear when populated
                </p>
              </div>
              <div className="card-content">
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  minHeight: '300px'
                }}>
                  {template.content || 'No content to preview. Switch to Content tab to add template content.'}
                </div>
                
                {template.placeholders.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      Available Placeholders:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                      {template.placeholders.map((placeholder, index) => (
                        <div key={index} style={{
                          padding: '8px 12px',
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}>
                          <div style={{ fontWeight: '600', color: '#0369a1' }}>
                            {`{{${placeholder.key}}}`}
                          </div>
                          <div style={{ color: '#64748b' }}>
                            {placeholder.description}
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

        {/* Modal Footer */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {initialTemplate ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;