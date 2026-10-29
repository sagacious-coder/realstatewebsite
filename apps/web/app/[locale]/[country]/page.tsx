import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  getCountrySettings,
  getFeaturedListings,
  type CountryCode,
  type CountrySettings,
  type ListingSummary,
} from '@/lib/data';

const VALID_COUNTRIES: readonly CountryCode[] = ['ae', 'eg', 'ge', 'tr'];

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

export default function CountryPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  return <CountryContent params={params} />;
}

async function CountryContent({
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
  const [settings, featuredListings] = await Promise.all([
    getCountrySettings(countryCode),
    getFeaturedListings(countryCode, 3),
  ]);

  return (
    <CountryShell
      locale={locale}
      country={countryCode}
      settings={settings}
      featuredListings={featuredListings}
    />
  );
}

/**
 * Temporary country page. Stage 7 replaces it with the full country home.
 * The navy hero band carries `data-nav-hero`, which makes the navbar transparent at the top.
 */
function CountryShell({
  locale,
  country,
  settings,
  featuredListings,
}: {
  locale: string;
  country: CountryCode;
  settings: CountrySettings;
  featuredListings: ListingSummary[];
}) {
  const t = useTranslations('common');
  const countryName = t(`countries.${country}`);

  return (
    <section data-nav-hero className="on-navy bg-navy pb-20 pt-28 text-ivory md:pb-28 md:pt-44">
      <div className="container text-start">
        <span className="mb-4 inline-block rounded bg-mist px-2.5 py-1 text-xs font-semibold tracking-wider text-emerald">
          {country.toUpperCase()}
        </span>
        <h1 className="h1 mb-4 text-ivory">{countryName}</h1>
        <p className="mb-8 max-w-xl text-lg text-ivory/80">
          {locale === 'ar'
            ? `استكشف أفضل العقارات والمشاريع الاستثمارية في ${countryName}.`
            : `Explore premium properties, off-plan launches, and verified resale opportunities in ${countryName}.`}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-[4px] border border-ivory px-5 text-sm font-medium text-ivory transition-colors hover:bg-ivory hover:text-navy"
          >
            {locale === 'ar' ? 'جميع الدول' : 'All countries'}
          </Link>
          <span className="text-xs text-ivory/60">
            {locale === 'ar' ? `العملة: ${settings.currency}` : `Default currency: ${settings.currency}`}
          </span>
        </div>

        {featuredListings.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-xs font-semibold tracking-wider text-gold-light uppercase">
              {locale === 'ar' ? 'عقارات مميزة في الدولة' : 'Featured Country Properties'}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredListings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-card border border-ivory/20 bg-white/5 p-4 text-start backdrop-blur-sm"
                >
                  <div className="mb-1 text-xs font-semibold text-gold-light">{item.refNumber}</div>
                  <div className="font-serif text-lg text-ivory line-clamp-1">{item.title}</div>
                  <div className="mt-2 text-xs text-ivory/70">
                    {item.location.city} • {item.bedrooms} {locale === 'ar' ? 'غرف' : 'Beds'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
