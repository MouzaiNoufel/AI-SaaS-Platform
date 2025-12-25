import Link from 'next/link';
import { 
  Sparkles, 
  Zap, 
  Code, 
  FileText, 
  Languages, 
  MessageSquare, 
  BarChart3,
  ArrowRight,
  Check,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const tools = [
  {
    name: 'Text Generation',
    description: 'Generate high-quality content, articles, and creative text with advanced AI.',
    icon: FileText,
    color: 'bg-blue-500',
  },
  {
    name: 'Code Assistant',
    description: 'Write, debug, and optimize code with AI-powered assistance.',
    icon: Code,
    color: 'bg-green-500',
  },
  {
    name: 'Summarization',
    description: 'Condense long documents into clear, concise summaries.',
    icon: Zap,
    color: 'bg-yellow-500',
  },
  {
    name: 'Translation',
    description: 'Translate text between 100+ languages with high accuracy.',
    icon: Languages,
    color: 'bg-purple-500',
  },
  {
    name: 'AI Chat',
    description: 'Engage in intelligent conversations with our advanced chatbot.',
    icon: MessageSquare,
    color: 'bg-pink-500',
  },
  {
    name: 'Data Analysis',
    description: 'Extract insights and patterns from your data automatically.',
    icon: BarChart3,
    color: 'bg-orange-500',
  },
];

const pricingPlans = [
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
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For professionals and growing teams',
    features: [
      '500 AI requests per day',
      'Access to all tools',
      'Priority response time',
      'Email support',
      'API access',
      'Advanced analytics',
    ],
    cta: 'Start Free Trial',
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
      'Dedicated support',
      'SLA guarantee',
      'SSO & advanced security',
      'On-premise deployment option',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const testimonials = [
  {
    content: "This AI platform has transformed how our team works. We've cut content creation time by 70%.",
    author: 'Sarah Chen',
    role: 'Marketing Director',
    company: 'TechCorp',
    rating: 5,
  },
  {
    content: "The code assistant is incredible. It's like having a senior developer available 24/7.",
    author: 'Michael Rodriguez',
    role: 'Lead Developer',
    company: 'StartupXYZ',
    rating: 5,
  },
  {
    content: "Best investment we've made this year. The ROI has been phenomenal.",
    author: 'Emma Thompson',
    role: 'CEO',
    company: 'InnovateCo',
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm">
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                <span>Powered by Advanced AI</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Transform Your Work with{' '}
                <span className="gradient-text">AI-Powered</span> Tools
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                Access a comprehensive suite of intelligent tools designed to boost your
                productivity. From text generation to code assistance, we&apos;ve got you covered.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/tools">Explore Tools</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required • 50 free requests daily
              </p>
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section className="py-20 bg-muted/50">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Powerful AI Tools at Your Fingertips
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to supercharge your productivity with artificial intelligence.
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <Card key={tool.name} className="group relative overflow-hidden transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${tool.color}`}>
                      <tool.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="mt-4">{tool.name}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link 
                      href={`/tools/${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      Try it now
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-4">
              {[
                { value: '10M+', label: 'AI Requests Processed' },
                { value: '50K+', label: 'Active Users' },
                { value: '99.9%', label: 'Uptime SLA' },
                { value: '4.9/5', label: 'User Rating' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="mt-2 text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-muted/50">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Loved by Thousands of Users
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                See what our customers have to say about their experience.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.author} className="relative">
                  <CardHeader>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">&quot;{testimonial.content}&quot;</p>
                    <div className="mt-6">
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Choose the plan that best fits your needs. All plans include a 14-day free trial.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {pricingPlans.map((plan) => (
                <Card 
                  key={plan.name} 
                  className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="mt-8 w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href="/register">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Transform Your Workflow?
              </h2>
              <p className="mt-4 text-lg opacity-90">
                Join thousands of professionals already using our AI tools to work smarter.
              </p>
              <div className="mt-10">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/register">
                    Get Started for Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
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
