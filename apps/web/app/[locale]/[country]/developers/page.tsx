import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  ShieldCheck,
  Building,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Award,
} from 'lucide-react';
import { isCountryCode, COUNTRY_CODES, type CountryCode } from '@/lib/countries';
import { getDevelopers } from '@/lib/data';
import { SiteImage } from '@/components/SiteImage';

interface DevelopersDirectoryProps {
  params: Promise<{
    locale: string;
    country: string;
  }>;
}

export async function generateStaticParams() {
  const supportedLocales = ['en', 'ar', 'tr', 'ka'];
  const paths: { locale: string; country: string }[] = [];

  for (const locale of supportedLocales) {
    for (const country of COUNTRY_CODES) {
      paths.push({ locale, country });
    }
  }

  return paths;
}

export async function generateMetadata({ params }: DevelopersDirectoryProps) {
  const { country } = await params;
  if (!isCountryCode(country)) return {};

  return {
    title: `Verified Master Developers | Wild Hills Real Estate`,
    description: `Explore vetted, licensed master developers in ${country.toUpperCase()} with proven escrow compliance and on-time project delivery records.`,
  };
}

export default async function DevelopersDirectoryPage({ params }: DevelopersDirectoryProps) {
  const { locale, country } = await params;

  if (!isCountryCode(country)) {
    notFound();
  }

  const countryCode = country as CountryCode;
  const t = await getTranslations({ locale, namespace: 'developers' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const countryName = tCommon(`countries.${countryCode}`);

  const developers = await getDevelopers(countryCode);

  return (
    <div className="min-h-screen bg-sand text-navy pb-24">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <ol className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-muted">
          <li>
            <Link href={`/${locale}`} className="hover:text-navy transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="select-none">
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </li>
          <li>
            <Link href={`/${locale}/${countryCode}`} className="hover:text-navy transition-colors">
              {countryName}
            </Link>
          </li>
          <li aria-hidden="true" className="select-none">
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </li>
          <li aria-current="page" className="font-medium text-navy">
            Developers
          </li>
        </ol>
      </nav>

      {/* 2. Verification Pledge Hero */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-navy text-sand rounded-3xl p-8 sm:p-12 lg:p-14 relative overflow-hidden shadow-xl border border-line">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/30 text-xs font-semibold mb-6 tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('pledgeBadge')}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight">
              {t('directoryTitle', { country: countryName })}
            </h1>

            <p className="mt-4 text-sm sm:text-base text-sand/80 leading-relaxed">
              {t('pledgeSubtitle')}
            </p>

            {/* 3 Verification Pillars */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-white">
                  Government Escrow Audited
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-white">
                  Milestone-Linked Handover
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-white">
                  0% Buyer Brokerage Markups
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Developer Directory Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              Licensed Partners in {countryName}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              {t('directorySubtitle')}
            </p>
          </div>
          <span className="text-xs sm:text-sm font-medium text-muted">
            {developers.length} Developers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {developers.map((dev) => (
            <div
              key={dev.id}
              className="group flex flex-col justify-between rounded-2xl bg-card border border-line p-6 shadow-sm hover:shadow-md hover:border-gold/50 transition-all duration-300"
            >
              <div>
                {/* Developer Brand Row */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-sand border border-line flex items-center justify-center p-2 overflow-hidden shrink-0">
                    <Building className="w-7 h-7 text-navy/70 group-hover:text-gold transition-colors" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {dev.countryCodes.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sand border border-line text-navy/80"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="font-serif text-xl font-bold text-navy group-hover:text-gold transition-colors">
                  {dev.name}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-muted line-clamp-3 leading-relaxed">
                  {dev.description}
                </p>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-2 gap-3 py-3 border-y border-line text-center">
                  <div>
                    <span className="block text-lg font-bold text-navy">
                      {dev.projectCount}
                    </span>
                    <span className="text-[11px] text-muted uppercase tracking-wider">
                      Master Projects
                    </span>
                  </div>
                  <div>
                    <span className="block text-lg font-bold text-navy">
                      {dev.activeListingCount}
                    </span>
                    <span className="text-[11px] text-muted uppercase tracking-wider">
                      Active Listings
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <Link
                  href={`/${locale}/${countryCode}/developers/${dev.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-sand text-xs sm:text-sm font-semibold hover:bg-gold hover:text-navy transition-colors"
                >
                  <span>{t('viewProfile')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

