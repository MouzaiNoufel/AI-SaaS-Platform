import { PrismaClient, Role, UserStatus, ToolCategory, ToolStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!@#', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aisaas.com' },
    update: {},
    create: {
      email: 'admin@aisaas.com',
      password: adminPassword,
      name: 'System Admin',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      dailyLimit: 1000,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create demo user
  const userPassword = await bcrypt.hash('User123!@#', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@aisaas.com' },
    update: {},
    create: {
      email: 'demo@aisaas.com',
      password: userPassword,
      name: 'Demo User',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      bio: 'A demo user for testing the platform',
      company: 'Demo Corp',
    },
  });
  console.log('✅ Demo user created:', demoUser.email);

  // Create AI Tools
  const tools = [
    {
      name: 'Text Generator',
      slug: 'text-generator',
      description: 'Generate high-quality text content for various purposes including articles, blog posts, marketing copy, and creative writing. Powered by advanced language models.',
      shortDescription: 'Generate creative and professional text content',
      icon: 'FileText',
      category: ToolCategory.TEXT_GENERATION,
      status: ToolStatus.ACTIVE,
      creditCost: 1,
      maxTokens: 4096,
      tags: ['text', 'content', 'writing', 'creative'],
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', minLength: 10, maxLength: 5000 },
          tone: { type: 'string', enum: ['professional', 'casual', 'formal', 'creative'] },
          length: { type: 'string', enum: ['short', 'medium', 'long'] },
        },
        required: ['prompt'],
      },
      examples: [
        {
          input: { prompt: 'Write a product description for a smart watch', tone: 'professional' },
          output: 'Introducing the SmartWatch Pro...',
        },
      ],
    },
    {
      name: 'Code Assistant',
      slug: 'code-assistant',
      description: 'Get help with coding tasks including writing, debugging, explaining, and optimizing code across multiple programming languages.',
      shortDescription: 'Write, debug, and optimize code',
      icon: 'Code',
      category: ToolCategory.CODE_ASSISTANT,
      status: ToolStatus.ACTIVE,
      creditCost: 2,
      maxTokens: 8192,
      tags: ['code', 'programming', 'debug', 'developer'],
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          language: { type: 'string' },
          task: { type: 'string', enum: ['write', 'debug', 'explain', 'optimize', 'review'] },
          instruction: { type: 'string' },
        },
        required: ['task', 'instruction'],
      },
    },
    {
      name: 'Smart Summarizer',
      slug: 'smart-summarizer',
      description: 'Quickly summarize long documents, articles, or text into concise, easy-to-read summaries while preserving key information.',
      shortDescription: 'Summarize long texts instantly',
      icon: 'FileDown',
      category: ToolCategory.SUMMARIZATION,
      status: ToolStatus.ACTIVE,
      creditCost: 1,
      maxTokens: 2048,
      tags: ['summary', 'document', 'text', 'compress'],
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', minLength: 100 },
          length: { type: 'string', enum: ['brief', 'standard', 'detailed'] },
          format: { type: 'string', enum: ['paragraph', 'bullets', 'numbered'] },
        },
        required: ['text'],
      },
    },
    {
      name: 'Universal Translator',
      slug: 'universal-translator',
      description: 'Translate text between 50+ languages with high accuracy. Supports context-aware translations for natural-sounding results.',
      shortDescription: 'Translate between 50+ languages',
      icon: 'Languages',
      category: ToolCategory.TRANSLATION,
      status: ToolStatus.ACTIVE,
      creditCost: 1,
      maxTokens: 2048,
      tags: ['translate', 'language', 'multilingual'],
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', minLength: 1 },
          sourceLang: { type: 'string' },
          targetLang: { type: 'string' },
          preserveTone: { type: 'boolean' },
        },
        required: ['text', 'targetLang'],
      },
    },
    {
      name: 'Data Analyzer',
      slug: 'data-analyzer',
      description: 'Analyze data patterns, generate insights, and create visualizations from your datasets. Supports CSV, JSON, and structured text input.',
      shortDescription: 'Extract insights from your data',
      icon: 'BarChart3',
      category: ToolCategory.DATA_ANALYSIS,
      status: ToolStatus.ACTIVE,
      creditCost: 3,
      maxTokens: 4096,
      tags: ['data', 'analytics', 'insights', 'visualization'],
      inputSchema: {
        type: 'object',
        properties: {
          data: { type: 'string' },
          analysisType: { type: 'string', enum: ['summary', 'trends', 'anomalies', 'predictions'] },
          question: { type: 'string' },
        },
        required: ['data'],
      },
    },
    {
      name: 'AI Chatbot',
      slug: 'ai-chatbot',
      description: 'Engage in natural conversations with an AI assistant. Get answers to questions, brainstorm ideas, or just have a friendly chat.',
      shortDescription: 'Chat with an intelligent AI assistant',
      icon: 'MessageSquare',
      category: ToolCategory.CHATBOT,
      status: ToolStatus.ACTIVE,
      creditCost: 1,
      maxTokens: 4096,
      tags: ['chat', 'assistant', 'conversation', 'qa'],
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', minLength: 1 },
          context: { type: 'string' },
          personality: { type: 'string', enum: ['helpful', 'creative', 'analytical', 'friendly'] },
        },
        required: ['message'],
      },
    },
    {
      name: 'Image Generator',
      slug: 'image-generator',
      description: 'Create stunning AI-generated images from text descriptions. Perfect for concept art, illustrations, and creative projects.',
      shortDescription: 'Generate images from text prompts',
      icon: 'Image',
      category: ToolCategory.IMAGE_GENERATION,
      status: ToolStatus.MAINTENANCE,
      creditCost: 5,
      maxTokens: 1024,
      tags: ['image', 'art', 'creative', 'visual'],
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', minLength: 10 },
          style: { type: 'string', enum: ['realistic', 'artistic', 'cartoon', 'abstract'] },
          size: { type: 'string', enum: ['256x256', '512x512', '1024x1024'] },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'SEO Optimizer',
      slug: 'seo-optimizer',
      description: 'Optimize your content for search engines. Get keyword suggestions, meta descriptions, and content improvement recommendations.',
      shortDescription: 'Optimize content for search engines',
      icon: 'Search',
      category: ToolCategory.OTHER,
      status: ToolStatus.ACTIVE,
      creditCost: 2,
      maxTokens: 2048,
      tags: ['seo', 'marketing', 'content', 'optimization'],
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', minLength: 50 },
          targetKeywords: { type: 'array', items: { type: 'string' } },
          url: { type: 'string' },
        },
        required: ['content'],
      },
    },
  ];

  for (const tool of tools) {
    await prisma.aITool.upsert({
      where: { slug: tool.slug },
      update: tool,
      create: tool,
    });
  }
  console.log('✅ AI Tools created:', tools.length);

  // Create system settings
  const settings = [
    { key: 'site_name', value: 'AI SaaS Platform', category: 'general' },
    { key: 'site_description', value: 'Your all-in-one AI-powered productivity platform', category: 'general' },
    { key: 'maintenance_mode', value: false, category: 'system' },
    { key: 'registration_enabled', value: true, category: 'auth' },
    { key: 'email_verification_required', value: true, category: 'auth' },
    { key: 'default_user_limit', value: 50, category: 'limits' },
    { key: 'ai_provider', value: 'openai', category: 'ai' },
    { key: 'ai_model', value: 'gpt-4-turbo-preview', category: 'ai' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ System settings created');

  // Create initial analytics entry
  await prisma.dailyAnalytics.upsert({
    where: { date: new Date(new Date().toDateString()) },
    update: {},
    create: {
      date: new Date(new Date().toDateString()),
      newUsers: 2,
      activeUsers: 2,
    },
  });
  console.log('✅ Initial analytics created');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
