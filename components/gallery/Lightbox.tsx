'use client';

import React, { useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { SiteImage } from '@/components/SiteImage';
import { cn } from '@/lib/utils';

export interface GalleryItem {
  id: string | number;
  src: string;
  alt: string;
  caption?: string;
}

export interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

/**
 * Lightbox: Section 4.4, 13.2, 13.5
 * - Accessible Radix Dialog with backdrop
 * - Focus trap, Esc close, returns focus to trigger
 * - Previous / next buttons with aria-labels
 * - Keyboard navigation (ArrowLeft / ArrowRight)
 * - Mirrors arrows in RTL
 * - Counter badge ("Photo 3 of 12")
 * - 44px min touch targets
 */
export function Lightbox({
  isOpen,
  onClose,
  items,
  currentIndex,
  onNavigate,
}: LightboxProps) {
  const total = items.length;
  const current = items[currentIndex];

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    onNavigate((currentIndex - 1 + total) % total);
  }, [currentIndex, total, onNavigate]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    onNavigate((currentIndex + 1) % total);
  }, [currentIndex, total, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        // Check document direction
        const isRtl = document.documentElement.dir === 'rtl';
        if (isRtl) {
          handleNext();
        } else {
          handlePrev();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const isRtl = document.documentElement.dir === 'rtl';
        if (isRtl) {
          handlePrev();
        } else {
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext]);

  if (!isOpen || !current) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/95 backdrop-blur-sm animate-in fade-in duration-200" />

        {/* Content */}
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-6 text-white focus:outline-none"
          aria-label={`Photo gallery lightbox, displaying photo ${currentIndex + 1} of ${total}`}
        >
          <Dialog.Title className="sr-only">
            {current.alt || `Photo ${currentIndex + 1} of ${total}`}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Use left and right arrow keys to navigate photos, or Escape to close.
          </Dialog.Description>

          {/* Top Bar: Counter & Close */}
          <div className="flex items-center justify-between z-10">
            <div className="rounded-[4px] bg-white/10 px-3 py-1.5 text-xs font-medium text-ivory tracking-wide backdrop-blur-xs">
              <span className="font-semibold text-gold">
                <bdi>{currentIndex + 1}</bdi>
              </span>{' '}
              / <bdi>{total}</bdi>
            </div>

            <Dialog.Close
              asChild
              className="rounded-[4px] p-2 text-ivory/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <button
                type="button"
                aria-label="Close photo lightbox"
                className="flex h-11 w-11 items-center justify-center rounded-[4px]"
              >
                <X className="h-6 w-6" strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>

          {/* Main Photo Area with Navigation Arrows */}
          <div className="relative flex flex-1 items-center justify-center my-2 overflow-hidden">
            {/* Previous Button */}
            {total > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous photo"
                className="absolute start-2 sm:start-4 z-20 flex h-12 w-12 items-center justify-center rounded-[4px] bg-navy/70 text-white border border-white/20 backdrop-blur-xs transition-colors hover:bg-gold hover:text-navy hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rtl:rotate-180"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
              </button>
            )}

            {/* Main Image */}
            <div className="relative max-h-full max-w-full w-full h-[70vh] flex items-center justify-center">
              <SiteImage
                src={current.src}
                alt={current.alt}
                fill
                priority
                sizes="100vw"
                className="h-full w-full object-contain"
              />
            </div>

            {/* Next Button */}
            {total > 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next photo"
                className="absolute end-2 sm:end-4 z-20 flex h-12 w-12 items-center justify-center rounded-[4px] bg-navy/70 text-white border border-white/20 backdrop-blur-xs transition-colors hover:bg-gold hover:text-navy hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rtl:rotate-180"
              >
                <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Bottom Bar: Caption & Thumbnails */}
          <div className="z-10 flex flex-col items-center gap-3">
            {current.caption && (
              <p className="text-center text-sm text-ivory/90 max-w-xl">
                {current.caption}
              </p>
            )}

            {/* Thumbnail row */}
            {total > 1 && (
              <div
                className="flex items-center gap-2 overflow-x-auto max-w-full py-1 px-2"
                role="tablist"
                aria-label="Gallery thumbnails"
              >
                {items.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === currentIndex}
                    aria-label={`Photo ${idx + 1} of ${total}`}
                    onClick={() => onNavigate(idx)}
                    className={cn(
                      'relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-[3px] border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                      idx === currentIndex
                        ? 'border-gold ring-1 ring-gold opacity-100'
                        : 'border-white/20 opacity-50 hover:opacity-80'
                    )}
                  >
                    <SiteImage
                      src={item.src}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
