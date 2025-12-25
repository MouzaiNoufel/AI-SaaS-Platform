import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { config } from './config';
import { prisma } from './prisma';

// ============================================
// TYPES
// ============================================

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  sessionId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// ============================================
// PASSWORD UTILITIES
// ============================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.security.bcryptRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// TOKEN GENERATION
// ============================================

const getSecretKey = () => new TextEncoder().encode(config.jwt.secret);
const getRefreshSecretKey = () => new TextEncoder().encode(config.jwt.refreshSecret);

function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60; // Default 7 days in seconds

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 7 * 24 * 60 * 60;
  }
}

export async function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  const expiresInSeconds = parseExpiresIn(config.jwt.expiresIn);
  
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(getSecretKey());
}

export async function generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  const expiresInSeconds = parseExpiresIn(config.jwt.refreshExpiresIn);
  
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(getRefreshSecretKey());
}

export async function generateAuthTokens(
  userId: string,
  email: string,
  role: 'USER' | 'ADMIN'
): Promise<AuthTokens> {
  const sessionId = uuidv4();
  const payload = { userId, email, role, sessionId };
  
  const expiresInSeconds = parseExpiresIn(config.jwt.expiresIn);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return { accessToken, refreshToken, expiresAt };
}

// ============================================
// TOKEN VERIFICATION
// ============================================

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecretKey());
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

// ============================================
// UTILITY TOKENS
// ============================================

export function generateVerificationToken(): string {
  return uuidv4() + '-' + Date.now().toString(36);
}

export function generateResetToken(): string {
  return uuidv4() + '-' + uuidv4();
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

// ============================================
// COOKIE HELPERS
// ============================================

export const AUTH_COOKIE_NAME = 'auth_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';

export function getAuthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: config.app.isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function getAccessTokenCookieOptions() {
  const expiresInSeconds = parseExpiresIn(config.jwt.expiresIn);
  return getAuthCookieOptions(expiresInSeconds);
}

export function getRefreshTokenCookieOptions() {
  const expiresInSeconds = parseExpiresIn(config.jwt.refreshExpiresIn);
  return getAuthCookieOptions(expiresInSeconds);
}

// ============================================
// AUTH VERIFICATION
// ============================================

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN';
    avatar: string | null;
    stripeCustomerId: string | null;
  };
  error?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Try to get token from cookies first
    const cookieStore = await cookies();
    let token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    
    // Fall back to Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return { success: false, error: 'No authentication token provided' };
    }
    
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return { success: false, error: 'Invalid or expired token' };
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        stripeCustomerId: true,
      },
    });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'USER' | 'ADMIN',
        avatar: user.avatar,
        stripeCustomerId: user.stripeCustomerId,
      },
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}
