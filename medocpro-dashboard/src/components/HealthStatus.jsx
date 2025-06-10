import React from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Database, Wifi } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useHealth } from '@/hooks/useHealth';

export const HealthStatus = () => {
  const { health, loading, error, refetch, isHealthy, isUnhealthy } = useHealth();

  if (loading && !health) {
    return (
      <Card className="clinical-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-pulse-clinical">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Checking system health...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !health) {
    return (
      <Card className="clinical-card border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">System Unavailable</p>
                <p className="text-xs text-muted-foreground">Unable to connect to backend</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (isHealthy) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (isUnhealthy) return <AlertCircle className="h-5 w-5 text-destructive" />;
    return <Activity className="h-5 w-5 text-orange-600" />;
  };

  const getStatusColor = () => {
    if (isHealthy) return 'text-green-600 border-green-600';
    if (isUnhealthy) return 'text-destructive border-destructive';
    return 'text-orange-600 border-orange-600';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="clinical-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusIcon()}
            {health?.status || 'Unknown'}
          </Badge>
        </div>
        <CardDescription>
          Backend API and database connectivity status
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Service Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Service</p>
            <p className="font-medium">{health?.service || 'MeDocPro API'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Version</p>
            <p className="font-medium">{health?.version || '1.0.0'}</p>
          </div>
        </div>

        {/* Status Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Database</span>
            </div>
            <Badge 
              variant={health?.database === 'connected' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {health?.database || 'Unknown'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">API Status</span>
            </div>
            <Badge 
              variant={isHealthy ? 'default' : 'destructive'}
              className="text-xs"
            >
              {isHealthy ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Last Check</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(health?.timestamp)}
            </span>
          </div>
        </div>

        {/* Error Details */}
        {health?.error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-destructive font-medium mb-1">Error Details:</p>
            <p className="text-xs text-muted-foreground">{health.error}</p>
          </div>
        )}

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Checking...' : 'Refresh Status'}
        </Button>
      </CardContent>
    </Card>
  );
};

