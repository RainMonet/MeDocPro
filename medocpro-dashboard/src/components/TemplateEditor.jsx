import React, { useState, useEffect, useCallback } from 'react';

import TemplateLibrary from './templates/TemplateLibrary';
import apiService from '../services/api';

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
  const [template, setTemplate] = useState(() => {
    const defaultPlaceholders = [
      { key: 'patient_name', description: "Patient's full name", example: 'Doe, John', type: 'phi' },
      { key: 'date_of_service', description: 'Date of service', example: new Date().toLocaleDateString(), type: 'date' },
      { key: 'provider_name', description: 'Healthcare provider name', example: 'Dr. Smith', type: 'text' }
    ];
    
    return {
      name: '',
      category: 'progress',
      version: '1.0',
      content: '',
      placeholders: initialTemplate?.placeholders || defaultPlaceholders,
      aiEnhancementZones: [],
      ...initialTemplate
    };
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

  // Text selection and AI enhancement zone states
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [showAIZoneMenu, setShowAIZoneMenu] = useState(false);
  const [aiMenuPosition, setAIMenuPosition] = useState({ x: 0, y: 0 });
  const [defaultEnhancementIntensity, setDefaultEnhancementIntensity] = useState(50);
  const [defaultWritingStyle, setDefaultWritingStyle] = useState('professional');
  const [aiEnhancementZones, setAiEnhancementZones] = useState([]);
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [enhancingZoneId, setEnhancingZoneId] = useState(null);
  const [enhancementResults, setEnhancementResults] = useState({});

  const styles = getThemeStyles(theme);

  // Effect to handle initialTemplate changes (when editing existing templates)
  useEffect(() => {
    if (initialTemplate) {
      const defaultPlaceholders = [
        { key: 'patient_name', description: "Patient's full name", example: 'Doe, John', type: 'phi' },
        { key: 'date_of_service', description: 'Date of service', example: new Date().toLocaleDateString(), type: 'date' },
        { key: 'provider_name', description: 'Healthcare provider name', example: 'Dr. Smith', type: 'text' }
      ];
      
      setTemplate({
        name: '',
        category: 'progress',
        version: '1.0',
        content: '',
        placeholders: initialTemplate.placeholders || defaultPlaceholders,
        aiEnhancementZones: [],
        ...initialTemplate
      });
    }
  }, [initialTemplate]);

  // Function to populate template with placeholder examples for preview
  const getPopulatedPreview = useCallback(() => {
    if (!template.content) return 'No content to preview. Switch to Content tab to add template content.';
    
    let populatedContent = template.content;
    
    // Replace each placeholder with its example value
    template.placeholders.forEach(placeholder => {
      const placeholderPattern = new RegExp(`{{${placeholder.key}}}`, 'g');
      const exampleValue = placeholder.example || `[${placeholder.key}]`;
      populatedContent = populatedContent.replace(placeholderPattern, exampleValue);
    });
    
    return populatedContent;
  }, [template.content, template.placeholders]);

  // Function to render preview content with highlighted AI enhancement zones
  const renderPreviewWithHighlights = useCallback(() => {
    const populatedContent = getPopulatedPreview();
    
    if (!aiEnhancementZones.length || !hoveredZoneId) {
      return populatedContent;
    }
    
    const hoveredZone = aiEnhancementZones.find(zone => zone.id === hoveredZoneId);
    if (!hoveredZone) return populatedContent;
    
    // Get the populated version of the selected text by replacing placeholders in the zone text
    let populatedZoneText = hoveredZone.text;
    template.placeholders.forEach(placeholder => {
      const placeholderPattern = new RegExp(`{{${placeholder.key}}}`, 'g');
      const exampleValue = placeholder.example || `[${placeholder.key}]`;
      populatedZoneText = populatedZoneText.replace(placeholderPattern, exampleValue);
    });
    
    // Find the populated zone text in the populated content and wrap it with highlight
    const parts = [];
    let lastIndex = 0;
    let currentIndex = populatedContent.indexOf(populatedZoneText);
    
    while (currentIndex !== -1) {
      // Add text before the match
      if (currentIndex > lastIndex) {
        parts.push(populatedContent.slice(lastIndex, currentIndex));
      }
      
      // Add the highlighted text
      parts.push(
        <span 
          key={`highlight-${currentIndex}`}
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
            padding: '2px 4px',
            borderRadius: '3px',
            border: `1px solid ${styles.successColor}`,
            transition: 'all 0.2s ease',
            boxShadow: '0 0 4px rgba(34, 197, 94, 0.4)'
          }}
        >
          {populatedZoneText}
        </span>
      );
      
      lastIndex = currentIndex + populatedZoneText.length;
      currentIndex = populatedContent.indexOf(populatedZoneText, lastIndex);
    }
    
    // Add remaining text
    if (lastIndex < populatedContent.length) {
      parts.push(populatedContent.slice(lastIndex));
    }
    
    return parts.length > 1 ? parts : populatedContent;
  }, [getPopulatedPreview, aiEnhancementZones, hoveredZoneId, template.placeholders, theme, styles.successColor]);

  // AI Enhancement function
  const enhanceAIZone = useCallback(async (zoneId) => {
    const zone = aiEnhancementZones.find(z => z.id === zoneId);
    if (!zone || enhancingZoneId) return;

    setEnhancingZoneId(zoneId);
    
    try {
      const enhancementData = {
        text: zone.text,
        enhancement_type: 'clinical',
        intensity: zone.intensity,
        style: zone.style,
        model: 'mistral:latest'
      };

      console.log('Enhancing zone:', zoneId, 'with data:', enhancementData);
      const result = await apiService.enhanceText(enhancementData);
      
      if (result.success) {
        // Store the enhancement result
        setEnhancementResults(prev => ({
          ...prev,
          [zoneId]: {
            original: zone.text,
            enhanced: result.enhanced_text,
            processing_time: result.processing_time_ms,
            model_used: result.model_used,
            enhancement_applied: result.enhancement_applied,
            timestamp: new Date().toISOString()
          }
        }));

        // Optionally auto-apply the enhancement to the template content
        // (for now, just store it - we can add apply/revert functionality later)
        console.log('Enhancement successful:', result.enhanced_text);
      } else {
        console.error('Enhancement failed:', result.error);
        alert(`Enhancement failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      alert('Enhancement failed. Please check your connection and try again.');
    } finally {
      setEnhancingZoneId(null);
    }
  }, [aiEnhancementZones, enhancingZoneId]);

  // Apply enhancement result to template content
  const applyEnhancement = useCallback((zoneId) => {
    const result = enhancementResults[zoneId];
    const zone = aiEnhancementZones.find(z => z.id === zoneId);
    
    if (!result || !zone) return;

    // Replace the original text with enhanced text in template content
    const newContent = template.content.replace(zone.text, result.enhanced);
    setTemplate(prev => ({ ...prev, content: newContent }));

    // Update the zone text to match the enhancement
    setAiEnhancementZones(prev => prev.map(z => 
      z.id === zoneId ? { ...z, text: result.enhanced } : z
    ));

    console.log('Applied enhancement for zone:', zoneId);
  }, [enhancementResults, aiEnhancementZones, template.content]);

  // Revert enhancement (restore original text)
  const revertEnhancement = useCallback((zoneId) => {
    const result = enhancementResults[zoneId];
    const zone = aiEnhancementZones.find(z => z.id === zoneId);
    
    if (!result || !zone) return;

    // Replace enhanced text back to original in template content
    const newContent = template.content.replace(result.enhanced, result.original);
    setTemplate(prev => ({ ...prev, content: newContent }));

    // Update the zone text back to original
    setAiEnhancementZones(prev => prev.map(z => 
      z.id === zoneId ? { ...z, text: result.original } : z
    ));

    // Remove the enhancement result
    setEnhancementResults(prev => {
      const newResults = { ...prev };
      delete newResults[zoneId];
      return newResults;
    });

    console.log('Reverted enhancement for zone:', zoneId);
  }, [enhancementResults, aiEnhancementZones, template.content]);

  // Reset template when modal opens/closes or initialTemplate changes
  useEffect(() => {
    if (isOpen) {
      // Default template structure
      const defaultTemplate = {
        name: '',
        category: 'progress',
        version: '1.0',
        content: '',
        placeholders: [
          { key: 'patient_name', description: "Patient's full name", example: 'Doe, John', type: 'phi' },
          { key: 'date_of_service', description: 'Date of service', example: new Date().toLocaleDateString(), type: 'date' },
          { key: 'provider_name', description: 'Healthcare provider name', example: 'Dr. Smith', type: 'text' }
        ],
        aiEnhancementZones: []
      };
      
      // If editing existing template, use its data; otherwise use defaults
      if (initialTemplate && initialTemplate.id) {
        const templateData = {
          ...defaultTemplate,
          ...initialTemplate
        };
        setTemplate(templateData);
        setAiEnhancementZones(initialTemplate.aiEnhancementZones || []);
      } else {
        setTemplate(defaultTemplate);
        setAiEnhancementZones([]);
      }
      
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
    console.log('TemplateEditor handleSave called with template:', template);
    console.log('Template placeholders being saved:', template.placeholders);
    console.log('AI enhancement zones:', aiEnhancementZones);
    console.log('initialTemplate:', initialTemplate);
    
    // Ensure AI enhancement zones are synced with template before saving
    const templateToSave = {
      ...template,
      aiEnhancementZones: aiEnhancementZones
    };
    
    console.log('Final template to save:', templateToSave);
    console.log('Final placeholders to save:', templateToSave.placeholders);
    
    const errors = validateTemplateData(templateToSave);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      console.log('Validation passed, calling onSave with template:', templateToSave);
      onSave(templateToSave);
    } else {
      console.log('Validation failed with errors:', errors);
    }
  }, [template, aiEnhancementZones, onSave, initialTemplate]);

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

  // Handle text selection in the textarea
  const handleTextSelect = (e) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    
    if (selected.length > 0) {
      setSelectedText(selected);
      setSelectionStart(start);
      setSelectionEnd(end);
      
      // Calculate position for AI zone menu
      const rect = textarea.getBoundingClientRect();
      const lines = textarea.value.substring(0, start).split('\n');
      const lineHeight = 20; // Approximate line height
      const y = rect.top + (lines.length - 1) * lineHeight - textarea.scrollTop;
      const x = rect.left + 10; // Offset from left edge
      
      setAIMenuPosition({ x, y });
      setShowAIZoneMenu(true);
    } else {
      setShowAIZoneMenu(false);
      setSelectedText('');
    }
  };

  // Add AI enhancement zone
  const addAIEnhancementZone = () => {
    if (!selectedText.trim()) return;
    
    const newZone = {
      id: Date.now(), // Simple ID generation
      start: selectionStart,
      end: selectionEnd,
      text: selectedText,
      intensity: defaultEnhancementIntensity,
      style: defaultWritingStyle,
      label: `AI Zone ${aiEnhancementZones.length + 1}`
    };
    
    const updatedZones = [...aiEnhancementZones, newZone];
    setAiEnhancementZones(updatedZones);
    
    // Update template with zones
    setTemplate(prev => ({
      ...prev,
      aiEnhancementZones: updatedZones
    }));
    
    setShowAIZoneMenu(false);
    setSelectedText('');
  };

  // Remove AI enhancement zone
  const removeAIEnhancementZone = (zoneId) => {
    const updatedZones = aiEnhancementZones.filter(zone => zone.id !== zoneId);
    setAiEnhancementZones(updatedZones);
    
    setTemplate(prev => ({
      ...prev,
      aiEnhancementZones: updatedZones
    }));
  };

  // Check if current selection overlaps with existing zones
  const hasOverlappingZone = () => {
    return aiEnhancementZones.some(zone => 
      (selectionStart < zone.end && selectionEnd > zone.start)
    );
  };

  // Close AI zone menu when clicking outside
  const handleDocumentClick = useCallback((e) => {
    if (showAIZoneMenu && !e.target.closest('.ai-transformation-menu')) {
      setShowAIZoneMenu(false);
    }
  }, [showAIZoneMenu]);

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [handleDocumentClick]);

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
                  placeholder="Begin creating your clinical template here. Use {{placeholder_name}} syntax to insert dynamic fields. Select text and use AI to enhance it..."
                  value={template.content}
                  onChange={(e) => setTemplate(prev => ({ ...prev, content: e.target.value }))}
                  onMouseUp={handleTextSelect}
                  onKeyUp={handleTextSelect}
                />
                
                {/* AI Enhancement Zones Display */}
                {aiEnhancementZones.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: styles.bgSecondary,
                    borderRadius: '6px',
                    border: `1px solid ${styles.borderColor}`
                  }}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: styles.textPrimary
                    }}>
                      AI Enhancement Zones ({aiEnhancementZones.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {aiEnhancementZones.map((zone, index) => (
                        <div key={zone.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 8px',
                          backgroundColor: styles.bgPrimary,
                          borderRadius: '4px',
                          border: `1px solid ${styles.borderColor}`
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: styles.textPrimary,
                              marginBottom: '2px'
                            }}>
                              Zone {index + 1}: {zone.style} ({zone.intensity}%)
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: styles.textMuted,
                              fontFamily: 'monospace'
                            }}>
                              "{zone.text.substring(0, 50)}{zone.text.length > 50 ? '...' : ''}"
                            </div>
                          </div>
                          <button
                            onClick={() => removeAIEnhancementZone(zone.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: styles.errorColor || '#ef4444',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              fontSize: '12px'
                            }}
                            title="Remove AI zone"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* AI Enhancement Zone Menu */}
          {showAIZoneMenu && selectedText && (
            <div
              className="ai-transformation-menu"
              style={{
                position: 'fixed',
                top: aiMenuPosition.y + 'px',
                left: aiMenuPosition.x + 'px',
                zIndex: 1000,
                backgroundColor: styles.bgPrimary,
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                minWidth: '280px',
                maxWidth: '320px'
              }}
            >
              <div style={{
                marginBottom: '12px',
                fontSize: '12px',
                color: styles.textMuted,
                borderBottom: `1px solid ${styles.borderColor}`,
                paddingBottom: '8px'
              }}>
                Mark AI Enhancement Zone: "{selectedText.substring(0, 40)}{selectedText.length > 40 ? '...' : ''}"
              </div>
              
              {hasOverlappingZone() && (
                <div style={{
                  marginBottom: '12px',
                  padding: '8px',
                  backgroundColor: styles.warningColor || '#f59e0b',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}>
                  ⚠️ This selection overlaps with an existing AI zone
                </div>
              )}
              
              {/* Default Writing Style for new zones */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: styles.textPrimary,
                  marginBottom: '4px'
                }}>
                  Default Writing Style:
                </label>
                <select
                  value={defaultWritingStyle}
                  onChange={(e) => setDefaultWritingStyle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '4px',
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                    fontSize: '11px'
                  }}
                >
                  <option value="professional">Professional</option>
                  <option value="formal">Formal</option>
                  <option value="empathetic">Empathetic</option>
                  <option value="educational">Educational</option>
                  <option value="verbose">Verbose</option>
                  <option value="concise">Concise</option>
                  <option value="objective">Objective</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>

              {/* Default Enhancement Intensity */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: styles.textPrimary,
                  marginBottom: '4px'
                }}>
                  Default Intensity: {defaultEnhancementIntensity}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={defaultEnhancementIntensity}
                  onChange={(e) => setDefaultEnhancementIntensity(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: '2px',
                    background: `linear-gradient(to right, ${styles.primaryColor} 0%, ${styles.primaryColor} ${defaultEnhancementIntensity}%, ${styles.borderColor} ${defaultEnhancementIntensity}%, ${styles.borderColor} 100%)`,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={addAIEnhancementZone}
                  disabled={hasOverlappingZone()}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: hasOverlappingZone() ? styles.bgAccent : styles.primaryColor,
                    color: hasOverlappingZone() ? styles.textMuted : 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: hasOverlappingZone() ? 'not-allowed' : 'pointer',
                    opacity: hasOverlappingZone() ? 0.6 : 1
                  }}
                >
                  🎯 Mark AI Zone
                </button>
                
                <button
                  onClick={() => setShowAIZoneMenu(false)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${styles.borderColor}`,
                    borderRadius: '4px',
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
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

                        setTemplate(prev => {
                          const updatedTemplate = {
                            ...prev,
                            placeholders: [...(prev.placeholders || []), placeholder]
                          };
                          console.log('Adding new placeholder:', placeholder);
                          console.log('Updated template placeholders:', updatedTemplate.placeholders);
                          return updatedTemplate;
                        });

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
                        setTemplate(prev => {
                          const updatedTemplate = { ...prev, placeholders: updatedPlaceholders };
                          console.log('Updating placeholder at index:', editingIndex);
                          console.log('Updated placeholder:', editingPlaceholder);
                          console.log('All placeholders after update:', updatedTemplate.placeholders);
                          return updatedTemplate;
                        });
                        
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
                  {renderPreviewWithHighlights()}
                </div>
                
                {/* AI Enhancement Zones Display */}
                {aiEnhancementZones.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: styles.textPrimary }}>
                      AI Enhancement Zones: ({aiEnhancementZones.length})
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                      {aiEnhancementZones.map((zone, index) => (
                        <div 
                          key={zone.id} 
                          onMouseEnter={() => setHoveredZoneId(zone.id)}
                          onMouseLeave={() => setHoveredZoneId(null)}
                          style={{
                            padding: '12px',
                            background: hoveredZoneId === zone.id 
                              ? (theme === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)')
                              : styles.bgAccent,
                            border: `1px solid ${styles.successColor}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            borderLeft: `3px solid ${styles.successColor}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            transform: hoveredZoneId === zone.id ? 'translateY(-1px)' : 'translateY(0)',
                            boxShadow: hoveredZoneId === zone.id 
                              ? '0 4px 8px rgba(0, 0, 0, 0.1)' 
                              : 'none'
                          }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: styles.successColor,
                            marginBottom: '4px',
                            fontSize: '11px'
                          }}>
                            {zone.label}
                          </div>
                          <div style={{ 
                            color: styles.textSecondary,
                            fontSize: '10px',
                            marginBottom: '6px',
                            fontFamily: 'monospace',
                            background: styles.bgSecondary,
                            padding: '4px 6px',
                            borderRadius: '3px',
                            maxHeight: '40px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            "{zone.text.substring(0, 60)}{zone.text.length > 60 ? '...' : ''}"
                          </div>
                          <div style={{ 
                            display: 'flex',
                            gap: '4px',
                            fontSize: '10px',
                            color: styles.textMuted,
                            marginBottom: '8px'
                          }}>
                            <span>Style: {zone.style}</span>
                            <span>Intensity: {zone.intensity}%</span>
                          </div>

                          {/* Enhancement Results Display */}
                          {enhancementResults[zone.id] && (
                            <div style={{
                              marginBottom: '8px',
                              padding: '6px',
                              background: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                              border: `1px solid ${styles.successColor}`,
                              borderRadius: '4px',
                              fontSize: '9px'
                            }}>
                              <div style={{ fontWeight: '600', color: styles.successColor, marginBottom: '2px' }}>
                                ✓ Enhanced ({enhancementResults[zone.id].processing_time}ms)
                              </div>
                              <div style={{ 
                                color: styles.textSecondary,
                                maxHeight: '40px',
                                overflow: 'hidden',
                                fontFamily: 'monospace',
                                fontSize: '8px'
                              }}>
                                "{enhancementResults[zone.id].enhanced.substring(0, 80)}{enhancementResults[zone.id].enhanced.length > 80 ? '...' : ''}"
                              </div>
                            </div>
                          )}

                          {/* Enhancement Controls */}
                          <div style={{ 
                            display: 'flex',
                            gap: '4px',
                            fontSize: '9px'
                          }}>
                            {!enhancementResults[zone.id] ? (
                              <button
                                onClick={() => enhanceAIZone(zone.id)}
                                disabled={enhancingZoneId === zone.id}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: enhancingZoneId === zone.id 
                                    ? 'transparent' 
                                    : (theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'),
                                  color: enhancingZoneId === zone.id 
                                    ? styles.textMuted 
                                    : (theme === 'dark' ? '#60a5fa' : '#2563eb'),
                                  border: `1px solid ${enhancingZoneId === zone.id ? styles.borderColor : (theme === 'dark' ? '#60a5fa' : '#2563eb')}`,
                                  borderRadius: '3px',
                                  cursor: enhancingZoneId === zone.id ? 'not-allowed' : 'pointer',
                                  fontSize: '9px',
                                  fontWeight: '500',
                                  opacity: enhancingZoneId === zone.id ? 0.6 : 1
                                }}
                              >
                                {enhancingZoneId === zone.id ? '⏳ Enhancing...' : '🤖 Enhance'}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => applyEnhancement(zone.id)}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                                    color: styles.successColor,
                                    border: `1px solid ${styles.successColor}`,
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '9px',
                                    fontWeight: '500'
                                  }}
                                >
                                  ✓ Apply
                                </button>
                                <button
                                  onClick={() => revertEnhancement(zone.id)}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: 'transparent',
                                    color: styles.textMuted,
                                    border: `1px solid ${styles.borderColor}`,
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '9px'
                                  }}
                                >
                                  ↺ Revert
                                </button>
                              </>
                            )}
                            
                            <button
                              onClick={() => removeAIEnhancementZone(zone.id)}
                              style={{
                                marginLeft: 'auto',
                                padding: '4px 8px',
                                fontSize: '9px',
                                backgroundColor: 'transparent',
                                color: styles.errorColor,
                                border: `1px solid ${styles.errorColor}`,
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                            >
                              🗑 Remove
                            </button>
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