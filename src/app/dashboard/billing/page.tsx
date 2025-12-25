'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  Check,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Receipt,
  Calendar,
  Zap,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  type: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceFormatted: string;
  yearlyPriceFormatted: string;
  yearlySavings: string;
  dailyRequests: number;
  monthlyTokens: number;
  features: string[];
}

interface Subscription {
  plan: string;
  status: string;
  dailyRequestLimit: number;
  monthlyTokenLimit: number;
  tokensUsedThisMonth: number;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  paidAt: string | null;
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setMessage({ type: 'success', text: 'Payment successful! Your subscription is now active.' });
    } else if (searchParams.get('canceled') === 'true') {
      setMessage({ type: 'error', text: 'Payment was canceled.' });
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes, paymentsRes] = await Promise.all([
        fetch('/api/stripe/checkout'),
        fetch('/api/stripe/subscription'),
        fetch('/api/stripe/payments'),
      ]);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans);
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription);
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setActionLoading(planId);
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, interval }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to start checkout' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start checkout' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      setActionLoading('portal');
      const response = await fetch('/api/stripe/portal');
      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to open billing portal' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to open billing portal' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      setActionLoading('cancel');
      const response = await fetch('/api/stripe/subscription', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to cancel subscription' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel subscription' });
    } finally {
      setActionLoading(null);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-600'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {/* Current Subscription */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Current Plan</h2>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">
                {subscription?.plan || 'FREE'}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  subscription?.status === 'ACTIVE'
                    ? 'bg-green-500/10 text-green-600'
                    : subscription?.status === 'PAST_DUE'
                    ? 'bg-yellow-500/10 text-yellow-600'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {subscription?.status || 'ACTIVE'}
              </span>
            </div>
            {subscription?.cancelAtPeriodEnd && (
              <p className="text-sm text-yellow-600 mt-2">
                Your subscription will be canceled on{' '}
                {subscription.currentPeriodEnd
                  ? formatDate(subscription.currentPeriodEnd)
                  : 'the end of the billing period'}
              </p>
            )}
          </div>
          {subscription?.plan && subscription.plan !== 'FREE' && (
            <button
              onClick={handleManageBilling}
              disabled={actionLoading === 'portal'}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
            >
              {actionLoading === 'portal' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Manage Billing
            </button>
          )}
        </div>

        {/* Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Zap className="h-4 w-4" />
              Daily Requests
            </div>
            <div className="text-2xl font-bold">
              {subscription?.dailyRequestLimit || 50}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}/ day
              </span>
            </div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              Monthly Tokens
            </div>
            <div className="text-2xl font-bold">
              {formatTokens(subscription?.tokensUsedThisMonth || 0)}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}/ {formatTokens(subscription?.monthlyTokenLimit || 100000)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Available Plans</h2>
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                interval === 'monthly'
                  ? 'bg-background shadow'
                  : 'hover:bg-background/50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                interval === 'yearly'
                  ? 'bg-background shadow'
                  : 'hover:bg-background/50'
              }`}
            >
              Yearly
              <span className="ml-1 text-xs text-green-600">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.type;
            const price = interval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const priceFormatted =
              interval === 'yearly'
                ? plan.yearlyPriceFormatted
                : plan.monthlyPriceFormatted;

            return (
              <div
                key={plan.id}
                className={`bg-card border rounded-lg p-6 flex flex-col ${
                  isCurrentPlan ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{priceFormatted}</span>
                    <span className="text-muted-foreground">
                      /{interval === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-2 px-4 border rounded-lg text-center bg-muted cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : plan.type === 'FREE' ? (
                  subscription?.plan !== 'FREE' ? (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={actionLoading === 'cancel'}
                      className="w-full py-2 px-4 border rounded-lg text-center hover:bg-muted transition-colors"
                    >
                      {actionLoading === 'cancel' ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        'Downgrade to Free'
                      )}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2 px-4 border rounded-lg text-center bg-muted cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={actionLoading === plan.id}
                    className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {actionLoading === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>
        <div className="bg-card border rounded-lg overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payments yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Description</th>
                  <th className="text-left p-4 font-medium">Amount</th>
                  <th className="text-left p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </td>
                    <td className="p-4">{payment.description}</td>
                    <td className="p-4">
                      {formatAmount(payment.amount, payment.currency)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.status === 'SUCCEEDED'
                            ? 'bg-green-500/10 text-green-600'
                            : payment.status === 'FAILED'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
