import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// POST /api/integrations/webhook/[id] - Receive webhook from integration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/webhook/${id}`;

    // Find integration by webhook URL
    const integration = await prisma.integration.findFirst({
      where: { webhookUrl },
      include: {
        user: {
          select: { id: true, email: true, dailyLimit: true, dailyAiRequests: true },
        },
      },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (integration.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Integration is not active' }, { status: 400 });
    }

    // Verify webhook signature if secret is set
    const signature = request.headers.get('x-webhook-signature');
    if (integration.webhookSecret && signature) {
      const body = await request.text();
      const expectedSignature = crypto
        .createHmac('sha256', integration.webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      // Re-parse body after reading as text
      const parsedBody = JSON.parse(body);
      return handleWebhook(integration, parsedBody);
    }

    const body = await request.json();
    return handleWebhook(integration, body);
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleWebhook(
  integration: {
    id: string;
    type: string;
    userId: string;
    settings: unknown;
    user: { id: string; email: string; dailyLimit: number; dailyAiRequests: number };
  },
  body: Record<string, unknown>
) {
  try {
    // Update usage stats
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastUsed: new Date(),
        usageCount: { increment: 1 },
      },
    });

    // Handle based on integration type
    switch (integration.type) {
      case 'SLACK':
        return handleSlackWebhook(integration, body);
      case 'DISCORD':
        return handleDiscordWebhook(integration, body);
      case 'CHROME':
        return handleChromeWebhook(integration, body);
      default:
        return handleGenericWebhook(integration, body);
    }
  } catch (error) {
    console.error('Webhook handler error:', error);

    // Update error count
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastError: error instanceof Error ? error.message : 'Unknown error',
        errorCount: { increment: 1 },
      },
    });

    throw error;
  }
}

async function handleSlackWebhook(
  integration: { id: string; userId: string; settings: unknown },
  body: Record<string, unknown>
) {
  // Handle Slack-specific webhook format
  const { type, challenge, event } = body;

  // Slack URL verification
  if (type === 'url_verification' && challenge) {
    return NextResponse.json({ challenge });
  }

  // Handle Slack events
  if (type === 'event_callback' && event) {
    const eventData = event as Record<string, unknown>;
    
    // Handle message events
    if (eventData.type === 'message' && eventData.text) {
      // Process the message with AI
      const response = await processAIRequest(
        integration.userId,
        String(eventData.text),
        'slack'
      );

      return NextResponse.json({
        success: true,
        response,
        message: 'Message processed',
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Webhook received',
  });
}

async function handleDiscordWebhook(
  integration: { id: string; userId: string; settings: unknown },
  body: Record<string, unknown>
) {
  // Handle Discord-specific webhook format
  const { type, content, author } = body;

  // Discord ping verification
  if (type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // Handle message
  if (content) {
    const response = await processAIRequest(
      integration.userId,
      String(content),
      'discord'
    );

    return NextResponse.json({
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        content: response,
      },
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Webhook received',
  });
}

async function handleChromeWebhook(
  integration: { id: string; userId: string; settings: unknown },
  body: Record<string, unknown>
) {
  // Handle Chrome extension requests
  const { action, data, prompt } = body;

  switch (action) {
    case 'summarize':
      const summaryResponse = await processAIRequest(
        integration.userId,
        `Summarize the following content:\n\n${data}`,
        'chrome'
      );
      return NextResponse.json({ summary: summaryResponse });

    case 'translate':
      const { text, targetLanguage } = data as { text: string; targetLanguage: string };
      const translateResponse = await processAIRequest(
        integration.userId,
        `Translate the following to ${targetLanguage}:\n\n${text}`,
        'chrome'
      );
      return NextResponse.json({ translation: translateResponse });

    case 'analyze':
      const analyzeResponse = await processAIRequest(
        integration.userId,
        `Analyze the following:\n\n${data}`,
        'chrome'
      );
      return NextResponse.json({ analysis: analyzeResponse });

    case 'custom':
      const customResponse = await processAIRequest(
        integration.userId,
        String(prompt || data),
        'chrome'
      );
      return NextResponse.json({ result: customResponse });

    default:
      return NextResponse.json({
        success: true,
        message: 'Action not recognized',
      });
  }
}

async function handleGenericWebhook(
  integration: { id: string; userId: string; settings: unknown },
  body: Record<string, unknown>
) {
  // Handle generic webhook
  const { prompt, data } = body;

  if (prompt) {
    const response = await processAIRequest(
      integration.userId,
      String(prompt),
      'webhook'
    );
    return NextResponse.json({ response });
  }

  return NextResponse.json({
    success: true,
    message: 'Webhook received',
    data: body,
  });
}

async function processAIRequest(
  userId: string,
  prompt: string,
  source: string
): Promise<string> {
  // Check if user has available requests
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyLimit: true, dailyAiRequests: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.dailyAiRequests >= user.dailyLimit) {
    return 'Daily AI request limit reached. Please upgrade your plan for more requests.';
  }

  // Update user's request count
  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyAiRequests: { increment: 1 },
      totalAiRequests: { increment: 1 },
      lastRequestDate: new Date(),
    },
  });

  // Get or create a generic tool for external integrations
  let tool = await prisma.aITool.findFirst({
    where: { slug: 'external-integration' },
  });

  if (!tool) {
    tool = await prisma.aITool.create({
      data: {
        name: 'External Integration',
        slug: 'external-integration',
        description: 'AI requests from external integrations',
        category: 'TEXT_GENERATION',
        icon: 'Plug',
        status: 'ACTIVE',
      },
    });
  }

  // Create AI request record
  const aiRequest = await prisma.aIRequest.create({
    data: {
      userId,
      toolId: tool.id,
      input: { prompt: prompt.slice(0, 5000), source },
      status: 'PENDING',
    },
  });

  // Generate response (mock for now, would call OpenAI in production)
  const isMockMode = process.env.AI_MOCK_MODE === 'true' || !process.env.OPENAI_API_KEY;

  let response: string;

  if (isMockMode) {
    response = generateMockResponse(prompt, source);
  } else {
    // In production, call OpenAI API here
    response = generateMockResponse(prompt, source);
  }

  // Update AI request with response
  await prisma.aIRequest.update({
    where: { id: aiRequest.id },
    data: {
      output: { text: response },
      status: 'COMPLETED',
      processingTime: Math.floor(Math.random() * 500 + 100),
      tokenUsage: { prompt: prompt.length, completion: response.length, total: prompt.length + response.length },
      completedAt: new Date(),
    },
  });

  return response;
}

function generateMockResponse(prompt: string, source: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('summarize')) {
    return 'Here is a concise summary of the provided content: The main points cover key topics with relevant details and actionable insights.';
  }

  if (lowerPrompt.includes('translate')) {
    return 'Translation completed successfully. The text has been translated to the requested language.';
  }

  if (lowerPrompt.includes('analyze')) {
    return 'Analysis complete: The content shows positive patterns with clear structure and coherent messaging.';
  }

  return `Response from ${source} integration: Your request has been processed successfully. The AI has analyzed your input and generated this response based on the provided context.`;
}
