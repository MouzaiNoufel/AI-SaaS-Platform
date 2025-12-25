import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/conversations - List user's conversations
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const toolId = searchParams.get('toolId');
    const archived = searchParams.get('archived') === 'true';
    const search = searchParams.get('search');

    const where: any = {
      userId: auth.user.id,
      isArchived: archived,
    };

    if (toolId) {
      where.toolId = toolId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { lastMessageAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              content: true,
              role: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, toolId, initialMessage } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId: auth.user.id,
        toolId: toolId || null,
        title,
        messages: initialMessage
          ? {
              create: {
                role: 'USER',
                content: initialMessage,
              },
            }
          : undefined,
        messageCount: initialMessage ? 1 : 0,
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
