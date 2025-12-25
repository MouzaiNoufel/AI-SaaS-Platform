import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, successResponse, handleApiError, getPaginationParams, buildPaginationMeta } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ('error' in authResult) return authResult.error;

    const { page, limit, skip } = getPaginationParams(req);
    const { searchParams } = new URL(req.url);
    
    const read = searchParams.get('read');

    const where: Record<string, unknown> = {
      userId: authResult.user.userId,
    };

    if (read === 'true') where.read = true;
    if (read === 'false') where.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: authResult.user.userId, read: false },
      }),
    ]);

    return successResponse(
      { notifications, unreadCount },
      undefined,
      buildPaginationMeta(total, page, limit)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ('error' in authResult) return authResult.error;

    const { ids, markAll } = await req.json();

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: authResult.user.userId, read: false },
        data: { read: true },
      });
    } else if (ids && Array.isArray(ids)) {
      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId: authResult.user.userId,
        },
        data: { read: true },
      });
    }

    return successResponse(null, 'Notifications marked as read');
  } catch (error) {
    return handleApiError(error);
  }
}
