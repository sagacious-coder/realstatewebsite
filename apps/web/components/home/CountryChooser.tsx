'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { SiteImage } from '@/components/SiteImage';
import {
  COOKIE_COUNTRY,
  COOKIE_CURRENCY,
  COOKIE_LOCALE,
  COUNTRY_CODES,
  COUNTRY_DEFAULT_CURRENCY,
  type CountryCode,
} from '@/lib/countries';
import { writeCookie } from '@/lib/cookies';
import { cn } from '@/lib/utils';

interface CountryCardConfig {
  code: CountryCode;
  panelImage: string;
}

const COUNTRIES_CONFIG: readonly CountryCardConfig[] = [
  { code: 'ae', panelImage: '/images/panels/panel-uae.webp' },
  { code: 'tr', panelImage: '/images/panels/panel-turkey.webp' },
  { code: 'ge', panelImage: '/images/panels/panel-georgia.webp' },
  { code: 'eg', panelImage: '/images/panels/panel-egypt.webp' },
] as const;

export function CountryChooser({ locale }: { locale: string }) {
  const t = useTranslations('countryChooser');
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

  function handleSelectCountry(countryCode: CountryCode) {
    writeCookie(COOKIE_COUNTRY, countryCode);
    writeCookie(COOKIE_CURRENCY, COUNTRY_DEFAULT_CURRENCY[countryCode]);
    writeCookie(COOKIE_LOCALE, locale);
  }

  return (
    <section
      data-nav-hero
      aria-label={t('title')}
      className="relative w-full bg-navy text-ivory on-navy overflow-hidden"
    >
      {/* Intro Header band over the top of the panels */}
      <div className="pt-28 pb-8 md:pt-36 md:pb-10 container text-start">
        <div className="max-w-3xl">
          <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold tracking-widest uppercase rounded border border-gold/40 text-gold-light bg-navy-2/60 backdrop-blur-sm">
            {t('badge')}
          </span>
          <h1 className="h1 text-ivory mb-3 font-serif tracking-tight">
            {t('title')}
          </h1>
          <p className="text-base sm:text-lg text-ivory/80 leading-relaxed font-sans max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Desktop Four-Panel Interactive Chooser (md and up) */}
      <div className="hidden md:flex flex-row w-full h-[620px] lg:h-[700px] xl:h-[760px] border-t border-b border-line/20 bg-navy">
        {COUNTRIES_CONFIG.map((country, index) => {
          const isExpanded = activeHoverIndex === index;
          const isAnyExpanded = activeHoverIndex !== null;

          return (
            <Link
              key={country.code}
              href={`/${country.code}`}
              onClick={() => handleSelectCountry(country.code)}
              onMouseEnter={() => setActiveHoverIndex(index)}
              onMouseLeave={() => setActiveHoverIndex(null)}
              onFocus={() => setActiveHoverIndex(index)}
              onBlur={() => setActiveHoverIndex(null)}
              aria-label={`${t(`countries.${country.code}.name`)} - ${t(`countries.${country.code}.teaser`)}`}
              className={cn(
                'group relative flex flex-col justify-between overflow-hidden border-e border-line/20 text-start',
                'transition-[flex] duration-500 cubic-bezier(0.25, 1, 0.5, 1)',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy z-10',
                isExpanded
                  ? 'flex-[2.4] lg:flex-[2.6]'
                  : isAnyExpanded
                    ? 'flex-[0.8]'
                    : 'flex-1'
              )}
            >
              {/* Background Panel Image */}
              <div className="absolute inset-0 bg-navy-2 overflow-hidden">
                <SiteImage
                  src={country.panelImage}
                  alt={t(`countries.${country.code}.name`)}
                  fill
                  priority={country.code === 'ae'}
                  className={cn(
                    'object-cover transition-transform duration-700 ease-out will-change-transform',
                    isExpanded ? 'scale-105' : 'group-hover:scale-105'
                  )}
                  sizes="(max-width: 1024px) 50vw, 35vw"
                />
                {/* Ambient Top & Bottom Gradients for high contrast & legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/30" />
                <div
                  className={cn(
                    'absolute inset-0 bg-navy/20 transition-opacity duration-300',
                    isExpanded ? 'opacity-0' : isAnyExpanded ? 'opacity-40' : 'opacity-0'
                  )}
                />
              </div>

              {/* Panel Top Section: Country Code & Currency Pills */}
              <div className="relative z-10 p-6 lg:p-8 flex items-center justify-between gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded bg-navy-2/80 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-widest text-gold-light uppercase">
                  {country.code.toUpperCase()}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium tracking-wider text-ivory/70 transition-opacity duration-300',
                    isExpanded ? 'opacity-100' : 'opacity-0 lg:opacity-70'
                  )}
                >
                  {t(`countries.${country.code}.currency`)}
                </span>
              </div>

              {/* Panel Bottom Section: Title, Teaser, Cities & Action CTA */}
              <div className="relative z-10 p-6 lg:p-8">
                <div className="mb-2">
                  <span className="text-xs font-medium tracking-wider text-gold-light uppercase block mb-1">
                    {t(`countries.${country.code}.tagline`)}
                  </span>
                  <h2 className="font-serif text-2xl lg:text-3xl xl:text-4xl font-medium text-ivory group-hover:text-gold-light transition-colors">
                    {t(`countries.${country.code}.name`)}
                  </h2>
                </div>

                {/* Expanded content details */}
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    isExpanded
                      ? 'max-h-48 opacity-100 mt-3'
                      : 'max-h-0 opacity-0 lg:max-h-0'
                  )}
                >
                  <p className="text-sm text-ivory/85 leading-relaxed mb-4 max-w-sm">
                    {t(`countries.${country.code}.teaser`)}
                  </p>
                  <div className="text-xs text-gold-light/90 font-medium tracking-wide mb-4 flex items-center gap-2">
                    <span className="text-ivory/50 uppercase tracking-widest text-[10px]">
                      {t('featuredCities')}:
                    </span>
                    <span>{t(`countries.${country.code}.cities`)}</span>
                  </div>
                </div>

                {/* Action CTA link */}
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold tracking-wider text-gold-light uppercase group-hover:text-white transition-colors">
                  <span>{t('exploreLabel')}</span>
                  <ArrowRight
                    className="w-4 h-4 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Mobile Stacked Editorial Cards (< md screens) */}
      <div className="md:hidden container pb-16 flex flex-col gap-5 text-start">
        {COUNTRIES_CONFIG.map((country) => (
          <Link
            key={country.code}
            href={`/${country.code}`}
            onClick={() => handleSelectCountry(country.code)}
            aria-label={`${t(`countries.${country.code}.name`)} - ${t(`countries.${country.code}.teaser`)}`}
            className="group relative flex flex-col justify-end min-h-[300px] sm:min-h-[340px] overflow-hidden rounded-card border border-line/30 bg-navy-2 p-6 shadow-subtle transition-all duration-300 hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {/* Background Image with Ambient Gradient */}
            <div className="absolute inset-0">
              <SiteImage
                src={country.panelImage}
                alt={t(`countries.${country.code}.name`)}
                fill
                priority={country.code === 'ae'}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/30" />
            </div>

            {/* Top Badges */}
            <div className="absolute top-4 start-4 end-4 z-10 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded bg-navy-2/80 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-widest text-gold-light uppercase">
                {country.code.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 backdrop-blur-md text-[11px] font-medium text-ivory/80">
                {t(`countries.${country.code}.currency`)}
              </span>
            </div>

            {/* Bottom Content */}
            <div className="relative z-10 pt-20">
              <span className="text-xs font-medium tracking-wider text-gold-light uppercase block mb-1">
                {t(`countries.${country.code}.tagline`)}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ivory mb-2 group-hover:text-gold-light transition-colors">
                {t(`countries.${country.code}.name`)}
              </h2>
              <p className="text-sm text-ivory/80 leading-relaxed mb-3 line-clamp-2">
                {t(`countries.${country.code}.teaser`)}
              </p>
              <div className="text-xs text-gold-light/90 font-medium tracking-wide mb-4">
                <span className="text-ivory/50 uppercase tracking-widest text-[10px] me-1.5">
                  {t('featuredCities')}:
                </span>
                <span>{t(`countries.${country.code}.cities`)}</span>
              </div>
              <div className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold tracking-wider text-gold-light uppercase group-hover:text-white transition-colors">
                <span>{t('exploreLabel')}</span>
                <ArrowRight
                  className="w-4 h-4 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                  aria-hidden="true"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

