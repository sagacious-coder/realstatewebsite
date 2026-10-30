'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Bed, Bath, Square, Calendar, ShieldCheck, Building, DollarSign, Layers, CheckCircle2 } from 'lucide-react';
import { SiteImage } from '@/components/SiteImage';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { cn } from '@/lib/utils';
import type { Developer, CountryCode } from '@wild-hills/contracts';

export interface PropertyAttributesProps {
  countryCode: CountryCode;
  priceMinor: number;
  originalCurrency: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  completionYear?: number | null;
  status: string;
  furnishingStatus?: string;
  description: string;
  developer?: Developer | null;
  className?: string;
}

export function PropertyAttributes({
  countryCode,
  priceMinor,
  originalCurrency,
  bedrooms,
  bathrooms,
  sizeSqm,
  completionYear,
  status,
  furnishingStatus,
  description,
  developer,
  className,
}: PropertyAttributesProps) {
  const t = useTranslations('property');
  const locale = useLocale();
  const { currency, formatPrice } = useCurrency();

  // Unit toggle: sqm vs sqft
  const [isSqft, setIsSqft] = useState(false);

  // Price calculations
  const displayPrice = formatPrice(priceMinor, originalCurrency as any);
  const isOriginalDifferent = currency !== originalCurrency;
  const originalPriceFormatted = `${new Intl.NumberFormat(locale).format(priceMinor / 100)} ${originalCurrency}`;

  // Area & Price per unit
  const sizeValue = isSqft ? Math.round(sizeSqm * 10.7639) : sizeSqm;
  const unitLabel = isSqft ? t('sqft') : t('sqm');
  const formattedSize = new Intl.NumberFormat(locale).format(sizeValue);

  const pricePerUnitMinor = Math.round(priceMinor / (isSqft ? sizeSqm * 10.7639 : sizeSqm));
  const displayPricePerUnit = formatPrice(pricePerUnitMinor, originalCurrency as any);

  return (
    <div className={cn('space-y-8 text-start', className)}>
      {/* 1. Price Header Box */}
      <div className="rounded-card border border-line bg-white p-6 shadow-subtle flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
            {t('overview')}
          </span>
          <div className="font-serif text-3xl sm:text-4xl font-bold text-navy tracking-tight">
            <bdi>{displayPrice}</bdi>
          </div>
          {isOriginalDifferent && (
            <div className="mt-1 text-xs sm:text-sm text-muted font-sans">
              <span>{t('originalPrice')}: </span>
              <bdi className="font-semibold text-navy/80">{originalPriceFormatted}</bdi>
            </div>
          )}
        </div>

        {/* Price per unit & Unit switcher */}
        <div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-center">
          <div className="text-xs text-muted">
            <span>{isSqft ? t('pricePerSqft') : t('pricePerSqm')}: </span>
            <bdi className="font-semibold text-navy">{displayPricePerUnit} / {unitLabel}</bdi>
          </div>

          {/* Sqm / Sqft unit toggle */}
          <div className="inline-flex rounded-[4px] border border-line p-0.5 bg-ivory">
            <button
              type="button"
              onClick={() => setIsSqft(false)}
              className={cn(
                'px-2.5 py-0.5 text-xs font-semibold rounded-[2px] transition-colors',
                !isSqft ? 'bg-navy text-ivory shadow-xs' : 'text-muted hover:text-navy'
              )}
            >
              {t('sqm')}
            </button>
            <button
              type="button"
              onClick={() => setIsSqft(true)}
              className={cn(
                'px-2.5 py-0.5 text-xs font-semibold rounded-[2px] transition-colors',
                isSqft ? 'bg-navy text-ivory shadow-xs' : 'text-muted hover:text-navy'
              )}
            >
              {t('sqft')}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Bedrooms */}
        <div className="rounded-card border border-line bg-white p-4 shadow-subtle flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] bg-mist text-emerald-deep">
            <Bed className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <span className="block text-[11px] text-muted uppercase font-semibold">{t('bedrooms')}</span>
            <span className="font-serif text-lg font-bold text-navy">
              {bedrooms === 0 ? 'Studio' : bedrooms}
            </span>
          </div>
        </div>

        {/* Bathrooms */}
        <div className="rounded-card border border-line bg-white p-4 shadow-subtle flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] bg-mist text-emerald-deep">
            <Bath className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <span className="block text-[11px] text-muted uppercase font-semibold">{t('bathrooms')}</span>
            <span className="font-serif text-lg font-bold text-navy">{bathrooms}</span>
          </div>
        </div>

        {/* Total Area */}
        <div className="rounded-card border border-line bg-white p-4 shadow-subtle flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] bg-mist text-emerald-deep">
            <Square className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <span className="block text-[11px] text-muted uppercase font-semibold">{t('size')}</span>
            <span className="font-serif text-lg font-bold text-navy whitespace-nowrap">
              <bdi>{formattedSize}</bdi> <span className="text-xs font-sans font-normal text-muted">{unitLabel}</span>
            </span>
          </div>
        </div>

        {/* Handover / Status */}
        <div className="rounded-card border border-line bg-white p-4 shadow-subtle flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] bg-mist text-emerald-deep">
            <Calendar className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <span className="block text-[11px] text-muted uppercase font-semibold">{t('completion')}</span>
            <span className="font-serif text-lg font-bold text-navy">
              {completionYear ? completionYear : status === 'ready' ? 'Ready' : 'TBD'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Description Narrative */}
      <div className="rounded-card border border-line bg-white p-6 shadow-subtle space-y-3">
        <h2 className="font-serif text-xl font-semibold text-navy">
          {t('description')}
        </h2>
        <div className="text-sm text-navy/85 leading-relaxed font-sans space-y-3 whitespace-pre-line">
          {description}
        </div>
      </div>

      {/* 4. Verified Developer Profile Card */}
      {developer && (
        <div className="rounded-card border border-gold/30 bg-white p-6 shadow-subtle">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4 mb-4">
            <div className="flex items-center gap-3.5">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[4px] border border-line bg-navy-2">
                <SiteImage
                  src={developer.logo}
                  alt={developer.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald" />
                  <span className="text-xs font-semibold text-emerald-deep">
                    {t('developer.verifiedPartner')}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-navy">
                  {developer.name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted">
              <span>{t('developer.projects', { count: developer.projectCount })}</span>
              <span>·</span>
              <span>{t('developer.activeListings', { count: developer.activeListingCount })}</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted leading-relaxed mb-4">
            {developer.description}
          </p>

          <Link
            href={`/${locale}/${countryCode}/buy?developer=${encodeURIComponent(developer.name)}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gold-deep hover:text-navy transition-colors focus-visible:outline-2 focus-visible:outline-gold"
          >
            <span>{t('developer.viewDeveloper')}</span>
            <span aria-hidden="true" className="rtl:rotate-180">→</span>
          </Link>
        </div>
      )}
    </div>
  );
}

