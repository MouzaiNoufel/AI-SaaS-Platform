import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// POST /api/integrations/[id]/activate - Activate integration
export async function POST(
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
    const { accessToken, refreshToken, settings } = body;

    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (integration.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Update integration with tokens and activate
    const updated = await prisma.integration.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        accessToken: accessToken || integration.accessToken,
        refreshToken: refreshToken || integration.refreshToken,
        settings: settings || integration.settings,
        lastError: null,
        errorCount: 0,
      },
    });

    return NextResponse.json({
      integration: {
        id: updated.id,
        type: updated.type,
        name: updated.name,
        status: updated.status,
        webhookUrl: updated.webhookUrl,
      },
      message: 'Integration activated successfully',
    });
  } catch (error) {
    console.error('Error activating integration:', error);
    return NextResponse.json(
      { error: 'Failed to activate integration' },
      { status: 500 }
    );
  }
}
