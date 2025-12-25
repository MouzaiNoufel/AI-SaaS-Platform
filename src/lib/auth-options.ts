import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { config } from './config';

export const authOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: config.oauth.google.clientId || '',
      clientSecret: config.oauth.google.clientSecret || '',
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: config.oauth.github.clientId || '',
      clientSecret: config.oauth.github.clientSecret || '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(String(credentials.password), user.password);

        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('Account is not active');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        // Check if user exists with this email
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        // Get linked accounts
        const linkedAccounts = existingUser 
          ? await prisma.account.findMany({ where: { userId: existingUser.id } })
          : [];

        if (existingUser) {
          // Check if this provider is already linked
          const linkedAccount = linkedAccounts.find(
            (acc: { provider: string }) => acc.provider === account.provider
          );

          if (!linkedAccount) {
            // Link the new provider to existing account
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });
          }

          // Update user info if needed
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              status: 'ACTIVE',
              emailVerified: true,
              lastLoginAt: new Date(),
              ...(user.image && !existingUser.avatar && { avatar: user.image }),
            },
          });
        } else {
          // Create new user for OAuth
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || 'User',
              avatar: user.image,
              status: 'ACTIVE',
              emailVerified: true,
              role: 'USER',
            },
          });

          // Create account link
          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });

          // Create free subscription
          await prisma.subscription.create({
            data: {
              userId: newUser.id,
              plan: 'FREE',
              status: 'ACTIVE',
              dailyRequestLimit: 50,
              monthlyTokenLimit: 100000,
            },
          });
        }
      }

      return true;
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'USER';
      }

      if (account) {
        token.accessToken = account.access_token || undefined;
        token.provider = account.provider;
      }

      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.provider = token.provider;
      }

      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: config.auth.jwtSecret,
};
