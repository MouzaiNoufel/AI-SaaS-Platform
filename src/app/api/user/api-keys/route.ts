import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

// Generate a secure API key
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = key.substring(0, 12);
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, prefix, hash };
}

// GET: List all API keys for the user
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        rateLimit: true,
        dailyLimit: true,
        totalRequests: true,
        lastUsedAt: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: apiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new API key
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, permissions = ['read', 'write'], rateLimit = 100, dailyLimit = 10000 } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if user has too many API keys
    const existingKeysCount = await prisma.apiKey.count({
      where: { userId: user.id },
    });

    if (existingKeysCount >= 10) {
      return NextResponse.json(
        { error: 'Maximum API keys limit reached (10)' },
        { status: 400 }
      );
    }

    const { key, prefix, hash } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: name.trim(),
        key: key,
        keyPrefix: prefix,
        hashedKey: hash,
        permissions,
        rateLimit,
        dailyLimit,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        rateLimit: true,
        dailyLimit: true,
        totalRequests: true,
        lastUsedAt: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey,
        fullKey: key, // Only returned once on creation
      },
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
