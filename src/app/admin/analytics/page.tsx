'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Zap,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardSkeleton } from '@/components/ui/skeleton';

interface AnalyticsData {
  date: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  uniqueUsers: number;
  totalTokens: number;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${period}`);
      const data = await res.json();
      setAnalytics(data.data || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const totals = analytics.reduce(
    (acc, day) => ({
      requests: acc.requests + day.totalRequests,
      successful: acc.successful + day.successfulRequests,
      failed: acc.failed + day.failedRequests,
      users: acc.users + day.uniqueUsers,
      tokens: acc.tokens + day.totalTokens,
    }),
    { requests: 0, successful: 0, failed: 0, users: 0, tokens: 0 }
  );

  const successRate = totals.requests > 0 
    ? ((totals.successful / totals.requests) * 100).toFixed(1) 
    : '100';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Platform usage and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.requests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                in the last {period} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{successRate}%</div>
              <p className="text-xs text-muted-foreground">
                {totals.successful.toLocaleString()} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.users.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                unique users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.tokens.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                total tokens consumed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Requests Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Requests</CardTitle>
            <CardDescription>Request volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-24">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (day.totalRequests / Math.max(...analytics.map(a => a.totalRequests), 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">{day.totalRequests}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success/Failure Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Success vs Failures</CardTitle>
            <CardDescription>Request outcomes over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.slice(-7).map((day) => {
                  const total = day.successfulRequests + day.failedRequests || 1;
                  return (
                    <div key={day.date} className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-24">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${(day.successfulRequests / total) * 100}%` }}
                        />
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${(day.failedRequests / total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {((day.successfulRequests / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
                <div className="flex gap-4 justify-center mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-sm">Success</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <span className="text-sm">Failed</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
          <CardDescription>Detailed metrics for each day</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-32 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Requests</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Successful</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Failed</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Users</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Tokens</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.map((day) => (
                    <tr key={day.date} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{day.totalRequests}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-500">{day.successfulRequests}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-500">{day.failedRequests}</td>
                      <td className="px-4 py-3 text-sm text-right">{day.uniqueUsers}</td>
                      <td className="px-4 py-3 text-sm text-right">{day.totalTokens.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
