import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-utils';
import { successResponse, handleApiError, getClientIp, getUserAgent } from '@/lib/api-utils';
import { createAuditLog } from '@/services/logging-service';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const ip = getClientIp(req);

    if (user) {
      // Delete user's session
      const authToken = req.cookies.get('auth_token')?.value;
      if (authToken) {
        await prisma.session.deleteMany({
          where: { token: authToken },
        });
      }

      // Create audit log
      await createAuditLog({
        userId: user.userId,
        action: 'LOGOUT',
        ipAddress: ip,
        userAgent: getUserAgent(req),
      });
    }

    const response = successResponse(null, 'Logged out successfully');

    // Clear cookies
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
