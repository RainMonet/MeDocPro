import React from 'react';
import { 
  Activity, 
  FileText, 
  Users, 
  Settings, 
  Home,
  Stethoscope,
  ClipboardList,
  BarChart3,
  Shield,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/',
    description: 'Overview and quick actions'
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: FileText,
    href: '/templates',
    description: 'Clinical documentation templates'
  },
  {
    id: 'patients',
    label: 'Patient Census',
    icon: Users,
    href: '/patients',
    description: 'Patient list management'
  },
  {
    id: 'documentation',
    label: 'Documentation',
    icon: ClipboardList,
    href: '/documentation',
    description: 'Create and manage notes'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    description: 'Usage and performance metrics'
  },
  {
    id: 'audit',
    label: 'Audit Log',
    icon: Shield,
    href: '/audit',
    description: 'System activity tracking'
  }
];

const bottomItems = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    description: 'Application preferences'
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: HelpCircle,
    href: '/help',
    description: 'Documentation and support'
  }
];

export const Sidebar = ({ activeItem = 'dashboard', onItemClick, isCollapsed = false }) => {
  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;
    
    return (
      <Button
        key={item.id}
        variant={isActive ? "secondary" : "ghost"}
        className={`
          w-full justify-start h-11 px-3 mb-1
          ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}
          ${isCollapsed ? 'px-2' : ''}
        `}
        onClick={() => handleItemClick(item)}
        title={isCollapsed ? item.label : item.description}
      >
        <Icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
        {!isCollapsed && (
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{item.label}</span>
            <span className="text-xs text-muted-foreground">{item.description}</span>
          </div>
        )}
      </Button>
    );
  };

  return (
    <div className={`
      bg-sidebar border-r border-sidebar-border h-full flex flex-col
      ${isCollapsed ? 'w-16' : 'w-72'}
      transition-all duration-300 ease-in-out
    `}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">MeDocPro</h1>
              <p className="text-xs text-muted-foreground">Clinical Documentation</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3 overflow-y-auto">
        <nav className="space-y-1">
          {sidebarItems.map(renderNavItem)}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border">
        <nav className="space-y-1 mb-3">
          {bottomItems.map(renderNavItem)}
        </nav>
        
        {/* Theme Toggle */}
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-between items-center'}`}>
          {!isCollapsed && (
            <span className="text-xs text-muted-foreground">Theme</span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

