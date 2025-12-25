import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, successResponse, handleApiError } from '@/lib/api-utils';
import { getLatestSystemHealth, getSystemHealthHistory } from '@/services/logging-service';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;

    const { searchParams } = new URL(req.url);
    const hours = parseInt(searchParams.get('hours') || '24');

    const [latestHealth, healthHistory, dbStats] = await Promise.all([
      getLatestSystemHealth(),
      getSystemHealthHistory(hours),
      getDbStats(),
    ]);

    return successResponse({
      current: latestHealth,
      history: healthHistory,
      database: dbStats,
      uptime: process.uptime(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

async function getDbStats() {
  const [
    totalUsers,
    activeUsers,
    totalTools,
    activeTools,
    totalRequests,
    pendingRequests,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.aITool.count(),
    prisma.aITool.count({ where: { status: 'ACTIVE' } }),
    prisma.aIRequest.count(),
    prisma.aIRequest.count({ where: { status: 'PENDING' } }),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalTools,
    activeTools,
    totalRequests,
    pendingRequests,
  };
}
