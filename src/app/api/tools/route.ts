import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, handleApiError, getPaginationParams, buildPaginationMeta } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { searchParams } = new URL(req.url);
    
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || 'ACTIVE';

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search.toLowerCase()] } },
      ];
    }

    const [tools, total] = await Promise.all([
      prisma.aITool.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          shortDescription: true,
          icon: true,
          category: true,
          status: true,
          creditCost: true,
          tags: true,
          totalUsage: true,
          avgResponseTime: true,
          createdAt: true,
        },
        orderBy: { totalUsage: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aITool.count({ where }),
    ]);

    return successResponse(
      tools,
      undefined,
      buildPaginationMeta(total, page, limit)
    );
  } catch (error) {
    return handleApiError(error);
  }
}
