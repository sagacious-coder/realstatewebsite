'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface CounterProps {
  end: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  label: string;
  isPlaceholder?: boolean;
  className?: string;
}

/**
 * Counter: counts up once when visible (1.2s) adhering to Section 4.5.
 * Respects prefers-reduced-motion (immediately sets the final value).
 * Marks placeholders clearly per Section 2 Rule 6.
 */
export function Counter({
  end,
  prefix = '',
  suffix = '',
  durationMs = 1200,
  label,
  isPlaceholder = false,
  className,
}: CounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(end);
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const startTime = performance.now();
          const step = (currentTime: number) => {
            const progress = Math.min((currentTime - startTime) / durationMs, 1);
            // Ease-out cubic
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeOutProgress * end));

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setCount(end);
            }
          };

          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, durationMs, hasAnimated]);

  return (
    <div
      ref={ref}
      className={cn('flex flex-col text-start p-4 rounded-card', className)}
    >
      <div className="flex items-baseline gap-1 font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-navy">
        {prefix && <span className="text-gold-deep text-2xl md:text-3xl font-medium">{prefix}</span>}
        <span className="tabular-nums">{count.toLocaleString()}</span>
        {suffix && <span className="text-gold-deep text-2xl md:text-3xl font-medium">{suffix}</span>}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className="text-sm text-muted font-sans font-medium">{label}</span>
        {isPlaceholder && (
          <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-mist text-emerald border border-emerald/20">
            Sample
          </span>
        )}
      </div>
    </div>
  );
}

export default Counter;
