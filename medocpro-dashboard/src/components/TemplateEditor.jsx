import React, { useState } from 'react';
import { 
  Save, 
  Eye, 
  Code, 
  Wand2, 
  Download, 
  Upload,
  Copy,
  Undo,
  Redo,
  Type,
  AlignLeft,
  Bold,
  Italic,
  List,
  Hash
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TEMPLATE_CATEGORIES = {
  progress: { name: 'Progress Notes', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  assessment: { name: 'Psychiatric Assessment', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  treatment: { name: 'Treatment Plans', color: 'bg-green-50 text-green-700 border-green-200' },
  intake: { name: 'Intake Forms', color: 'bg-orange-50 text-orange-700 border-orange-200' }
};

const SAMPLE_TEMPLATE = `# Psychiatric Progress Note

**Patient:** {{patient_name}}
**Date:** {{date}}
**Provider:** {{provider_name}}

## Subjective
{{subjective_notes}}

## Objective
**Mental Status Exam:**
- Appearance: {{appearance}}
- Behavior: {{behavior}}
- Speech: {{speech}}
- Mood: {{mood}}
- Affect: {{affect}}
- Thought Process: {{thought_process}}
- Thought Content: {{thought_content}}
- Perceptual Disturbances: {{perceptual_disturbances}}
- Cognition: {{cognition}}
- Insight: {{insight}}
- Judgment: {{judgment}}

**Vital Signs:**
- BP: {{blood_pressure}}
- HR: {{heart_rate}}
- Temp: {{temperature}}
- Weight: {{weight}}

## Assessment
{{assessment}}

## Plan
{{plan}}

**Next Appointment:** {{next_appointment}}
**Provider Signature:** {{provider_signature}}`;

export const TemplateEditor = ({ template = null, onSave, onCancel }) => {
  const [templateData, setTemplateData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'progress',
    content: template?.content || SAMPLE_TEMPLATE,
    tags: template?.tags || [],
    isActive: template?.isActive !== false
  });

  const [activeTab, setActiveTab] = useState('edit');
  const [newTag, setNewTag] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = () => {
    if (onSave) {
      onSave(templateData);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !templateData.tags.includes(newTag.trim())) {
      setTemplateData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTemplateData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAiEnhancement = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI enhancement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add AI-enhanced content
      const enhancedContent = templateData.content + `\n\n<!-- AI Enhanced Section -->\n## AI Suggestions\n${aiPrompt}\n\n{{ai_generated_content}}`;
      
      setTemplateData(prev => ({
        ...prev,
        content: enhancedContent
      }));
      
      setAiPrompt('');
    } catch (error) {
      console.error('AI enhancement failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-content');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = 
        templateData.content.substring(0, start) + 
        `{{${variable}}}` + 
        templateData.content.substring(end);
      
      setTemplateData(prev => ({ ...prev, content: newContent }));
    }
  };

  const commonVariables = [
    'patient_name', 'date', 'provider_name', 'patient_id', 'dob',
    'chief_complaint', 'history_present_illness', 'past_medical_history',
    'medications', 'allergies', 'social_history', 'family_history',
    'review_of_systems', 'physical_exam', 'assessment', 'plan'
  ];

  const renderPreview = () => {
    // Simple markdown-like rendering for preview
    let preview = templateData.content
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/{{(.*?)}}/g, '<span class="bg-yellow-100 dark:bg-yellow-900 px-1 rounded text-sm font-mono">{{$1}}</span>')
      .replace(/\n/g, '<br>');

    return { __html: preview };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {template ? 'Edit Template' : 'Create Template'}
          </h1>
          <p className="text-muted-foreground">
            {template ? 'Modify existing template' : 'Create a new clinical documentation template'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="clinical-button-primary">
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-3 space-y-6">
          {/* Template Info */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
              <CardDescription>Basic template details and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={templateData.name}
                    onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Psychiatric Progress Note"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-category">Category</Label>
                  <Select
                    value={templateData.category}
                    onValueChange={(value) => setTemplateData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                        <SelectItem key={key} value={key}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={templateData.description}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the template's purpose and usage"
                  rows={2}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {templateData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Template Content
              </CardTitle>
              <CardDescription>
                Use markdown formatting and {{variable}} placeholders for dynamic content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit" className="gap-2">
                    <Code className="h-4 w-4" />
                    Edit
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="edit" className="space-y-4">
                  <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg">
                    <Button variant="ghost" size="sm" onClick={() => insertVariable('patient_name')}>
                      Patient Name
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => insertVariable('date')}>
                      Date
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => insertVariable('provider_name')}>
                      Provider
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => insertVariable('assessment')}>
                      Assessment
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => insertVariable('plan')}>
                      Plan
                    </Button>
                  </div>
                  
                  <Textarea
                    id="template-content"
                    value={templateData.content}
                    onChange={(e) => setTemplateData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your template content here..."
                    className="min-h-[400px] font-mono text-sm"
                  />
                </TabsContent>
                
                <TabsContent value="preview">
                  <div 
                    className="min-h-[400px] p-4 border rounded-lg bg-background prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={renderPreview()}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Enhancement */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI Enhancement
              </CardTitle>
              <CardDescription>
                Enhance your template with AI suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what you'd like to add or improve..."
                rows={3}
              />
              <Button 
                onClick={handleAiEnhancement}
                disabled={!aiPrompt.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Enhance
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Template
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Import Template
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Copy className="h-4 w-4 mr-2" />
                Duplicate Template
              </Button>
            </CardContent>
          </Card>

          {/* Variables Reference */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle>Common Variables</CardTitle>
              <CardDescription>
                Click to insert into template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {commonVariables.map(variable => (
                  <Button
                    key={variable}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs font-mono"
                    onClick={() => insertVariable(variable)}
                  >
                    {`{{${variable}}}`}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

