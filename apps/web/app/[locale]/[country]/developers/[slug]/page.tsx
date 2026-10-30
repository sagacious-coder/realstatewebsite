import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  Building,
  ShieldCheck,
  Award,
  Globe,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Briefcase,
  Layers,
} from 'lucide-react';
import { isCountryCode, type CountryCode } from '@/lib/countries';
import { getDeveloper, searchListings } from '@/lib/data';
import { FIXTURE_DEVELOPERS } from '@wild-hills/contracts';
import { LocationListingsGrid } from '@/components/locations/LocationListingsGrid';

interface DeveloperDetailPageProps {
  params: Promise<{
    locale: string;
    country: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const supportedLocales = ['en', 'ar', 'tr', 'ka'];
  const paths: { locale: string; country: string; slug: string }[] = [];

  for (const locale of supportedLocales) {
    for (const dev of FIXTURE_DEVELOPERS) {
      for (const country of dev.countryCodes) {
        paths.push({
          locale,
          country,
          slug: dev.slug,
        });
      }
    }
  }

  return paths;
}

export async function generateMetadata({ params }: DeveloperDetailPageProps) {
  const { country, slug } = await params;
  if (!isCountryCode(country)) return {};

  const developer = await getDeveloper(slug);
  if (!developer || !developer.countryCodes.includes(country as CountryCode)) return {};

  return {
    title: `${developer.name} Projects & Listings | Wild Hills Real Estate`,
    description: developer.description,
  };
}

export default async function DeveloperDetailPage({ params }: DeveloperDetailPageProps) {
  const { locale, country, slug } = await params;

  if (!isCountryCode(country)) {
    notFound();
  }

  const countryCode = country as CountryCode;
  const developer = await getDeveloper(slug);

  if (!developer || !developer.countryCodes.includes(countryCode)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'developers' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const countryName = tCommon(`countries.${countryCode}`);

  // Fetch developer listings
  const listingsRes = await searchListings({
    country: countryCode,
    developer: developer.name,
    limit: 6,
  });

  const displayListings =
    listingsRes.items.length > 0
      ? listingsRes.items
      : (await searchListings({ country: countryCode, limit: 6 })).items;

  const viewAllBuyHref = `/${locale}/${countryCode}/buy?developer=${encodeURIComponent(
    developer.name
  )}`;

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
          <li>
            <Link
              href={`/${locale}/${countryCode}/developers`}
              className="hover:text-navy transition-colors"
            >
              Developers
            </Link>
          </li>
          <li aria-hidden="true" className="select-none">
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </li>
          <li aria-current="page" className="font-medium text-navy">
            {developer.name}
          </li>
        </ol>
      </nav>

      {/* 2. Developer Profile Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-card rounded-3xl border border-line p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-line">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-sand border border-line flex items-center justify-center p-3 overflow-hidden shrink-0 shadow-sm">
                <Building className="w-10 h-10 text-navy" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gold/15 text-gold text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t('escrowBadge')}</span>
                  </span>
                  {developer.countryCodes.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sand border border-line text-navy/80"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy tracking-tight">
                  {developer.name}
                </h1>
              </div>
            </div>

            {developer.websiteUrl && (
              <a
                href={developer.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-line text-navy hover:border-gold hover:text-gold text-xs sm:text-sm font-semibold transition-colors self-start lg:self-center"
              >
                <Globe className="w-4 h-4" />
                <span>{t('officialWebsite')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Description & Track Record Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              <h2 className="font-serif text-xl font-bold text-navy mb-3">
                Company Overview & Vision
              </h2>
              <p className="text-sm sm:text-base text-muted leading-relaxed">
                {developer.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-sand/60 rounded-2xl p-5 border border-line">
              <div>
                <span className="block text-2xl sm:text-3xl font-bold text-navy">
                  {developer.projectCount}
                </span>
                <span className="text-[11px] sm:text-xs text-muted uppercase tracking-wider">
                  {t('completedProjects')}
                </span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-bold text-gold">
                  {developer.activeListingCount}
                </span>
                <span className="text-[11px] sm:text-xs text-muted uppercase tracking-wider">
                  {t('activeProperties')}
                </span>
              </div>
              <div className="col-span-2 pt-3 border-t border-line">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Licensed & Vetted Partner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Master Planning & Architectural Standards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-line">
            <div className="w-10 h-10 rounded-xl bg-navy/10 text-navy flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy">Master-Planned Communities</h3>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              Integrated urban planning incorporating residential sanctuaries, walkable park corridors, and premium retail promenades.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-line">
            <div className="w-10 h-10 rounded-xl bg-navy/10 text-navy flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy">Architectural Craftsmanship</h3>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              Engineered with world-class structural integrity, energy-efficient glazing, and bespoke Italian and German interior finishes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-line">
            <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy">Escrow & Milestone Security</h3>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              Every purchaser payment is deposited into government-regulated escrow accounts, released strictly upon verified construction milestones.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Active Listings by this Developer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              {t('portfolioTitle', { name: developer.name })}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              {t('portfolioSubtitle')}
            </p>
          </div>

          <Link
            href={viewAllBuyHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-navy transition-colors shrink-0"
          >
            <span>{t('viewAllListings', { name: developer.name })}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        <LocationListingsGrid
          listings={displayListings}
          countryCode={countryCode}
          emptyMessage={t('noListings')}
        />
      </section>
    </div>
  );
}

