'use client';

import React, { useState } from 'react';
import { SiteImage } from '@/components/SiteImage';
import { Lightbox, type GalleryItem } from '@/components/gallery/Lightbox';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GalleryProps {
  items: GalleryItem[];
  aspectRatio?: '16/9' | '4/3' | '3/2';
  focalPoint?: { x: number; y: number };
  className?: string;
}

/**
 * Gallery: Section 4.4, 13.5
 * - Main photo with focal point support
 * - Thumbnail strip with accessible button roles & labels
 * - Previous / Next controls with RTL mirroring
 * - Lightbox modal trigger
 * - Counter badge ("Photo 1 of 5")
 */
export function Gallery({
  items,
  aspectRatio = '16/9',
  focalPoint,
  className,
}: GalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!items || items.length === 0) return null;

  const total = items.length;
  const current = items[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const aspectClass =
    aspectRatio === '4/3'
      ? 'aspect-[4/3]'
      : aspectRatio === '3/2'
      ? 'aspect-[3/2]'
      : 'aspect-[16/9]';

  // Compute object position style if focalPoint is provided
  const objectPositionStyle = focalPoint
    ? { objectPosition: `${focalPoint.x * 100}% ${focalPoint.y * 100}%` }
    : undefined;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Main Image Frame */}
      <div
        className={cn(
          'group relative w-full overflow-hidden rounded-[6px] border border-line bg-navy/5',
          aspectClass
        )}
      >
        <SiteImage
          src={current.src}
          alt={current.alt || `Property photo ${currentIndex + 1} of ${total}`}
          fill
          priority={currentIndex === 0}
          sizes="(max-width: 1024px) 100vw, 1200px"
          style={objectPositionStyle}
          className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.02] motion-reduce:transform-none"
        />

        {/* Counter Badge */}
        <div className="absolute start-4 top-4 z-10 rounded-[4px] bg-navy/80 px-2.5 py-1 text-xs font-medium text-ivory backdrop-blur-xs">
          <bdi>{currentIndex + 1}</bdi> / <bdi>{total}</bdi>
        </div>

        {/* Expand / Lightbox Trigger Button */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          aria-label="View full gallery in lightbox"
          className="absolute end-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-[4px] bg-navy/80 text-white backdrop-blur-xs transition-colors hover:bg-gold hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
        </button>

        {/* Previous Button */}
        {total > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous photo"
            className="absolute start-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-[4px] bg-white/90 text-navy shadow-sm transition-all hover:bg-gold hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rtl:rotate-180"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
        )}

        {/* Next Button */}
        {total > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next photo"
            className="absolute end-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-[4px] bg-white/90 text-navy shadow-sm transition-all hover:bg-gold hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rtl:rotate-180"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
          </button>
        )}

        {/* Caption strip if available */}
        {current.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/80 via-navy/40 to-transparent p-4 pt-8 text-sm text-white">
            {current.caption}
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {total > 1 && (
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Photo gallery thumbnail strip"
        >
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={idx === currentIndex}
              aria-label={`Photo ${idx + 1} of ${total}`}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-[4px] border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                idx === currentIndex
                  ? 'border-gold ring-2 ring-gold'
                  : 'border-line opacity-70 hover:opacity-100'
              )}
            >
              <SiteImage
                src={item.src}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Connected Lightbox */}
      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        items={items}
        currentIndex={currentIndex}
        onNavigate={setCurrentIndex}
      />
    </div>
  );
}
