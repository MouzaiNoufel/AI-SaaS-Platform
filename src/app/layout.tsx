import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI SaaS Platform - Intelligent Tools for Modern Business',
  description: 'Transform your workflow with our comprehensive suite of AI-powered tools. Text generation, code assistance, summarization, translation, and more.',
  keywords: ['AI', 'SaaS', 'artificial intelligence', 'text generation', 'code assistant', 'productivity'],
  authors: [{ name: 'AI SaaS Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-saas.example.com',
    siteName: 'AI SaaS Platform',
    title: 'AI SaaS Platform - Intelligent Tools for Modern Business',
    description: 'Transform your workflow with our comprehensive suite of AI-powered tools.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI SaaS Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI SaaS Platform - Intelligent Tools for Modern Business',
    description: 'Transform your workflow with our comprehensive suite of AI-powered tools.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
