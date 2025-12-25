import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return errorResponse('Verification token is required', 400);
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      return errorResponse('Invalid or expired verification token', 400);
    }

    if (user.emailVerified) {
      return errorResponse('Email is already verified', 400);
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        status: 'ACTIVE',
      },
    });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    return successResponse(null, 'Email verified successfully! You can now log in.');
  } catch (error) {
    return handleApiError(error);
  }
}
