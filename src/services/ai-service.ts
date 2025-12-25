import { config } from '@/lib/config';
import OpenAI from 'openai';

// ============================================
// TYPES
// ============================================

export interface AIProviderConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIRequest {
  toolSlug: string;
  input: Record<string, unknown>;
  parameters?: Record<string, unknown>;
}

export interface AIResponse {
  success: boolean;
  output: unknown;
  error?: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  processingTime: number;
}

// ============================================
// AI PROVIDER INTERFACE
// ============================================

export interface AIProvider {
  name: string;
  generateText(prompt: string, options?: AIProviderConfig): Promise<AIResponse>;
  generateCode(instruction: string, options?: AIProviderConfig): Promise<AIResponse>;
  summarize(text: string, options?: AIProviderConfig): Promise<AIResponse>;
  translate(text: string, targetLang: string, options?: AIProviderConfig): Promise<AIResponse>;
  chat(message: string, context?: string, options?: AIProviderConfig): Promise<AIResponse>;
  chatWithHistory(params: ChatWithHistoryParams): Promise<ChatResponse>;
  analyze(data: string, question?: string, options?: AIProviderConfig): Promise<AIResponse>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatWithHistoryParams {
  messages: ChatMessage[];
  systemPrompt?: string;
  options?: AIProviderConfig;
}

export interface ChatResponse {
  content: string;
  usage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// ============================================
// MOCK AI PROVIDER
// ============================================

class MockAIProvider implements AIProvider {
  name = 'mock';

  private async simulateDelay(): Promise<void> {
    const delay = Math.random() * 1000 + 500;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private createResponse(output: unknown, tokens: number = 100): AIResponse {
    return {
      success: true,
      output,
      tokenUsage: {
        prompt: Math.floor(tokens * 0.3),
        completion: Math.floor(tokens * 0.7),
        total: tokens,
      },
      processingTime: Math.floor(Math.random() * 2000 + 500),
    };
  }

  async generateText(prompt: string): Promise<AIResponse> {
    await this.simulateDelay();
    
    const responses = [
      `Here's a creative response to your prompt about "${prompt.slice(0, 50)}...":\n\nIn the realm of possibilities, where ideas converge and creativity flourishes, we find ourselves at the intersection of innovation and imagination. Your request has sparked a journey through concepts and narratives that weave together to form a coherent and engaging piece of content.\n\nThe key themes emerging from your prompt include exploration, discovery, and the pursuit of excellence. These elements combine to create a narrative that resonates with readers and provides value through its insightful perspectives.`,
      `Based on your prompt "${prompt.slice(0, 30)}...", here's the generated content:\n\n# Overview\n\nThis comprehensive piece addresses the core aspects of your request, diving deep into the subject matter while maintaining clarity and engagement.\n\n## Key Points\n\n1. **Innovation**: Pushing boundaries and exploring new frontiers\n2. **Quality**: Maintaining high standards throughout\n3. **Relevance**: Ensuring content meets your specific needs\n\nThe content has been crafted to provide maximum value while being easy to understand and implement.`,
    ];

    return this.createResponse(responses[Math.floor(Math.random() * responses.length)], 250);
  }

  async generateCode(instruction: string): Promise<AIResponse> {
    await this.simulateDelay();

    const output = {
      code: `// Generated code based on: ${instruction.slice(0, 50)}...

function processData(input: any): Result {
  // Validate input
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input provided');
  }

  // Process the data
  const processed = Object.entries(input).map(([key, value]) => ({
    key,
    value,
    timestamp: new Date().toISOString(),
  }));

  // Return structured result
  return {
    success: true,
    data: processed,
    count: processed.length,
  };
}

interface Result {
  success: boolean;
  data: Array<{ key: string; value: any; timestamp: string }>;
  count: number;
}

export { processData, Result };`,
      language: 'typescript',
      explanation: 'This code provides a type-safe function for processing data objects with proper validation and structured output.',
    };

    return this.createResponse(output, 350);
  }

  async summarize(text: string): Promise<AIResponse> {
    await this.simulateDelay();

    const wordCount = text.split(' ').length;
    const output = {
      summary: `**Summary** (Original: ${wordCount} words)\n\nThis text discusses key themes and concepts that are central to the subject matter. The main points include:\n\n• Primary topic exploration and analysis\n• Supporting evidence and examples\n• Conclusions and implications\n\nThe author presents a well-structured argument that builds upon established foundations while introducing novel perspectives.`,
      keyPoints: [
        'Main argument is clearly articulated',
        'Evidence supports the central thesis',
        'Implications are significant for the field',
      ],
      wordReduction: `${Math.floor((1 - 50 / wordCount) * 100)}%`,
    };

    return this.createResponse(output, 150);
  }

  async translate(text: string, targetLang: string): Promise<AIResponse> {
    await this.simulateDelay();

    const translations: Record<string, string> = {
      spanish: `[Traducción al español]: ${text.slice(0, 100)}... (Esta es una traducción simulada del texto original)`,
      french: `[Traduction en français]: ${text.slice(0, 100)}... (Ceci est une traduction simulée du texte original)`,
      german: `[Übersetzung auf Deutsch]: ${text.slice(0, 100)}... (Dies ist eine simulierte Übersetzung des Originaltexts)`,
      japanese: `[日本語への翻訳]: ${text.slice(0, 100)}... (これは元のテキストのシミュレートされた翻訳です)`,
      chinese: `[中文翻译]: ${text.slice(0, 100)}... (这是原文的模拟翻译)`,
    };

    const output = {
      translation: translations[targetLang.toLowerCase()] || `[Translation to ${targetLang}]: ${text} (Simulated translation)`,
      sourceLanguage: 'English (detected)',
      targetLanguage: targetLang,
      confidence: 0.95,
    };

    return this.createResponse(output, 200);
  }

  async chat(message: string, context?: string): Promise<AIResponse> {
    await this.simulateDelay();

    const responses = [
      `I understand you're asking about "${message.slice(0, 30)}...". That's a great question!\n\nBased on my analysis, here are some key insights:\n\n1. The topic you've raised is indeed important and worth exploring further.\n2. There are several approaches you could consider, each with its own merits.\n3. I'd recommend starting with the fundamentals and building from there.\n\nWould you like me to elaborate on any specific aspect?`,
      `Thank you for your message about "${message.slice(0, 30)}...". Let me help you with that.\n\n${context ? `Considering the context you provided, ` : ''}Here's my response:\n\nThis is a multifaceted topic that requires careful consideration. The key factors to keep in mind are relevance, accuracy, and practicality. I've analyzed your query and believe the best approach would be to break it down into manageable components.\n\nFeel free to ask follow-up questions!`,
    ];

    return this.createResponse(responses[Math.floor(Math.random() * responses.length)], 180);
  }

  async chatWithHistory(params: ChatWithHistoryParams): Promise<ChatResponse> {
    await this.simulateDelay();

    const lastMessage = params.messages[params.messages.length - 1];
    const messagePreview = lastMessage?.content.slice(0, 30) || 'your question';

    const responses = [
      `Based on our conversation, I can provide insight on "${messagePreview}..."\n\nConsidering the context from our previous exchanges, here's my analysis:\n\n1. Your question builds naturally on what we discussed earlier.\n2. The key considerations here involve balancing multiple factors.\n3. I recommend a structured approach that accounts for all variables.\n\nWould you like me to go deeper into any particular aspect?`,
      `Great follow-up question about "${messagePreview}..."\n\nDrawing from our conversation history:\n\nThe topic you're exploring connects directly to themes we've covered. Here are my thoughts:\n\n- First, consider the foundational elements we established\n- Next, apply those principles to your current question\n- Finally, evaluate the outcomes against your goals\n\nLet me know if you need clarification on any point!`,
    ];

    return {
      content: responses[Math.floor(Math.random() * responses.length)],
      usage: {
        prompt: Math.floor(params.messages.length * 50),
        completion: 150,
        total: Math.floor(params.messages.length * 50) + 150,
      },
    };
  }

  async analyze(data: string, question?: string): Promise<AIResponse> {
    await this.simulateDelay();

    const output = {
      analysis: `**Data Analysis Report**\n\n${question ? `Question: ${question}\n\n` : ''}## Overview\nThe provided dataset contains structured information that reveals several interesting patterns and insights.\n\n## Key Findings\n1. **Trend Analysis**: The data shows a consistent upward trend\n2. **Anomalies**: No significant outliers detected\n3. **Correlations**: Strong positive correlation between key variables\n\n## Recommendations\n- Continue monitoring the identified trends\n- Consider expanding data collection for deeper insights\n- Implement automated alerts for anomaly detection`,
      metrics: {
        dataPoints: Math.floor(Math.random() * 1000) + 100,
        confidence: 0.87,
        processingComplexity: 'medium',
      },
      charts: ['trend_line', 'distribution', 'correlation_matrix'],
    };

    return this.createResponse(output, 300);
  }
}

// ============================================
// OPENAI PROVIDER
// ============================================

class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.ai.openaiApiKey,
      organization: config.ai.openaiOrgId || undefined,
    });
  }

  private async callOpenAI(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: AIProviderConfig
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || config.ai.model,
        messages,
        max_tokens: options?.maxTokens || config.ai.maxTokens,
        temperature: options?.temperature || 0.7,
      });

      const processingTime = Date.now() - startTime;
      const message = response.choices[0]?.message?.content || '';

      return {
        success: true,
        output: message,
        tokenUsage: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0,
        },
        processingTime,
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : 'OpenAI API error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  async generateText(prompt: string, options?: AIProviderConfig): Promise<AIResponse> {
    return this.callOpenAI(
      [
        { role: 'system', content: 'You are a professional content writer. Generate high-quality, engaging content based on the user\'s prompt.' },
        { role: 'user', content: prompt },
      ],
      options
    );
  }

  async generateCode(instruction: string, options?: AIProviderConfig): Promise<AIResponse> {
    const response = await this.callOpenAI(
      [
        { role: 'system', content: 'You are an expert programmer. Provide clean, well-documented code with explanations. Format your response as JSON with "code", "language", and "explanation" fields.' },
        { role: 'user', content: instruction },
      ],
      options
    );

    if (response.success && typeof response.output === 'string') {
      try {
        response.output = JSON.parse(response.output);
      } catch {
        response.output = { code: response.output, language: 'unknown', explanation: '' };
      }
    }

    return response;
  }

  async summarize(text: string, options?: AIProviderConfig): Promise<AIResponse> {
    const response = await this.callOpenAI(
      [
        { role: 'system', content: 'Summarize the following text concisely while retaining key information. Provide the response as JSON with "summary" and "keyPoints" fields.' },
        { role: 'user', content: text },
      ],
      options
    );

    if (response.success && typeof response.output === 'string') {
      try {
        response.output = JSON.parse(response.output);
      } catch {
        response.output = { summary: response.output, keyPoints: [] };
      }
    }

    return response;
  }

  async translate(text: string, targetLang: string, options?: AIProviderConfig): Promise<AIResponse> {
    const response = await this.callOpenAI(
      [
        { role: 'system', content: `Translate the following text to ${targetLang}. Provide the response as JSON with "translation", "sourceLanguage", and "targetLanguage" fields.` },
        { role: 'user', content: text },
      ],
      options
    );

    if (response.success && typeof response.output === 'string') {
      try {
        response.output = JSON.parse(response.output);
      } catch {
        response.output = { translation: response.output, sourceLanguage: 'auto', targetLanguage: targetLang };
      }
    }

    return response;
  }

  async chat(message: string, context?: string, options?: AIProviderConfig): Promise<AIResponse> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: 'You are a helpful, friendly AI assistant. Provide clear, accurate, and helpful responses.' },
    ];

    if (context) {
      messages.push({ role: 'user', content: `Context: ${context}` });
      messages.push({ role: 'assistant', content: 'I understand the context. How can I help you?' });
    }

    messages.push({ role: 'user', content: message });

    return this.callOpenAI(messages, options);
  }

  async chatWithHistory(params: ChatWithHistoryParams): Promise<ChatResponse> {
    const startTime = Date.now();
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }

    for (const msg of params.messages) {
      messages.push({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      });
    }

    try {
      const response = await this.client.chat.completions.create({
        model: params.options?.model || config.ai.model,
        messages,
        max_tokens: params.options?.maxTokens || config.ai.maxTokens,
        temperature: params.options?.temperature || 0.7,
      });

      return {
        content: response.choices[0]?.message?.content || '',
        usage: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'OpenAI API error');
    }
  }

  async analyze(data: string, question?: string, options?: AIProviderConfig): Promise<AIResponse> {
    const prompt = question
      ? `Analyze the following data and answer this question: ${question}\n\nData:\n${data}`
      : `Analyze the following data and provide insights:\n\n${data}`;

    const response = await this.callOpenAI(
      [
        { role: 'system', content: 'You are a data analyst. Analyze the provided data and give insights. Format response as JSON with "analysis", "metrics", and "recommendations" fields.' },
        { role: 'user', content: prompt },
      ],
      options
    );

    if (response.success && typeof response.output === 'string') {
      try {
        response.output = JSON.parse(response.output);
      } catch {
        response.output = { analysis: response.output, metrics: {}, recommendations: [] };
      }
    }

    return response;
  }
}

// ============================================
// AI SERVICE FACTORY
// ============================================

export function getAIProvider(): AIProvider {
  if (config.ai.mockMode || !config.ai.openaiApiKey) {
    console.log('Using Mock AI Provider');
    return new MockAIProvider();
  }
  
  console.log('Using OpenAI Provider');
  return new OpenAIProvider();
}

// Singleton instance
let aiProvider: AIProvider | null = null;

export function getAI(): AIProvider {
  if (!aiProvider) {
    aiProvider = getAIProvider();
  }
  return aiProvider;
}

// ============================================
// AI SERVICE - TOOL DISPATCHER
// ============================================

export async function processAIRequest(request: AIRequest): Promise<AIResponse> {
  const ai = getAI();
  const { toolSlug, input } = request;

  switch (toolSlug) {
    case 'text-generator':
      return ai.generateText(
        input.prompt as string,
        { temperature: input.tone === 'creative' ? 0.9 : 0.7 }
      );

    case 'code-assistant':
      const codePrompt = `Task: ${input.task}\nLanguage: ${input.language || 'any'}\nInstruction: ${input.instruction}\n${input.code ? `Existing code:\n${input.code}` : ''}`;
      return ai.generateCode(codePrompt);

    case 'smart-summarizer':
      return ai.summarize(
        input.text as string,
        { maxTokens: input.length === 'brief' ? 200 : input.length === 'detailed' ? 1000 : 500 }
      );

    case 'universal-translator':
      return ai.translate(
        input.text as string,
        input.targetLang as string
      );

    case 'ai-chatbot':
      return ai.chat(
        input.message as string,
        input.context as string | undefined
      );

    case 'data-analyzer':
      return ai.analyze(
        input.data as string,
        input.question as string | undefined
      );

    case 'seo-optimizer':
      const seoPrompt = `Optimize the following content for SEO:\n\nContent: ${input.content}\n${input.targetKeywords ? `Target Keywords: ${(input.targetKeywords as string[]).join(', ')}` : ''}`;
      return ai.generateText(seoPrompt);

    default:
      return {
        success: false,
        output: null,
        error: `Unknown tool: ${toolSlug}`,
        processingTime: 0,
      };
  }
}
