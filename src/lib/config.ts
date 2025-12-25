// Environment configuration with validation
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value && !defaultValue) {
    console.warn(`Warning: Environment variable ${key} is not set`);
  }
  return value || '';
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

export const config = {
  // App
  app: {
    name: getEnvVar('NEXT_PUBLIC_APP_NAME', 'AI SaaS Platform'),
    url: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    env: getEnvVar('NODE_ENV', 'development'),
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
  },

  // Database
  database: {
    url: getEnvVar('DATABASE_URL'),
  },

  // JWT
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'default-secret-change-in-production'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
    refreshSecret: getEnvVar('JWT_REFRESH_SECRET', 'default-refresh-secret'),
    refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  // Email
  email: {
    host: getEnvVar('SMTP_HOST', 'smtp.gmail.com'),
    port: getEnvNumber('SMTP_PORT', 587),
    user: getEnvVar('SMTP_USER'),
    password: getEnvVar('SMTP_PASSWORD'),
    from: getEnvVar('SMTP_FROM', 'noreply@aisaas.com'),
  },

  // AI
  ai: {
    openaiApiKey: getEnvVar('OPENAI_API_KEY'),
    openaiOrgId: getEnvVar('OPENAI_ORG_ID'),
    model: getEnvVar('OPENAI_MODEL', 'gpt-4o-mini'),
    mockMode: getEnvBoolean('AI_MOCK_MODE', false),
    requestTimeout: getEnvNumber('AI_REQUEST_TIMEOUT', 60000),
    maxTokens: getEnvNumber('AI_MAX_TOKENS', 4096),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 60000),
    maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    aiPerMinute: getEnvNumber('AI_RATE_LIMIT_PER_MINUTE', 10),
  },

  // User Limits
  userLimits: {
    defaultDaily: getEnvNumber('DEFAULT_DAILY_AI_LIMIT', 50),
    premiumDaily: getEnvNumber('PREMIUM_DAILY_AI_LIMIT', 500),
  },

  // Security
  security: {
    bcryptRounds: getEnvNumber('BCRYPT_SALT_ROUNDS', 12),
    csrfSecret: getEnvVar('CSRF_SECRET', 'csrf-secret'),
  },

  // Features
  features: {
    emailVerification: getEnvBoolean('ENABLE_EMAIL_VERIFICATION', true),
    passwordReset: getEnvBoolean('ENABLE_PASSWORD_RESET', true),
    websockets: getEnvBoolean('ENABLE_WEBSOCKETS', false),
  },

  // File Upload
  upload: {
    maxSize: getEnvNumber('MAX_FILE_SIZE', 10485760),
    allowedTypes: getEnvVar('ALLOWED_FILE_TYPES', 'image/jpeg,image/png,image/gif,application/pdf').split(','),
  },

  // Logging
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    auditEnabled: getEnvBoolean('ENABLE_AUDIT_LOG', true),
  },
} as const;

export default config;
