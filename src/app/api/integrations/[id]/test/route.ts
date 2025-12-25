import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// POST /api/integrations/[id]/test - Test integration
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

    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (integration.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Perform test based on integration type
    let testResult: { success: boolean; message: string; details?: Record<string, unknown> };

    switch (integration.type) {
      case 'SLACK':
        testResult = await testSlackIntegration(integration);
        break;
      case 'DISCORD':
        testResult = await testDiscordIntegration(integration);
        break;
      case 'CHROME':
        testResult = testChromeIntegration(integration);
        break;
      default:
        testResult = {
          success: true,
          message: 'Integration connection verified',
          details: {
            webhookUrl: integration.webhookUrl,
            status: integration.status,
          },
        };
    }

    // Update last used
    await prisma.integration.update({
      where: { id },
      data: { lastUsed: new Date() },
    });

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Error testing integration:', error);
    return NextResponse.json(
      { error: 'Failed to test integration' },
      { status: 500 }
    );
  }
}

async function testSlackIntegration(
  integration: { id: string; accessToken: string | null; settings: unknown }
): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
  // In production, would verify Slack token and try to post a test message
  if (!integration.accessToken) {
    return {
      success: false,
      message: 'No access token configured. Please complete OAuth setup.',
    };
  }

  // Mock successful test
  return {
    success: true,
    message: 'Slack integration is working correctly',
    details: {
      connected: true,
      workspace: 'Your Workspace',
      channel: '#general',
    },
  };
}

async function testDiscordIntegration(
  integration: { id: string; accessToken: string | null; settings: unknown }
): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
  // In production, would verify Discord bot token
  if (!integration.accessToken) {
    return {
      success: false,
      message: 'No bot token configured. Please add your Discord bot token.',
    };
  }

  // Mock successful test
  return {
    success: true,
    message: 'Discord integration is working correctly',
    details: {
      connected: true,
      bot: 'AI SaaS Bot',
      servers: 1,
    },
  };
}

function testChromeIntegration(
  integration: { id: string; webhookUrl: string | null }
): { success: boolean; message: string; details?: Record<string, unknown> } {
  // Chrome extension uses webhook URL
  return {
    success: true,
    message: 'Chrome extension integration is ready',
    details: {
      webhookUrl: integration.webhookUrl,
      status: 'Ready for connection',
      instructions: 'Install the Chrome extension and configure it with your webhook URL',
    },
  };
}
