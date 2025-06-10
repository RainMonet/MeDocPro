import React, { useState } from 'react';
import { 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  Save, 
  Send, 
  Printer, 
  Download,
  Wand2,
  Eye,
  Edit3,
  MoreHorizontal,
  Plus,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SAMPLE_PATIENTS = [
  { id: 1, name: 'John Doe', mrn: 'MRN001234', dob: '1985-03-15' },
  { id: 2, name: 'Jane Smith', mrn: 'MRN005678', dob: '1992-07-22' },
  { id: 3, name: 'Robert Johnson', mrn: 'MRN009012', dob: '1978-11-08' }
];

const SAMPLE_TEMPLATES = [
  { 
    id: 1, 
    name: 'Psychiatric Progress Note', 
    category: 'progress',
    content: `# Psychiatric Progress Note

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

## Assessment
{{assessment}}

## Plan
{{plan}}`
  },
  { 
    id: 2, 
    name: 'Mental Status Examination', 
    category: 'assessment',
    content: `# Mental Status Examination

**Patient:** {{patient_name}}
**Date:** {{date}}
**Examiner:** {{provider_name}}

## Appearance
{{appearance}}

## Behavior
{{behavior}}

## Speech
{{speech}}

## Mood and Affect
{{mood_affect}}

## Thought Process and Content
{{thought_process_content}}

## Perceptual Disturbances
{{perceptual_disturbances}}

## Cognitive Assessment
{{cognitive_assessment}}

## Insight and Judgment
{{insight_judgment}}`
  }
];

export const DocumentationWorkspace = ({ templateId = null, patientId = null }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(
    templateId ? SAMPLE_TEMPLATES.find(t => t.id === templateId) : null
  );
  const [selectedPatient, setSelectedPatient] = useState(
    patientId ? SAMPLE_PATIENTS.find(p => p.id === patientId) : null
  );
  const [documentContent, setDocumentContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [activeTab, setActiveTab] = useState('compose');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const populateTemplate = () => {
    if (!selectedTemplate || !selectedPatient) return;

    const populatedContent = selectedTemplate.content
      .replace(/{{patient_name}}/g, selectedPatient.name)
      .replace(/{{date}}/g, new Date().toLocaleDateString())
      .replace(/{{provider_name}}/g, 'Dr. Admin')
      .replace(/{{patient_id}}/g, selectedPatient.mrn)
      .replace(/{{dob}}/g, selectedPatient.dob);

    setDocumentContent(populatedContent);
    setDocumentTitle(`${selectedTemplate.name} - ${selectedPatient.name}`);
  };

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI assistance
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiSuggestion = `\n\n## AI-Generated Content\n${aiPrompt}\n\n[AI would provide relevant clinical content here based on the prompt]`;
      setDocumentContent(prev => prev + aiSuggestion);
      setAiPrompt('');
    } catch (error) {
      console.error('AI assistance failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDocument = () => {
    console.log('Saving document:', { title: documentTitle, content: documentContent });
    // Implement save functionality
  };

  const handleExportDocument = () => {
    console.log('Exporting document');
    // Implement export functionality
  };

  const renderPreview = () => {
    let preview = documentContent
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n/g, '<br>');

    return { __html: preview };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Documentation Workspace</h1>
          <p className="text-muted-foreground">Create and manage clinical documentation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportDocument}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSaveDocument} className="clinical-button-primary">
            <Save className="h-4 w-4 mr-2" />
            Save Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Workspace */}
        <div className="lg:col-span-3 space-y-6">
          {/* Document Setup */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle>Document Setup</CardTitle>
              <CardDescription>Select template and patient for documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select
                    value={selectedTemplate?.id?.toString() || ''}
                    onValueChange={(value) => {
                      const template = SAMPLE_TEMPLATES.find(t => t.id === parseInt(value));
                      setSelectedTemplate(template);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_TEMPLATES.map(template => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select
                    value={selectedPatient?.id?.toString() || ''}
                    onValueChange={(value) => {
                      const patient = SAMPLE_PATIENTS.find(p => p.id === parseInt(value));
                      setSelectedPatient(patient);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_PATIENTS.map(patient => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.name} ({patient.mrn})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={populateTemplate}
                    disabled={!selectedTemplate || !selectedPatient}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Populate Template
                  </Button>
                </div>
              </div>

              {selectedPatient && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{selectedPatient.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{selectedPatient.mrn}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>DOB: {selectedPatient.dob}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Editor */}
          <Card className="clinical-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Document Editor</CardTitle>
                  <CardDescription>Create and edit your clinical documentation</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Auto-saved
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-title">Document Title</Label>
                  <Input
                    id="document-title"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="Enter document title..."
                  />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="compose" className="gap-2">
                      <Edit3 className="h-4 w-4" />
                      Compose
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="compose" className="space-y-4">
                    <Textarea
                      value={documentContent}
                      onChange={(e) => setDocumentContent(e.target.value)}
                      placeholder="Start typing your documentation here, or use a template..."
                      className="min-h-[500px] font-mono text-sm"
                    />
                  </TabsContent>
                  
                  <TabsContent value="preview">
                    <div 
                      className="min-h-[500px] p-6 border rounded-lg bg-background prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={renderPreview()}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Assistant */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Get AI-powered suggestions for your documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask for help with documentation..."
                rows={3}
              />
              <Button 
                onClick={handleAiAssist}
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
                    Get Suggestions
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
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Printer className="h-4 w-4 mr-2" />
                Print Document
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: 'Progress Note - John Doe', date: '2 hours ago' },
                { title: 'MSE - Jane Smith', date: '1 day ago' },
                { title: 'Treatment Plan - Robert Johnson', date: '2 days ago' }
              ].map((doc, index) => (
                <div key={index} className="p-2 rounded-lg hover:bg-accent cursor-pointer">
                  <p className="text-sm font-medium">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{doc.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

