import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateResetToken } from '@/lib/auth';
import { validateBody, successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { forgotPasswordSchema } from '@/lib/validations';
import { checkPasswordResetLimit } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const validation = await validateBody(req, forgotPasswordSchema);
    if ('error' in validation) return validation.error;

    const { email } = validation.data;

    // Rate limit check
    const rateLimit = await checkPasswordResetLimit(email);
    if (!rateLimit.success) {
      return errorResponse('Too many password reset requests. Please try again later.', 429);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return successResponse(null, 'If an account exists with this email, you will receive a password reset link.');
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Send email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    return successResponse(null, 'If an account exists with this email, you will receive a password reset link.');
  } catch (error) {
    return handleApiError(error);
  }
}
