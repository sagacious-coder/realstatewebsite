import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import {
  searchListings,
  getLocations,
  getCountrySettings,
  type CountryCode,
} from '@/lib/data';
import { SearchDirectoryClient } from '@/components/search/SearchDirectoryClient';
import type { SearchFilterState } from '@/components/search/types';
import type {
  PropertyType,
  PropertyStatus,
  ListingSort,
  CurrencyCode,
  UnitSizeUnit,
  SearchQueryInput,
} from '@wild-hills/contracts';

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
    ? `عقارات للبيع في ${countryName} | وايلد هيلز للعقارات`
    : `Properties for Sale in ${countryName} | Wild Hills Real Estate`;

  const description = isArabic
    ? `استكشف عقارات وفلل وشقق للبيع في ${countryName}. تصفّح المشاريع الموثقة على الخارطة والمشاريع الجاهزة للسكن.`
    : `Explore verified luxury properties, off-plan investments, and homes for sale in ${countryName} with flexible installment payment plans.`;

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
          alt: `${countryName} Real Estate Search`,
        },
      ],
    },
  };
}

export default async function BuyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

  const rawSearchParams = await searchParams;

  // Helper to parse query values
  const getParam = (key: string): string | undefined => {
    const val = rawSearchParams[key];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  const getArrayParam = (key: string): string[] | undefined => {
    const val = rawSearchParams[key];
    if (!val) return undefined;
    if (Array.isArray(val)) return val;
    return [val];
  };

  // Parse filters into typed SearchFilterState & SearchQueryInput
  const q = getParam('q');
  const city = getParam('city');
  const area = getParam('area');
  const typeParam = getArrayParam('type') as PropertyType[] | undefined;
  const minPrice = getParam('minPrice') ? Number(getParam('minPrice')) : undefined;
  const maxPrice = getParam('maxPrice') ? Number(getParam('maxPrice')) : undefined;
  const currencyParam = getParam('currency') as CurrencyCode | undefined;
  const beds = getParam('beds');
  const baths = getParam('baths') ? Number(getParam('baths')) : undefined;
  const minSize = getParam('minSize') ? Number(getParam('minSize')) : undefined;
  const maxSize = getParam('maxSize') ? Number(getParam('maxSize')) : undefined;
  const sizeUnit = (getParam('sizeUnit') as UnitSizeUnit) || 'sqm';
  const statusParam = getArrayParam('status') as PropertyStatus[] | undefined;
  const isHotDeal = getParam('isHotDeal') === 'true';
  const isNewLaunch = getParam('isNewLaunch') === 'true';
  const isVerified = getParam('isVerified') === 'true';
  const hasInstallments = getParam('hasInstallments') === 'true';
  const sort = (getParam('sort') as ListingSort) || 'featured';
  const page = getParam('page') ? Math.max(1, parseInt(getParam('page')!, 10)) : 1;
  const limit = 12;

  // Query contract input
  const queryInput: SearchQueryInput = {
    country: countryCode,
    city: city || undefined,
    area: area || undefined,
    type: typeParam && typeParam.length > 0 ? typeParam : undefined,
    minPrice: minPrice !== undefined && !isNaN(minPrice) ? minPrice : undefined,
    maxPrice: maxPrice !== undefined && !isNaN(maxPrice) ? maxPrice : undefined,
    currency: currencyParam,
    beds: beds || undefined,
    baths: baths !== undefined && !isNaN(baths) ? baths : undefined,
    minSize: minSize !== undefined && !isNaN(minSize) ? minSize : undefined,
    maxSize: maxSize !== undefined && !isNaN(maxSize) ? maxSize : undefined,
    sizeUnit,
    status: statusParam && statusParam.length > 0 ? statusParam : undefined,
    isHotDeal: isHotDeal || undefined,
    isNewLaunch: isNewLaunch || undefined,
    isVerified: isVerified || undefined,
    hasInstallments: hasInstallments || undefined,
    q: q || undefined,
    sort,
    page,
    limit,
  };

  // Active filters for UI state
  const activeFilters: SearchFilterState = {
    country: countryCode,
    city,
    area,
    type: typeParam,
    minPrice: queryInput.minPrice,
    maxPrice: queryInput.maxPrice,
    currency: currencyParam,
    beds,
    baths: queryInput.baths,
    minSize: queryInput.minSize,
    maxSize: queryInput.maxSize,
    sizeUnit,
    status: statusParam,
    isHotDeal,
    isNewLaunch,
    isVerified,
    hasInstallments,
    q,
    sort,
    page,
    limit,
  };

  // Concurrently fetch server data: listings, locations, and country settings
  const [searchResult, locations, countrySettings] = await Promise.all([
    searchListings(queryInput),
    getLocations(countryCode),
    getCountrySettings(countryCode),
  ]);

  const activeCurrency: CurrencyCode =
    currencyParam || countrySettings.currency || 'USD';

  return (
    <main id="main-content" className="min-h-screen bg-ivory text-navy">
      <SearchDirectoryClient
        countryCode={countryCode}
        countryName={countryName}
        locations={locations}
        currency={activeCurrency}
        initialListings={searchResult.items}
        totalCount={searchResult.total}
        currentPage={searchResult.page}
        totalPages={searchResult.totalPages}
        filters={activeFilters}
      />
    </main>
  );
}

