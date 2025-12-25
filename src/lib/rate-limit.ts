import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { config } from './config';

// ============================================
// RATE LIMITERS
// ============================================

// General API rate limiter
const apiLimiter = new RateLimiterMemory({
  points: config.rateLimit.maxRequests,
  duration: config.rateLimit.windowMs / 1000,
});

// AI requests rate limiter (stricter)
const aiLimiter = new RateLimiterMemory({
  points: config.rateLimit.aiPerMinute,
  duration: 60,
});

// Auth rate limiter (prevent brute force)
const authLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 15, // 15 minutes
  blockDuration: 60 * 30, // Block for 30 minutes
});

// Password reset limiter
const passwordResetLimiter = new RateLimiterMemory({
  points: 3,
  duration: 60 * 60, // 1 hour
});

// ============================================
// RATE LIMIT FUNCTIONS
// ============================================

export interface RateLimitResult {
  success: boolean;
  remaining?: number;
  retryAfter?: number;
  limit?: number;
}

async function checkRateLimit(
  limiter: RateLimiterMemory,
  key: string
): Promise<RateLimitResult> {
  try {
    const res = await limiter.consume(key);
    return {
      success: true,
      remaining: res.remainingPoints,
      limit: limiter.points,
    };
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      return {
        success: false,
        remaining: 0,
        retryAfter: Math.ceil(error.msBeforeNext / 1000),
        limit: limiter.points,
      };
    }
    throw error;
  }
}

export async function checkApiRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(apiLimiter, ip);
}

export async function checkAiRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(aiLimiter, `ai_${userId}`);
}

export async function checkAuthRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(authLimiter, `auth_${ip}`);
}

export async function checkPasswordResetLimit(email: string): Promise<RateLimitResult> {
  return checkRateLimit(passwordResetLimiter, `reset_${email}`);
}

// ============================================
// RATE LIMIT HEADERS
// ============================================

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (result.limit !== undefined) {
    headers['X-RateLimit-Limit'] = result.limit.toString();
  }
  if (result.remaining !== undefined) {
    headers['X-RateLimit-Remaining'] = result.remaining.toString();
  }
  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString();
  }
  
  return headers;
}

// ============================================
// USER DAILY LIMIT CHECK
// ============================================

export async function checkUserDailyLimit(
  userId: string,
  currentCount: number,
  limit: number
): Promise<{ allowed: boolean; remaining: number }> {
  const remaining = Math.max(0, limit - currentCount);
  return {
    allowed: currentCount < limit,
    remaining,
  };
}
