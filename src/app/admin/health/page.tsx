'use client';

import { useEffect, useState } from 'react';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Server,
  Database,
  Cpu,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';

interface HealthData {
  status: string;
  uptime: number;
  lastCheck: string;
  services: {
    name: string;
    status: string;
    responseTime: number;
  }[];
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    requests: number;
  };
}

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/health');
      const data = await res.json();
      setHealth(data.data);
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'down':
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <Badge variant="success">Healthy</Badge>;
      case 'degraded':
        return <Badge variant="warning">Degraded</Badge>;
      case 'down':
      case 'critical':
        return <Badge variant="destructive">Down</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMetricColor = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground">
            Monitor system status and performance
          </p>
        </div>
        <Button variant="outline" onClick={fetchHealth} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : health ? (
        <>
          {/* Overall Status */}
          <Card className={health.status === 'healthy' ? 'border-green-500' : 'border-yellow-500'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(health.status)}
                  <div>
                    <CardTitle className="text-xl capitalize">{health.status}</CardTitle>
                    <CardDescription>All systems operational</CardDescription>
                  </div>
                </div>
                {getStatusBadge(health.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8">
                <div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-2xl font-bold">{health.uptime.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Check</p>
                  <p className="text-lg">{new Date(health.lastCheck).toLocaleTimeString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.metrics.cpu}%</div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${getMetricColor(health.metrics.cpu)}`}
                    style={{ width: `${health.metrics.cpu}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Memory</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.metrics.memory}%</div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${getMetricColor(health.metrics.memory)}`}
                    style={{ width: `${health.metrics.memory}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.metrics.disk}%</div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${getMetricColor(health.metrics.disk)}`}
                    style={{ width: `${health.metrics.disk}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Requests/min</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.metrics.requests}</div>
                <p className="text-xs text-muted-foreground mt-2">Active requests</p>
              </CardContent>
            </Card>
          </div>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
              <CardDescription>Status of individual services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {health.services.map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Response time: {service.responseTime}ms
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Failed to load health data</h3>
            <p className="text-muted-foreground">Please try again</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
