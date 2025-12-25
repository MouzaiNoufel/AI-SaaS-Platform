import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAIRequest } from '@/services/ai-service';
import crypto from 'crypto';

interface ApiKeyValidation {
  valid: boolean;
  apiKey?: {
    id: string;
    userId: string;
    permissions: string[];
    rateLimit: number;
    dailyLimit: number;
  };
  error?: string;
}

async function validateApiKey(request: NextRequest): Promise<ApiKeyValidation> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' };
  }

  const apiKeyValue = authHeader.replace('Bearer ', '');
  
  if (!apiKeyValue.startsWith('sk_live_')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  const hashedKey = crypto.createHash('sha256').update(apiKeyValue).digest('hex');

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      hashedKey,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    return { valid: false, error: 'API key has expired' };
  }

  if (apiKey.user.status !== 'ACTIVE') {
    return { valid: false, error: 'User account is not active' };
  }

  // Check IP allowlist
  if (apiKey.allowedIps.length > 0) {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    if (!apiKey.allowedIps.includes(clientIp)) {
      return { valid: false, error: 'IP address not allowed' };
    }
  }

  return {
    valid: true,
    apiKey: {
      id: apiKey.id,
      userId: apiKey.userId,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
      dailyLimit: apiKey.dailyLimit,
    },
  };
}

// POST /api/v1/ai - Public AI endpoint for developers
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate API key
    const validation = await validateApiKey(request);
    if (!validation.valid || !validation.apiKey) {
      return NextResponse.json(
        { error: validation.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    if (!validation.apiKey.permissions.includes('write')) {
      return NextResponse.json(
        { error: 'API key does not have write permission' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tool, input, parameters } = body;

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool slug is required' },
        { status: 400 }
      );
    }

    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }

    // Check if tool exists
    const aiTool = await prisma.aITool.findUnique({
      where: { slug: tool },
    });

    if (!aiTool || aiTool.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Tool not found or not available' },
        { status: 404 }
      );
    }

    // Process AI request
    const result = await processAIRequest({
      toolSlug: tool,
      input,
      parameters,
    });

    const responseTime = Date.now() - startTime;

    // Log the API request
    await prisma.apiLog.create({
      data: {
        apiKeyId: validation.apiKey.id,
        endpoint: `/api/v1/ai/${tool}`,
        method: 'POST',
        statusCode: result.success ? 200 : 500,
        responseTime,
        tokensUsed: result.tokenUsage?.total || 0,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0],
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Update API key usage stats
    await prisma.apiKey.update({
      where: { id: validation.apiKey.id },
      data: {
        totalRequests: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Update user usage stats
    await prisma.user.update({
      where: { id: validation.apiKey.userId },
      data: {
        dailyAiRequests: { increment: 1 },
        totalAiRequests: { increment: 1 },
        lastRequestDate: new Date(),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'AI processing failed',
          requestId: validation.apiKey.id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.output,
      usage: result.tokenUsage,
      processingTime: result.processingTime,
      tool: tool,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/v1/ai - Get available tools
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const validation = await validateApiKey(request);
    if (!validation.valid || !validation.apiKey) {
      return NextResponse.json(
        { error: validation.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const tools = await prisma.aITool.findMany({
      where: { status: 'ACTIVE' },
      select: {
        slug: true,
        name: true,
        description: true,
        category: true,
        inputSchema: true,
        maxTokens: true,
        creditCost: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      tools,
      count: tools.length,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
