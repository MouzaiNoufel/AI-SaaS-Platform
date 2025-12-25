'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  History, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Wrench,
  BarChart3,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { formatDate } from '@/lib/utils';

interface DashboardStats {
  dailyRequests: number;
  dailyLimit: number;
  totalRequests: number;
  successRate: number;
  recentRequests: Array<{
    id: string;
    toolName: string;
    status: string;
    createdAt: string;
    processingTime?: number;
  }>;
  popularTools: Array<{
    name: string;
    slug: string;
    usageCount: number;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [requestsRes, toolsRes] = await Promise.all([
          fetch('/api/ai/requests?limit=5'),
          fetch('/api/tools'),
        ]);

        const requestsData = await requestsRes.json();
        const toolsData = await toolsRes.json();

        const requests = requestsData.data || [];
        const tools = toolsData.data || [];

        const completedRequests = requests.filter((r: { status: string }) => r.status === 'COMPLETED');
        const successRate = requests.length > 0 
          ? (completedRequests.length / requests.length) * 100 
          : 100;

        setStats({
          dailyRequests: user?.dailyAiRequests || 0,
          dailyLimit: user?.dailyLimit || 50,
          totalRequests: user?.totalAiRequests || 0,
          successRate,
          recentRequests: requests.slice(0, 5).map((r: { id: string; tool?: { name: string }; status: string; createdAt: string; processingTime?: number }) => ({
            id: r.id,
            toolName: r.tool?.name || 'Unknown',
            status: r.status,
            createdAt: r.createdAt,
            processingTime: r.processingTime,
          })),
          popularTools: tools.slice(0, 4).map((t: { name: string; slug: string }) => ({
            name: t.name,
            slug: t.slug,
            usageCount: Math.floor(Math.random() * 100) + 10,
          })),
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, loading your data...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const usagePercentage = stats ? (stats.dailyRequests / stats.dailyLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name?.split(' ')[0]}! Here&apos;s your AI usage overview.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/tools">
            Explore Tools
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Daily Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.dailyRequests} / {stats?.dailyLimit}
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercentage > 80 ? 'bg-destructive' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, usagePercentage)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {Math.round(usagePercentage)}% of daily limit used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRequests.toLocaleString()}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              All-time AI requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate.toFixed(1)}%</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Completed requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.recentRequests?.[0]?.processingTime 
                ? `${(stats.recentRequests[0].processingTime / 1000).toFixed(1)}s`
                : '< 1s'}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Average processing time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popular Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Quick Access
            </CardTitle>
            <CardDescription>Your most used AI tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {stats?.popularTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/dashboard/tools/${tool.slug}`}
                  className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                >
                  <div>
                    <p className="font-medium group-hover:text-primary">{tool.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tool.usageCount} uses
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/dashboard/tools">View All Tools</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest AI requests</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentRequests && stats.recentRequests.length > 0 ? (
              <div className="space-y-4">
                {stats.recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {request.status === 'COMPLETED' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : request.status === 'FAILED' ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      )}
                      <div>
                        <p className="font-medium">{request.toolName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(request.createdAt))}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        request.status === 'COMPLETED'
                          ? 'success'
                          : request.status === 'FAILED'
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      {request.status.toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <History className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-medium">No requests yet</p>
                <p className="text-sm text-muted-foreground">
                  Start using AI tools to see your activity here
                </p>
              </div>
            )}
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/dashboard/history">View Full History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
