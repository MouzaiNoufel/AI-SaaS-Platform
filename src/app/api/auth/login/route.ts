import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateAuthTokens } from '@/lib/auth';
import { validateBody, successResponse, errorResponse, handleApiError, getClientIp, getUserAgent } from '@/lib/api-utils';
import { loginSchema } from '@/lib/validations';
import { checkAuthRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { createAuditLog } from '@/services/logging-service';
import { config } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    
    // Rate limit check
    const rateLimit = await checkAuthRateLimit(ip);
    if (!rateLimit.success) {
      return errorResponse('Too many login attempts. Please try again later.', 429);
    }

    // Validate request body
    const validation = await validateBody(req, loginSchema);
    if ('error' in validation) return validation.error;

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return errorResponse('Invalid email or password', 401);
    }

    // Check user status
    if (user.status === 'BANNED') {
      return errorResponse('Your account has been banned. Please contact support.', 403);
    }

    if (user.status === 'INACTIVE') {
      return errorResponse('Your account is inactive. Please contact support.', 403);
    }

    if (user.status === 'PENDING_VERIFICATION') {
      return errorResponse('Please verify your email address before logging in.', 403);
    }

    // Generate tokens
    const tokens = await generateAuthTokens(user.id, user.email, user.role);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        ipAddress: ip,
        userAgent: getUserAgent(req),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      ipAddress: ip,
      userAgent: getUserAgent(req),
    });

    const response = successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
    }, 'Login successful');

    // Set rate limit headers
    const headers = getRateLimitHeaders(rateLimit);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

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
