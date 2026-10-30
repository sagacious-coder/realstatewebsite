'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Image as ImageIcon, Map, Maximize2, LayoutGrid } from 'lucide-react';
import { SiteImage } from '@/components/SiteImage';
import { Lightbox, type GalleryItem } from '@/components/gallery/Lightbox';
import { ZoomViewer } from '@/components/gallery/ZoomViewer';
import { cn } from '@/lib/utils';
import type { ListingImage, FloorPlan } from '@wild-hills/contracts';

export interface PropertyHeroGalleryProps {
  coverImage: string;
  images: ListingImage[];
  floorPlans?: FloorPlan[];
  title: string;
  className?: string;
}

export function PropertyHeroGallery({
  coverImage,
  images,
  floorPlans = [],
  title,
  className,
}: PropertyHeroGalleryProps) {
  const t = useTranslations('property');

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [zoomViewerOpen, setZoomViewerOpen] = useState(false);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<FloorPlan | null>(
    floorPlans.length > 0 ? floorPlans[0] : null
  );

  // Compile all gallery items
  const galleryItems: GalleryItem[] = React.useMemo(() => {
    const list: GalleryItem[] = [];

    // Include cover image first
    if (coverImage) {
      list.push({
        id: 'cover',
        src: coverImage,
        alt: `${title} - Main Exterior`,
        caption: title,
      });
    }

    // Append other images
    images.forEach((img, idx) => {
      if (img.url !== coverImage) {
        list.push({
          id: `img-${idx}`,
          src: img.url,
          alt: img.alt || `${title} - Photo ${idx + 1}`,
          caption: img.caption || img.alt,
        });
      }
    });

    return list;
  }, [coverImage, images, title]);

  const openLightboxAt = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const primaryPhoto = galleryItems[0];
  const secondaryPhotos = galleryItems.slice(1, 5);

  return (
    <section aria-label="Property Media Gallery" className={cn('relative my-6', className)}>
      {/* Desktop Responsive Mosaic (1 large + 4 thumbs) */}
      <div className="hidden sm:grid sm:grid-cols-4 sm:grid-rows-2 gap-3 h-[380px] md:h-[460px] lg:h-[500px] rounded-card overflow-hidden border border-line bg-navy-2">
        {/* Large Featured Photo (Col 1-2, Row 1-2) */}
        {primaryPhoto && (
          <div
            onClick={() => openLightboxAt(0)}
            className="group relative sm:col-span-2 sm:row-span-2 cursor-pointer overflow-hidden bg-navy"
          >
            <SiteImage
              src={primaryPhoto.src}
              alt={primaryPhoto.alt}
              fill
              priority
              sizes="(max-width: 1024px) 50vw, 600px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/15 transition-colors" />
          </div>
        )}

        {/* Secondary Photos (4 tiles) */}
        {secondaryPhotos.map((photo, i) => {
          const photoIndex = i + 1;
          const isLast = i === 3 || photoIndex === galleryItems.length - 1;
          const remainingCount = galleryItems.length - 5;

          return (
            <div
              key={photo.id}
              onClick={() => openLightboxAt(photoIndex)}
              className="group relative col-span-1 row-span-1 cursor-pointer overflow-hidden bg-navy"
            >
              <SiteImage
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 1024px) 25vw, 300px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/15 transition-colors" />

              {/* "+N More" overlay on the 4th thumbnail */}
              {isLast && remainingCount > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy/70 text-ivory backdrop-blur-xs">
                  <LayoutGrid className="h-5 w-5 mb-1 text-gold" />
                  <span className="text-sm font-semibold tracking-wider">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Swipe / Hero Viewport */}
      <div className="sm:hidden relative aspect-[4/3] w-full rounded-card overflow-hidden border border-line bg-navy-2">
        {primaryPhoto && (
          <div
            onClick={() => openLightboxAt(0)}
            className="relative w-full h-full cursor-pointer"
          >
            <SiteImage
              src={primaryPhoto.src}
              alt={primaryPhoto.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* Action Pills Bar overlay */}
      <div className="absolute bottom-4 end-4 z-10 flex items-center gap-2">
        {/* Floor Plan Button */}
        {floorPlans.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelectedFloorPlan(floorPlans[0]);
              setZoomViewerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-white/20 bg-navy/85 px-3 py-1.5 text-xs font-medium text-ivory backdrop-blur-md shadow-subtle transition-all hover:bg-gold hover:text-navy focus-visible:outline-2 focus-visible:outline-gold"
          >
            <Map className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{t('floorPlan')}</span>
          </button>
        )}

        {/* View All Photos Button */}
        <button
          type="button"
          onClick={() => openLightboxAt(0)}
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-white/20 bg-navy/85 px-3 py-1.5 text-xs font-semibold text-ivory backdrop-blur-md shadow-subtle transition-all hover:bg-gold hover:text-navy focus-visible:outline-2 focus-visible:outline-gold"
        >
          <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{t('viewAllPhotos', { count: galleryItems.length })}</span>
        </button>
      </div>

      {/* Lightbox Modal */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={galleryItems}
        currentIndex={lightboxIndex}
        onNavigate={setLightboxIndex}
      />

      {/* Floor Plan Zoom Viewer */}
      {selectedFloorPlan && (
        <ZoomViewer
          isOpen={zoomViewerOpen}
          onClose={() => setZoomViewerOpen(false)}
          imageSrc={selectedFloorPlan.url}
          alt={selectedFloorPlan.title || 'Property Floor Plan'}
          title={`${title} · ${selectedFloorPlan.title || t('floorPlan')}`}
        />
      )}
    </section>
  );
}

