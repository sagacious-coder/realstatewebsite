'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, Copy, Check, Share2, Sparkles, Building, ShieldCheck, Flame } from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { CountryCode } from '@wild-hills/contracts';

export interface PropertyHeaderProps {
  countryCode: CountryCode;
  countryName: string;
  city: string;
  title: string;
  refCode: string;
  status: string;
  badges?: string[];
  isHotDeal?: boolean;
  isNewLaunch?: boolean;
  isVerified?: boolean;
  isSample?: boolean;
  className?: string;
}

export function PropertyHeader({
  countryCode,
  countryName,
  city,
  title,
  refCode,
  status,
  badges = [],
  isHotDeal,
  isNewLaunch,
  isVerified,
  isSample = true,
  className,
}: PropertyHeaderProps) {
  const t = useTranslations('property');
  const locale = useLocale();

  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(refCode);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2200);
    } catch {}
  };

  const handleShare = async () => {
    const shareData = {
      title,
      text: `${title} (${refCode}) - Wild Hills Real Estate`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    } catch {}
  };

  // Badges map
  const displayBadges: BadgeVariant[] = [];
  if (isVerified) displayBadges.push('verified');
  if (isHotDeal) displayBadges.push('hot-deal');
  if (isNewLaunch) displayBadges.push('new-launch');
  if (status === 'ready') displayBadges.push('ready');
  if (status === 'off_plan') displayBadges.push('off-plan');

  return (
    <div className={cn('space-y-3.5 text-start', className)}>
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-muted overflow-x-auto py-1">
        <ol className="flex items-center gap-1.5 whitespace-nowrap">
          <li>
            <Link
              href={`/${locale}`}
              className="hover:text-navy transition-colors focus-visible:outline-2 focus-visible:outline-gold"
            >
              {t('breadcrumbs.home')}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5 text-muted/60 rtl:rotate-180" />
          </li>
          <li>
            <Link
              href={`/${locale}/${countryCode}`}
              className="hover:text-navy transition-colors focus-visible:outline-2 focus-visible:outline-gold"
            >
              {countryName}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5 text-muted/60 rtl:rotate-180" />
          </li>
          <li>
            <Link
              href={`/${locale}/${countryCode}/buy`}
              className="hover:text-navy transition-colors focus-visible:outline-2 focus-visible:outline-gold"
            >
              {t('breadcrumbs.buy')}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5 text-muted/60 rtl:rotate-180" />
          </li>
          <li>
            <Link
              href={`/${locale}/${countryCode}/buy?city=${encodeURIComponent(city)}`}
              className="hover:text-navy transition-colors focus-visible:outline-2 focus-visible:outline-gold"
            >
              {city}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5 text-muted/60 rtl:rotate-180" />
          </li>
          <li className="font-semibold text-navy truncate max-w-[200px] sm:max-w-xs" aria-current="page">
            {title}
          </li>
        </ol>
      </nav>

      {/* 2. Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          {/* Badges line */}
          <div className="flex flex-wrap items-center gap-2">
            {displayBadges.map((b) => (
              <Badge key={b} variant={b} className="shadow-xs" />
            ))}

            {/* Sample data pill */}
            {isSample && (
              <span className="inline-flex items-center gap-1 rounded-[4px] border border-gold/40 bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold-deep">
                <Sparkles className="h-3 w-3" />
                <span>{t('sampleDataBadge')}</span>
              </span>
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-navy tracking-tight leading-tight">
            {title}
          </h1>
        </div>

        {/* Action Pills: Ref code & Share */}
        <div className="flex items-center gap-2 flex-shrink-0 self-start">
          {/* Ref Code with Copy button */}
          <button
            type="button"
            onClick={handleCopyRef}
            aria-label={t('copyRef')}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-line bg-white px-3 py-1.5 text-xs font-mono font-medium text-navy shadow-xs transition-colors hover:border-gold hover:bg-mist/40 focus-visible:outline-2 focus-visible:outline-gold"
          >
            <span className="text-muted text-[10px] font-sans uppercase">{t('refCode')}:</span>
            <bdi className="font-semibold">{refCode}</bdi>
            {copiedRef ? (
              <Check className="h-3.5 w-3.5 text-emerald" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted" />
            )}
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            aria-label={t('share.shareProperty')}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-line bg-white px-3 py-1.5 text-xs font-medium text-navy shadow-xs transition-colors hover:border-gold hover:bg-mist/40 focus-visible:outline-2 focus-visible:outline-gold"
          >
            {copiedShare ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald" />
                <span className="text-emerald-deep font-semibold">{t('share.copiedLink')}</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-gold-deep" />
                <span className="hidden sm:inline">{t('share.shareProperty')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

