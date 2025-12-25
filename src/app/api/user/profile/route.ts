import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { 
  requireAuth, 
  validateBody, 
  successResponse, 
  errorResponse, 
  handleApiError, 
  getClientIp, 
  getUserAgent 
} from '@/lib/api-utils';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validations';
import { createAuditLog } from '@/services/logging-service';
import { sendPasswordChangedEmail } from '@/lib/email';

// GET - Get user profile
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
        bio: true,
        company: true,
        location: true,
        website: true,
        role: true,
        status: true,
        dailyAiRequests: true,
        totalAiRequests: true,
        dailyLimit: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH - Update user profile
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ('error' in authResult) return authResult.error;

    const validation = await validateBody(req, updateProfileSchema);
    if ('error' in validation) return validation.error;

    const updates = validation.data;

    const user = await prisma.user.update({
      where: { id: authResult.user.userId },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        company: true,
        location: true,
        website: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: authResult.user.userId,
      action: 'PROFILE_UPDATE',
      details: { updatedFields: Object.keys(updates) },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return successResponse(user, 'Profile updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT - Change password
export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ('error' in authResult) return authResult.error;

    const validation = await validateBody(req, changePasswordSchema);
    if ('error' in validation) return validation.error;

    const { currentPassword, newPassword } = validation.data;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.userId },
      select: { id: true, email: true, name: true, password: true },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return errorResponse('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'PASSWORD_RESET',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    // Send notification email
    await sendPasswordChangedEmail(user.email, user.name);

    return successResponse(null, 'Password changed successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
