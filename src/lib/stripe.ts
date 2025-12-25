import Stripe from 'stripe';
import { config } from './config';

if (!config.stripe.secretKey && process.env.NODE_ENV === 'production') {
  console.warn('Stripe secret key is not configured');
}

export const stripe = new Stripe(config.stripe.secretKey || 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: 'Free',
    type: 'FREE' as const,
    monthlyPrice: 0,
    yearlyPrice: 0,
    dailyRequests: 50,
    monthlyTokens: 100000,
    features: [
      '50 AI requests per day',
      '100K tokens per month',
      'Basic AI tools',
      'Email support',
    ],
  },
  STARTER: {
    name: 'Starter',
    type: 'STARTER' as const,
    monthlyPrice: 999, // $9.99
    yearlyPrice: 9999, // $99.99
    dailyRequests: 200,
    monthlyTokens: 500000,
    features: [
      '200 AI requests per day',
      '500K tokens per month',
      'All AI tools',
      'Chat history',
      'Priority support',
    ],
  },
  PRO: {
    name: 'Pro',
    type: 'PRO' as const,
    monthlyPrice: 2999, // $29.99
    yearlyPrice: 29999, // $299.99
    dailyRequests: 1000,
    monthlyTokens: 2000000,
    features: [
      '1,000 AI requests per day',
      '2M tokens per month',
      'All AI tools',
      'Unlimited chat history',
      'API access',
      'Priority support',
      'Advanced analytics',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    type: 'ENTERPRISE' as const,
    monthlyPrice: 9999, // $99.99
    yearlyPrice: 99999, // $999.99
    dailyRequests: 10000,
    monthlyTokens: 10000000,
    features: [
      'Unlimited AI requests',
      '10M tokens per month',
      'All AI tools',
      'Unlimited chat history',
      'Full API access',
      'Dedicated support',
      'Custom integrations',
      'Team features',
      'SLA guarantee',
    ],
  },
};

export type PlanType = keyof typeof PLANS;

export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceInCents / 100);
}
