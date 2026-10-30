import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  ShieldCheck,
  Globe,
  Camera,
  Scale,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  isCountryCode,
  COUNTRY_CODES,
  COUNTRY_DEFAULT_CURRENCY,
  type CountryCode,
} from '@/lib/countries';
import { SellPropertyForm } from '@/components/forms/SellPropertyForm';

interface SellPageProps {
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

export async function generateMetadata({ params }: SellPageProps) {
  const { country } = await params;
  if (!isCountryCode(country)) return {};

  return {
    title: `Sell With Us | List Luxury Real Estate | Wild Hills`,
    description: `Access 45,000+ verified international high-net-worth investors across UAE, Turkey, Georgia, and Egypt with transparent marketing and full escrow protection.`,
  };
}

export default async function SellWithUsPage({ params }: SellPageProps) {
  const { locale, country } = await params;

  if (!isCountryCode(country)) {
    notFound();
  }

  const countryCode = country as CountryCode;
  const defaultCurrency = COUNTRY_DEFAULT_CURRENCY[countryCode] || 'USD';

  const t = await getTranslations({ locale, namespace: 'sell' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const countryName = tCommon(`countries.${countryCode}`);

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
            Sell With Us
          </li>
        </ol>
      </nav>

      {/* 2. Hero Section & Value Proposition */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-navy text-sand rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-xl border border-line">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/30 text-xs font-semibold mb-6 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('heroBadge')}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
              {t('heroTitle')}
            </h1>

            <p className="mt-4 text-sm sm:text-base lg:text-lg text-sand/80 leading-relaxed">
              {t('heroSubtitle')}
            </p>

            {/* Transparent Commission & Escrow Pledge */}
            <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-gold shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-white">
                {t('commissionPledge')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Advisory Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            {t('advisoryTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-card border border-line shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-navy/10 text-navy flex items-center justify-center mb-6">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy">
              {t('benefits.global.title')}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              {t('benefits.global.description')}
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-card border border-line shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-navy/10 text-navy flex items-center justify-center mb-6">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy">
              {t('benefits.media.title')}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              {t('benefits.media.description')}
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-card border border-line shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-gold/20 text-gold flex items-center justify-center mb-6">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy">
              {t('benefits.legal.title')}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              {t('benefits.legal.description')}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Intake Submission Form */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SellPropertyForm
          defaultCountry={countryCode}
          defaultCurrency={defaultCurrency}
        />
      </section>
    </div>
  );
}

