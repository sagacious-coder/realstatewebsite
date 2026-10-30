'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Sparkles,
  Waves,
  Cpu,
  ShieldCheck,
  Dumbbell,
  Car,
  Home,
  Compass,
  Trees,
  CheckCircle2,
  Tv,
  Wind,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PropertyFeaturesProps {
  features: string[];
  className?: string;
}

// Icon mapping for amenities
function getFeatureIcon(featureName: string) {
  const f = featureName.toLowerCase();
  if (f.includes('pool') || f.includes('water') || f.includes('sea')) return Waves;
  if (f.includes('smart') || f.includes('automation')) return Cpu;
  if (f.includes('security') || f.includes('gated')) return ShieldCheck;
  if (f.includes('gym') || f.includes('fitness')) return Dumbbell;
  if (f.includes('parking') || f.includes('garage')) return Car;
  if (f.includes('maid') || f.includes('concierge')) return Home;
  if (f.includes('view') || f.includes('balcony')) return Compass;
  if (f.includes('garden') || f.includes('park')) return Trees;
  if (f.includes('ac') || f.includes('air')) return Wind;
  return CheckCircle2;
}

export function PropertyFeatures({ features, className }: PropertyFeaturesProps) {
  const t = useTranslations('property');

  if (!features || features.length === 0) return null;

  return (
    <section
      aria-labelledby="features-heading"
      className={cn('rounded-card border border-line bg-white p-6 shadow-subtle text-start', className)}
    >
      <div className="flex items-center gap-2 border-b border-line pb-4 mb-6">
        <Sparkles className="h-4 w-4 text-gold-deep" strokeWidth={1.5} />
        <h2 id="features-heading" className="font-serif text-xl font-semibold text-navy">
          {t('amenities')}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        {features.map((item) => {
          const Icon = getFeatureIcon(item);
          return (
            <div
              key={item}
              className="flex items-center gap-2.5 rounded-[4px] border border-line bg-ivory/50 px-3.5 py-2.5 text-xs font-medium text-navy transition-colors hover:border-gold/60"
            >
              <Icon className="h-4 w-4 text-gold-deep flex-shrink-0" strokeWidth={1.5} />
              <span className="truncate">{item}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

