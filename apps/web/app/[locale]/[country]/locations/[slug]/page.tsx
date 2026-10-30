import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  MapPin,
  Building2,
  TrendingUp,
  Plane,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { isCountryCode, type CountryCode } from '@/lib/countries';
import { getLocationBySlug, getLocations, searchListings } from '@/lib/data';
import { FIXTURE_LOCATIONS } from '@wild-hills/contracts';
import { SiteImage } from '@/components/SiteImage';
import { LocationListingsGrid } from '@/components/locations/LocationListingsGrid';

interface LocationPageProps {
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
    for (const loc of FIXTURE_LOCATIONS) {
      paths.push({
        locale,
        country: loc.countryCode,
        slug: loc.slug,
      });
    }
  }

  return paths;
}

export async function generateMetadata({ params }: LocationPageProps) {
  const { country, slug } = await params;
  if (!isCountryCode(country)) return {};

  const location = await getLocationBySlug(slug);
  if (!location || location.countryCode !== country) return {};

  return {
    title: `${location.name} Real Estate & Luxury Properties | Wild Hills`,
    description:
      location.description ||
      `Explore luxury properties, villas, and off-plan investments in ${location.name}.`,
  };
}

export default async function LocationDetailPage({ params }: LocationPageProps) {
  const { locale, country, slug } = await params;

  if (!isCountryCode(country)) {
    notFound();
  }

  const countryCode = country as CountryCode;
  const location = await getLocationBySlug(slug);

  if (!location || location.countryCode !== countryCode) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'locations' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  // Query listings matching this location
  const isCity = location.type === 'city';
  const listingsRes = await searchListings(
    isCity
      ? { country: countryCode, city: location.name, limit: 6 }
      : { country: countryCode, area: location.name, limit: 6 }
  );

  // If no exact match, fallback to country listings for lively display
  const displayListings =
    listingsRes.items.length > 0
      ? listingsRes.items
      : (await searchListings({ country: countryCode, limit: 6 })).items;

  // Nearby / sibling locations in the same country
  const allLocations = await getLocations(countryCode);
  const nearbyLocations = allLocations
    .filter((l) => l.slug !== location.slug && (l.isFeatured || l.listingCount > 0))
    .slice(0, 4);

  // Localized average price estimates by country
  const avgPriceMap: Record<CountryCode, string> = {
    ae: '18,500 AED / m²',
    tr: '78,000 TRY / m²',
    ge: '5,200 GEL / m²',
    eg: '64,000 EGP / m²',
  };

  const avgPriceDisplay = avgPriceMap[countryCode] || '—';
  const countryDisplayName = tCommon(`countries.${countryCode}`);

  const viewAllBuyHref = `/${locale}/${countryCode}/buy?${
    isCity
      ? `city=${encodeURIComponent(location.name)}`
      : `area=${encodeURIComponent(location.name)}`
  }`;

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
              {countryDisplayName}
            </Link>
          </li>
          <li aria-hidden="true" className="select-none">
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </li>
          <li>
            <Link
              href={`/${locale}/${countryCode}/locations`}
              className="hover:text-navy transition-colors"
            >
              Destinations
            </Link>
          </li>
          <li aria-hidden="true" className="select-none">
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </li>
          <li aria-current="page" className="font-medium text-navy">
            {location.name}
          </li>
        </ol>
      </nav>

      {/* 2. Hero Destination Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="relative rounded-3xl overflow-hidden bg-navy min-h-[380px] sm:min-h-[460px] flex items-end shadow-xl border border-line">
          {/* Background Image */}
          <div className="absolute inset-0">
            <SiteImage
              src={location.coverImage || '/images/defaults/apartment/cover.webp'}
              alt={location.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/55 to-navy/20" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 p-6 sm:p-10 lg:p-12 w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold backdrop-blur-md border border-gold/30 text-xs font-semibold mb-4 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{location.tagLabel || (isCity ? 'City Hub' : 'Prime Waterfront District')}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              {location.name}
            </h1>

            <p className="mt-3 text-sm sm:text-base lg:text-lg text-sand/80 max-w-2xl line-clamp-2">
              {location.description ||
                `Discover an exceptional selection of luxury residences and investment developments in ${location.name}.`}
            </p>

            {/* Quick Stats Grid */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl">
              <div className="p-3.5 sm:p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <p className="text-[11px] sm:text-xs text-sand/70 uppercase tracking-wider">
                  {t('avgPrice')}
                </p>
                <p className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {avgPriceDisplay}
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <p className="text-[11px] sm:text-xs text-sand/70 uppercase tracking-wider">
                  {t('rentalYield')}
                </p>
                <p className="text-base sm:text-lg font-bold text-gold mt-0.5">
                  6.8% – 9.2% Net
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <p className="text-[11px] sm:text-xs text-sand/70 uppercase tracking-wider">
                  {t('activeProperties')}
                </p>
                <p className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {location.listingCount || listingsRes.total} Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Area Lifestyle & Investment Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-card rounded-2xl border border-line p-6 sm:p-10 shadow-sm">
          <div className="max-w-3xl mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              {t('lifestyleGuide')}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
              {location.description ||
                `${location.name} represents a cornerstone destination within ${countryDisplayName}, renowned for strategic connectivity, high-spec master developments, and strong international investor liquidity.`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-line">
            <div className="p-5 rounded-xl bg-sand/60 border border-line flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-navy/10 text-navy flex items-center justify-center mb-4">
                  <Plane className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-navy">
                  {t('transport')}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                  {t('transportDesc')}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-sand/60 border border-line flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-navy/10 text-navy flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-navy">
                  {t('amenities')}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                  {t('amenitiesDesc')}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-sand/60 border border-line flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-gold/20 text-gold flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-navy">
                  {t('investment')}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                  {t('investmentDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Active Listings in this Location */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              {t('activeListings', { location: location.name })}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              {t('activeListingsSubtitle')}
            </p>
          </div>

          <Link
            href={viewAllBuyHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-navy transition-colors shrink-0"
          >
            <span>{t('viewAllIn', { location: location.name })}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        <LocationListingsGrid
          listings={displayListings}
          countryCode={countryCode}
          emptyMessage={t('noListings')}
        />
      </section>

      {/* 5. Explore Nearby Areas */}
      {nearbyLocations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              {t('nearby')}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              {t('nearbySubtitle', { country: countryDisplayName })}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearbyLocations.map((item) => (
              <Link
                key={item.id}
                href={`/${locale}/${countryCode}/locations/${item.slug}`}
                className="group block rounded-2xl overflow-hidden bg-card border border-line shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-navy">
                  <SiteImage
                    src={item.coverImage || '/images/defaults/apartment/cover-card.webp'}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                      {item.listingCount} listings
                    </span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-serif text-base font-semibold text-navy group-hover:text-gold transition-colors">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-1">
                    {item.tagLabel || (item.type === 'city' ? 'City Hub' : 'District')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

