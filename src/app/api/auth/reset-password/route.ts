import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { validateBody, successResponse, errorResponse, handleApiError, getClientIp, getUserAgent } from '@/lib/api-utils';
import { resetPasswordSchema } from '@/lib/validations';
import { sendPasswordChangedEmail } from '@/lib/email';
import { createAuditLog } from '@/services/logging-service';

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const validation = await validateBody(req, resetPasswordSchema);
    if ('error' in validation) return validation.error;

    const { token, password } = validation.data;

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return errorResponse('Invalid or expired reset token', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'PASSWORD_RESET',
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    // Send confirmation email
    await sendPasswordChangedEmail(user.email, user.name);

    return successResponse(null, 'Password has been reset successfully. You can now log in with your new password.');
  } catch (error) {
    return handleApiError(error);
  }
}
