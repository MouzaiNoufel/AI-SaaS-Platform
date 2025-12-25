# AI SaaS Platform

A **complete, production-ready AI Software-as-a-Service (SaaS) web platform** built with Next.js 14, featuring a comprehensive set of AI-powered tools, user management, and admin dashboard.

![Platform Preview](./docs/preview.png)

## 🚀 Features

### Core Features
- **AI Tool Catalog**: Multiple AI-powered tools for text generation, code assistance, translation, summarization, and more
- **User Authentication**: Secure JWT-based authentication with email verification and password reset
- **User Dashboard**: Personal dashboard with usage statistics, request history, and profile management
- **Admin Panel**: Complete admin dashboard for user management, analytics, and system monitoring
- **Dark/Light Mode**: Full theme support with system preference detection

### AI Capabilities
- Text Generation
- Code Assistant
- Content Summarization
- Language Translation
- Data Analysis
- Custom Chatbots

### User Features
- User registration and authentication
- Email verification
- Password reset functionality
- Profile customization
- Usage tracking and history
- Notification system

### Admin Features
- User management (activate/suspend/role changes)
- AI tool management (CRUD operations)
- Analytics dashboard with charts
- System health monitoring
- Audit logs and system logs
- Contact message management

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **UI Components** | Radix UI + custom components |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Authentication** | JWT (jose library) |
| **Forms** | React Hook Form + Zod |
| **State** | React Context API |
| **AI Integration** | OpenAI API |

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.17 or later
- **PostgreSQL** 14 or later
- **npm** or **yarn** or **pnpm**

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-saas-platform.git
cd ai-saas-platform
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_saas_db?schema=public"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_REFRESH_SECRET="your-refresh-token-secret-minimum-32-characters"

# OpenAI (for AI features)
OPENAI_API_KEY="sk-your-openai-api-key"

# Email (optional, for email notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-smtp-password"
EMAIL_FROM="AI SaaS <noreply@example.com>"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="AI SaaS Platform"

# Rate Limiting (optional)
RATE_LIMIT_ENABLED="true"
```

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database with initial data
npx prisma db seed
```

### 5. Start the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at `http://localhost:3000`

### Default Accounts

After seeding, you can use these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin123! |
| User | user@example.com | User123! |

## 📁 Project Structure

```
ai-saas-platform/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding script
├── src/
│   ├── app/
│   │   ├── (auth)/         # Authentication pages
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # User dashboard pages
│   │   ├── tools/          # Public tools listing
│   │   ├── pricing/        # Pricing page
│   │   ├── contact/        # Contact page
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing page
│   ├── components/
│   │   ├── layout/         # Layout components (navbar, footer, sidebars)
│   │   └── ui/             # Reusable UI components
│   ├── contexts/           # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and configurations
│   └── middleware.ts       # Next.js middleware for auth protection
├── public/                 # Static assets
├── .env.example            # Environment variables template
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🔐 API Routes

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/verify-email` | Verify email address |

### AI Tools

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tools` | List all AI tools |
| GET | `/api/tools/[slug]` | Get specific tool |
| POST | `/api/tools` | Create tool (admin) |
| PUT | `/api/tools/[id]` | Update tool (admin) |
| DELETE | `/api/tools/[id]` | Delete tool (admin) |

### AI Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate` | Execute AI request |
| GET | `/api/user/requests` | Get user's request history |
| DELETE | `/api/user/requests/[id]` | Delete request |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update profile |
| PUT | `/api/user/password` | Change password |
| DELETE | `/api/user/account` | Delete account |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/[id]` | Update user |
| GET | `/api/admin/analytics` | Get analytics data |
| GET | `/api/admin/logs` | Get system logs |
| GET | `/api/admin/health` | Get system health |

## 🎨 Customization

### Theming

The platform uses CSS variables for theming. Customize colors in `src/app/globals.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  /* ... other variables */
}

.dark {
  --primary: 217.2 91.2% 59.8%;
  --secondary: 217.2 32.6% 17.5%;
  /* ... other variables */
}
```

### Adding New AI Tools

1. Create the tool in the admin dashboard
2. Or add via database seed in `prisma/seed.ts`
3. Implement custom logic in `src/lib/ai-service.ts`

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## 📦 Production Deployment

### Build for production

```bash
npm run build
```

### Environment Setup

For production, ensure:

1. Set strong, unique secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`
2. Use a production PostgreSQL database
3. Configure proper CORS and security headers
4. Set up SSL/TLS
5. Configure email service for transactional emails

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t ai-saas-platform .
docker run -p 3000:3000 ai-saas-platform
```

## 📋 Database Commands

```bash
# View database in Prisma Studio
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy
```

## 🔧 Troubleshooting

### Common Issues

**Database connection fails**
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

**Prisma client not generated**
```bash
npx prisma generate
```

**Build fails with type errors**
```bash
npm run type-check
```

**Styles not loading**
- Clear `.next` cache: `rm -rf .next`
- Rebuild: `npm run build`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Radix UI](https://radix-ui.com/) - Accessible UI primitives
- [Prisma](https://prisma.io/) - Next-generation ORM
- [OpenAI](https://openai.com/) - AI capabilities

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/ai-saas-platform/issues)
- **Email**: support@ai-saas.example.com

---

Built with ❤️ by [Your Name]
