'use client';

import React from 'react';
import { Heart, Bed, Bath, Square, MapPin } from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { SiteImage } from '@/components/SiteImage';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';

export interface ListingCardProps {
  id?: string;
  refCode: string; // e.g. WH-AE-00123
  title: string;
  location: string; // e.g. Yas Island, Abu Dhabi
  priceFormatted?: string; // e.g. 1,850,000 AED
  price?: string; // alias for priceFormatted
  priceOriginal?: string; // e.g. approx. $503,000 USD
  coverImage?: string;
  imageSrc?: string; // alias for coverImage
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  isSqft?: boolean;
  propertyType?: string;
  statusLabel?: string;
  badges?: BadgeVariant[];
  badge?: BadgeVariant;
  isFavorite?: boolean;
  isCompared?: boolean;
  onToggleFavorite?: (id: string) => void;
  onToggleCompare?: (id: string) => void;
  href?: string;
  className?: string;
}

/**
 * ListingCard component adhering to Section 4.4 & 8.4:
 * - 4:3 cover photo with 1.03 scale hover over 700ms
 * - Real badges with icons (Verified, Hot deal, etc.)
 * - Price in chosen currency with original beneath
 * - Beds, baths, size with sqm/sqft toggle support
 * - Heart favorite & compare checkbox with accessible touch targets
 */
export function ListingCard({
  id,
  refCode,
  title,
  location,
  priceFormatted,
  price,
  priceOriginal,
  coverImage,
  imageSrc,
  bedrooms,
  bathrooms,
  sizeSqm,
  isSqft = false,
  propertyType,
  statusLabel,
  badges,
  badge,
  isFavorite = false,
  isCompared = false,
  onToggleFavorite,
  onToggleCompare,
  href = '#',
  className,
}: ListingCardProps) {
  const cardId = id || refCode;
  const displayPrice = priceFormatted || price || '';
  const displayCover = coverImage || imageSrc || '/images/defaults/villa/cover-exterior.webp';
  const displayBadges: BadgeVariant[] = badges || (badge ? [badge] : []);
  const displaySize = isSqft
    ? `${Math.round(sizeSqm * 10.7639).toLocaleString()} sq ft`
    : `${sizeSqm.toLocaleString()} sqm`;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-card bg-white border border-line shadow-subtle',
        'hover:border-gold/60 transition-colors duration-300 text-start',
        className
      )}
    >
      {/* 4:3 Media Frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-navy-2">
        <a href={href} className="block w-full h-full" tabIndex={-1} aria-hidden="true">
          <SiteImage
            src={displayCover}
            alt={title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </a>

        {/* Top Badges overlay */}
        <div className="absolute top-3 start-3 end-3 flex items-start justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap gap-1.5 pointer-events-auto">
            {displayBadges.map((b) => (
              <Badge key={b} variant={b} className="backdrop-blur-sm shadow-subtle" />
            ))}
          </div>

          {/* Favorite Heart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite?.(cardId);
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            aria-pressed={isFavorite}
            className={cn(
              'pointer-events-auto flex items-center justify-center h-9 w-9 rounded-full bg-white/90 text-navy backdrop-blur-sm border border-line shadow-subtle',
              'transition-all duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-gold'
            )}
          >
            <Heart
              className={cn('w-4 h-4', isFavorite ? 'fill-red-600 text-red-600' : 'text-navy')}
              strokeWidth={1.5}
            />
          </button>
        </div>

        {/* Ref number chip */}
        <div className="absolute bottom-3 start-3 pointer-events-none">
          <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-navy/80 text-ivory/90 backdrop-blur-sm border border-white/10">
            <bdi>{refCode}</bdi>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Price Header */}
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <div className="font-serif text-xl sm:text-2xl font-semibold text-navy tracking-tight">
              <bdi>{displayPrice}</bdi>
            </div>
          </div>
          {priceOriginal && (
            <div className="text-xs text-muted mb-3 font-sans">
              <bdi>{priceOriginal}</bdi>
            </div>
          )}

          {/* Title & Location */}
          <h3 className="font-serif text-base font-medium text-navy line-clamp-1 group-hover:text-gold-deep transition-colors mb-1.5">
            <a href={href} className="focus-visible:outline-2 focus-visible:outline-gold rounded-[2px]">
              {title}
            </a>
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-muted mb-4">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gold-deep" strokeWidth={1.5} aria-hidden="true" />
            <span className="line-clamp-1">{location}</span>
          </div>

          {/* Key specs (Beds, Baths, Size) */}
          <div className="grid grid-cols-3 gap-2 py-3 border-t border-line text-xs text-navy font-medium">
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-muted flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>{bedrooms === 0 ? 'Studio' : `${bedrooms} Beds`}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-muted flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>{bathrooms} Baths</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Square className="w-4 h-4 text-muted flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>{displaySize}</span>
            </div>
          </div>
        </div>

        {/* Card Footer: Compare Toggle & Action */}
        <div className="pt-3 border-t border-line flex items-center justify-between text-xs mt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-muted hover:text-navy">
            <Checkbox
              checked={isCompared}
              onCheckedChange={() => onToggleCompare?.(cardId)}
              className="h-4 w-4"
              aria-label={`Compare ${title}`}
            />
            <span>Compare</span>
          </label>

          <a
            href={href}
            className="text-gold-deep font-semibold hover:text-navy transition-colors inline-flex items-center gap-1"
          >
            <span>View home</span>
            <span aria-hidden="true" className="rtl:rotate-180">→</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export default ListingCard;
