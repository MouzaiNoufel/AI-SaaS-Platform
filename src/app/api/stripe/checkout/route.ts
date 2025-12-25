import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS, formatPrice } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { config } from '@/lib/config';

// GET /api/stripe/checkout - Create checkout session
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, interval = 'monthly' } = body;

    if (!plan || !['STARTER', 'PRO', 'ENTERPRISE'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!config.stripe.secretKey || config.stripe.secretKey === 'sk_test_placeholder') {
      return NextResponse.json(
        { error: 'Payment system is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS];
    const price = interval === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;

    // Get or create Stripe customer
    let stripeCustomerId = auth.user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: auth.user.email,
        name: auth.user.name || undefined,
        metadata: {
          userId: auth.user.id,
        },
      });
      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: auth.user.id },
        data: { stripeCustomerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${selectedPlan.name} Plan`,
              description: selectedPlan.features.join(', '),
            },
            unit_amount: price,
            recurring: {
              interval: interval === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${config.app.url}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.app.url}/dashboard/billing?canceled=true`,
      metadata: {
        userId: auth.user.id,
        plan: plan,
        interval: interval,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// GET /api/stripe/checkout - Get available plans
export async function GET() {
  const plans = Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    ...plan,
    monthlyPriceFormatted: formatPrice(plan.monthlyPrice),
    yearlyPriceFormatted: formatPrice(plan.yearlyPrice),
    yearlySavings: formatPrice((plan.monthlyPrice * 12) - plan.yearlyPrice),
  }));

  return NextResponse.json({ plans });
}
