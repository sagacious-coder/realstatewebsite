'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ListingCard } from '@/components/cards/ListingCard';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { ArrowRight } from 'lucide-react';
import type { BadgeVariant } from '@/components/ui/Badge';
import type { CountryCode, ListingSummary } from '@/lib/data';

export interface HotDealsSectionProps {
  countryCode: CountryCode;
  countryName: string;
  listings: ListingSummary[];
}

const VALID_BADGES: Set<string> = new Set([
  'verified',
  'hot-deal',
  'hot_deal',
  'new-launch',
  'new_launch',
  'ready',
  'off-plan',
  'off_plan',
  'sold',
  'reserved',
]);

export function HotDealsSection({
  countryCode,
  countryName,
  listings,
}: HotDealsSectionProps) {
  const t = useTranslations('countryHome');
  const locale = useLocale();
  const { formatPrice, currency: activeCurrency } = useCurrency();

  return (
    <section
      id="hot-deals"
      className="bg-white py-16 md:py-24 border-b border-line"
      aria-labelledby="hot-deals-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          kicker={t('hotDeals.kicker')}
          title={t('hotDeals.title')}
          subtitle={t('hotDeals.subtitle')}
          align="split"
          action={
            <Link href={`/${locale}/${countryCode}/buy`}>
              <Button variant="secondary" size="sm" className="inline-flex items-center gap-2 group">
                {t('hotDeals.viewAll', { country: countryName })}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => {
            // Price formatted in user's active currency
            const priceFormatted = formatPrice(item.priceMinor, item.currency);

            // Original price in listing's native currency
            const priceOriginal =
              activeCurrency !== item.currency
                ? `${(item.priceMinor / 100).toLocaleString(locale)} ${item.currency}`
                : undefined;

            const badges: BadgeVariant[] = [];
            if (item.isVerified) badges.push('verified');
            if (item.isHotDeal) badges.push('hot-deal');
            if (item.isNewLaunch) badges.push('new-launch');
            if (item.status === 'ready') badges.push('ready');
            if (item.status === 'off_plan') badges.push('off-plan');
            (item.badges || []).forEach((b: string) => {
              const normalized = b.toLowerCase().replace('_', '-');
              if (VALID_BADGES.has(normalized) && !badges.includes(normalized as BadgeVariant)) {
                badges.push(normalized as BadgeVariant);
              }
            });

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
                href={`/${locale}/${countryCode}/property/${item.refNumber.toLowerCase()}-${item.slug}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
