import { prisma } from '@/lib/prisma';
import { AuditAction, Prisma } from '@prisma/client';

// ============================================
// TYPES
// ============================================

interface AuditLogParams {
  userId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

interface SystemLogParams {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Prisma.InputJsonValue;
  source?: string;
}

// ============================================
// AUDIT LOG SERVICE
// ============================================

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(options: {
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { userId, action, startDate, endDate, page = 1, limit = 50 } = options;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================
// SYSTEM LOG SERVICE
// ============================================

export async function createSystemLog(params: SystemLogParams): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        level: params.level,
        message: params.message,
        context: params.context || {},
        source: params.source,
      },
    });
  } catch (error) {
    console.error('Failed to create system log:', error);
  }
}

export async function getSystemLogs(options: {
  level?: string;
  source?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { level, source, startDate, endDate, search, page = 1, limit = 100 } = options;

  const where: Record<string, unknown> = {};
  if (level) where.level = level;
  if (source) where.source = source;
  if (search) {
    where.message = { contains: search, mode: 'insensitive' };
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.systemLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================
// SYSTEM HEALTH SERVICE
// ============================================

export async function recordSystemHealth(): Promise<void> {
  try {
    // Get active users in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await prisma.session.count({
      where: {
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    // Get requests in last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentRequests = await prisma.aIRequest.findMany({
      where: { createdAt: { gte: oneMinuteAgo } },
      select: { processingTime: true, status: true },
    });

    const requestsPerMin = recentRequests.length;
    const avgResponseTime = requestsPerMin > 0
      ? recentRequests.reduce((sum, r) => sum + (r.processingTime || 0), 0) / requestsPerMin
      : 0;
    const failedRequests = recentRequests.filter(r => r.status === 'FAILED').length;
    const errorRate = requestsPerMin > 0 ? (failedRequests / requestsPerMin) * 100 : 0;

    await prisma.systemHealth.create({
      data: {
        activeUsers,
        requestsPerMin,
        avgResponseTime,
        errorRate,
        aiServiceStatus: 'healthy',
        dbStatus: 'healthy',
      },
    });
  } catch (error) {
    console.error('Failed to record system health:', error);
  }
}

export async function getLatestSystemHealth() {
  return prisma.systemHealth.findFirst({
    orderBy: { timestamp: 'desc' },
  });
}

export async function getSystemHealthHistory(hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return prisma.systemHealth.findMany({
    where: { timestamp: { gte: since } },
    orderBy: { timestamp: 'asc' },
  });
}

// ============================================
// CLEANUP SERVICE
// ============================================

export async function cleanupOldLogs(daysToKeep: number = 30): Promise<{ deleted: number }> {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const result = await prisma.systemLog.deleteMany({
    where: { createdAt: { lt: cutoffDate } },
  });

  await createSystemLog({
    level: 'info',
    message: `Cleaned up ${result.count} old system logs`,
    source: 'cleanup-service',
  });

  return { deleted: result.count };
}

export async function cleanupExpiredSessions(): Promise<{ deleted: number }> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return { deleted: result.count };
}

export async function cleanupOldHealthRecords(daysToKeep: number = 7): Promise<{ deleted: number }> {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const result = await prisma.systemHealth.deleteMany({
    where: { timestamp: { lt: cutoffDate } },
  });

  return { deleted: result.count };
}
