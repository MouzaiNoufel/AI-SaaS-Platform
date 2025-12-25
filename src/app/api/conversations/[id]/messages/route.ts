import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { getAI } from '@/services/ai-service';

// GET /api/conversations/[id]/messages - Get messages with pagination
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: auth.user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId: id } }),
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message and get AI response
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
    const { content, toolSlug } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: auth.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: id,
        role: 'USER',
        content,
        tokenCount: Math.ceil(content.length / 4),
      },
    });

    // Build conversation history for AI
    const history = conversation.messages.map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    history.push({ role: 'user', content });

    // Get AI response
    let aiResponse: string;
    let tokenUsage = { prompt: 0, completion: 0, total: 0 };

    try {
      const ai = getAI();
      const result = await ai.chatWithHistory({
        messages: history,
        systemPrompt: 'You are a helpful AI assistant. Maintain context from the conversation history and provide helpful, accurate responses.',
      });

      aiResponse = result.content;
      tokenUsage = result.usage || tokenUsage;
    } catch (aiError) {
      console.error('AI service error:', aiError);
      aiResponse = 'I apologize, but I encountered an error processing your request. Please try again.';
    }

    // Create assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: id,
        role: 'ASSISTANT',
        content: aiResponse,
        tokenCount: tokenUsage.completion || Math.ceil(aiResponse.length / 4),
        metadata: { tokenUsage },
      },
    });

    // Update conversation stats
    await prisma.conversation.update({
      where: { id },
      data: {
        messageCount: { increment: 2 },
        totalTokens: { increment: tokenUsage.total },
        lastMessageAt: new Date(),
      },
    });

    // Update user stats
    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        dailyAiRequests: { increment: 1 },
        totalAiRequests: { increment: 1 },
        lastRequestDate: new Date(),
      },
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
      tokenUsage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
