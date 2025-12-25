import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import crypto from 'crypto';

function generateApiKey(): string {
  const prefix = 'sk_live_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}${randomBytes}`;
}

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function getKeyPrefix(key: string): string {
  return key.substring(0, 12) + '...';
}

// GET /api/developer/keys - List user's API keys
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: auth.user.id },
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

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST /api/developer/keys - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, permissions = ['read', 'write'], rateLimit = 100, dailyLimit = 10000, expiresAt } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check API key limit based on subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: auth.user.id },
    });

    const existingKeys = await prisma.apiKey.count({
      where: { userId: auth.user.id },
    });

    const maxKeys = subscription?.plan === 'ENTERPRISE' ? 50 : 
                    subscription?.plan === 'PRO' ? 10 : 
                    subscription?.plan === 'STARTER' ? 3 : 1;

    if (existingKeys >= maxKeys) {
      return NextResponse.json(
        { error: `Maximum ${maxKeys} API keys allowed for your plan` },
        { status: 400 }
      );
    }

    // Generate API key
    const apiKey = generateApiKey();
    const hashedKey = hashApiKey(apiKey);
    const keyPrefix = getKeyPrefix(apiKey);

    const newKey = await prisma.apiKey.create({
      data: {
        userId: auth.user.id,
        name,
        key: apiKey,
        keyPrefix,
        hashedKey,
        permissions,
        rateLimit,
        dailyLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        rateLimit: true,
        dailyLimit: true,
        createdAt: true,
      },
    });

    // Return the full key only once during creation
    return NextResponse.json({
      apiKey: {
        ...newKey,
        key: apiKey, // Full key shown only once
      },
      message: 'API key created successfully. Save this key securely - it will not be shown again.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

// DELETE /api/developer/keys - Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, userId: auth.user.id },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await prisma.apiKey.delete({ where: { id: keyId } });

    return NextResponse.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

// PATCH /api/developer/keys - Update an API key
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, permissions, rateLimit, dailyLimit, isActive, expiresAt } = body;

    if (!id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId: auth.user.id },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const updated = await prisma.apiKey.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(permissions !== undefined && { permissions }),
        ...(rateLimit !== undefined && { rateLimit }),
        ...(dailyLimit !== undefined && { dailyLimit }),
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        rateLimit: true,
        dailyLimit: true,
        isActive: true,
        expiresAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ apiKey: updated });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}
