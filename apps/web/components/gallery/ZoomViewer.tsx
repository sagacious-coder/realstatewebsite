'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ZoomIn, ZoomOut, RotateCcw, X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { SiteImage } from '@/components/SiteImage';
import { cn } from '@/lib/utils';

export interface ZoomViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  alt: string;
  title?: string;
  footerNote?: string;
}

/**
 * ZoomViewer: Section 4.4, 12.2, 13.2, 13.5
 * - Fullscreen floor plan viewer for 2400px assets
 * - Ivory (#FAF8F3) canvas with 1px line border
 * - Zoom in, Zoom out, Reset buttons
 * - Keyboard panning with arrow keys
 * - Drag/touch panning
 * - Esc to close, focus trap, returns focus
 * - "Indicative plan. Dimensions approximate." notice
 */
export function ZoomViewer({
  isOpen,
  onClose,
  imageSrc,
  alt,
  title = 'Floor Plan',
  footerNote = 'Indicative plan. Dimensions approximate.',
}: ZoomViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.3, 3.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev - 0.3, 0.7);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Keyboard navigation & panning
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const panStep = 40;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPosition((prev) => ({ ...prev, y: prev.y + panStep }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPosition((prev) => ({ ...prev, y: prev.y - panStep }));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPosition((prev) => ({ ...prev, x: prev.x + panStep }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPosition((prev) => ({ ...prev, x: prev.x - panStep }));
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleZoomIn, handleZoomOut, handleReset]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/90 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col bg-ivory text-navy focus:outline-none"
          aria-label={`Interactive floor plan viewer for ${title}`}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Description className="sr-only">
            Use plus and minus to zoom, arrow keys or click-and-drag to pan, and Escape to close.
          </Dialog.Description>

          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3 sm:px-6 z-10 shadow-xs">
            <div>
              <h2 className="font-serif text-lg font-medium text-navy">{title}</h2>
              <p className="text-xs text-muted">
                Zoom:{' '}
                <span className="font-semibold text-navy">
                  <bdi>{Math.round(scale * 100)}%</bdi>
                </span>{' '}
                · Use mouse drag or arrow keys to pan
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleZoomIn}
                aria-label="Zoom in"
                disabled={scale >= 3.5}
                className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-line bg-white text-navy hover:bg-mist hover:border-gold/60 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                aria-label="Zoom out"
                disabled={scale <= 0.7}
                className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-line bg-white text-navy hover:bg-mist hover:border-gold/60 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <ZoomOut className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={handleReset}
                aria-label="Reset zoom and position"
                className="flex h-10 px-3 items-center justify-center gap-1.5 rounded-[4px] border border-line bg-white text-xs font-medium text-navy hover:bg-mist hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <div className="mx-1 h-6 w-px bg-line" />

              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close floor plan viewer"
                  className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-line bg-white text-navy hover:bg-gold hover:text-navy hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Canvas Area with Drag Panning */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={cn(
              'relative flex flex-1 items-center justify-center overflow-hidden bg-ivory p-6 select-none',
              scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            )}
          >
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 200ms ease-out',
              }}
              className="relative max-h-full max-w-full flex items-center justify-center"
            >
              <SiteImage
                src={imageSrc}
                alt={alt}
                width={1600}
                height={1200}
                className="rounded-[4px] border border-line/60 bg-white p-4 shadow-sm object-contain"
                priority
              />
            </div>
          </div>

          {/* Footer Strip */}
          <div className="flex items-center justify-between border-t border-line bg-white px-4 py-2.5 text-xs text-muted sm:px-6">
            <p className="tracking-wide">{footerNote}</p>
            <div className="hidden sm:flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-line bg-ivory px-1 text-[10px]">+/-</kbd> Zoom
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-line bg-ivory px-1 text-[10px]">Arrows</kbd> Pan
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-line bg-ivory px-1 text-[10px]">Esc</kbd> Close
              </span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
