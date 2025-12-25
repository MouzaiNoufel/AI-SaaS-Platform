import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { 
  requireAuth, 
  validateBody, 
  successResponse, 
  createdResponse, 
  errorResponse, 
  notFoundResponse, 
  handleApiError, 
  getClientIp, 
  getUserAgent,
  getPaginationParams,
  buildPaginationMeta
} from '@/lib/api-utils';
import { aiRequestSchema } from '@/lib/validations';
import { checkAiRateLimit, checkUserDailyLimit } from '@/lib/rate-limit';
import { processAIRequest } from '@/services/ai-service';
import { createAuditLog } from '@/services/logging-service';

// GET - List user's AI requests
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ('error' in authResult) return authResult.error;

    const { page, limit, skip } = getPaginationParams(req);
    const { searchParams } = new URL(req.url);
    
    const toolId = searchParams.get('toolId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {
      userId: authResult.user.userId,
    };

    if (toolId) where.toolId = toolId;
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.aIRequest.findMany({
        where,
        select: {
          id: true,
          input: true,
          output: true,
          status: true,
          processingTime: true,
          tokenUsage: true,
          createdAt: true,
          completedAt: true,
          tool: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aIRequest.count({ where }),
    ]);

    return successResponse(
      requests,
      undefined,
      buildPaginationMeta(total, page, limit)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Create new AI request
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ('error' in authResult) return authResult.error;

    const { userId } = authResult.user;
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Validate request body
    const validation = await validateBody(req, aiRequestSchema);
    if ('error' in validation) return validation.error;

    const { toolId, input, parameters } = validation.data;

    // Check rate limit
    const rateLimit = await checkAiRateLimit(userId);
    if (!rateLimit.success) {
      return errorResponse(
        `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
        429
      );
    }

    // Get user for daily limit check
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dailyAiRequests: true, dailyLimit: true, lastRequestDate: true },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Reset daily count if new day
    const today = new Date().toDateString();
    const lastRequestDay = user.lastRequestDate?.toDateString();
    const currentDailyRequests = lastRequestDay === today ? user.dailyAiRequests : 0;

    // Check daily limit
    const dailyCheck = await checkUserDailyLimit(
      userId,
      currentDailyRequests,
      user.dailyLimit
    );

    if (!dailyCheck.allowed) {
      return errorResponse(
        `Daily limit reached (${user.dailyLimit} requests). Resets at midnight.`,
        429
      );
    }

    // Get tool
    const tool = await prisma.aITool.findUnique({
      where: { id: toolId },
    });

    if (!tool) {
      return notFoundResponse('AI tool not found');
    }

    if (tool.status !== 'ACTIVE') {
      return errorResponse('This tool is currently unavailable', 400);
    }

    // Create request record
    const aiRequest = await prisma.aIRequest.create({
      data: {
        userId,
        toolId,
        input,
        parameters: parameters || {},
        status: 'PROCESSING',
        ipAddress: ip,
        userAgent,
      },
    });

    // Process AI request
    const startTime = Date.now();
    const result = await processAIRequest({
      toolSlug: tool.slug,
      input: input as Record<string, unknown>,
      parameters: parameters as Record<string, unknown> | undefined,
    });

    // Update request with result
    const updatedRequest = await prisma.aIRequest.update({
      where: { id: aiRequest.id },
      data: {
        status: result.success ? 'COMPLETED' : 'FAILED',
        output: result.output as Prisma.InputJsonValue,
        error: result.error,
        processingTime: result.processingTime,
        tokenUsage: result.tokenUsage,
        completedAt: new Date(),
      },
      include: {
        tool: {
          select: { id: true, name: true, slug: true, icon: true },
        },
      },
    });

    // Update user's request count
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyAiRequests: lastRequestDay === today ? { increment: 1 } : 1,
        totalAiRequests: { increment: 1 },
        lastRequestDate: new Date(),
      },
    });

    // Update tool stats
    await prisma.aITool.update({
      where: { id: toolId },
      data: {
        totalUsage: { increment: 1 },
        avgResponseTime: {
          set: (tool.avgResponseTime * tool.totalUsage + result.processingTime) / (tool.totalUsage + 1),
        },
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'AI_REQUEST',
      entityType: 'AIRequest',
      entityId: aiRequest.id,
      details: {
        toolId,
        toolSlug: tool.slug,
        status: result.success ? 'COMPLETED' : 'FAILED',
        processingTime: result.processingTime,
      },
      ipAddress: ip,
      userAgent,
    });

    return createdResponse({
      id: updatedRequest.id,
      tool: {
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        icon: tool.icon,
      },
      input: updatedRequest.input,
      output: updatedRequest.output,
      status: updatedRequest.status,
      processingTime: updatedRequest.processingTime,
      tokenUsage: updatedRequest.tokenUsage,
      createdAt: updatedRequest.createdAt,
      completedAt: updatedRequest.completedAt,
      remainingRequests: dailyCheck.remaining - 1,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
