import React from 'react';
import Link from 'next/link';
import { SiteImage } from '@/components/SiteImage';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LocationCardProps {
  id?: string;
  name: string;
  countryName: string;
  imageSrc: string;
  listingCount: number;
  href: string;
  regionLabel?: string;
  isFeatured?: boolean;
  className?: string;
}

/**
 * LocationCard: Section 4.4 and 7.2
 * - 4:3 photo frame (or 1000x750)
 * - 6px radius, 1px line border, subtle 1px line shadow
 * - Hover zoom 1.03 over 700ms (reduced-motion safe)
 * - City / Area name, region label, listing count badge
 * - "No listings here yet" lead trigger fallback if count === 0
 * - RTL friendly with logical properties and directional icon mirroring
 */
export function LocationCard({
  name,
  countryName,
  imageSrc,
  listingCount,
  href,
  regionLabel,
  isFeatured,
  className,
}: LocationCardProps) {
  const isZero = listingCount === 0;

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[6px] border border-line bg-white shadow-sm transition-all duration-300 hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
        className
      )}
      aria-label={`${name}, ${countryName}, ${isZero ? 'No listings yet' : `${listingCount} listings`}`}
    >
      {/* 4:3 Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ivory">
        <SiteImage
          src={imageSrc}
          alt={`${name}, ${countryName}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03] motion-reduce:transform-none"
        />

        {/* Subtle gradient vignette at bottom of image for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

        {/* Region Tag or Featured Pill */}
        <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
          {regionLabel && (
            <span className="rounded-[4px] bg-navy/80 px-2 py-0.5 text-xs font-medium text-ivory backdrop-blur-xs">
              {regionLabel}
            </span>
          )}
          {isFeatured && (
            <span className="rounded-[4px] bg-gold px-2 py-0.5 text-xs font-medium text-navy">
              Featured
            </span>
          )}
        </div>

        {/* Listing Count Badge */}
        <div className="absolute end-3 top-3">
          <span
            className={cn(
              'rounded-[4px] px-2.5 py-1 text-xs font-medium backdrop-blur-xs',
              isZero
                ? 'bg-mist text-navy border border-line/60'
                : 'bg-white/90 text-navy shadow-xs'
            )}
          >
            {isZero ? (
              'Inquire'
            ) : (
              <>
                <bdi>{listingCount}</bdi> listings
              </>
            )}
          </span>
        </div>

        {/* Bottom overlay text on image */}
        <div className="absolute bottom-3 start-3 end-3 flex items-end justify-between">
          <div>
            <span className="block text-xs font-medium tracking-wide text-gold-light uppercase">
              {countryName}
            </span>
            <h3 className="font-serif text-xl font-normal text-white drop-shadow-xs">
              {name}
            </h3>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xs transition-colors duration-200 group-hover:bg-gold group-hover:text-navy rtl:rotate-180">
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Footer message if 0 listings */}
      {isZero && (
        <div className="border-t border-line bg-ivory px-3.5 py-2 text-xs text-muted">
          No listings here yet. Tell us what you are looking for.
        </div>
      )}
    </Link>
  );
}
