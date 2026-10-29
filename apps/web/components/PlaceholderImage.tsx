import React from 'react';
import { cn } from '@/lib/utils';

export interface PlaceholderImageProps {
  alt?: string;
  label?: string;
  aspectRatio?: '4/3' | '16/9' | '3/2' | '1/1' | 'portrait' | 'auto';
  className?: string;
  showBadge?: boolean;
}

export function PlaceholderImage({
  alt = 'Wild Hills property placeholder',
  label,
  aspectRatio = '4/3',
  className,
  showBadge = true,
}: PlaceholderImageProps) {
  const aspectClass =
    aspectRatio === '4/3'
      ? 'aspect-[4/3]'
      : aspectRatio === '16/9'
      ? 'aspect-[16/9]'
      : aspectRatio === '3/2'
      ? 'aspect-[3/2]'
      : aspectRatio === '1/1'
      ? 'aspect-square'
      : aspectRatio === 'portrait'
      ? 'aspect-[3/4]'
      : '';

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-card',
        // Navy-to-mist wash per Section 5 & 15.2
        'bg-gradient-to-br from-navy via-navy-2 to-[#1E3050]',
        'border border-line/40 text-ivory select-none transition-all duration-300',
        aspectClass,
        className
      )}
    >
      {/* Subtle background decorative mist line */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--mist)_0%,_transparent_70%)]"
        aria-hidden="true"
      />

      {/* Wild Hills Brand Symbol (Arch + Cypress + Waves) */}
      <div className="relative z-10 flex flex-col items-center text-center p-4">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gold mb-2.5 opacity-90 transition-transform duration-300 group-hover:scale-105"
          aria-hidden="true"
        >
          {/* Brand Arch */}
          <path
            d="M8 40V22C8 13.1634 15.1634 6 24 6C32.8366 6 40 13.1634 40 22V40"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Internal hill / landscape lines */}
          <path
            d="M12 40C16 35 20 34 24 36C28 38 32 37 36 40"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M14 34C18 30 22 29 26 31C30 33 34 32 36 34"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
        </svg>

        <span className="font-serif text-xs md:text-sm tracking-wide text-ivory/90 font-medium">
          {label || 'Wild Hills'}
        </span>

        {showBadge && (
          <span className="mt-1 text-[10px] tracking-wider uppercase text-gold-light/80 font-sans">
            Verified Property
          </span>
        )}
      </div>
    </div>
  );
}

export default PlaceholderImage;
