import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, successResponse, handleApiError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ('error' in authResult) return authResult.error;

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        bio: true,
        company: true,
        location: true,
        website: true,
        dailyAiRequests: true,
        totalAiRequests: true,
        dailyLimit: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return handleApiError(new Error('User not found'));
    }

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}
