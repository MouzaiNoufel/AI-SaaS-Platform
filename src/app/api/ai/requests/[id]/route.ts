import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, successResponse, notFoundResponse, handleApiError } from '@/lib/api-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(req);
    if ('error' in authResult) return authResult.error;

    const request = await prisma.aIRequest.findUnique({
      where: { id: params.id },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            category: true,
          },
        },
      },
    });

    if (!request) {
      return notFoundResponse('Request not found');
    }

    // Check ownership (unless admin)
    if (request.userId !== authResult.user.userId && authResult.user.role !== 'ADMIN') {
      return notFoundResponse('Request not found');
    }

    return successResponse(request);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(req);
    if ('error' in authResult) return authResult.error;

    const request = await prisma.aIRequest.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!request) {
      return notFoundResponse('Request not found');
    }

    // Check ownership (unless admin)
    if (request.userId !== authResult.user.userId && authResult.user.role !== 'ADMIN') {
      return notFoundResponse('Request not found');
    }

    await prisma.aIRequest.delete({
      where: { id: params.id },
    });

    return successResponse(null, 'Request deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
