import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/integrations/[id] - Get integration details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const integration = await prisma.integration.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        name: true,
        status: true,
        settings: true,
        webhookUrl: true,
        lastUsed: true,
        usageCount: true,
        lastError: true,
        errorCount: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (integration.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({ integration });
  } catch (error) {
    console.error('Error fetching integration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    );
  }
}

// PATCH /api/integrations/[id] - Update integration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, settings, status } = body;

    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (integration.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updated = await prisma.integration.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(settings !== undefined && { settings }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({ integration: updated });
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/[id] - Delete integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (integration.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.integration.delete({ where: { id } });

    return NextResponse.json({ message: 'Integration deleted successfully' });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}
