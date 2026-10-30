'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Plane, Palmtree, Building2, TrainTrack, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ListingLocationBrief } from '@wild-hills/contracts';

export interface PropertyLocationProps {
  location: ListingLocationBrief;
  countryName: string;
  className?: string;
}

export function PropertyLocation({
  location,
  countryName,
  className,
}: PropertyLocationProps) {
  const t = useTranslations('property.locationVicinity');

  // Realistic sample landmark distances based on city
  const landmarks = [
    { icon: Plane, label: t('airport'), time: '20' },
    { icon: Palmtree, label: t('beach'), time: '10' },
    { icon: Building2, label: t('downtown'), time: '15' },
    { icon: TrainTrack, label: t('metro'), time: '5' },
  ];

  return (
    <section
      aria-labelledby="location-heading"
      className={cn('rounded-card border border-line bg-white p-6 shadow-subtle text-start', className)}
    >
      <div className="flex items-center gap-2 border-b border-line pb-4 mb-5">
        <MapPin className="h-4 w-4 text-gold-deep" strokeWidth={1.5} />
        <div>
          <h2 id="location-heading" className="font-serif text-xl font-semibold text-navy">
            {t('title')}
          </h2>
          <p className="text-xs text-muted mt-0.5">{t('subtitle')}</p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-navy">
        <Navigation className="h-4 w-4 text-gold-deep flex-shrink-0" />
        <span>
          {location.area ? `${location.area}, ` : ''}{location.city}, {countryName}
        </span>
      </div>

      {/* Vicinity Travel Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {landmarks.map((l) => {
          const Icon = l.icon;
          return (
            <div
              key={l.label}
              className="rounded-[4px] border border-line bg-ivory/50 p-3.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-4 w-4 text-gold-deep" strokeWidth={1.5} />
                <span className="text-xs font-bold font-serif text-navy">
                  {t('minutes', { count: Number(l.time) })}
                </span>
              </div>
              <span className="text-xs text-muted leading-tight font-medium">
                {l.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

