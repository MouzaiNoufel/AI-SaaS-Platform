import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRefreshToken, generateAuthTokens } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError, getClientIp, getUserAgent } from '@/lib/api-utils';
import { config } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return errorResponse('Refresh token is required', 401);
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return errorResponse('Invalid or expired refresh token', 401);
    }

    // Check if session exists
    const session = await prisma.session.findFirst({
      where: { refreshToken, userId: payload.userId },
    });

    if (!session) {
      return errorResponse('Session not found', 401);
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status === 'BANNED' || user.status === 'INACTIVE') {
      // Delete invalid session
      await prisma.session.delete({ where: { id: session.id } });
      return errorResponse('Account is not active', 401);
    }

    // Generate new tokens
    const tokens = await generateAuthTokens(user.id, user.email, user.role);

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      },
    });

    const response = successResponse({
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
    }, 'Token refreshed successfully');

    // Set cookies
    response.cookies.set('auth_token', tokens.accessToken, {
      httpOnly: true,
      secure: config.app.isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: config.app.isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
