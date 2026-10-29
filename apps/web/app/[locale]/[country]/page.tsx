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
    <main className="min-h-screen bg-ivory text-navy px-6 py-12 md:py-20 max-w-[1200px] mx-auto flex flex-col justify-between">
      <header className="flex items-center justify-between border-b border-line pb-6">
        <div>
          <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-navy">
            {t('brandName')}
          </Link>
          <div className="text-xs uppercase tracking-widest text-gold-deep font-sans mt-0.5">
            {t('tagline')}
          </div>
        </div>

        <Link
          href="/"
          className="text-sm font-sans text-muted hover:text-navy px-3 py-1.5 rounded border border-line hover:border-gold transition-colors"
        >
          {locale === 'ar' ? '← جميع الدول' : '← All Countries'}
        </Link>
      </header>

      <section className="py-16 text-start">
        <span className="inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 bg-mist text-emerald rounded mb-4">
          {country.toUpperCase()}
        </span>
        <h1 className="h1 mb-4 text-navy">
          {countryName}
        </h1>
        <p className="text-lg text-muted max-w-xl mb-8">
          {locale === 'ar'
            ? `استكشف أفضل العقارات والمشاريع الاستثمارية في ${countryName}.`
            : `Explore premium properties, off-plan launches, and verified resale opportunities in ${countryName}.`}
        </p>

        <div className="p-6 rounded-card bg-white border border-line shadow-subtle max-w-md">
          <p className="text-sm text-muted">
            {locale === 'ar'
              ? 'مرحلة الإعداد 1: تم تهيئة الموقع الأساسي بنجاح.'
              : 'Stage 1 setup verified: Locale & Country shell active.'}
          </p>
        </div>
      </section>

      <footer className="border-t border-line pt-6 text-xs text-muted flex justify-between items-center text-start">
        <p>© {new Date().getFullYear()} Wild Hills Real Estate.</p>
        <p className="text-gold-deep font-medium">{country.toUpperCase()} Portal</p>
      </footer>
    </main>
  );
}
