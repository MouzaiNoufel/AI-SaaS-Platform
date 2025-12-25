import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  requireAdmin, 
  validateBody, 
  successResponse, 
  createdResponse, 
  handleApiError, 
  getPaginationParams, 
  buildPaginationMeta,
  getClientIp,
  getUserAgent 
} from '@/lib/api-utils';
import { createToolSchema } from '@/lib/validations';
import { createAuditLog } from '@/services/logging-service';

// GET - List all tools (admin view)
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;

    const { page, limit, skip } = getPaginationParams(req);
    const { searchParams } = new URL(req.url);
    
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (status) where.status = status;

    const [tools, total] = await Promise.all([
      prisma.aITool.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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

// POST - Create new tool
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;

    const validation = await validateBody(req, createToolSchema);
    if ('error' in validation) return validation.error;

    const tool = await prisma.aITool.create({
      data: validation.data,
    });

    // Create audit log
    await createAuditLog({
      userId: authResult.user.userId,
      action: 'TOOL_CREATE',
      entityType: 'AITool',
      entityId: tool.id,
      details: { name: tool.name, slug: tool.slug },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return createdResponse(tool, 'Tool created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
