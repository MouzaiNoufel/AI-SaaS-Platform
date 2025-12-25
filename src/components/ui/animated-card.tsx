'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'scale' | 'glow' | 'tilt' | 'border' | 'none';
  delay?: number;
}

const hoverVariants = {
  lift: {
    rest: { y: 0, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
    hover: { y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
  },
  scale: {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
  },
  glow: {
    rest: { boxShadow: '0 0 0 0 hsl(var(--primary) / 0)' },
    hover: { boxShadow: '0 0 30px 5px hsl(var(--primary) / 0.2)' },
  },
  tilt: {
    rest: { rotateX: 0, rotateY: 0 },
    hover: { rotateX: 5, rotateY: 5 },
  },
  border: {
    rest: { borderColor: 'hsl(var(--border))' },
    hover: { borderColor: 'hsl(var(--primary))' },
  },
  none: {
    rest: {},
    hover: {},
  },
};

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, hoverEffect = 'lift', delay = 0, ...props }, ref) => {
    const variants = hoverVariants[hoverEffect];

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          className
        )}
        initial="rest"
        whileHover="hover"
        animate="rest"
        variants={variants}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCard.displayName = 'AnimatedCard';

// Card with entrance animation
interface EntranceCardProps extends AnimatedCardProps {
  index?: number;
}

const EntranceCard = React.forwardRef<HTMLDivElement, EntranceCardProps>(
  ({ children, className, index = 0, hoverEffect = 'lift', ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          className
        )}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        whileHover={hoverVariants[hoverEffect].hover}
        transition={{
          duration: 0.5,
          delay: index * 0.1,
          ease: 'easeOut',
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
EntranceCard.displayName = 'EntranceCard';

// Flip card
interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}

function FlipCard({ front, back, className }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  return (
    <div
      className={cn('relative cursor-pointer perspective-1000', className)}
      onClick={() => setIsFlipped(!isFlipped)}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-lg border bg-card text-card-foreground shadow-sm p-6"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 rounded-lg border bg-card text-card-foreground shadow-sm p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}

// Expandable card
interface ExpandableCardProps {
  children: React.ReactNode;
  expandedContent: React.ReactNode;
  className?: string;
}

function ExpandableCard({ children, expandedContent, className }: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <motion.div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm cursor-pointer overflow-hidden',
        className
      )}
      onClick={() => setIsExpanded(!isExpanded)}
      layout
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <motion.div layout="position" className="p-6">
        {children}
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="p-6 pt-0 border-t">{expandedContent}</div>
      </motion.div>
    </motion.div>
  );
}

// Card with shine effect
const ShineCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden group',
          className
        )}
        whileHover="hover"
        initial="rest"
        {...props}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
          variants={{
            rest: { x: '-100%' },
            hover: { x: '100%' },
          }}
          transition={{ duration: 0.6 }}
        />
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);
ShineCard.displayName = 'ShineCard';

// Glass card with blur effect
const GlassCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, hoverEffect = 'lift', ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-lg border border-white/10 bg-white/5 backdrop-blur-lg text-card-foreground shadow-lg',
          className
        )}
        initial="rest"
        whileHover="hover"
        variants={hoverVariants[hoverEffect]}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

// Card with gradient border
const GradientBorderCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative rounded-lg p-[2px] bg-gradient-to-br from-primary via-blue-500 to-primary',
          className
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        <div className="rounded-[6px] bg-card p-6 h-full">{children}</div>
      </motion.div>
    );
  }
);
GradientBorderCard.displayName = 'GradientBorderCard';

// Stats card with animated number
interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  className?: string;
}

function StatsCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  trendValue,
  className 
}: StatsCardProps) {
  return (
    <motion.div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm p-6',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <motion.div
        className="mt-2"
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, type: 'spring' }}
      >
        <span className="text-3xl font-bold">{value}</span>
      </motion.div>
      {(description || trend) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                'text-xs font-medium',
                trend === 'up' ? 'text-green-500' : 'text-red-500'
              )}
            >
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </span>
          )}
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export {
  AnimatedCard,
  EntranceCard,
  FlipCard,
  ExpandableCard,
  ShineCard,
  GlassCard,
  GradientBorderCard,
  StatsCard,
};
