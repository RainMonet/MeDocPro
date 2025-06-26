import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

// Icons for template categories
const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>
);

const ClipboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
  </svg>
);

const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const UserPlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" x2="19" y1="8" y2="14"/>
    <line x1="22" x2="16" y1="11" y2="11"/>
  </svg>
);

const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
  </svg>
);

// Template Categories Configuration
const TEMPLATE_CATEGORIES = {
  'progress': { 
    name: 'Progress Notes', 
    color: '#10b981', 
    icon: FileTextIcon,
    description: 'Session notes and treatment progress documentation'
  },
  'assessment': { 
    name: 'Psychiatric Assessment', 
    color: '#0066cc', 
    icon: ClipboardIcon,
    description: 'Initial evaluations and diagnostic assessments'
  },
  'treatment': { 
    name: 'Treatment Plans', 
    color: '#8b5cf6', 
    icon: TargetIcon,
    description: 'Structured treatment planning and goal setting'
  },
  'intake': { 
    name: 'Intake Forms', 
    color: '#f59e0b', 
    icon: UserPlusIcon,
    description: 'Patient intake and initial screening forms'
  },
  'discharge': { 
    name: 'Discharge Summaries', 
    color: '#ef4444', 
    icon: LogOutIcon,
    description: 'Discharge planning and summary documentation'
  },
  'custom': { 
    name: 'Custom Documentation', 
    color: '#64748b', 
    icon: EditIcon,
    description: 'Custom clinical documentation templates'
  }
};

// Template Card Component
const TemplateCard = ({ template, onEdit, onUse, onView }) => {
  const category = TEMPLATE_CATEGORIES[template.category] || TEMPLATE_CATEGORIES.custom;
  const IconComponent = category.icon;

  // Generate content preview (first 150 characters)
  const contentPreview = template.content 
    ? template.content.replace(/{{[^}]+}}/g, '[field]').substring(0, 150) + '...'
    : 'No content preview available';

  return (
    <div className="card template-card" style={{ 
      transition: 'all 0.2s ease',
      border: '1px solid #e2e8f0',
      borderRadius: '8px'
    }}>
      <div className="card-content" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <IconComponent />
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                margin: 0,
                color: '#1a202c'
              }}>
                {template.name}
              </h3>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '500',
                backgroundColor: category.color + '20',
                color: category.color,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {category.name}
              </span>
              
              {template.is_active === false && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626'
                }}>
                  INACTIVE
                </span>
              )}
            </div>

            <p style={{ 
              fontSize: '13px', 
              color: '#64748b', 
              lineHeight: '1.4',
              margin: '0 0 8px 0'
            }}>
              {contentPreview}
            </p>

            <div style={{ 
              fontSize: '12px', 
              color: '#9ca3af',
              display: 'flex',
              gap: '12px'
            }}>
              <span>
                Created: {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown'}
              </span>
              {template.last_modified && (
                <span>
                  Modified: {new Date(template.last_modified).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => onUse(template)}
              style={{ 
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              Use Template
            </button>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => onEdit(template)}
              style={{ 
                padding: '6px 8px',
                fontSize: '12px'
              }}
            >
              <EditIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Category Filter Component
const CategoryFilter = ({ selectedCategory, onCategoryChange, templateCounts }) => {
  const allCount = Object.values(templateCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
        Filter by Category
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button
          className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onCategoryChange('all')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '12px',
            padding: '6px 12px'
          }}
        >
          <FilterIcon />
          All ({allCount})
        </button>
        
        {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => {
          const IconComponent = category.icon;
          const count = templateCounts[key] || 0;
          
          return (
            <button
              key={key}
              className={`btn btn-sm ${selectedCategory === key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onCategoryChange(key)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '12px',
                padding: '6px 12px'
              }}
            >
              <IconComponent />
              {category.name} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Main Template Library Component
const TemplateLibrary = ({ onEditTemplate, onUseTemplate, onCreateNew }) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [templateCounts, setTemplateCounts] = useState({});

  // Load templates from API
  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await apiService.getTemplates();
      const templateList = response.templates || [];
      
      setTemplates(templateList);
      
      // Calculate template counts by category
      const counts = {};
      templateList.forEach(template => {
        counts[template.category] = (counts[template.category] || 0) + 1;
      });
      setTemplateCounts(counts);
      
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError(err.message || 'Failed to load templates');
      
      // Use mock data if backend is unavailable
      const mockTemplates = [
        {
          id: 1,
          name: 'Psychiatric Progress Note',
          category: 'progress',
          content: 'PROGRESS NOTE\n\nDate: {{date_of_service}}\nPatient: {{patient_name}}...',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: 2,
          name: 'Mental Status Examination',
          category: 'assessment',
          content: 'MENTAL STATUS EXAMINATION\n\nDate: {{date_of_service}}...',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: 3,
          name: 'Treatment Plan Template',
          category: 'treatment',
          content: 'TREATMENT PLAN\n\nPatient: {{patient_name}}...',
          created_at: new Date().toISOString(),
          is_active: true
        }
      ];
      
      setTemplates(mockTemplates);
      
      const mockCounts = {};
      mockTemplates.forEach(template => {
        mockCounts[template.category] = (mockCounts[template.category] || 0) + 1;
      });
      setTemplateCounts(mockCounts);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Filter templates based on category and search
  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        (template.content && template.content.toLowerCase().includes(query)) ||
        (TEMPLATE_CATEGORIES[template.category]?.name.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, searchQuery]);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Handle template actions
  const handleEditTemplate = (template) => {
    onEditTemplate(template);
  };

  const handleUseTemplate = (template) => {
    onUseTemplate(template);
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="loading-spinner" style={{ width: '32px', height: '32px' }}></div>
        <div style={{ color: '#64748b' }}>Loading template library...</div>
      </div>
    );
  }

  return (
    <div className="template-library">
      {/* Header Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#1a202c' }}>
              Clinical Template Library
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Manage your clinical documentation templates with AI enhancement capabilities
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={onCreateNew}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '18px' }}>+</span>
            New Template
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
            <strong>Connection Issue:</strong> {error}
            <br />
            <small>Displaying cached templates for demonstration.</small>
          </div>
        )}

        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <SearchIcon style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search templates by name, category, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                paddingLeft: '36px',
                fontSize: '14px'
              }}
            />
          </div>
          {searchQuery && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setSearchQuery('')}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        templateCounts={templateCounts}
      />

      {/* Results Summary */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Showing {filteredTemplates.length} of {templates.length} templates
          {selectedCategory !== 'all' && ` in ${TEMPLATE_CATEGORIES[selectedCategory]?.name}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      {/* Template Grid */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredTemplates.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No templates found</h3>
            <p style={{ fontSize: '14px', marginBottom: '20px' }}>
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first clinical template to get started'
              }
            </p>
            {(!searchQuery && selectedCategory === 'all') && (
              <button className="btn btn-primary" onClick={onCreateNew}>
                Create Your First Template
              </button>
            )}
          </div>
        ) : (
          filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEditTemplate}
              onUse={handleUseTemplate}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TemplateLibrary;