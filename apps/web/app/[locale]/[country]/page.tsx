import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

const VALID_COUNTRIES = ['ae', 'eg', 'ge', 'tr'] as const;
type CountryCode = (typeof VALID_COUNTRIES)[number];

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

  return <CountryShell locale={locale} country={country as CountryCode} />;
}

/**
 * Temporary country page. Stage 7 replaces it with the full country home.
 * The navy hero band carries `data-nav-hero`, which makes the navbar transparent at the top.
 */
function CountryShell({
  locale,
  country,
}: {
  locale: string;
  country: CountryCode;
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
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-[4px] border border-ivory px-5 text-sm font-medium text-ivory transition-colors hover:bg-ivory hover:text-navy"
        >
          {locale === 'ar' ? 'جميع الدول' : 'All countries'}
        </Link>
      </div>
    </section>
  );
}
