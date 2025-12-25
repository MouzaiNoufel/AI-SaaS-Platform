import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// POST /api/uploads/[id]/analyze - Analyze uploaded file with AI
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
    const { prompt, analysisType = 'summary' } = body;

    const upload = await prisma.upload.findUnique({ where: { id } });

    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    if (upload.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (upload.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'File has not been processed yet' },
        { status: 400 }
      );
    }

    if (!upload.extractedText) {
      return NextResponse.json(
        { error: 'No text content available for analysis' },
        { status: 400 }
      );
    }

    // Build analysis prompt based on type
    let systemPrompt = '';
    switch (analysisType) {
      case 'summary':
        systemPrompt = 'You are an expert at summarizing documents. Provide a clear, concise summary of the content.';
        break;
      case 'keyPoints':
        systemPrompt = 'Extract and list the key points from this document in a structured format.';
        break;
      case 'sentiment':
        systemPrompt = 'Analyze the sentiment and tone of this document. Identify emotions, attitudes, and overall sentiment.';
        break;
      case 'entities':
        systemPrompt = 'Extract named entities (people, organizations, locations, dates, etc.) from this document.';
        break;
      case 'questions':
        systemPrompt = 'Generate relevant questions that could be answered based on this document content.';
        break;
      case 'custom':
        systemPrompt = 'You are a helpful assistant analyzing document content.';
        break;
      default:
        systemPrompt = 'Provide a comprehensive analysis of this document.';
    }

    const userPrompt = prompt
      ? `${prompt}\n\nDocument content:\n${upload.extractedText.slice(0, 15000)}`
      : `Analyze the following document:\n\n${upload.extractedText.slice(0, 15000)}`;

    // Check for mock mode
    const isMockMode = process.env.AI_MOCK_MODE === 'true' || !process.env.OPENAI_API_KEY;

    let analysis: string;
    let tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    if (isMockMode) {
      // Mock response for development
      analysis = generateMockAnalysis(analysisType, upload.originalName);
      tokenUsage = {
        promptTokens: userPrompt.length,
        completionTokens: analysis.length,
        totalTokens: userPrompt.length + analysis.length,
      };
    } else {
      // Real OpenAI API call
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      analysis = completion.choices[0].message.content || 'No analysis generated';
      tokenUsage = {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      };
    }

    // Store analysis result
    const existingAnalysis = (upload.aiAnalysis as Record<string, unknown>) || {};
    await prisma.upload.update({
      where: { id },
      data: {
        aiAnalysis: {
          ...existingAnalysis,
          [analysisType]: {
            result: analysis,
            timestamp: new Date().toISOString(),
            tokenUsage,
          },
        },
      },
    });

    return NextResponse.json({
      analysis,
      analysisType,
      tokenUsage,
    });
  } catch (error) {
    console.error('Error analyzing upload:', error);
    return NextResponse.json(
      { error: 'Failed to analyze upload' },
      { status: 500 }
    );
  }
}

function generateMockAnalysis(type: string, filename: string): string {
  switch (type) {
    case 'summary':
      return `Summary of "${filename}":\n\nThis document contains important information that has been extracted and processed. The main topics covered include data analysis, project planning, and strategic recommendations. Key themes identified include efficiency improvements, resource allocation, and timeline management.`;

    case 'keyPoints':
      return `Key Points from "${filename}":\n\n1. Primary objective identified: Improve operational efficiency\n2. Target metrics: 15% reduction in processing time\n3. Implementation timeline: Q3-Q4 2024\n4. Required resources: Technical team, budget allocation\n5. Success criteria: Measurable KPIs defined\n6. Risk factors: Dependencies on external systems`;

    case 'sentiment':
      return `Sentiment Analysis of "${filename}":\n\nOverall Sentiment: Positive (72%)\n\nTone: Professional and optimistic\n- Confidence: High\n- Urgency: Moderate\n- Formality: Formal\n\nEmotional indicators:\n- Enthusiasm about project goals\n- Cautious optimism regarding timeline\n- Collaborative language throughout`;

    case 'entities':
      return `Named Entities in "${filename}":\n\nOrganizations:\n- Example Corp\n- Technology Partners Inc.\n\nPeople:\n- Project Lead (role mentioned)\n- Technical Team (group reference)\n\nDates:\n- Q3 2024, Q4 2024\n\nLocations:\n- Main Office (reference)\n\nProducts/Technologies:\n- AI Platform, Cloud Services`;

    case 'questions':
      return `Generated Questions from "${filename}":\n\n1. What are the primary objectives outlined in this document?\n2. What is the expected timeline for implementation?\n3. Who are the key stakeholders involved?\n4. What resources are required for success?\n5. What are the identified risks and mitigation strategies?\n6. How will success be measured?`;

    default:
      return `Analysis of "${filename}":\n\nThis document has been processed and analyzed. The content appears to be related to business operations and planning. Further analysis can be performed using specific analysis types such as summary, key points, sentiment, or entity extraction.`;
  }
}
