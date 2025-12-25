import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundResponse, handleApiError } from '@/lib/api-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const tool = await prisma.aITool.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        icon: true,
        category: true,
        status: true,
        inputSchema: true,
        outputSchema: true,
        defaultParams: true,
        maxTokens: true,
        creditCost: true,
        rateLimit: true,
        version: true,
        documentation: true,
        examples: true,
        tags: true,
        totalUsage: true,
        avgResponseTime: true,
        successRate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tool) {
      return notFoundResponse('Tool not found');
    }

    if (tool.status !== 'ACTIVE' && tool.status !== 'MAINTENANCE') {
      return notFoundResponse('Tool is not available');
    }

    return successResponse(tool);
  } catch (error) {
    return handleApiError(error);
  }
}
