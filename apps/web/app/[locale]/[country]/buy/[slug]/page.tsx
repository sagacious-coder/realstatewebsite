import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import {
  getListingBySlug,
  getDeveloper,
  searchListings,
  type CountryCode,
} from '@/lib/data';
import { FIXTURE_LISTINGS } from '@wild-hills/contracts';
import { PropertyHeader } from '@/components/property/PropertyHeader';
import { PropertyHeroGallery } from '@/components/property/PropertyHeroGallery';
import { PropertyAttributes } from '@/components/property/PropertyAttributes';
import { PropertyPaymentPlan } from '@/components/property/PropertyPaymentPlan';
import { PropertyFeatures } from '@/components/property/PropertyFeatures';
import { PropertyLocation } from '@/components/property/PropertyLocation';
import { PropertyInquirySidebar } from '@/components/property/PropertyInquirySidebar';
import { SimilarProperties } from '@/components/property/SimilarProperties';

const VALID_COUNTRIES: readonly CountryCode[] = ['ae', 'eg', 'ge', 'tr'];

const COUNTRY_NAMES_EN: Record<CountryCode, string> = {
  ae: 'United Arab Emirates',
  eg: 'Egypt',
  ge: 'Georgia',
  tr: 'Turkey',
};

const COUNTRY_NAMES_AR: Record<CountryCode, string> = {
  ae: 'الإمارات العربية المتحدة',
  eg: 'مصر',
  ge: 'جورجيا',
  tr: 'تركيا',
};

export function generateStaticParams() {
  const params: { locale: string; country: string; slug: string }[] = [];
  const locales = ['en', 'ar', 'tr', 'ka'];
  for (const locale of locales) {
    for (const listing of FIXTURE_LISTINGS) {
      params.push({
        locale,
        country: listing.location.countryCode,
        slug: listing.slug,
      });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, country, slug } = await params;
  if (!VALID_COUNTRIES.includes(country as CountryCode)) {
    return {};
  }

  const countryCode = country as CountryCode;
  const listing = await getListingBySlug(slug);
  if (!listing) return {};

  const isArabic = locale === 'ar';
  const countryName = isArabic
    ? COUNTRY_NAMES_AR[countryCode]
    : COUNTRY_NAMES_EN[countryCode];

  const title = isArabic
    ? `${listing.title} | وايلد هيلز للعقارات ${countryName}`
    : `${listing.title} | Wild Hills Real Estate ${countryName}`;

  const description = isArabic
    ? `${listing.title} في ${listing.location.city}، ${countryName}. ${listing.bedrooms} غرف نوم، ${listing.bathrooms} حمام، بمساحة ${listing.sizeSqm} م². تشطيب راقٍ ومزايا حصرية.`
    : `${listing.title} for sale in ${listing.location.city}, ${countryName}. Featuring ${listing.bedrooms} bedrooms, ${listing.bathrooms} bathrooms, and ${listing.sizeSqm} sqm built-up area.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: listing.coverImage || listing.images[0]?.url || `/images/${countryCode}/hero/hero-01.webp`,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
    },
    alternates: {
      languages: {
        en: `/en/${countryCode}/buy/${listing.slug}`,
        ar: `/ar/${countryCode}/buy/${listing.slug}`,
      },
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; slug: string }>;
}) {
  const { locale, country, slug } = await params;

  if (!VALID_COUNTRIES.includes(country as CountryCode)) {
    notFound();
  }

  setRequestLocale(locale);

  const countryCode = country as CountryCode;
  const isArabic = locale === 'ar';
  const countryName = isArabic
    ? COUNTRY_NAMES_AR[countryCode]
    : COUNTRY_NAMES_EN[countryCode];

  const listing = await getListingBySlug(slug);
  if (!listing || listing.location.countryCode !== countryCode) {
    notFound();
  }

  // Concurrently fetch developer info and similar properties
  const [developer, similarResult] = await Promise.all([
    listing.developer?.id ? getDeveloper(listing.developer.id) : Promise.resolve(null),
    searchListings({
      country: countryCode,
      type: [listing.propertyType],
      limit: 4,
    }),
  ]);

  // Filter out active property from similar listings and take up to 3
  const similarListings = similarResult.items
    .filter((item) => item.id !== listing.id)
    .slice(0, 3);

  return (
    <main id="main-content" className="min-h-screen bg-ivory text-navy pb-16">
      <div className="container pt-6 sm:pt-8">
        {/* 1. Breadcrumbs & Header Bar */}
        <PropertyHeader
          countryCode={countryCode}
          countryName={countryName}
          city={listing.location.city}
          title={listing.title}
          refCode={listing.refNumber}
          status={listing.status}
          badges={listing.badges}
          isHotDeal={listing.isHotDeal}
          isNewLaunch={listing.isNewLaunch}
          isVerified={listing.isVerified}
          isSample={listing.isSample}
        />

        {/* 2. Hero Gallery & Media Showcase */}
        <PropertyHeroGallery
          coverImage={listing.coverImage}
          images={listing.images}
          floorPlans={listing.floorPlans}
          title={listing.title}
        />

        {/* 3. Main Content Split: Left Details + Right Sticky Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-8">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key Attributes & Description */}
            <PropertyAttributes
              countryCode={countryCode}
              priceMinor={listing.priceMinor}
              originalCurrency={listing.currency}
              bedrooms={listing.bedrooms}
              bathrooms={listing.bathrooms}
              sizeSqm={listing.sizeSqm}
              completionYear={listing.completionYear}
              status={listing.status}
              furnishingStatus={listing.furnishingStatus}
              description={listing.description}
              developer={developer}
            />

            {/* Structured Payment Plan */}
            {listing.paymentPlan && (
              <PropertyPaymentPlan
                paymentPlan={listing.paymentPlan}
                priceMinor={listing.priceMinor}
                originalCurrency={listing.currency}
              />
            )}

            {/* Features & Amenities */}
            <PropertyFeatures features={listing.features} />

            {/* Location & Vicinity */}
            <PropertyLocation
              location={listing.location}
              countryName={countryName}
            />
          </div>

          {/* Right Column: Sticky Inquiry Sidebar */}
          <div className="lg:col-span-1">
            <PropertyInquirySidebar
              countryCode={countryCode}
              listingId={listing.id}
              refCode={listing.refNumber}
              title={listing.title}
              priceMinor={listing.priceMinor}
              originalCurrency={listing.currency}
              agent={listing.agent}
            />
          </div>
        </div>

        {/* 4. Similar Properties Grid */}
        <SimilarProperties
          countryCode={countryCode}
          countryName={countryName}
          similarListings={similarListings}
          className="mt-12"
        />
      </div>
    </main>
  );
}

