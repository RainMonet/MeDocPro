import React from 'react';
import { Bell, Search, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Header = ({ 
  onMenuToggle, 
  isSidebarCollapsed = false,
  user = { name: 'Dr. Admin', email: 'admin@medocpro.com' }
}) => {
  return (
    <header className="bg-background border-b border-border h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="h-9 w-9 p-0 lg:hidden"
          aria-label="Toggle menu"
        >
          {isSidebarCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>

        {/* Desktop Sidebar Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="h-9 w-9 p-0 hidden lg:flex"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates, patients..."
            className="pl-10 w-64 lg:w-80"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Mobile Search */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 md:hidden"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-xs flex items-center justify-center">
            <span className="sr-only">3 notifications</span>
          </span>
        </Button>

        {/* Theme Toggle - Desktop */}
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        {/* User Profile */}
        <Button
          variant="ghost"
          className="h-9 px-3 gap-2 hidden sm:flex"
        >
          <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
            <User className="h-3 w-3 text-primary-foreground" />
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </Button>

        {/* Mobile User Profile */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 sm:hidden"
          aria-label="User profile"
        >
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

