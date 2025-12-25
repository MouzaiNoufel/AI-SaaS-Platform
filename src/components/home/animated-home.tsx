'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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
  Star,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FadeInWhenVisible,
  HoverCard,
  FloatAnimation,
} from '@/components/ui/animations';

const tools = [
  {
    name: 'Text Generation',
    description: 'Generate high-quality content, articles, and creative text with advanced AI.',
    icon: FileText,
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Code Assistant',
    description: 'Write, debug, and optimize code with AI-powered assistance.',
    icon: Code,
    color: 'bg-green-500',
    gradient: 'from-green-500 to-green-600',
  },
  {
    name: 'Summarization',
    description: 'Condense long documents into clear, concise summaries.',
    icon: Zap,
    color: 'bg-yellow-500',
    gradient: 'from-yellow-500 to-yellow-600',
  },
  {
    name: 'Translation',
    description: 'Translate text between 100+ languages with high accuracy.',
    icon: Languages,
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    name: 'AI Chat',
    description: 'Engage in intelligent conversations with our advanced chatbot.',
    icon: MessageSquare,
    color: 'bg-pink-500',
    gradient: 'from-pink-500 to-pink-600',
  },
  {
    name: 'Data Analysis',
    description: 'Extract insights and patterns from your data automatically.',
    icon: BarChart3,
    color: 'bg-orange-500',
    gradient: 'from-orange-500 to-orange-600',
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

const stats = [
  { value: '10M+', label: 'AI Requests Processed' },
  { value: '50K+', label: 'Active Users' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '4.9/5', label: 'User Rating' },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export function AnimatedHomePage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        {/* Animated background shapes */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -20, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"
          />
        </div>

        <div className="container">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div 
              variants={itemVariants}
              className="mb-6 inline-flex items-center rounded-full border bg-background/80 backdrop-blur px-4 py-1.5 text-sm shadow-sm"
            >
              <FloatAnimation>
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
              </FloatAnimation>
              <span>Powered by Advanced AI</span>
              <ChevronRight className="ml-1 h-4 w-4 text-muted-foreground" />
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Transform Your Work with{' '}
              <span className="text-gradient-animate">AI-Powered</span> Tools
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="mt-6 text-lg text-muted-foreground md:text-xl"
            >
              Access a comprehensive suite of intelligent tools designed to boost your
              productivity. From text generation to code assistance, we&apos;ve got you covered.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="group" asChild>
                  <Link href="/register">
                    Get Started Free
                    <motion.span
                      className="ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.span>
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" asChild>
                  <Link href="/tools">Explore Tools</Link>
                </Button>
              </motion.div>
            </motion.div>

            <motion.p 
              variants={itemVariants}
              className="mt-4 text-sm text-muted-foreground"
            >
              No credit card required • 50 free requests daily
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <FadeInWhenVisible className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Powerful AI Tools at Your Fingertips
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to supercharge your productivity with artificial intelligence.
            </p>
          </FadeInWhenVisible>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {tools.map((tool, index) => (
              <motion.div key={tool.name} variants={itemVariants}>
                <HoverCard hoverScale={1.03}>
                  <Card className="group relative h-full overflow-hidden transition-all hover:shadow-xl border-0 bg-card/50 backdrop-blur">
                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    <CardHeader>
                      <motion.div 
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${tool.gradient} shadow-lg`}
                      >
                        <tool.icon className="h-6 w-6 text-white" />
                      </motion.div>
                      <CardTitle className="mt-4">{tool.name}</CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link 
                        href={`/tools/${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="inline-flex items-center text-sm font-medium text-primary hover:underline group/link"
                      >
                        Try it now
                        <motion.span
                          className="ml-1"
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.span>
                      </Link>
                    </CardContent>
                  </Card>
                </HoverCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-4"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label} 
                variants={scaleVariants}
                className="text-center"
              >
                <motion.div 
                  className="text-4xl font-bold text-gradient-animate"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  {stat.value}
                </motion.div>
                <div className="mt-2 text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <FadeInWhenVisible className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by Thousands of Users
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See what our customers have to say about their experience.
            </p>
          </FadeInWhenVisible>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="mt-16 grid gap-8 md:grid-cols-3"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={testimonial.author} variants={itemVariants}>
                <HoverCard>
                  <Card className="relative h-full border-0 bg-card/50 backdrop-blur">
                    <CardHeader>
                      <motion.div 
                        className="flex gap-1"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 + i * 0.05 }}
                          >
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          </motion.div>
                        ))}
                      </motion.div>
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
                </HoverCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container">
          <FadeInWhenVisible className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that best fits your needs. All plans include a 14-day free trial.
            </p>
          </FadeInWhenVisible>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="mt-16 grid gap-8 md:grid-cols-3"
          >
            {pricingPlans.map((plan, index) => (
              <motion.div 
                key={plan.name} 
                variants={itemVariants}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className={`relative h-full ${plan.popular ? 'border-primary shadow-lg shadow-primary/20' : 'border-0 bg-card/50 backdrop-blur'}`}
                >
                  {plan.popular && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                    >
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                        Most Popular
                      </span>
                    </motion.div>
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
                      {plan.features.map((feature, featureIndex) => (
                        <motion.li 
                          key={feature} 
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: featureIndex * 0.05 }}
                        >
                          <Check className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        className="mt-8 w-full" 
                        variant={plan.popular ? 'default' : 'outline'}
                        asChild
                      >
                        <Link href="/register">{plan.cta}</Link>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Animated background */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />

        <div className="container relative">
          <FadeInWhenVisible className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Transform Your Workflow?
            </h2>
            <p className="mt-4 text-lg opacity-90">
              Join thousands of professionals already using our AI tools to work smarter.
            </p>
            <motion.div 
              className="mt-10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" variant="secondary" className="shadow-lg" asChild>
                <Link href="/register">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </FadeInWhenVisible>
        </div>
      </section>
    </main>
  );
}
