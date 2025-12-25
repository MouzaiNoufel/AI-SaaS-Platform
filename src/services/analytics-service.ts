import { prisma } from '@/lib/prisma';

// ============================================
// TYPES
// ============================================

export interface AnalyticsSummary {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalRequests: number;
  requestsToday: number;
  successRate: number;
  avgResponseTime: number;
  topTools: Array<{ name: string; count: number }>;
}

export interface UsageByTool {
  toolId: string;
  toolName: string;
  count: number;
  successRate: number;
  avgTime: number;
}

export interface DailyStats {
  date: string;
  requests: number;
  users: number;
  newUsers: number;
  avgResponseTime: number;
}

// ============================================
// ANALYTICS SERVICE
// ============================================

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    totalRequests,
    requestsToday,
    successfulRequests,
    avgResponseTimeResult,
    topToolsResult,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),
    
    // Active users (logged in within 30 days)
    prisma.user.count({
      where: { lastLoginAt: { gte: thirtyDaysAgo } },
    }),
    
    // New users today
    prisma.user.count({
      where: { createdAt: { gte: today } },
    }),
    
    // Total AI requests
    prisma.aIRequest.count(),
    
    // Requests today
    prisma.aIRequest.count({
      where: { createdAt: { gte: today } },
    }),
    
    // Successful requests (for success rate)
    prisma.aIRequest.count({
      where: { status: 'COMPLETED' },
    }),
    
    // Average response time
    prisma.aIRequest.aggregate({
      _avg: { processingTime: true },
      where: { status: 'COMPLETED' },
    }),
    
    // Top tools
    prisma.aIRequest.groupBy({
      by: ['toolId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  // Get tool names for top tools
  const toolIds = topToolsResult.map((t) => t.toolId);
  const tools = await prisma.aITool.findMany({
    where: { id: { in: toolIds } },
    select: { id: true, name: true },
  });
  const toolMap = new Map(tools.map((t) => [t.id, t.name]));

  const topTools = topToolsResult.map((t) => ({
    name: toolMap.get(t.toolId) || 'Unknown',
    count: t._count.id,
  }));

  return {
    totalUsers,
    activeUsers,
    newUsersToday,
    totalRequests,
    requestsToday,
    successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    avgResponseTime: avgResponseTimeResult._avg.processingTime || 0,
    topTools,
  };
}

export async function getUsageByTool(): Promise<UsageByTool[]> {
  const tools = await prisma.aITool.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { aiRequests: true } },
    },
  });

  const usageData: UsageByTool[] = [];

  for (const tool of tools) {
    const [stats, successCount] = await Promise.all([
      prisma.aIRequest.aggregate({
        _avg: { processingTime: true },
        where: { toolId: tool.id },
      }),
      prisma.aIRequest.count({
        where: { toolId: tool.id, status: 'COMPLETED' },
      }),
    ]);

    usageData.push({
      toolId: tool.id,
      toolName: tool.name,
      count: tool._count.aiRequests,
      successRate: tool._count.aiRequests > 0 
        ? (successCount / tool._count.aiRequests) * 100 
        : 0,
      avgTime: stats._avg.processingTime || 0,
    });
  }

  return usageData.sort((a, b) => b.count - a.count);
}

export async function getDailyStats(days: number = 30): Promise<DailyStats[]> {
  const stats: DailyStats[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const [requests, avgTime, activeUsers, newUsers] = await Promise.all([
      prisma.aIRequest.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
        },
      }),
      prisma.aIRequest.aggregate({
        _avg: { processingTime: true },
        where: {
          createdAt: { gte: date, lt: nextDate },
          status: 'COMPLETED',
        },
      }),
      prisma.aIRequest.findMany({
        where: { createdAt: { gte: date, lt: nextDate } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.user.count({
        where: { createdAt: { gte: date, lt: nextDate } },
      }),
    ]);

    stats.push({
      date: date.toISOString().split('T')[0],
      requests,
      users: activeUsers.length,
      newUsers,
      avgResponseTime: avgTime._avg.processingTime || 0,
    });
  }

  return stats;
}

export async function getUserStats(userId: string) {
  const [totalRequests, successfulRequests, avgTime, recentRequests] = await Promise.all([
    prisma.aIRequest.count({ where: { userId } }),
    prisma.aIRequest.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.aIRequest.aggregate({
      _avg: { processingTime: true },
      where: { userId, status: 'COMPLETED' },
    }),
    prisma.aIRequest.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        tool: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  // Usage by tool
  const toolUsage = await prisma.aIRequest.groupBy({
    by: ['toolId'],
    _count: { id: true },
    where: { userId },
    orderBy: { _count: { id: 'desc' } },
  });

  const toolIds = toolUsage.map((t) => t.toolId);
  const tools = await prisma.aITool.findMany({
    where: { id: { in: toolIds } },
    select: { id: true, name: true },
  });
  const toolMap = new Map(tools.map((t) => [t.id, t.name]));

  return {
    totalRequests,
    successfulRequests,
    successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    avgResponseTime: avgTime._avg.processingTime || 0,
    recentRequests,
    toolUsage: toolUsage.map((t) => ({
      toolName: toolMap.get(t.toolId) || 'Unknown',
      count: t._count.id,
    })),
  };
}

export async function updateDailyAnalytics(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    newUsers,
    activeUserIds,
    totalRequests,
    successfulRequests,
    failedRequests,
    avgTimeResult,
  ] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.aIRequest.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.aIRequest.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.aIRequest.count({
      where: { createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
    }),
    prisma.aIRequest.count({
      where: { createdAt: { gte: today, lt: tomorrow }, status: 'FAILED' },
    }),
    prisma.aIRequest.aggregate({
      _avg: { processingTime: true },
      where: { createdAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
    }),
  ]);

  // Tool usage breakdown
  const toolUsage = await prisma.aIRequest.groupBy({
    by: ['toolId'],
    _count: { id: true },
    where: { createdAt: { gte: today, lt: tomorrow } },
  });

  const toolUsageMap = Object.fromEntries(
    toolUsage.map((t) => [t.toolId, t._count.id])
  );

  await prisma.dailyAnalytics.upsert({
    where: { date: today },
    update: {
      newUsers,
      activeUsers: activeUserIds.length,
      totalRequests,
      successfulReqs: successfulRequests,
      failedRequests,
      avgResponseTime: avgTimeResult._avg.processingTime || 0,
      toolUsage: toolUsageMap,
    },
    create: {
      date: today,
      newUsers,
      activeUsers: activeUserIds.length,
      totalRequests,
      successfulReqs: successfulRequests,
      failedRequests,
      avgResponseTime: avgTimeResult._avg.processingTime || 0,
      toolUsage: toolUsageMap,
    },
  });
}
