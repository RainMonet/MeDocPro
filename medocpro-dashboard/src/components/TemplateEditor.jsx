import React, { useState, useEffect, useCallback } from 'react';

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
    <div className="card">
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
            gridTemplateColumns: '150px 200px 1fr 100px auto',
            gap: '12px',
            alignItems: 'end',
            padding: '16px',
            background: '#f1f5f9',
            borderRadius: '8px',
            border: '2px dashed #cbd5e0',
            marginBottom: '20px'
          }}>
            <div>
              <label className="form-label">Placeholder Key</label>
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
              <label className="form-label">Example Value</label>
              <input
                type="text"
                className="form-input"
                placeholder="Doe, John"
                value={newPlaceholder.example}
                onChange={(e) => setNewPlaceholder(prev => ({ ...prev, example: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Data Type</label>
              <select
                className="form-input"
                value={newPlaceholder.type}
                onChange={(e) => setNewPlaceholder(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="text">Text</option>
                <option value="date">Date</option>
                <option value="number">Number</option>
                <option value="phi">PHI (Protected)</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={addPlaceholder}>
              Add
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gap: '12px' }}>
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
                  gridTemplateColumns: '150px 200px 1fr auto',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '12px',
                  background: placeholder.type === 'phi' ? '#fef2f2' : '#f8fafc',
                  borderRadius: '8px',
                  borderLeft: 3px solid 
                }}
              >
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0066cc',
                  background: 'white',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0'
                }}>
                  {{{}}}
                </div>
                <div style={{ fontSize: '13px', color: '#4a5568' }}>
                  {placeholder.description}
                </div>
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '11px', 
                  color: '#64748b' 
                }}>
                  {placeholder.example}
                </div>
                <button
                  className="btn btn-sm"
                  style={{ background: 'none', border: 'none', color: '#ef4444' }}
                  onClick={() => removePlaceholder(index)}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Main Template Editor Component
const TemplateEditor = ({ initialTemplate, onSave, onCancel }) => {
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
      progress: PROGRESS NOTE

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

Provider: {{provider_signature}},

      assessment: PSYCHIATRIC ASSESSMENT

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

Examiner: {{examiner_signature}},

      plan: TREATMENT PLAN

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

Provider: {{provider_signature}}
    };

    if (samples[type]) {
      setTemplate(prev => ({ ...prev, content: samples[type] }));
    }
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a365d', marginBottom: '8px' }}>
            Medical Document Template Editor
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Create and manage HIPAA-compliant clinical documentation templates
          </p>
        </div>
      </div>

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

      {/* Template Controls */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Template Information</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Template
            </button>
            {onCancel && (
              <button className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        </div>
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', marginBottom: '20px', alignItems: 'end' }}>
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
            <div>
              <label className="form-label">Version</label>
              <input
                type="text"
                className="form-input"
                placeholder="1.0"
                value={template.version}
                onChange={(e) => setTemplate(prev => ({ ...prev, version: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder Manager */}
      <PlaceholderManager
        placeholders={template.placeholders}
        onPlaceholdersChange={(placeholders) => setTemplate(prev => ({ ...prev, placeholders }))}
      />

      {/* Main Editor */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Quick Templates:
              </span>
              <button className="btn btn-sm btn-secondary" onClick={() => loadSampleTemplate('progress')}>
                Progress Note
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => loadSampleTemplate('assessment')}>
                Assessment
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => loadSampleTemplate('plan')}>
                Treatment Plan
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Insert:
              </span>
              <button className="btn btn-sm btn-secondary" onClick={() => insertText('{{patient_name}}')}>
                Patient Name
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => insertText('{{date_of_service}}')}>
                Service Date
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
            minHeight: '400px',
            padding: '20px',
            border: 'none',
            fontSize: '14px',
            lineHeight: '1.6',
            resize: 'vertical',
            fontFamily: 'inherit',
            outline: 'none',
            width: '100%'
          }}
          placeholder="Begin creating your clinical template here. Use {{placeholder_name}} syntax to insert dynamic fields..."
          value={template.content}
          onChange={(e) => setTemplate(prev => ({ ...prev, content: e.target.value }))}
        />
      </div>

      {/* Template Preview */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Template Preview</h3>
        </div>
        <div className="card-content">
          <div style={{ 
            fontSize: '14px', 
            lineHeight: '1.6', 
            color: '#2d3748', 
            whiteSpace: 'pre-wrap',
            minHeight: '200px',
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            {template.content || 'Start typing in the template editor to see a preview here...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
