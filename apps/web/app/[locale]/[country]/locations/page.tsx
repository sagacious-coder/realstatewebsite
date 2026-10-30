import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, ArrowRight, MapPin } from 'lucide-react';
import { isCountryCode, COUNTRY_CODES, type CountryCode } from '@/lib/countries';
import { getLocations } from '@/lib/data';
import { SiteImage } from '@/components/SiteImage';

interface LocationsDirectoryProps {
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

export async function generateMetadata({ params }: LocationsDirectoryProps) {
  const { country } = await params;
  if (!isCountryCode(country)) return {};

  return {
    title: `Destinations & Investment Hubs | Wild Hills Real Estate`,
    description: `Explore prime residential communities, cities, and coastal destinations available across ${country.toUpperCase()}.`,
  };
}

export default async function LocationsDirectoryPage({ params }: LocationsDirectoryProps) {
  const { locale, country } = await params;

  if (!isCountryCode(country)) {
    notFound();
  }

  const countryCode = country as CountryCode;
  const t = await getTranslations({ locale, namespace: 'locations' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const countryName = tCommon(`countries.${countryCode}`);

  const locations = await getLocations(countryCode);
  const cities = locations.filter((l) => l.type === 'city');
  const areas = locations.filter((l) => l.type === 'area');

  return (
    <div className="min-h-screen bg-sand text-navy pb-24">
      {/* Breadcrumbs */}
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
            Destinations
          </li>
        </ol>
      </nav>

      {/* Hero Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-card rounded-3xl border border-line p-8 sm:p-12 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-semibold mb-4 tracking-wider uppercase">
            <MapPin className="w-3.5 h-3.5" />
            <span>{countryName}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-navy tracking-tight">
            {t('allLocationsTitle', { country: countryName })}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted max-w-2xl">
            {t('allLocationsSubtitle')}
          </p>
        </div>
      </header>

      {/* Cities Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="font-serif text-2xl font-bold text-navy mb-6">Prime Cities & Regions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/${locale}/${countryCode}/locations/${city.slug}`}
              className="group block rounded-2xl overflow-hidden bg-card border border-line shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-navy">
                <SiteImage
                  src={city.coverImage || '/images/defaults/apartment/cover.webp'}
                  alt={city.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-white group-hover:text-gold transition-colors">
                      {city.name}
                    </h3>
                    <p className="text-xs text-sand/80 mt-0.5">
                      {city.listingCount} Available Properties
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4 text-white rtl:rotate-180" />
                  </div>
                </div>
              </div>
              {city.description && (
                <div className="p-4">
                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {city.description}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Areas & Districts Section */}
      {areas.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-navy mb-6">
            Featured Neighborhoods & Districts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {areas.map((area) => (
              <Link
                key={area.id}
                href={`/${locale}/${countryCode}/locations/${area.slug}`}
                className="group block rounded-2xl overflow-hidden bg-card border border-line shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-navy">
                  <SiteImage
                    src={area.coverImage || '/images/defaults/apartment/cover-card.webp'}
                    alt={area.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                      {area.listingCount} listings
                    </span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-base font-semibold text-navy group-hover:text-gold transition-colors">
                    {area.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-1">
                    {area.tagLabel || 'District'}
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

