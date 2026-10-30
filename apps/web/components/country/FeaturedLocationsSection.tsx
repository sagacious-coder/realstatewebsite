'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { LocationCard } from '@/components/cards/LocationCard';
import { Button } from '@/components/ui/Button';
import { Bell, CheckCircle } from 'lucide-react';
import type { CountryCode, Location } from '@/lib/data';

export interface FeaturedLocationsSectionProps {
  countryCode: CountryCode;
  countryName: string;
  locale: string;
  locations: Location[];
}

export function FeaturedLocationsSection({
  countryCode,
  countryName,
  locale,
  locations,
}: FeaturedLocationsSectionProps) {
  const t = useTranslations('countryHome');
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  // Fallback map of images for locations
  const fallbackImages: Record<string, string> = {
    dubai: '/images/uae/cities/dubai.webp',
    'abu-dhabi': '/images/uae/cities/abu-dhabi.webp',
    'dubai-marina': '/images/uae/areas/dubai-marina.avif',
    'yas-island': '/images/uae/areas/yas-island.avif',
    istanbul: '/images/turkey/cities/istanbul.webp',
    antalya: '/images/turkey/cities/antalya.webp',
    kadikoy: '/images/turkey/areas/kadikoy.avif',
    konyaalti: '/images/turkey/areas/konyaalti.avif',
    tbilisi: '/images/georgia/cities/tbilisi.webp',
    batumi: '/images/georgia/cities/batumi.webp',
    vake: '/images/georgia/areas/vake.avif',
    'batumi-new-boulevard': '/images/georgia/areas/batumi-new-boulevard.avif',
    cairo: '/images/egypt/cities/cairo.webp',
    'new-cairo': '/images/egypt/cities/new-cairo.webp',
    'new-capital': '/images/egypt/cities/new-capital.webp',
    'north-coast': '/images/egypt/cities/north-coast.webp',
    alexandria: '/images/egypt/cities/alexandria.webp',
    'fifth-settlement': '/images/egypt/areas/fifth-settlement.avif',
  };

  const handleAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setAlertSubmitted(true);
    }
  };

  return (
    <section
      id="featured-locations"
      className="bg-ivory py-16 md:py-24 border-b border-line"
      aria-labelledby="locations-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          kicker={t('featuredLocations.kicker')}
          title={t('featuredLocations.title', { country: countryName })}
          subtitle={t('featuredLocations.subtitle')}
          align="split"
        />

        {locations.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {locations.map((loc) => {
              const imageSrc =
                fallbackImages[loc.slug] || `/images/${countryCode}/cities/${loc.slug}.webp`;
              const listingCount = loc.listingCount ?? 0;

              return (
                <LocationCard
                  key={loc.id}
                  id={loc.id}
                  name={loc.name}
                  countryName={countryName}
                  imageSrc={imageSrc}
                  listingCount={listingCount}
                  href={`/${locale}/${countryCode}/buy?location=${loc.slug}`}
                  regionLabel={loc.type === 'area' ? 'Neighborhood' : 'City'}
                  isFeatured={loc.isFeatured}
                />
              );
            })}
          </div>
        ) : (
          /* "No listings here yet" empty state per Section 8.3 & Stage 7 specs */
          <div className="rounded-[6px] border border-line bg-white p-8 text-center max-w-xl mx-auto shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-mist text-emerald">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="h3 mb-2 font-serif text-lg font-semibold text-navy">
              {t('featuredLocations.emptyTitle')}
            </h3>
            <p className="mb-6 text-sm text-muted">
              {t('featuredLocations.emptySubtitle')}
            </p>

            {alertSubmitted ? (
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald">
                <CheckCircle className="h-4 w-4" />
                Alert request registered. We will notify you promptly.
              </div>
            ) : (
              <form onSubmit={handleAlertSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-[4px] border border-line bg-ivory/30 px-3.5 py-2 text-sm text-navy placeholder:text-muted focus:border-gold focus:outline-none"
                />
                <Button type="submit" variant="primary" size="sm">
                  {t('featuredLocations.requestAlerts')}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
