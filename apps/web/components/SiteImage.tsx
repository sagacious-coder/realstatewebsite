import React from 'react';
import Image, { type ImageProps } from 'next/image';
import { getImageMeta } from '@/lib/image-manifest';
import { PlaceholderImage } from '@/components/PlaceholderImage';
import { cn } from '@/lib/utils';

export interface SiteImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  alt: string;
  showSampleBadge?: boolean;
  fallbackLabel?: string;
  quality?: number;
  containerClassName?: string;
}

/**
 * SiteImage: Brand wrapper around Next.js <Image /> adhering to Section 5:
 * - Reads real dimensions & blur placeholders from lib/image-manifest.ts
 * - Sets sizes, blur placeholder, quality=90, and lazy loading by default
 * - Uses hardware acceleration (transform-gpu backface-hidden will-change-transform) to prevent texture blurring
 * - Gracefully falls back to PlaceholderImage for missing/placeholder assets
 */
export function SiteImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  priority = false,
  quality = 90,
  className,
  containerClassName,
  showSampleBadge = false,
  fallbackLabel,
  ...rest
}: SiteImageProps) {
  const meta = getImageMeta(src);

  // If manifest indicates this is a placeholder or file does not exist, show PlaceholderImage
  if (!meta && !src.startsWith('http') && !src.startsWith('data:')) {
    return (
      <PlaceholderImage
        alt={alt}
        label={fallbackLabel}
        className={className}
      />
    );
  }

  const finalWidth = width || (fill ? undefined : meta?.width || 1200);
  const finalHeight = height || (fill ? undefined : meta?.height || 800);

  // Accurate responsive sizes defaults requesting 2x density for retina viewports
  const resolvedSizes =
    sizes ||
    (fill || priority
      ? '(max-width: 768px) 100vw, (max-width: 1440px) 100vw, 2560px'
      : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px');

  // Allow explicit quality prop up to 90 for hero & detail galleries
  const resolvedQuality = Math.min(Math.max(quality, 1), 90);

  const blurProps: Partial<ImageProps> =
    meta?.blurDataURL && !priority
      ? {
          placeholder: 'blur',
          blurDataURL: meta.blurDataURL,
        }
      : {};

  return (
    <div
      className={cn(
        'relative overflow-hidden isolate',
        fill ? 'w-full h-full' : '',
        containerClassName
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        fill={fill}
        sizes={resolvedSizes}
        priority={priority}
        fetchPriority={priority ? 'high' : undefined}
        quality={resolvedQuality}
        loading={priority ? undefined : 'lazy'}
        {...blurProps}
        className={cn(
          'transform-gpu backface-hidden will-change-transform transition-transform duration-500 ease-out',
          fill ? 'object-cover' : 'h-auto w-full object-cover',
          className
        )}
        {...rest}
      />

      {/* Flag fake/sample data with "Sample" badge per Section 2 Rule 6 */}
      {showSampleBadge && meta?.is_sample && (
        <span className="absolute top-2.5 start-2.5 z-10 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-navy/80 text-gold-light border border-gold/30 backdrop-blur-sm">
          Sample
        </span>
      )}
    </div>
  );
}

export default SiteImage;
