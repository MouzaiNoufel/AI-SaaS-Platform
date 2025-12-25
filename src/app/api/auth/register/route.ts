import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateAuthTokens, generateVerificationToken } from '@/lib/auth';
import { validateBody, createdResponse, errorResponse, handleApiError, getClientIp, getUserAgent } from '@/lib/api-utils';
import { registerSchema } from '@/lib/validations';
import { checkAuthRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email';
import { createAuditLog } from '@/services/logging-service';
import { config } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    
    // Rate limit check
    const rateLimit = await checkAuthRateLimit(ip);
    if (!rateLimit.success) {
      return errorResponse('Too many registration attempts. Please try again later.', 429);
    }

    // Validate request body
    const validation = await validateBody(req, registerSchema);
    if ('error' in validation) return validation.error;

    const { name, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse('An account with this email already exists', 409);
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const emailVerifyToken = generateVerificationToken();

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        emailVerifyToken,
        status: config.features.emailVerification ? 'PENDING_VERIFICATION' : 'ACTIVE',
        emailVerified: !config.features.emailVerification,
        dailyLimit: config.userLimits.defaultDaily,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'REGISTER',
      details: { email: user.email },
      ipAddress: ip,
      userAgent: getUserAgent(req),
    });

    // Send verification email
    if (config.features.emailVerification) {
      await sendVerificationEmail(email, name, emailVerifyToken);
    }

    // Generate tokens if email verification is disabled
    let tokens = null;
    if (!config.features.emailVerification) {
      tokens = await generateAuthTokens(user.id, user.email, user.role);
      
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
    }

    const response = createdResponse(
      {
        user,
        tokens: tokens ? {
          accessToken: tokens.accessToken,
          expiresAt: tokens.expiresAt,
        } : null,
      },
      config.features.emailVerification
        ? 'Registration successful! Please check your email to verify your account.'
        : 'Registration successful!'
    );

    // Set rate limit headers
    const headers = getRateLimitHeaders(rateLimit);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Set cookies if tokens generated
    if (tokens) {
      response.cookies.set('auth_token', tokens.accessToken, {
        httpOnly: true,
        secure: config.app.isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
      response.cookies.set('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: config.app.isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
