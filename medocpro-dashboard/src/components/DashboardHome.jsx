import React from 'react';
import { 
  Activity, 
  FileText, 
  Users, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const statsCards = [
  {
    title: 'Active Templates',
    value: '12',
    change: '+2 this week',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950'
  },
  {
    title: 'Patient Census',
    value: '48',
    change: '+5 today',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950'
  },
  {
    title: 'Notes Generated',
    value: '156',
    change: '+23 today',
    icon: Activity,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950'
  },
  {
    title: 'Avg. Time Saved',
    value: '12 min',
    change: 'per note',
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950'
  }
];

const recentActivity = [
  {
    id: 1,
    action: 'Created Progress Note',
    patient: 'Patient #1234',
    time: '2 minutes ago',
    status: 'completed',
    template: 'Psychiatric Progress Note'
  },
  {
    id: 2,
    action: 'Updated Treatment Plan',
    patient: 'Patient #5678',
    time: '15 minutes ago',
    status: 'completed',
    template: 'Treatment Plan Template'
  },
  {
    id: 3,
    action: 'Mental Status Exam',
    patient: 'Patient #9012',
    time: '1 hour ago',
    status: 'in-progress',
    template: 'Mental Status Examination'
  },
  {
    id: 4,
    action: 'Created Template',
    patient: 'System',
    time: '2 hours ago',
    status: 'completed',
    template: 'Custom Assessment'
  }
];

const quickActions = [
  {
    title: 'New Progress Note',
    description: 'Create a psychiatric progress note',
    icon: FileText,
    color: 'bg-blue-600 hover:bg-blue-700'
  },
  {
    title: 'Mental Status Exam',
    description: 'Conduct mental status examination',
    icon: Activity,
    color: 'bg-green-600 hover:bg-green-700'
  },
  {
    title: 'Treatment Plan',
    description: 'Develop treatment plan',
    icon: TrendingUp,
    color: 'bg-purple-600 hover:bg-purple-700'
  },
  {
    title: 'Add Patient',
    description: 'Add new patient to census',
    icon: Plus,
    color: 'bg-orange-600 hover:bg-orange-700'
  }
];

export const DashboardHome = ({ onNavigate }) => {
  const handleQuickAction = (action) => {
    // Handle quick action clicks
    console.log('Quick action:', action.title);
    if (onNavigate) {
      if (action.title.includes('Patient')) {
        onNavigate({ id: 'patients' });
      } else {
        onNavigate({ id: 'templates' });
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Dr. Admin</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            System Healthy
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="clinical-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="clinical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common clinical documentation tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-accent"
                  onClick={() => handleQuickAction(action)}
                >
                  <div className={`p-2 rounded-md ${action.color} mr-3`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="clinical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest documentation activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex-shrink-0">
                  {activity.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.patient} • {activity.template}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
                <Badge 
                  variant={activity.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {activity.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

