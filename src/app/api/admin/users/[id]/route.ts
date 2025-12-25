import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  requireAdmin, 
  validateBody, 
  successResponse, 
  notFoundResponse, 
  errorResponse,
  handleApiError, 
  getClientIp, 
  getUserAgent 
} from '@/lib/api-utils';
import { adminUpdateUserSchema } from '@/lib/validations';
import { createAuditLog } from '@/services/logging-service';

// GET - Get user details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;

    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: { aiRequests: true, sessions: true },
        },
      },
    });

    if (!user) {
      return notFoundResponse('User not found');
    }

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH - Update user
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;

    const validation = await validateBody(req, adminUpdateUserSchema);
    if ('error' in validation) return validation.error;

    const updates = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true, status: true },
    });

    if (!existingUser) {
      return notFoundResponse('User not found');
    }

    // Prevent self-demotion from admin
    if (
      params.id === authResult.user.userId &&
      updates.role &&
      updates.role !== 'ADMIN'
    ) {
      return errorResponse('Cannot remove your own admin privileges', 400);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        dailyLimit: true,
        updatedAt: true,
      },
    });

    // Create audit logs for important changes
    if (updates.status && updates.status !== existingUser.status) {
      await createAuditLog({
        userId: authResult.user.userId,
        action: updates.status === 'BANNED' ? 'USER_BAN' : 'USER_UNBAN',
        entityType: 'User',
        entityId: params.id,
        details: { previousStatus: existingUser.status, newStatus: updates.status },
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });
    }

    if (updates.role && updates.role !== existingUser.role) {
      await createAuditLog({
        userId: authResult.user.userId,
        action: 'ROLE_CHANGE',
        entityType: 'User',
        entityId: params.id,
        details: { previousRole: existingUser.role, newRole: updates.role },
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });
    }

    return successResponse(user, 'User updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;

    // Prevent self-deletion
    if (params.id === authResult.user.userId) {
      return errorResponse('Cannot delete your own account', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return notFoundResponse('User not found');
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return successResponse(null, 'User deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
