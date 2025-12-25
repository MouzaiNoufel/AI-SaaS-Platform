import { NextRequest } from 'next/server';
import { requireAdmin, successResponse, handleApiError } from '@/lib/api-utils';
import { getAnalyticsSummary, getUsageByTool, getDailyStats } from '@/services/analytics-service';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const [summary, toolUsage, dailyStats] = await Promise.all([
      getAnalyticsSummary(),
      getUsageByTool(),
      getDailyStats(days),
    ]);

    return successResponse({
      summary,
      toolUsage,
      dailyStats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
