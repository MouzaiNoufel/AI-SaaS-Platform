import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============================================
// USER SCHEMAS
// ============================================

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  company: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url('Invalid URL').or(z.literal('')).optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING_VERIFICATION']).optional(),
  dailyLimit: z.number().min(0).max(10000).optional(),
  emailVerified: z.boolean().optional(),
});

// ============================================
// AI TOOL SCHEMAS
// ============================================

export const createToolSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  shortDescription: z.string().max(200).optional(),
  icon: z.string().optional(),
  category: z.enum([
    'TEXT_GENERATION',
    'IMAGE_GENERATION',
    'CODE_ASSISTANT',
    'DATA_ANALYSIS',
    'TRANSLATION',
    'SUMMARIZATION',
    'CHATBOT',
    'OTHER',
  ]),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DEPRECATED']).optional(),
  creditCost: z.number().min(1).max(100).optional(),
  maxTokens: z.number().min(100).max(32000).optional(),
  rateLimit: z.number().min(1).max(100).optional(),
  inputSchema: z.any().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateToolSchema = createToolSchema.partial();

// ============================================
// AI REQUEST SCHEMAS
// ============================================

export const aiRequestSchema = z.object({
  toolId: z.string().min(1, 'Tool ID is required'),
  input: z.record(z.any()),
  parameters: z.record(z.any()).optional(),
});

// Text Generator
export const textGeneratorSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(5000),
  tone: z.enum(['professional', 'casual', 'formal', 'creative']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
});

// Code Assistant
export const codeAssistantSchema = z.object({
  code: z.string().optional(),
  language: z.string().optional(),
  task: z.enum(['write', 'debug', 'explain', 'optimize', 'review']),
  instruction: z.string().min(10, 'Instruction must be at least 10 characters'),
});

// Summarizer
export const summarizerSchema = z.object({
  text: z.string().min(100, 'Text must be at least 100 characters'),
  length: z.enum(['brief', 'standard', 'detailed']).optional(),
  format: z.enum(['paragraph', 'bullets', 'numbered']).optional(),
});

// Translator
export const translatorSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  sourceLang: z.string().optional(),
  targetLang: z.string().min(1, 'Target language is required'),
  preserveTone: z.boolean().optional(),
});

// Chatbot
export const chatbotSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.string().optional(),
  personality: z.enum(['helpful', 'creative', 'analytical', 'friendly']).optional(),
});

// ============================================
// CONTACT SCHEMA
// ============================================

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  message: z.string().min(20, 'Message must be at least 20 characters').max(5000),
});

// ============================================
// QUERY PARAMS SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const searchSchema = paginationSchema.extend({
  search: z.string().optional(),
  filter: z.string().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type CreateToolInput = z.infer<typeof createToolSchema>;
export type UpdateToolInput = z.infer<typeof updateToolSchema>;
export type AIRequestInput = z.infer<typeof aiRequestSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
