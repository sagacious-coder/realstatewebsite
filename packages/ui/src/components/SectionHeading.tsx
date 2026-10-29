import React from 'react';
import { cn } from '../utils';

export interface SectionHeadingProps {
  tagline?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  description?: string;
  action?: React.ReactNode;
  align?: 'start' | 'center' | 'split';
  onNavy?: boolean;
  className?: string;
}

/**
 * Editorial SectionHeading adhering to Section 4.3 & 4.4:
 * - Editorial rhythm with thin gold rule or tagline/kicker
 * - Supports split asymmetric layout, start-aligned, or centered
 * - Supports onNavy dark mode sections
 */
export function SectionHeading({
  tagline,
  kicker,
  title,
  subtitle,
  description,
  action,
  align = 'start',
  onNavy = false,
  className,
}: SectionHeadingProps) {
  const displayTagline = kicker || tagline;
  const displaySubtitle = description || subtitle;
  if (align === 'split') {
    return (
      <div
        className={cn(
          'flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-4 border-b',
          onNavy ? 'border-line/20' : 'border-line',
          className
        )}
      >
        <div className="max-w-2xl text-start">
          {displayTagline && (
            <div
              className={cn(
                'text-xs font-semibold uppercase tracking-wider mb-2 font-sans',
                onNavy ? 'text-gold-light' : 'text-gold-deep'
              )}
            >
              {displayTagline}
            </div>
          )}
          <h2
            className={cn(
              'h2 tracking-tight',
              onNavy ? 'text-ivory' : 'text-navy'
            )}
          >
            {title}
          </h2>
          {displaySubtitle && (
            <p
              className={cn(
                'text-sm md:text-base mt-2 max-w-xl leading-relaxed',
                onNavy ? 'text-ivory/70' : 'text-muted'
              )}
            >
              {displaySubtitle}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }

  const isCenter = align === 'center';

  return (
    <div
      className={cn(
        'mb-10 text-start',
        isCenter ? 'text-center mx-auto max-w-2xl' : 'max-w-2xl',
        className
      )}
    >
      {displayTagline && (
        <div
          className={cn(
            'text-xs font-semibold uppercase tracking-wider mb-2 font-sans',
            onNavy ? 'text-gold-light' : 'text-gold-deep'
          )}
        >
          {displayTagline}
        </div>
      )}
      <h2
        className={cn(
          'h2 tracking-tight',
          onNavy ? 'text-ivory' : 'text-navy'
        )}
      >
        {title}
      </h2>
      {displaySubtitle && (
        <p
          className={cn(
            'text-sm md:text-base mt-3 leading-relaxed',
            onNavy ? 'text-ivory/70' : 'text-muted'
          )}
        >
          {displaySubtitle}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export default SectionHeading;
