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
    color: '#6b8e23', 
    icon: FileTextIcon,
    description: 'Session notes and treatment progress documentation'
  },
  'assessment': { 
    name: 'Psychiatric Assessment', 
    color: '#8b4513', 
    icon: ClipboardIcon,
    description: 'Initial evaluations and diagnostic assessments'
  },
  'treatment': { 
    name: 'Treatment Plans', 
    color: '#708090', 
    icon: TargetIcon,
    description: 'Structured treatment planning and goal setting'
  },
  'intake': { 
    name: 'Intake Forms', 
    color: '#cd853f', 
    icon: UserPlusIcon,
    description: 'Patient intake and initial screening forms'
  },
  'discharge': { 
    name: 'Discharge Summaries', 
    color: '#a0522d', 
    icon: LogOutIcon,
    description: 'Discharge planning and summary documentation'
  },
  'custom': { 
    name: 'Custom Documentation', 
    color: '#8b7355', 
    icon: EditIcon,
    description: 'Custom clinical documentation templates'
  }
};

// Template Card Component
const TemplateCard = ({ template, onEdit, onUse, onView, theme = 'dark' }) => {
  const category = TEMPLATE_CATEGORIES[template.category] || TEMPLATE_CATEGORIES.custom;
  const IconComponent = category.icon;
  const styles = getThemeStyles(theme);

  // Generate content preview (first 150 characters)
  const contentPreview = template.content 
    ? template.content.replace(/{{[^}]+}}/g, '[field]').substring(0, 150) + '...'
    : 'No content preview available';

  return (
    <div className="card template-card" style={{ 
      transition: 'all 0.2s ease',
      border: `1px solid ${styles.borderColor}`,
      borderRadius: '8px',
      backgroundColor: styles.cardBg
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
                color: styles.textPrimary
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
                  backgroundColor: '#f4f1eb',
                  color: '#8b7355'
                }}>
                  INACTIVE
                </span>
              )}
            </div>

            <p style={{ 
              fontSize: '13px', 
              color: styles.textSecondary, 
              lineHeight: '1.4',
              margin: '0 0 8px 0'
            }}>
              {contentPreview}
            </p>

            <div style={{ 
              fontSize: '12px', 
              color: styles.textMuted,
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
const CategoryFilter = ({ selectedCategory, onCategoryChange, templateCounts, theme = 'dark' }) => {
  const allCount = Object.values(templateCounts).reduce((sum, count) => sum + count, 0);
  const styles = getThemeStyles(theme);

  return (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: styles.textPrimary }}>
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

// Theme-aware style helpers
const getThemeStyles = (theme) => ({
  textPrimary: theme === 'dark' ? '#f1f5f9' : '#2d1810',
  textSecondary: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
  textMuted: theme === 'dark' ? '#94a3b8' : '#8b7355',
  bgPrimary: theme === 'dark' ? '#1e293b' : '#faf8f3',
  bgSecondary: theme === 'dark' ? '#0f172a' : '#f4f1eb',
  borderColor: theme === 'dark' ? '#334155' : '#d4c4a8',
  cardBg: theme === 'dark' ? '#1e293b' : '#faf8f3'
});

// Main Template Library Component
const TemplateLibrary = ({ onEditTemplate, onUseTemplate, onCreateNew, theme = 'dark' }) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [templateCounts, setTemplateCounts] = useState({});

  const styles = getThemeStyles(theme);

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
        flexDirection: 'column',
        height: '100%',
        backgroundColor: styles.bgPrimary
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flex: 1,
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div className="loading-spinner" style={{ width: '32px', height: '32px' }}></div>
          <div style={{ color: styles.textMuted, fontSize: '14px' }}>Loading template library...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: styles.bgPrimary
    }}>
      {/* Header Section - Similar to PatientCensusModal */}
      <div style={{
        padding: '24px 24px 20px 24px',
        borderBottom: `1px solid ${styles.borderColor}`,
        flexShrink: 0,
        backgroundColor: styles.bgPrimary
      }}>
        {/* Title and Description */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: styles.textPrimary,
              marginBottom: '4px'
            }}>
              📚 Template Library
            </h2>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: styles.textSecondary
            }}>
              Manage clinical documentation templates
            </p>
          </div>
        </div>

        {/* Statistics Cards Row - Similar to Patient Census */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: styles.bgSecondary,
            borderRadius: '8px',
            border: `1px solid ${styles.borderColor}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: styles.textPrimary,
              marginBottom: '4px'
            }}>
              {templates.length}
            </div>
            <div style={{
              fontSize: '12px',
              color: styles.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Total Templates
            </div>
          </div>
          
          <div style={{
            padding: '12px 16px',
            backgroundColor: styles.bgSecondary,
            borderRadius: '8px',
            border: `1px solid ${styles.borderColor}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#6b8e23',
              marginBottom: '4px'
            }}>
              {templateCounts['progress'] || 0}
            </div>
            <div style={{
              fontSize: '12px',
              color: styles.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Progress Notes
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            backgroundColor: styles.bgSecondary,
            borderRadius: '8px',
            border: `1px solid ${styles.borderColor}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#8b4513',
              marginBottom: '4px'
            }}>
              {templateCounts['assessment'] || 0}
            </div>
            <div style={{
              fontSize: '12px',
              color: styles.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Assessments
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            backgroundColor: styles.bgSecondary,
            borderRadius: '8px',
            border: `1px solid ${styles.borderColor}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#cd853f',
              marginBottom: '4px'
            }}>
              {filteredTemplates.length}
            </div>
            <div style={{
              fontSize: '12px',
              color: styles.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Filtered Results
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(205, 133, 63, 0.1)',
            borderLeft: `4px solid #cd853f`,
            color: '#cd853f',
            borderRadius: '4px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            <strong>Connection Issue:</strong> {error} - Displaying cached templates for demonstration.
          </div>
        )}

        {/* Controls Row - Search, Filter, and New Button */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 250px', minWidth: '200px' }}>
            <SearchIcon style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: styles.textMuted
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
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${styles.borderColor}`,
              backgroundColor: styles.bgPrimary,
              color: styles.textPrimary,
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="all">All Categories</option>
            {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>
                {category.name} ({templateCounts[key] || 0})
              </option>
            ))}
          </select>

          {/* New Template Button */}
          <button
            onClick={onCreateNew}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b8e23',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            New Template
          </button>
        </div>
      </div>

      {/* Content Area - Scrollable like PatientCensusModal */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px 24px'
      }}>
        {/* Results Summary */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ 
            color: styles.textSecondary, 
            fontSize: '13px',
            margin: 0
          }}>
            Showing {filteredTemplates.length} of {templates.length} templates
            {selectedCategory !== 'all' && ` in ${TEMPLATE_CATEGORIES[selectedCategory]?.name}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Template Grid/List */}
        {filteredTemplates.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: styles.textMuted
          }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📄</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: styles.textPrimary }}>No templates found</h3>
            <p style={{ fontSize: '14px', marginBottom: '20px', color: styles.textSecondary }}>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEditTemplate}
                onUse={handleUseTemplate}
                theme={theme}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateLibrary;