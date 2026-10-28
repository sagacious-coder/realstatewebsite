import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface DeveloperLogo {
  name: string;
  slug: string;
  logoSrc: string;
}

const DEFAULT_DEVELOPERS: DeveloperLogo[] = [
  { name: 'Altura Development', slug: 'altura', logoSrc: '/images/developers/altura.svg' },
  { name: 'Blue Haven Real Estate', slug: 'bluehaven', logoSrc: '/images/developers/bluehaven.svg' },
  { name: 'Cedar Living', slug: 'cedar', logoSrc: '/images/developers/cedar.svg' },
  { name: 'Crownline Properties', slug: 'crownline', logoSrc: '/images/developers/crownline.svg' },
  { name: 'Horizon Estates', slug: 'horizon', logoSrc: '/images/developers/horizon.svg' },
  { name: 'Meridian Partners', slug: 'meridian', logoSrc: '/images/developers/meridian.svg' },
  { name: 'Nova Residential', slug: 'nova', logoSrc: '/images/developers/nova.svg' },
  { name: 'Solara Homes', slug: 'solara', logoSrc: '/images/developers/solara.svg' },
  { name: 'Stone & Co.', slug: 'stone-co', logoSrc: '/images/developers/stone-co.svg' },
  { name: 'Verdant Group', slug: 'verdant', logoSrc: '/images/developers/verdant.svg' },
];

export interface DeveloperLogoStripProps {
  developers?: DeveloperLogo[];
  title?: string;
  showSampleBadge?: boolean;
  className?: string;
}

/**
 * DeveloperLogoStrip: Section 4.4
 * - Grayscale developer logos from /images/developers/*.svg
 * - Transitions to full color / opacity on hover
 * - Includes a "Sample" flag
 * - Responsive grid / carousel display
 */
export function DeveloperLogoStrip({
  developers = DEFAULT_DEVELOPERS,
  title = 'Trusted Developers & Partners',
  showSampleBadge = true,
  className,
}: DeveloperLogoStripProps) {
  return (
    <div
      className={cn(
        'w-full border-y border-line bg-ivory/50 py-8 px-4 sm:px-6',
        className
      )}
    >
      <div className="mx-auto max-w-[1200px]">
        {/* Header row with Title and Sample Flag */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wider text-muted uppercase">
            {title}
          </p>
          {showSampleBadge && (
            <span
              className="inline-flex items-center gap-1 rounded-[4px] border border-gold/40 bg-gold-light/20 px-2 py-0.5 text-[11px] font-medium text-gold-deep"
              title="These developers represent curated sample partner profiles for demonstration"
            >
              Sample developers
            </span>
          )}
        </div>

        {/* Logos Grid */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5 items-center justify-items-center">
          {developers.map((dev) => (
            <div
              key={dev.slug}
              className="group relative flex h-16 w-full items-center justify-center p-2 rounded-[4px] transition-all duration-300 hover:bg-white hover:shadow-xs focus-within:ring-2 focus-within:ring-gold"
              title={dev.name}
            >
              <Image
                src={dev.logoSrc}
                alt={dev.name}
                width={160}
                height={60}
                className="max-h-10 w-auto object-contain filter grayscale opacity-60 transition-all duration-300 group-hover:filter-none group-hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
