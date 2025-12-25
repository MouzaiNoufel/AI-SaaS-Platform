import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  if (!config.stripe.webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripe.webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as 'STARTER' | 'PRO' | 'ENTERPRISE';
        const subscriptionId = session.subscription as string;

        if (userId && plan && subscriptionId) {
          const planLimits = {
            STARTER: { daily: 200, monthly: 500000 },
            PRO: { daily: 1000, monthly: 2000000 },
            ENTERPRISE: { daily: 10000, monthly: 10000000 },
          };

          const limits = planLimits[plan];

          // Get subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: subscription.items.data[0]?.price.id,
              plan,
              status: 'ACTIVE',
              dailyRequestLimit: limits.daily,
              monthlyTokenLimit: limits.monthly,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
            update: {
              stripeSubscriptionId: subscriptionId,
              stripePriceId: subscription.items.data[0]?.price.id,
              plan,
              status: 'ACTIVE',
              dailyRequestLimit: limits.daily,
              monthlyTokenLimit: limits.monthly,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });

          // Update user daily limit
          await prisma.user.update({
            where: { id: userId },
            data: { dailyLimit: limits.daily },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const stripeSubscriptionId = subscription.id;

        const existingSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId },
        });

        if (existingSub) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId },
            data: {
              status: subscription.status.toUpperCase() as any,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const stripeSubscriptionId = subscription.id;

        const existingSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId },
          include: { user: true },
        });

        if (existingSub) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId },
            data: {
              status: 'CANCELED',
              plan: 'FREE',
              dailyRequestLimit: 50,
              monthlyTokenLimit: 100000,
            },
          });

          // Reset user to free limits
          await prisma.user.update({
            where: { id: existingSub.userId },
            data: { dailyLimit: 50 },
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.payment.create({
            data: {
              userId: user.id,
              stripePaymentId: invoice.payment_intent as string,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'SUCCEEDED',
              description: `Invoice ${invoice.number}`,
              paidAt: new Date(),
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.payment.create({
            data: {
              userId: user.id,
              stripePaymentId: invoice.payment_intent as string,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_due,
              currency: invoice.currency,
              status: 'FAILED',
              description: `Failed payment for invoice ${invoice.number}`,
            },
          });

          // Update subscription status
          await prisma.subscription.updateMany({
            where: { userId: user.id },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
