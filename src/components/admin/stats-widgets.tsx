'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkline } from './charts';

// Animated Counter Hook
function useAnimatedCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(startValue + (end - startValue) * easeOutExpo));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'violet' | 'cyan' | 'green' | 'amber' | 'red' | 'blue';
  sparklineData?: number[];
}

export function StatsCard({
  title,
  value,
  previousValue,
  prefix = '',
  suffix = '',
  icon,
  trend,
  trendValue,
  color = 'violet',
  sparklineData,
}: StatsCardProps) {
  const animatedValue = useAnimatedCounter(value);

  const colorClasses = {
    violet: {
      bg: 'bg-violet-500/10',
      icon: 'text-violet-500',
      trend: 'text-violet-500',
      border: 'border-violet-500/20',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      icon: 'text-cyan-500',
      trend: 'text-cyan-500',
      border: 'border-cyan-500/20',
    },
    green: {
      bg: 'bg-green-500/10',
      icon: 'text-green-500',
      trend: 'text-green-500',
      border: 'border-green-500/20',
    },
    amber: {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-500',
      trend: 'text-amber-500',
      border: 'border-amber-500/20',
    },
    red: {
      bg: 'bg-red-500/10',
      icon: 'text-red-500',
      trend: 'text-red-500',
      border: 'border-red-500/20',
    },
    blue: {
      bg: 'bg-blue-500/10',
      icon: 'text-blue-500',
      trend: 'text-blue-500',
      border: 'border-blue-500/20',
    },
  };

  const colors = colorClasses[color];

  const calculateTrend = () => {
    if (trend) return trend;
    if (previousValue === undefined) return 'neutral';
    if (value > previousValue) return 'up';
    if (value < previousValue) return 'down';
    return 'neutral';
  };

  const calculatedTrend = calculateTrend();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border ${colors.border} p-6`}
    >
      {/* Background gradient decoration */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2`}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colors.bg}`}>
            <div className={colors.icon}>{icon}</div>
          </div>
          <AnimatePresence mode="wait">
            {trendValue && (
              <motion.div
                key={trendValue}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                  calculatedTrend === 'up'
                    ? 'bg-green-500/10 text-green-500'
                    : calculatedTrend === 'down'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-gray-500/10 text-gray-500'
                }`}
              >
                {calculatedTrend === 'up' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
                {calculatedTrend === 'down' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {trendValue}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {prefix}
              {animatedValue.toLocaleString()}
              {suffix}
            </span>
          </div>
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4">
            <Sparkline data={sparklineData} color={colors.icon.replace('text-', '')} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Large Stats Card with more detail
interface LargeStatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  details: Array<{ label: string; value: string | number }>;
}

export function LargeStatsCard({ title, value, subtitle, icon, color, gradient, details }: LargeStatsCardProps) {
  const animatedValue = useAnimatedCounter(value);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl p-6 ${gradient}`}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">{icon}</div>
          <div>
            <h3 className="text-lg font-medium text-white/80">{title}</h3>
            <p className="text-sm text-white/60">{subtitle}</p>
          </div>
        </div>

        <div className="mb-6">
          <motion.span
            key={animatedValue}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-5xl font-bold text-white"
          >
            {animatedValue.toLocaleString()}
          </motion.span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {details.map((detail, index) => (
            <motion.div
              key={detail.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3"
            >
              <p className="text-xs text-white/60">{detail.label}</p>
              <p className="text-lg font-semibold text-white">{detail.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Progress Ring Component
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#8b5cf6',
  backgroundColor = '#374151',
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (animatedProgress / 100) * circumference }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(progress)}%</span>
        {label && <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>}
        {sublabel && <span className="text-xs text-gray-400 dark:text-gray-500">{sublabel}</span>}
      </div>
    </div>
  );
}

// Live Activity Indicator
interface LiveActivityProps {
  activeUsers: number;
  trend: 'up' | 'down' | 'stable';
}

export function LiveActivityIndicator({ activeUsers, trend }: LiveActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="relative">
        <div className="w-3 h-3 bg-green-500 rounded-full" />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full"
        />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">{activeUsers}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">active now</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {trend === 'up' && <span className="text-green-500">↑ Increasing</span>}
          {trend === 'down' && <span className="text-red-500">↓ Decreasing</span>}
          {trend === 'stable' && <span className="text-gray-500">→ Stable</span>}
        </div>
      </div>
    </motion.div>
  );
}

// Quick Actions Grid
interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
  badge?: number;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="relative flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:border-violet-500 transition-colors"
        >
          {action.badge !== undefined && action.badge > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {action.badge > 99 ? '99+' : action.badge}
            </span>
          )}
          <div className={`p-3 rounded-xl ${action.color || 'bg-violet-500/10'}`}>
            <div className={action.color ? 'text-white' : 'text-violet-500'}>{action.icon}</div>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

// Metric Comparison Component
interface MetricComparisonProps {
  label: string;
  current: number;
  previous: number;
  format?: (value: number) => string;
}

export function MetricComparison({ label, current, previous, format = (v) => v.toLocaleString() }: MetricComparisonProps) {
  const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-gray-900 dark:text-white">{format(current)}</span>
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-center text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}
        >
          {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </motion.span>
      </div>
    </div>
  );
}

// Alert/Notification Card
interface AlertCardProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp?: string;
  onDismiss?: () => void;
}

export function AlertCard({ type, title, message, timestamp, onDismiss }: AlertCardProps) {
  const typeStyles = {
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: 'text-blue-500',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: 'text-amber-500',
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      icon: 'text-red-500',
    },
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      icon: 'text-green-500',
    },
  };

  const styles = typeStyles[type];

  const icons = {
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`${styles.bg} border ${styles.border} rounded-xl p-4`}
    >
      <div className="flex items-start gap-3">
        <div className={styles.icon}>{icons[type]}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
            {onDismiss && (
              <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{message}</p>
          {timestamp && <p className="text-xs text-gray-500 mt-2">{timestamp}</p>}
        </div>
      </div>
    </motion.div>
  );
}

// Top Items List
interface TopItem {
  rank: number;
  name: string;
  value: number | string;
  change?: number;
  avatar?: string;
  icon?: React.ReactNode;
}

interface TopItemsListProps {
  items: TopItem[];
  valueLabel?: string;
}

export function TopItemsList({ items, valueLabel = 'Value' }: TopItemsListProps) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <motion.div
          key={item.rank}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              item.rank === 1
                ? 'bg-amber-500 text-white'
                : item.rank === 2
                ? 'bg-gray-300 text-gray-700'
                : item.rank === 3
                ? 'bg-amber-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {item.rank}
          </div>
          {item.avatar && (
            <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
          )}
          {item.icon && <div className="text-gray-500 dark:text-gray-400">{item.icon}</div>}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900 dark:text-white">{item.value}</p>
            {item.change !== undefined && (
              <p className={`text-xs ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {item.change >= 0 ? '+' : ''}
                {item.change}%
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
