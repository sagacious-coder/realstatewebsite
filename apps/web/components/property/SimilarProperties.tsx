'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ListingCard } from '@/components/cards/ListingCard';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import type { ListingSummary, CountryCode } from '@wild-hills/contracts';
import type { BadgeVariant } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface SimilarPropertiesProps {
  countryCode: CountryCode;
  countryName: string;
  similarListings: ListingSummary[];
  className?: string;
}

export function SimilarProperties({
  countryCode,
  countryName,
  similarListings,
  className,
}: SimilarPropertiesProps) {
  const t = useTranslations('property.similar');
  const locale = useLocale();
  const { currency, formatPrice } = useCurrency();

  if (!similarListings || similarListings.length === 0) return null;

  return (
    <section
      aria-labelledby="similar-properties-heading"
      className={cn('pt-12 border-t border-line text-start', className)}
    >
      <div className="mb-8">
        <h2 id="similar-properties-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-navy">
          {t('title', { country: countryName })}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarListings.map((item) => {
          const priceFormatted = formatPrice(item.priceMinor, item.currency);
          const priceOriginal =
            currency !== item.currency
              ? `${new Intl.NumberFormat(locale).format(item.priceMinor / 100)} ${item.currency}`
              : undefined;

          const badges: BadgeVariant[] = [];
          if (item.isVerified) badges.push('verified');
          if (item.isHotDeal) badges.push('hot-deal');
          if (item.isNewLaunch) badges.push('new-launch');
          if (item.status === 'ready') badges.push('ready');
          if (item.status === 'off_plan') badges.push('off-plan');

          const locationStr = item.location
            ? `${item.location.area ? `${item.location.area}, ` : ''}${item.location.city}`
            : countryName;

          return (
            <ListingCard
              key={item.id}
              id={item.id}
              refCode={item.refNumber}
              title={item.title}
              location={locationStr}
              priceFormatted={priceFormatted}
              priceOriginal={priceOriginal}
              coverImage={item.coverImage}
              bedrooms={item.bedrooms}
              bathrooms={item.bathrooms}
              sizeSqm={item.sizeSqm}
              propertyType={item.propertyType}
              badges={badges.length > 0 ? badges : ['new-launch']}
              href={`/${locale}/${item.location.countryCode}/buy/${item.slug}`}
              locale={locale}
            />
          );
        })}
      </div>
    </section>
  );
}

