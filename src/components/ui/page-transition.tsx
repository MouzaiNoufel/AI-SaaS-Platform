'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  mode?: 'fade' | 'slide' | 'scale' | 'slideUp' | 'slideDown';
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
};

export function PageTransition({ 
  children, 
  className,
  mode = 'fade' 
}: PageTransitionProps) {
  const pathname = usePathname();
  const selectedVariant = variants[mode];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={selectedVariant.initial}
        animate={selectedVariant.animate}
        exit={selectedVariant.exit}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Wrapper for smooth page content loading
interface ContentLoaderProps {
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function ContentLoader({ children, isLoading = false, className }: ContentLoaderProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center min-h-[200px]"
        >
          <div className="flex flex-col items-center gap-4">
            <motion.div
              className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-muted-foreground animate-pulse">Loading...</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Animated section wrapper
interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// Animated list items
interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
}

export function AnimatedList({ 
  children, 
  className, 
  itemClassName,
  staggerDelay = 0.1 
}: AnimatedListProps) {
  return (
    <motion.ul
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children.map((child, index) => (
        <motion.li
          key={index}
          variants={{
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0 },
          }}
          transition={{ duration: 0.3 }}
          className={itemClassName}
        >
          {child}
        </motion.li>
      ))}
    </motion.ul>
  );
}

// Reveal on scroll
interface RevealProps {
  children: ReactNode;
  className?: string;
  width?: 'fit-content' | '100%';
}

export function Reveal({ children, className, width = 'fit-content' }: RevealProps) {
  return (
    <div style={{ position: 'relative', width, overflow: 'hidden' }} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 75 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
      <motion.div
        initial={{ left: 0 }}
        whileInView={{ left: '100%' }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeIn' }}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          background: 'hsl(var(--primary))',
          zIndex: 20,
        }}
      />
    </div>
  );
}

// Text reveal animation
interface TextRevealProps {
  text: string;
  className?: string;
  once?: boolean;
}

export function TextReveal({ text, className, once = true }: TextRevealProps) {
  const words = text.split(' ');

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      className={className}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-1"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{
            duration: 0.3,
            delay: index * 0.05,
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Parallax wrapper
interface ParallaxProps {
  children: ReactNode;
  className?: string;
  speed?: number;
}

export function Parallax({ children, className, speed = 0.5 }: ParallaxProps) {
  return (
    <motion.div
      initial={{ y: 0 }}
      whileInView={{ y: [-20 * speed, 20 * speed] }}
      viewport={{ once: false }}
      transition={{ duration: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated gradient background
export function AnimatedGradientBackground({ className }: { className?: string }) {
  return (
    <motion.div
      className={`absolute inset-0 -z-10 ${className}`}
      animate={{
        background: [
          'radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
          'radial-gradient(circle at 100% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
          'radial-gradient(circle at 100% 100%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
          'radial-gradient(circle at 0% 100%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
          'radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
        ],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

// Cursor follower for interactive elements
export function CursorFollower() {
  return (
    <motion.div
      className="fixed w-8 h-8 rounded-full bg-primary/20 pointer-events-none z-50 mix-blend-difference"
      animate={{
        x: typeof window !== 'undefined' ? 0 : 0,
        y: typeof window !== 'undefined' ? 0 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 28,
      }}
    />
  );
}
