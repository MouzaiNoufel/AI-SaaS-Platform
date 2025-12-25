import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import crypto from 'crypto';

// GET /api/integrations - List user's integrations
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrations = await prisma.integration.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
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
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

// POST /api/integrations - Create a new integration
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, name, settings } = body;

    if (!type || !name) {
      return NextResponse.json(
        { error: 'Type and name are required' },
        { status: 400 }
      );
    }

    const validTypes = ['SLACK', 'DISCORD', 'CHROME', 'ZAPIER', 'CUSTOM'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 });
    }

    // Check if integration already exists
    const existing = await prisma.integration.findUnique({
      where: {
        userId_type: {
          userId: auth.user.id,
          type,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `You already have a ${type} integration` },
        { status: 400 }
      );
    }

    // Generate webhook URL and secret
    const webhookId = crypto.randomBytes(16).toString('hex');
    const webhookSecret = crypto.randomBytes(32).toString('hex');
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/webhook/${webhookId}`;

    const integration = await prisma.integration.create({
      data: {
        userId: auth.user.id,
        type,
        name,
        status: 'PENDING',
        settings,
        webhookUrl,
        webhookSecret,
      },
    });

    return NextResponse.json({
      integration: {
        id: integration.id,
        type: integration.type,
        name: integration.name,
        status: integration.status,
        webhookUrl: integration.webhookUrl,
        createdAt: integration.createdAt,
      },
      webhookSecret, // Only returned once during creation
      message: 'Integration created successfully',
    });
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}
