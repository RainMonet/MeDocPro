import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { DashboardHome } from '@/components/DashboardHome';
import { TemplatesList } from '@/components/TemplatesList';
import { TemplateEditor } from '@/components/TemplateEditor';
import { DocumentationWorkspace } from '@/components/DocumentationWorkspace';
import { HealthStatus } from '@/components/HealthStatus';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [viewData, setViewData] = useState({});

  const handleNavigation = (item) => {
    setActiveView(item.id);
    setViewData(item);
  };

  const handleTemplateEdit = (template) => {
    setActiveView('template-editor');
    setViewData({ template, mode: 'edit' });
  };

  const handleTemplateCreate = () => {
    setActiveView('template-editor');
    setViewData({ template: null, mode: 'create' });
  };

  const handleTemplateUse = (template) => {
    setActiveView('documentation');
    setViewData({ templateId: template.id });
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardHome onNavigate={handleNavigation} />;
      
      case 'templates':
        return (
          <TemplatesList 
            onNavigate={handleNavigation}
            onEditTemplate={handleTemplateEdit}
            onCreateTemplate={handleTemplateCreate}
            onUseTemplate={handleTemplateUse}
          />
        );

      case 'template-editor':
        return (
          <TemplateEditor
            template={viewData.template}
            onSave={(templateData) => {
              console.log('Saving template:', templateData);
              // Handle template save
              setActiveView('templates');
            }}
            onCancel={() => setActiveView('templates')}
          />
        );
      
      case 'documentation':
        return (
          <DocumentationWorkspace
            templateId={viewData.templateId}
            patientId={viewData.patientId}
          />
        );
      
      case 'patients':
        return (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Patient Census</h1>
                <p className="text-muted-foreground">Manage your patient list and documentation</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="clinical-card p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Patient Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Patient census and EMR integration features will be implemented here.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will include automated patient list updates from EMR screenshots.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <HealthStatus />
              </div>
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Analytics</h1>
                <p className="text-muted-foreground">Usage metrics and performance insights</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="clinical-card p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Usage Analytics</h3>
                  <p className="text-muted-foreground mb-4">
                    Charts and metrics showing template usage, time savings, and productivity insights.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <HealthStatus />
              </div>
            </div>
          </div>
        );
      
      case 'audit':
        return (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Audit Log</h1>
                <p className="text-muted-foreground">System activity and compliance tracking</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="clinical-card p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Activity Log</h3>
                  <p className="text-muted-foreground mb-4">
                    Detailed audit trail of all system activities for compliance and security.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <HealthStatus />
              </div>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Application preferences and configuration</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="clinical-card p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Preferences</h3>
                  <p className="text-muted-foreground mb-4">
                    Theme customization, AI settings, and system preferences.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <HealthStatus />
              </div>
            </div>
          </div>
        );
      
      case 'help':
        return (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Help & Support</h1>
                <p className="text-muted-foreground">Documentation and support resources</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="clinical-card p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Documentation</h3>
                  <p className="text-muted-foreground mb-4">
                    User guides, tutorials, and support resources for MeDocPro.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <HealthStatus />
              </div>
            </div>
          </div>
        );
      
      default:
        return <DashboardHome onNavigate={handleNavigation} />;
    }
  };

  return (
    <ThemeProvider>
      <Layout 
        activeItem={activeView === 'template-editor' ? 'templates' : activeView} 
        onNavigate={handleNavigation}
      >
        {renderContent()}
      </Layout>
    </ThemeProvider>
  );
}

export default App;

