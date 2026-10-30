import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import {
  getCountrySettings,
  getFeaturedListings,
  getFeaturedLocations,
  getDevelopers,
  getBuyingGuide,
  getFaqs,
  getTestimonials,
  getBlogPosts,
  type CountryCode,
} from '@/lib/data';
import { CountryHeroSlideshow } from '@/components/country/CountryHeroSlideshow';
import { FeaturedLocationsSection } from '@/components/country/FeaturedLocationsSection';
import { HotDealsSection } from '@/components/country/HotDealsSection';
import { WhyWildHillsSection } from '@/components/country/WhyWildHillsSection';
import { DeveloperStripSection } from '@/components/country/DeveloperStripSection';
import { PaymentPlanCalculatorSection } from '@/components/country/PaymentPlanCalculatorSection';
import { BuyingGuideSection } from '@/components/country/BuyingGuideSection';
import { TestimonialsSection } from '@/components/country/TestimonialsSection';
import { FaqSection } from '@/components/country/FaqSection';
import { BlogSection } from '@/components/country/BlogSection';
import { FinalCtaSection } from '@/components/country/FinalCtaSection';

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
  const params: { locale: string; country: string }[] = [];
  const locales = ['en', 'ar', 'tr', 'ka'];
  for (const locale of locales) {
    for (const country of VALID_COUNTRIES) {
      params.push({ locale, country });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  if (!VALID_COUNTRIES.includes(country as CountryCode)) {
    return {};
  }

  const countryCode = country as CountryCode;
  const isArabic = locale === 'ar';
  const countryName = isArabic
    ? COUNTRY_NAMES_AR[countryCode]
    : COUNTRY_NAMES_EN[countryCode];

  const title = isArabic
    ? `عقارات ${countryName} | وايلد هيلز للعقارات`
    : `Luxury Real Estate & Homes in ${countryName} | Wild Hills`;

  const description = isArabic
    ? `استكشف أفضل العقارات والمشاريع قيد الإنشاء في ${countryName}. فلل وشقق ومشاريع بحرية مباشرة من كبار المطورين.`
    : `Explore premium residential properties, luxury waterfront villas, and off-plan launches in ${countryName} with direct developer installment plans.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/images/${countryCode}/hero/hero-01.webp`,
          width: 2400,
          height: 1350,
          alt: `${countryName} Real Estate`,
        },
      ],
    },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;

  if (!VALID_COUNTRIES.includes(country as CountryCode)) {
    notFound();
  }

  setRequestLocale(locale);

  const countryCode = country as CountryCode;
  const isArabic = locale === 'ar';
  const countryName = isArabic
    ? COUNTRY_NAMES_AR[countryCode]
    : COUNTRY_NAMES_EN[countryCode];

  // Fetch all country domain fixtures via the central typed API client
  const [
    settings,
    locations,
    featuredListings,
    developers,
    buyingGuide,
    faqs,
    testimonials,
    blogPosts,
  ] = await Promise.all([
    getCountrySettings(countryCode),
    getFeaturedLocations(countryCode),
    getFeaturedListings(countryCode, 6),
    getDevelopers(countryCode),
    getBuyingGuide(countryCode),
    getFaqs(countryCode),
    getTestimonials(countryCode),
    getBlogPosts(countryCode),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      {/* 1. Hero Slideshow with Rising Search Bar */}
      <CountryHeroSlideshow
        countryCode={countryCode}
        countryName={countryName}
        locale={locale}
        locations={locations}
      />

      {/* 2. Featured Locations (Cities / Areas) with Empty State Fallback */}
      <FeaturedLocationsSection
        countryCode={countryCode}
        countryName={countryName}
        locale={locale}
        locations={locations}
      />

      {/* 3. Hot Deals & New Launches */}
      <HotDealsSection
        countryCode={countryCode}
        countryName={countryName}
        listings={featuredListings}
      />

      {/* 4. Why Wild Hills Value Proposition & Animated Counters */}
      <WhyWildHillsSection />

      {/* 5. Developer Logo Strip */}
      <DeveloperStripSection
        countryCode={countryCode}
        countryName={countryName}
        developers={developers}
      />

      {/* 6. Payment Plan Calculator */}
      <PaymentPlanCalculatorSection
        countryCode={countryCode}
        countryName={countryName}
      />

      {/* 7. Country Buying Guide (Foreign Buyer's Handbook) */}
      <BuyingGuideSection
        countryCode={countryCode}
        countryName={countryName}
        guide={buyingGuide}
      />

      {/* 8. Testimonials & Client Stories */}
      <TestimonialsSection
        countryCode={countryCode}
        testimonials={testimonials}
      />

      {/* 9. Frequently Asked Questions Accordion */}
      <FaqSection
        countryCode={countryCode}
        countryName={countryName}
        faqs={faqs}
      />

      {/* 10. Blog Posts / Market Insights */}
      <BlogSection
        countryCode={countryCode}
        countryName={countryName}
        posts={blogPosts}
      />

      {/* 11. Final High-Impact Advisory CTA */}
      <FinalCtaSection
        countryCode={countryCode}
        countryName={countryName}
        settings={settings}
      />

      {/* 12. Footer is rendered universally by apps/web/app/[locale]/layout.tsx */}
    </div>
  );
}
