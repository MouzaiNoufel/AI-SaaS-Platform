import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// PATCH: Update an API key
export async function PATCH(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyId } = params;
    const body = await request.json();
    const { isActive, name, permissions, rateLimit, dailyLimit } = body;

    // Verify the key belongs to the user
    const existingKey = await prisma.apiKey.findFirst({
      where: { id: keyId, userId: user.id },
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (name) updateData.name = name.trim();
    if (permissions) updateData.permissions = permissions;
    if (rateLimit) updateData.rateLimit = rateLimit;
    if (dailyLimit) updateData.dailyLimit = dailyLimit;

    const updatedKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: updateData,
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

    return NextResponse.json({ success: true, data: updatedKey });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyId } = params;

    // Verify the key belongs to the user
    const existingKey = await prisma.apiKey.findFirst({
      where: { id: keyId, userId: user.id },
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    return NextResponse.json({ success: true, message: 'API key deleted' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
