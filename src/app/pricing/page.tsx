import Link from 'next/link';
import { Check, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out our AI tools',
    features: [
      '50 AI requests per day',
      'Access to all basic tools',
      'Standard response time',
      'Community support',
      'Basic analytics',
    ],
    limitations: [
      'No API access',
      'No priority support',
    ],
    cta: 'Get Started',
    ctaVariant: 'outline' as const,
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For professionals and growing teams',
    features: [
      '500 AI requests per day',
      'Access to all tools including premium',
      'Priority response time',
      'Email support (24h response)',
      'Advanced analytics',
      'API access',
      'Custom integrations',
      'Export capabilities',
    ],
    limitations: [],
    cta: 'Start Free Trial',
    ctaVariant: 'default' as const,
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'per month',
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited AI requests',
      'Custom AI models',
      'Dedicated account manager',
      'SLA guarantee (99.9% uptime)',
      'SSO & advanced security',
      'On-premise deployment option',
      'Custom training & onboarding',
      'Priority phone support',
      'Custom API limits',
    ],
    limitations: [],
    cta: 'Contact Sales',
    ctaVariant: 'outline' as const,
    popular: false,
  },
];

const faqs = [
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.',
  },
  {
    q: 'Is there a free trial for the Pro plan?',
    a: 'Yes! We offer a 14-day free trial for the Pro plan. No credit card required to start.',
  },
  {
    q: 'What happens if I exceed my daily request limit?',
    a: 'If you reach your daily limit, you can either upgrade your plan or wait until the next day when your quota resets.',
  },
  {
    q: 'Do you offer discounts for annual billing?',
    a: 'Yes, we offer a 20% discount when you choose annual billing. Contact our sales team for more details.',
  },
  {
    q: 'Can I switch plans at any time?',
    a: 'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can pay via invoice.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4">
                <Sparkles className="mr-1 h-3 w-3" />
                Simple pricing
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Choose the Right Plan for You
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Start free and scale as you grow. All plans include a 14-day free trial.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${
                    plan.popular ? 'border-primary shadow-lg scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.price !== 'Custom' && (
                        <span className="text-muted-foreground">/{plan.period}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                      {plan.limitations.map((limitation) => (
                        <li key={limitation} className="flex items-start gap-3 text-muted-foreground">
                          <span className="h-5 w-5 shrink-0 text-center">—</span>
                          <span className="text-sm">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={plan.ctaVariant}
                      size="lg"
                      asChild
                    >
                      <Link href={plan.name === 'Enterprise' ? '/contact' : '/register'}>
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Comparison */}
        <section className="py-16 bg-muted/50">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Compare Plans</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-4 px-6 text-left">Feature</th>
                    <th className="py-4 px-6 text-center">Free</th>
                    <th className="py-4 px-6 text-center">Pro</th>
                    <th className="py-4 px-6 text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ['Daily Requests', '50', '500', 'Unlimited'],
                    ['AI Tools Access', 'Basic', 'All', 'All + Custom'],
                    ['Response Time', 'Standard', 'Priority', 'Fastest'],
                    ['Support', 'Community', 'Email', 'Dedicated'],
                    ['API Access', '❌', '✅', '✅'],
                    ['Custom Integrations', '❌', '✅', '✅'],
                    ['Analytics', 'Basic', 'Advanced', 'Custom'],
                    ['SLA Guarantee', '❌', '❌', '99.9%'],
                    ['SSO', '❌', '❌', '✅'],
                  ].map(([feature, free, pro, enterprise], i) => (
                    <tr key={i} className="hover:bg-muted/50">
                      <td className="py-4 px-6 font-medium">{feature}</td>
                      <td className="py-4 px-6 text-center">{free}</td>
                      <td className="py-4 px-6 text-center">{pro}</td>
                      <td className="py-4 px-6 text-center">{enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-center text-muted-foreground mb-12">
                Can&apos;t find what you&apos;re looking for?{' '}
                <Link href="/contact" className="text-primary hover:underline">
                  Contact us
                </Link>
              </p>
              <div className="space-y-6">
                {faqs.map((faq, i) => (
                  <div key={i} className="rounded-lg border p-6">
                    <h3 className="flex items-start gap-3 font-semibold">
                      <HelpCircle className="h-5 w-5 shrink-0 text-primary" />
                      {faq.q}
                    </h3>
                    <p className="mt-3 text-muted-foreground pl-8">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
              <p className="mt-4 opacity-90">
                Join thousands of professionals already using our AI tools.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/register">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
