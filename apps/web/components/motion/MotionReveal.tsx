'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface MotionRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
  as?: React.ElementType;
}

/**
 * Section reveal: fade-up 24px, 600ms ease-out, stagger support per Section 4.5.
 * Respects prefers-reduced-motion (replaces motion with immediate or simple fade).
 */
export function MotionReveal({
  children,
  delayMs = 0,
  className,
  as: Component = 'div',
  ...rest
}: MotionRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced-motion immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      style={{
        transitionDelay: `${delayMs}ms`,
      }}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6 motion-reduce:opacity-100 motion-reduce:translate-y-0',
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default MotionReveal;
