import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, successResponse, handleApiError, getPaginationParams, buildPaginationMeta } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;

    const { page, limit, skip } = getPaginationParams(req);
    const { searchParams } = new URL(req.url);
    
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          status: true,
          emailVerified: true,
          dailyAiRequests: true,
          totalAiRequests: true,
          dailyLimit: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: { aiRequests: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse(
      users,
      undefined,
      buildPaginationMeta(total, page, limit)
    );
  } catch (error) {
    return handleApiError(error);
  }
}
