'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from 'recharts';
import { motion } from 'framer-motion';

// Color palette for charts
const COLORS = {
  primary: '#8b5cf6',
  secondary: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
};

const GRADIENT_COLORS = [
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart Card Wrapper
interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function ChartCard({ title, subtitle, children, action }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

// Revenue Line Chart
interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    target?: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={COLORS.primary}
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorRevenue)"
          name="Revenue"
        />
        {data[0]?.target !== undefined && (
          <Area
            type="monotone"
            dataKey="target"
            stroke={COLORS.success}
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1}
            fill="url(#colorTarget)"
            name="Target"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// User Growth Chart
interface UserGrowthChartProps {
  data: Array<{
    month: string;
    users: number;
    newUsers: number;
  }>;
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="newUsers" name="New Users" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
        <Line
          type="monotone"
          dataKey="users"
          name="Total Users"
          stroke={COLORS.primary}
          strokeWidth={3}
          dot={{ fill: COLORS.primary, strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Tool Usage Bar Chart
interface ToolUsageChartProps {
  data: Array<{
    name: string;
    usage: number;
    color?: string;
  }>;
}

export function ToolUsageChart({ data }: ToolUsageChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis type="number" stroke="#6b7280" fontSize={12} />
        <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={90} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="usage" name="Usage Count" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || GRADIENT_COLORS[index % GRADIENT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Subscription Distribution Pie Chart
interface SubscriptionChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
}

export function SubscriptionChart({ data }: SubscriptionChartProps) {
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={120}
          innerRadius={60}
          fill="#8884d8"
          dataKey="value"
          animationBegin={0}
          animationDuration={1500}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || GRADIENT_COLORS[index % GRADIENT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Request Status Radial Chart
interface RequestStatusChartProps {
  data: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
}

export function RequestStatusChart({ data }: RequestStatusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="30%"
        outerRadius="100%"
        barSize={20}
        data={data}
        startAngle={180}
        endAngle={-180}
      >
        <RadialBar
          label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
          background={{ fill: '#1f2937' }}
          dataKey="value"
          animationBegin={0}
          animationDuration={1500}
        />
        <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
        <Tooltip content={<CustomTooltip />} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

// Daily Activity Chart
interface DailyActivityChartProps {
  data: Array<{
    hour: string;
    requests: number;
    users: number;
  }>;
}

export function DailyActivityChart({ data }: DailyActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="requests"
          name="AI Requests"
          stroke={COLORS.primary}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="users"
          name="Active Users"
          stroke={COLORS.secondary}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Mini Sparkline Chart
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = COLORS.primary, height = 40 }: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Comparison Bar Chart
interface ComparisonChartProps {
  data: Array<{
    category: string;
    current: number;
    previous: number;
  }>;
}

export function ComparisonChart({ data }: ComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis dataKey="category" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="current" name="This Period" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
        <Bar dataKey="previous" name="Last Period" fill="#6b7280" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Heatmap-style Activity Grid
interface ActivityGridProps {
  data: Array<{
    day: string;
    hours: number[];
  }>;
}

export function ActivityGrid({ data }: ActivityGridProps) {
  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-800';
    if (value < 25) return 'bg-violet-900/40';
    if (value < 50) return 'bg-violet-700/60';
    if (value < 75) return 'bg-violet-500/80';
    return 'bg-violet-400';
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-1 min-w-[600px]">
        {/* Hour labels */}
        <div className="flex gap-1">
          <div className="w-12 shrink-0" />
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="flex-1 text-center text-xs text-gray-500">
              {i}
            </div>
          ))}
        </div>
        {/* Data rows */}
        {data.map((row) => (
          <div key={row.day} className="flex gap-1">
            <div className="w-12 shrink-0 text-xs text-gray-500 flex items-center">{row.day}</div>
            {row.hours.map((value, hourIndex) => (
              <motion.div
                key={hourIndex}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: hourIndex * 0.02, duration: 0.2 }}
                className={`flex-1 h-6 rounded ${getColor(value)} transition-colors`}
                title={`${row.day} ${hourIndex}:00 - ${value} requests`}
              />
            ))}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-2">
          <span className="text-xs text-gray-500">Less</span>
          {['bg-gray-800', 'bg-violet-900/40', 'bg-violet-700/60', 'bg-violet-500/80', 'bg-violet-400'].map(
            (color, i) => (
              <div key={i} className={`w-4 h-4 rounded ${color}`} />
            )
          )}
          <span className="text-xs text-gray-500">More</span>
        </div>
      </div>
    </div>
  );
}

// Geographic Distribution Chart (simplified world map representation)
interface GeoChartProps {
  data: Array<{
    country: string;
    users: number;
    percentage: number;
  }>;
}

export function GeoDistributionChart({ data }: GeoChartProps) {
  const maxUsers = Math.max(...data.map((d) => d.users));

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <motion.div
          key={item.country}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-4"
        >
          <div className="w-24 text-sm text-gray-600 dark:text-gray-400">{item.country}</div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.users / maxUsers) * 100}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${GRADIENT_COLORS[index % GRADIENT_COLORS.length]}, ${
                    GRADIENT_COLORS[(index + 1) % GRADIENT_COLORS.length]
                  })`,
                }}
              />
            </div>
          </div>
          <div className="w-20 text-right">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{item.users.toLocaleString()}</span>
            <span className="text-xs text-gray-500 ml-1">({item.percentage}%)</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export { COLORS, GRADIENT_COLORS };
