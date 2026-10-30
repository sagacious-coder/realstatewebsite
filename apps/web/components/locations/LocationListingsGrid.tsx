'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { ListingCard } from '@/components/cards/ListingCard';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import type { ListingSummary, CountryCode } from '@wild-hills/contracts';
import type { BadgeVariant } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface LocationListingsGridProps {
  listings: ListingSummary[];
  countryCode: CountryCode;
  className?: string;
  emptyMessage?: string;
}

export function LocationListingsGrid({
  listings,
  countryCode,
  className,
  emptyMessage = 'No active listings currently available in this specific location.',
}: LocationListingsGridProps) {
  const locale = useLocale();
  const { currency, formatPrice } = useCurrency();

  if (!listings || listings.length === 0) {
    return (
      <div className="py-12 px-6 rounded-2xl bg-card border border-line text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {listings.map((item) => {
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
          : '';

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
            badges={badges}
            locale={locale}
            href={`/${locale}/${countryCode}/buy/${item.slug}`}
          />
        );
      })}
    </div>
  );
}
