import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Grid,
  List,
  Clock,
  User,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTemplates } from '@/hooks/useTemplates';

const TemplateCard = ({ template, onEdit, onUse }) => {
  const getCategoryColor = (category) => {
    const colors = {
      progress: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
      assessment: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
      treatment: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
      intake: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
    };
    return colors[category] || 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300';
  };

  return (
    <Card className="clinical-card hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {template.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {template.description || 'Clinical documentation template'}
            </CardDescription>
          </div>
          <Badge className={`ml-2 ${getCategoryColor(template.category)}`}>
            {template.category || 'general'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Template Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Updated {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : 'Recently'}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{template.author || 'System'}</span>
          </div>
        </div>

        {/* Template Preview */}
        <div className="p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground line-clamp-3">
            {template.content ? 
              template.content.substring(0, 150) + (template.content.length > 150 ? '...' : '') :
              'This template contains structured fields for clinical documentation.'
            }
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={() => onUse(template)}
          >
            <FileText className="h-3 w-3 mr-1" />
            Use Template
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(template)}
          >
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const TemplatesList = ({ onNavigate, onEditTemplate, onCreateTemplate, onUseTemplate }) => {
  const { templates, loading, error, refetch } = useTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'progress', name: 'Progress Notes', count: templates.filter(t => t.category === 'progress').length },
    { id: 'assessment', name: 'Assessments', count: templates.filter(t => t.category === 'assessment').length },
    { id: 'treatment', name: 'Treatment Plans', count: templates.filter(t => t.category === 'treatment').length },
    { id: 'intake', name: 'Intake Forms', count: templates.filter(t => t.category === 'intake').length },
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template) => {
    console.log('Using template:', template.name);
    if (onUseTemplate) {
      onUseTemplate(template);
    } else if (onNavigate) {
      onNavigate({ id: 'documentation', templateId: template.id });
    }
  };

  const handleEditTemplate = (template) => {
    console.log('Editing template:', template.name);
    if (onEditTemplate) {
      onEditTemplate(template);
    }
  };

  const handleCreateTemplate = () => {
    console.log('Creating new template');
    if (onCreateTemplate) {
      onCreateTemplate();
    }
  };

  if (loading && templates.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Templates</h1>
            <p className="text-muted-foreground">Loading clinical documentation templates...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="clinical-card">
              <CardContent className="p-6">
                <div className="animate-pulse-clinical space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && templates.length === 0) {
    return (
      <div className="p-6">
        <Card className="clinical-card border-destructive">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Templates</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            {filteredTemplates.length} of {templates.length} clinical documentation templates
          </p>
        </div>
        <Button onClick={handleCreateTemplate} className="clinical-button-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="gap-2"
          >
            <Tag className="h-3 w-3" />
            {category.name}
            <Badge variant="secondary" className="ml-1 text-xs">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <Card className="clinical-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first template.'
              }
            </p>
            {(!searchTerm && selectedCategory === 'all') && (
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEditTemplate}
              onUse={handleUseTemplate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

