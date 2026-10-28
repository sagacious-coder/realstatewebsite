import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <LocaleHomeContent params={params} />;
}

async function LocaleHomeContent({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BrandedShell locale={locale} />;
}

function BrandedShell({ locale }: { locale: string }) {
  const t = useTranslations('common');
  const isArabic = locale === 'ar';

  const countries = [
    { code: 'ae', name: t('countries.ae'), currency: 'AED' },
    { code: 'eg', name: t('countries.eg'), currency: 'EGP' },
    { code: 'ge', name: t('countries.ge'), currency: 'GEL' },
    { code: 'tr', name: t('countries.tr'), currency: 'TRY' },
  ];

  return (
    <main className="min-h-screen flex flex-col justify-between bg-ivory text-navy px-6 py-12 md:py-20 max-w-[1200px] mx-auto">
      {/* Top Brand Bar */}
      <header className="flex items-center justify-between border-b border-line pb-6">
        <div>
          <div className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-navy">
            {t('brandName')}
          </div>
          <div className="text-xs uppercase tracking-widest text-gold-deep font-sans mt-0.5">
            {t('tagline')}
          </div>
        </div>

        {/* Locale switcher */}
        <nav
          aria-label="Language switcher"
          className="flex items-center gap-3 text-sm font-sans"
        >
          <Link
            href="/"
            locale="en"
            className={`px-3 py-1.5 rounded transition-colors ${
              !isArabic
                ? 'bg-navy text-ivory font-medium'
                : 'text-muted hover:text-navy'
            }`}
          >
            English
          </Link>
          <span className="text-line" aria-hidden="true">
            |
          </span>
          <Link
            href="/"
            locale="ar"
            className={`px-3 py-1.5 rounded transition-colors ${
              isArabic
                ? 'bg-navy text-ivory font-medium'
                : 'text-muted hover:text-navy'
            }`}
          >
            العربية
          </Link>
        </nav>
      </header>

      {/* Main Hero & Country Chooser Shell */}
      <section className="my-auto py-12 text-start">
        <div className="max-w-2xl">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-gold-deep mb-3">
            {t('tagline')}
          </span>
          <h1 className="h1 mb-6 text-navy">
            {t('shell.welcome')}
          </h1>
          <p className="text-lg md:text-xl text-muted leading-relaxed mb-10">
            {t('shell.description')}
          </p>
        </div>

        {/* Country Navigation Cards (Server-rendered for crawlers and visitors) */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-6">
            {t('chooseCountry')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {countries.map((country) => (
              <Link
                key={country.code}
                href={`/${country.code}`}
                className="group p-6 rounded-card bg-white border border-line shadow-subtle hover:border-gold transition-all duration-200 text-start"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium uppercase tracking-wider px-2 py-1 bg-mist text-emerald rounded">
                    {country.code.toUpperCase()}
                  </span>
                  <span className="text-xs font-medium text-muted">
                    {country.currency}
                  </span>
                </div>
                <div className="text-lg font-serif font-medium text-navy group-hover:text-gold-deep transition-colors">
                  {country.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Minimal Indicator */}
      <footer className="border-t border-line pt-6 text-xs text-muted flex flex-col sm:flex-row justify-between items-center gap-4 text-start">
        <p>© {new Date().getFullYear()} Wild Hills Real Estate. All rights reserved.</p>
        <p className="text-gold-deep font-medium">Stage 1: Core Shell Verified</p>
      </footer>
    </main>
  );
}
