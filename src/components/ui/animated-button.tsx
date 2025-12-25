'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

const animatedButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient:
          'bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg hover:shadow-primary/25',
        glow:
          'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        xl: 'h-12 rounded-md px-10 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface AnimatedButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof animatedButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  hoverScale?: number;
  tapScale?: number;
  pulse?: boolean;
  bounce?: boolean;
  shimmer?: boolean;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading, 
    children, 
    disabled,
    hoverScale = 1.02,
    tapScale = 0.98,
    pulse = false,
    bounce = false,
    shimmer = false,
    ...props 
  }, ref) => {
    const buttonContent = loading ? (
      <>
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Loading...
      </>
    ) : (
      children
    );

    const pulseAnimation = pulse ? {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    } : {};

    const bounceAnimation = bounce ? {
      y: [0, -5, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    } : {};

    return (
      <motion.button
        className={cn(
          animatedButtonVariants({ variant, size, className }),
          shimmer && 'relative overflow-hidden',
          pulse && 'animate-pulse-soft'
        )}
        ref={ref}
        disabled={disabled || loading}
        whileHover={{ 
          scale: disabled || loading ? 1 : hoverScale,
        }}
        whileTap={{ 
          scale: disabled || loading ? 1 : tapScale,
        }}
        animate={{
          ...pulseAnimation,
          ...bounceAnimation,
        }}
        {...props}
      >
        {shimmer && (
          <motion.div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['0%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        )}
        <span className="relative z-10">{buttonContent}</span>
      </motion.button>
    );
  }
);
AnimatedButton.displayName = 'AnimatedButton';

// Icon button with animation
export interface AnimatedIconButtonProps extends AnimatedButtonProps {
  icon: React.ReactNode;
  spin?: boolean;
  wiggle?: boolean;
}

const AnimatedIconButton = React.forwardRef<HTMLButtonElement, AnimatedIconButtonProps>(
  ({ icon, spin = false, wiggle = false, className, ...props }, ref) => {
    return (
      <AnimatedButton
        ref={ref}
        size="icon"
        className={cn(
          spin && 'hover:[&>span>*]:animate-spin',
          wiggle && 'hover:[&>span>*]:animate-wiggle',
          className
        )}
        {...props}
      >
        {icon}
      </AnimatedButton>
    );
  }
);
AnimatedIconButton.displayName = 'AnimatedIconButton';

// Button with ripple effect
const RippleButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, children, variant, size, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<{ x: number; y: number; id: number }[]>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      
      setRipples(prev => [...prev, { x, y, id }]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          animatedButtonVariants({ variant, size }),
          'relative overflow-hidden',
          className
        )}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
            }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ 
              width: 200, 
              height: 200, 
              x: -100, 
              y: -100, 
              opacity: 0 
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }
);
RippleButton.displayName = 'RippleButton';

// Magnetic button that follows cursor
interface MagneticButtonProps extends AnimatedButtonProps {
  strength?: number;
}

const MagneticButton = React.forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ className, children, variant, size, strength = 0.3, ...props }, ref) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      setPosition({ x, y });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    return (
      <motion.button
        ref={buttonRef}
        className={cn(animatedButtonVariants({ variant, size }), className)}
        animate={{ x: position.x, y: position.y }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
MagneticButton.displayName = 'MagneticButton';

// 3D Button
const Button3D = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, children, variant, size, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          animatedButtonVariants({ variant, size }),
          'relative transform-gpu',
          className
        )}
        whileHover={{ 
          y: -2,
          boxShadow: '0 10px 20px -10px rgba(0,0,0,0.3)',
        }}
        whileTap={{ 
          y: 0,
          boxShadow: '0 5px 10px -5px rgba(0,0,0,0.2)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button3D.displayName = 'Button3D';

export { 
  AnimatedButton, 
  AnimatedIconButton, 
  RippleButton, 
  MagneticButton, 
  Button3D,
  animatedButtonVariants 
};
