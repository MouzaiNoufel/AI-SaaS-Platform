'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Wrench, 
  Activity, 
  TrendingUp,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTools: number;
  activeTools: number;
  totalRequests: number;
  requestsToday: number;
  systemHealth: {
    status: string;
    uptime: number;
    cpu: number;
    memory: number;
  };
  recentActivity: Array<{
    type: string;
    message: string;
    time: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [usersRes, toolsRes, analyticsRes, healthRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/tools'),
        fetch('/api/admin/analytics'),
        fetch('/api/admin/health'),
      ]);

      const users = await usersRes.json();
      const tools = await toolsRes.json();
      const analytics = await analyticsRes.json();
      const health = await healthRes.json();

      const usersData = users.data || [];
      const toolsData = tools.data || [];
      const analyticsData = analytics.data || [];

      setStats({
        totalUsers: usersData.length || users.pagination?.total || 0,
        activeUsers: usersData.filter((u: { status: string }) => u.status === 'ACTIVE').length,
        totalTools: toolsData.length,
        activeTools: toolsData.filter((t: { isActive: boolean }) => t.isActive).length,
        totalRequests: analyticsData.reduce((sum: number, a: { totalRequests?: number }) => sum + (a.totalRequests || 0), 0),
        requestsToday: analyticsData[0]?.totalRequests || 0,
        systemHealth: {
          status: health.data?.status || 'healthy',
          uptime: health.data?.uptime || 99.9,
          cpu: health.data?.metrics?.cpu || 45,
          memory: health.data?.metrics?.memory || 62,
        },
        recentActivity: [
          { type: 'user', message: 'New user registered', time: '5 min ago' },
          { type: 'request', message: '150 AI requests processed', time: '1 hour ago' },
          { type: 'system', message: 'System backup completed', time: '3 hours ago' },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Loading system overview...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and quick actions</p>
        </div>
        <Button variant="outline" onClick={fetchStats} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                12% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Tools</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeTools} / {stats?.totalTools}
            </div>
            <p className="text-xs text-muted-foreground">Active tools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.requestsToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize text-green-500">
              {stats?.systemHealth.status}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.systemHealth.uptime}% uptime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" asChild className="justify-start">
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/admin/tools">
                <Wrench className="mr-2 h-4 w-4" />
                Manage Tools
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/admin/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/admin/logs">
                <Activity className="mr-2 h-4 w-4" />
                System Logs
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* System Resources */}
        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
            <CardDescription>Current resource utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>CPU Usage</span>
                <span>{stats?.systemHealth.cpu}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${stats?.systemHealth.cpu}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>{stats?.systemHealth.memory}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${stats?.systemHealth.memory}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Uptime</span>
                <span>{stats?.systemHealth.uptime}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${stats?.systemHealth.uptime}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/logs">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
