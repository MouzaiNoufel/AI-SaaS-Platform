'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Zap,
  DollarSign,
  TrendingUp,
  BarChart3,
  Activity,
  Globe,
  Clock,
  RefreshCw,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Server,
  CreditCard,
} from 'lucide-react';

import {
  ChartCard,
  RevenueChart,
  UserGrowthChart,
  ToolUsageChart,
  SubscriptionChart,
  RequestStatusChart,
  DailyActivityChart,
  ActivityGrid,
  GeoDistributionChart,
  ComparisonChart,
} from '@/components/admin/charts';

import {
  StatsCard,
  LargeStatsCard,
  ProgressRing,
  LiveActivityIndicator,
  QuickActions,
  TopItemsList,
  AlertCard,
} from '@/components/admin/stats-widgets';

type TimeRange = '7d' | '30d' | '90d' | '12m';

// Mock data generator for demo
function generateMockData(period: TimeRange) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  
  // Revenue data
  const revenueData = Array.from({ length: Math.min(days, 30) }, (_, i) => ({
    date: new Date(Date.now() - (Math.min(days, 30) - 1 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: Math.floor(Math.random() * 5000) + 2000,
    target: 4000,
  }));

  // User growth data
  const userGrowthData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
    users: Math.floor(Math.random() * 500) + 800 + i * 100,
    newUsers: Math.floor(Math.random() * 100) + 50,
  }));

  // Tool usage data
  const toolUsageData = [
    { name: 'AI Writer', usage: 4520, color: '#8b5cf6' },
    { name: 'Code Generator', usage: 3890, color: '#06b6d4' },
    { name: 'Image Creator', usage: 3100, color: '#10b981' },
    { name: 'Translator', usage: 2450, color: '#f59e0b' },
    { name: 'Summarizer', usage: 1980, color: '#ef4444' },
    { name: 'Chatbot', usage: 1540, color: '#3b82f6' },
  ];

  // Subscription data
  const subscriptionData = [
    { name: 'Free', value: 2500, color: '#6b7280' },
    { name: 'Pro', value: 1200, color: '#8b5cf6' },
    { name: 'Enterprise', value: 350, color: '#10b981' },
  ];

  // Request status data
  const requestStatusData = [
    { name: 'Completed', value: 85, fill: '#10b981' },
    { name: 'Processing', value: 8, fill: '#f59e0b' },
    { name: 'Failed', value: 7, fill: '#ef4444' },
  ];

  // Daily activity data
  const dailyActivityData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    requests: Math.floor(Math.random() * 200) + 50,
    users: Math.floor(Math.random() * 50) + 10,
  }));

  // Weekly heatmap data
  const heatmapData = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => ({
    day,
    hours: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100)),
  }));

  // Geographic data
  const geoData = [
    { country: 'United States', users: 3250, percentage: 35 },
    { country: 'United Kingdom', users: 1120, percentage: 12 },
    { country: 'Germany', users: 980, percentage: 11 },
    { country: 'France', users: 810, percentage: 9 },
    { country: 'Canada', users: 680, percentage: 7 },
    { country: 'Australia', users: 520, percentage: 6 },
    { country: 'India', users: 490, percentage: 5 },
    { country: 'Japan', users: 350, percentage: 4 },
  ];

  // Comparison data
  const comparisonData = [
    { category: 'Users', current: 4850, previous: 4200 },
    { category: 'Revenue', current: 72500, previous: 65000 },
    { category: 'Requests', current: 125000, previous: 98000 },
    { category: 'Avg Response', current: 1.2, previous: 1.5 },
  ];

  // Top users
  const topUsers = [
    { rank: 1, name: 'Sarah Johnson', value: '2,456 requests', avatar: 'https://i.pravatar.cc/100?img=1', change: 12 },
    { rank: 2, name: 'Michael Chen', value: '2,102 requests', avatar: 'https://i.pravatar.cc/100?img=2', change: 8 },
    { rank: 3, name: 'Emily Davis', value: '1,890 requests', avatar: 'https://i.pravatar.cc/100?img=3', change: -3 },
    { rank: 4, name: 'James Wilson', value: '1,654 requests', avatar: 'https://i.pravatar.cc/100?img=4', change: 15 },
    { rank: 5, name: 'Lisa Anderson', value: '1,432 requests', avatar: 'https://i.pravatar.cc/100?img=5', change: 5 },
  ];

  return {
    revenueData,
    userGrowthData,
    toolUsageData,
    subscriptionData,
    requestStatusData,
    dailyActivityData,
    heatmapData,
    geoData,
    comparisonData,
    topUsers,
    stats: {
      totalUsers: 9250 + Math.floor(Math.random() * 100),
      newUsers: 342 + Math.floor(Math.random() * 50),
      userGrowth: 12.5,
      totalRevenue: 72500 + Math.floor(Math.random() * 1000),
      revenueGrowth: 8.3,
      totalRequests: 125890 + Math.floor(Math.random() * 1000),
      requestGrowth: 15.2,
      activeSubscriptions: 1550 + Math.floor(Math.random() * 50),
      avgResponseTime: 1.24,
      successRate: 94.5,
      activeTools: 8,
      activeNow: 127 + Math.floor(Math.random() * 20),
    },
  };
}

export default function EnhancedAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ReturnType<typeof generateMockData> | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'revenue' | 'tools'>('overview');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setData(generateMockData(timeRange));
    setIsLoading(false);
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '12m', label: 'Last 12 months' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'tools', label: 'Tools', icon: Sparkles },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-violet-500" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Monitor your platform's performance and growth metrics
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Activity Indicator */}
            {data && (
              <LiveActivityIndicator activeUsers={data.stats.activeNow} trend="up" />
            )}

            {/* Time Range Selector */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-1.5 shadow-sm border border-gray-200 dark:border-gray-700">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range.value
                      ? 'bg-violet-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchData}
              disabled={isLoading}
              className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-violet-500 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>

            {/* Export Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-3 bg-violet-500 text-white rounded-xl shadow-lg hover:bg-violet-600 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Export</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-violet-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Loading State */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              ))}
            </motion.div>
          ) : data ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                      title="Total Users"
                      value={data.stats.totalUsers}
                      icon={<Users className="w-6 h-6" />}
                      trend="up"
                      trendValue="+12.5%"
                      color="violet"
                      sparklineData={[65, 72, 78, 85, 89, 94, 98, 102, 110, 115]}
                    />
                    <StatsCard
                      title="Total Revenue"
                      value={data.stats.totalRevenue}
                      prefix="$"
                      icon={<DollarSign className="w-6 h-6" />}
                      trend="up"
                      trendValue="+8.3%"
                      color="green"
                      sparklineData={[4500, 5200, 4800, 5500, 6200, 5800, 6500, 7000, 6800, 7250]}
                    />
                    <StatsCard
                      title="AI Requests"
                      value={data.stats.totalRequests}
                      icon={<Zap className="w-6 h-6" />}
                      trend="up"
                      trendValue="+15.2%"
                      color="cyan"
                      sparklineData={[8500, 9200, 10100, 11500, 10800, 12000, 11200, 12500, 13000, 12589]}
                    />
                    <StatsCard
                      title="Subscriptions"
                      value={data.stats.activeSubscriptions}
                      icon={<CreditCard className="w-6 h-6" />}
                      trend="up"
                      trendValue="+5.8%"
                      color="amber"
                      sparklineData={[120, 135, 142, 150, 148, 155, 162, 158, 165, 155]}
                    />
                  </div>

                  {/* Large Feature Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <LargeStatsCard
                      title="Success Rate"
                      value={Math.round(data.stats.successRate)}
                      subtitle="Request completion rate"
                      icon={<Activity className="w-8 h-8 text-white" />}
                      color="emerald"
                      gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                      details={[
                        { label: 'Completed', value: '118,590' },
                        { label: 'Failed', value: '6,900' },
                        { label: 'Pending', value: '400' },
                        { label: 'Avg Time', value: '1.24s' },
                      ]}
                    />
                    <LargeStatsCard
                      title="Active Tools"
                      value={data.stats.activeTools}
                      subtitle="AI tools in production"
                      icon={<Sparkles className="w-8 h-8 text-white" />}
                      color="violet"
                      gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                      details={[
                        { label: 'Most Popular', value: 'AI Writer' },
                        { label: 'Fastest', value: 'Translator' },
                        { label: 'New', value: '2 tools' },
                        { label: 'Coming Soon', value: '3 tools' },
                      ]}
                    />
                  </div>

                  {/* Charts Row 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Revenue Overview" subtitle="Daily revenue vs target">
                      <RevenueChart data={data.revenueData} />
                    </ChartCard>
                    <ChartCard title="User Growth" subtitle="Monthly user acquisition">
                      <UserGrowthChart data={data.userGrowthData} />
                    </ChartCard>
                  </div>

                  {/* Charts Row 2 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartCard title="Tool Usage" subtitle="Requests per AI tool">
                      <ToolUsageChart data={data.toolUsageData} />
                    </ChartCard>
                    <ChartCard title="Subscription Plans" subtitle="User distribution by plan">
                      <SubscriptionChart data={data.subscriptionData} />
                    </ChartCard>
                    <ChartCard title="Request Status" subtitle="Success vs failure rate">
                      <RequestStatusChart data={data.requestStatusData} />
                    </ChartCard>
                  </div>

                  {/* Activity Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Daily Activity" subtitle="Requests and users by hour">
                      <DailyActivityChart data={data.dailyActivityData} />
                    </ChartCard>
                    <ChartCard title="Activity Heatmap" subtitle="Weekly usage patterns">
                      <ActivityGrid data={data.heatmapData} />
                    </ChartCard>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                      title="Total Users"
                      value={data.stats.totalUsers}
                      icon={<Users className="w-6 h-6" />}
                      trend="up"
                      trendValue="+12.5%"
                      color="violet"
                    />
                    <StatsCard
                      title="New Users"
                      value={data.stats.newUsers}
                      icon={<TrendingUp className="w-6 h-6" />}
                      trend="up"
                      trendValue="+8.2%"
                      color="green"
                    />
                    <StatsCard
                      title="Active Now"
                      value={data.stats.activeNow}
                      icon={<Activity className="w-6 h-6" />}
                      trend="up"
                      trendValue="+3%"
                      color="cyan"
                    />
                    <StatsCard
                      title="Pro Users"
                      value={1200}
                      icon={<Sparkles className="w-6 h-6" />}
                      trend="up"
                      trendValue="+15%"
                      color="amber"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="User Growth Over Time" subtitle="Total vs new users">
                      <UserGrowthChart data={data.userGrowthData} />
                    </ChartCard>
                    <ChartCard title="Geographic Distribution" subtitle="Users by country">
                      <GeoDistributionChart data={data.geoData} />
                    </ChartCard>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartCard title="Subscription Distribution" subtitle="Users by plan">
                      <SubscriptionChart data={data.subscriptionData} />
                    </ChartCard>
                    <div className="lg:col-span-2">
                      <ChartCard title="Top Users" subtitle="Most active platform users">
                        <TopItemsList items={data.topUsers} valueLabel="Requests" />
                      </ChartCard>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Tab */}
              {activeTab === 'revenue' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                      title="Total Revenue"
                      value={data.stats.totalRevenue}
                      prefix="$"
                      icon={<DollarSign className="w-6 h-6" />}
                      trend="up"
                      trendValue="+8.3%"
                      color="green"
                    />
                    <StatsCard
                      title="MRR"
                      value={45200}
                      prefix="$"
                      icon={<TrendingUp className="w-6 h-6" />}
                      trend="up"
                      trendValue="+12%"
                      color="violet"
                    />
                    <StatsCard
                      title="Avg Order Value"
                      value={89}
                      prefix="$"
                      icon={<CreditCard className="w-6 h-6" />}
                      trend="up"
                      trendValue="+5%"
                      color="cyan"
                    />
                    <StatsCard
                      title="Churn Rate"
                      value={2.4}
                      suffix="%"
                      icon={<ArrowDownRight className="w-6 h-6" />}
                      trend="down"
                      trendValue="-0.3%"
                      color="amber"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Revenue Over Time" subtitle="Daily revenue tracking">
                      <RevenueChart data={data.revenueData} />
                    </ChartCard>
                    <ChartCard title="Period Comparison" subtitle="This period vs last period">
                      <ComparisonChart data={data.comparisonData} />
                    </ChartCard>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartCard title="Revenue by Plan" subtitle="Income per subscription tier">
                      <SubscriptionChart
                        data={[
                          { name: 'Pro Monthly', value: 28500, color: '#8b5cf6' },
                          { name: 'Pro Annual', value: 18200, color: '#06b6d4' },
                          { name: 'Enterprise', value: 25800, color: '#10b981' },
                        ]}
                      />
                    </ChartCard>
                    <div className="lg:col-span-2">
                      <ChartCard title="Revenue Metrics" subtitle="Key financial indicators">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <ProgressRing progress={78} color="#8b5cf6" label="Target" />
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Revenue Goal</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <ProgressRing progress={92} color="#10b981" label="Collected" />
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Payment Rate</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <ProgressRing progress={65} color="#f59e0b" label="Upsell" />
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Upgrade Rate</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <ProgressRing progress={88} color="#06b6d4" label="Retention" />
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Customer Retention</p>
                          </div>
                        </div>
                      </ChartCard>
                    </div>
                  </div>
                </div>
              )}

              {/* Tools Tab */}
              {activeTab === 'tools' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                      title="Active Tools"
                      value={data.stats.activeTools}
                      icon={<Sparkles className="w-6 h-6" />}
                      color="violet"
                    />
                    <StatsCard
                      title="Total Requests"
                      value={data.stats.totalRequests}
                      icon={<Zap className="w-6 h-6" />}
                      trend="up"
                      trendValue="+15.2%"
                      color="cyan"
                    />
                    <StatsCard
                      title="Avg Response Time"
                      value={1.24}
                      suffix="s"
                      icon={<Clock className="w-6 h-6" />}
                      trend="down"
                      trendValue="-8%"
                      color="green"
                    />
                    <StatsCard
                      title="Success Rate"
                      value={Math.round(data.stats.successRate)}
                      suffix="%"
                      icon={<Activity className="w-6 h-6" />}
                      trend="up"
                      trendValue="+2.1%"
                      color="amber"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Tool Usage Ranking" subtitle="Requests per tool">
                      <ToolUsageChart data={data.toolUsageData} />
                    </ChartCard>
                    <ChartCard title="Request Status" subtitle="Completion rates">
                      <RequestStatusChart data={data.requestStatusData} />
                    </ChartCard>
                  </div>

                  <ChartCard title="24-Hour Activity" subtitle="Request volume by hour">
                    <DailyActivityChart data={data.dailyActivityData} />
                  </ChartCard>

                  <ChartCard title="Weekly Usage Patterns" subtitle="Activity heatmap">
                    <ActivityGrid data={data.heatmapData} />
                  </ChartCard>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
