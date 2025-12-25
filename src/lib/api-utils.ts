import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, TokenPayload } from './auth';
import { prisma } from './prisma';
import { ZodSchema } from 'zod';

// ============================================
// TYPES
// ============================================

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ============================================
// API RESPONSE HELPERS
// ============================================

export function successResponse<T>(data: T, message?: string, meta?: ApiResponse['meta']): NextResponse {
  return NextResponse.json(
    { success: true, data, message, meta },
    { status: 200 }
  );
}

export function createdResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json(
    { success: true, data, message: message || 'Created successfully' },
    { status: 201 }
  );
}

export function errorResponse(error: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { success: false, error },
    { status }
  );
}

export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return errorResponse(message, 403);
}

export function notFoundResponse(message: string = 'Not found'): NextResponse {
  return errorResponse(message, 404);
}

export function validationErrorResponse(errors: Record<string, string[]>): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Validation failed', errors },
    { status: 422 }
  );
}

export function serverErrorResponse(message: string = 'Internal server error'): NextResponse {
  return errorResponse(message, 500);
}

export function rateLimitResponse(message: string = 'Too many requests'): NextResponse {
  return errorResponse(message, 429);
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

export async function getAuthUser(req: NextRequest): Promise<TokenPayload | null> {
  const authHeader = req.headers.get('authorization');
  const cookieToken = req.cookies.get('auth_token')?.value;
  
  const token = authHeader?.replace('Bearer ', '') || cookieToken;
  
  if (!token) return null;
  
  return verifyAccessToken(token);
}

export async function requireAuth(req: NextRequest): Promise<{ user: TokenPayload } | { error: NextResponse }> {
  const user = await getAuthUser(req);
  
  if (!user) {
    return { error: unauthorizedResponse('Authentication required') };
  }

  // Check if user still exists and is active
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { status: true },
  });

  if (!dbUser) {
    return { error: unauthorizedResponse('User not found') };
  }

  if (dbUser.status === 'BANNED') {
    return { error: forbiddenResponse('Account has been banned') };
  }

  if (dbUser.status === 'INACTIVE') {
    return { error: forbiddenResponse('Account is inactive') };
  }

  return { user };
}

export async function requireAdmin(req: NextRequest): Promise<{ user: TokenPayload } | { error: NextResponse }> {
  const result = await requireAuth(req);
  
  if ('error' in result) return result;
  
  if (result.user.role !== 'ADMIN') {
    return { error: forbiddenResponse('Admin access required') };
  }

  return result;
}

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      return { error: validationErrorResponse(errors) };
    }

    return { data: result.data };
  } catch {
    return { error: errorResponse('Invalid JSON body') };
  }
}

export function validateQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): { data: T } | { error: NextResponse } {
  const { searchParams } = new URL(req.url);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    });
    return { error: validationErrorResponse(errors) };
  }

  return { data: result.data };
}

// ============================================
// ERROR HANDLING
// ============================================

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Prisma errors
    if (error.message.includes('Unique constraint')) {
      return errorResponse('A record with this value already exists', 409);
    }
    if (error.message.includes('Record to update not found')) {
      return notFoundResponse('Record not found');
    }
    if (error.message.includes('Foreign key constraint')) {
      return errorResponse('Related record not found', 400);
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production') {
      return serverErrorResponse();
    }
    return serverErrorResponse(error.message);
  }

  return serverErrorResponse();
}

// ============================================
// REQUEST HELPERS
// ============================================

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown';
}

// ============================================
// PAGINATION HELPERS
// ============================================

export function getPaginationParams(req: NextRequest): { page: number; limit: number; skip: number } {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
