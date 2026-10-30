'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DeveloperLogoStrip, type DeveloperLogo } from '@/components/DeveloperLogoStrip';
import type { CountryCode, Developer } from '@/lib/data';

export interface DeveloperStripSectionProps {
  countryCode: CountryCode;
  countryName: string;
  developers: Developer[];
}

export function DeveloperStripSection({
  countryName,
  developers,
}: DeveloperStripSectionProps) {
  const t = useTranslations('countryHome.developers');

  // Map API Developer DTOs to DeveloperLogo format
  const mappedDevelopers: DeveloperLogo[] = developers.map((dev) => ({
    name: dev.name,
    slug: dev.slug,
    logoSrc: dev.logo || `/images/developers/${dev.slug}.svg`,
  }));

  return (
    <section className="bg-ivory/60" aria-label="Partner developers">
      <DeveloperLogoStrip
        developers={mappedDevelopers.length > 0 ? mappedDevelopers : undefined}
        title={t('title', { country: countryName })}
        showSampleBadge={true}
      />
    </section>
  );
}

