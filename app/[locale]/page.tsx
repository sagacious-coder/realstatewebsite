import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { SiteImage } from '@/components/SiteImage';

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
    { code: 'ae', name: t('countries.ae'), currency: 'AED', panel: '/images/panels/panel-uae.webp' },
    { code: 'eg', name: t('countries.eg'), currency: 'EGP', panel: '/images/panels/panel-egypt.webp' },
    { code: 'ge', name: t('countries.ge'), currency: 'GEL', panel: '/images/panels/panel-georgia.webp' },
    { code: 'tr', name: t('countries.tr'), currency: 'TRY', panel: '/images/panels/panel-turkey.webp' },
  ];

  return (
    <main className="min-h-screen flex flex-col justify-between bg-ivory text-navy px-6 py-12 md:py-20 max-w-[1200px] mx-auto">
      {/* Top Brand Bar */}
      <header className="flex items-center justify-between border-b border-line pb-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/wild-hills-logo-full-light.svg"
            alt="Wild Hills Real Estate"
            width={160}
            height={44}
            className="h-10 w-auto"
            priority
          />
        </Link>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {countries.map((country) => (
              <Link
                key={country.code}
                href={`/${country.code}`}
                className="group relative overflow-hidden rounded-card bg-white border border-line shadow-subtle hover:border-gold transition-all duration-300 text-start flex flex-col"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-navy-2">
                  <SiteImage
                    src={country.panel}
                    alt={country.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
                  <div className="absolute top-3 end-3 z-10">
                    <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 bg-white/90 text-navy backdrop-blur-sm rounded">
                      {country.code.toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute bottom-4 start-4 end-4 z-10">
                    <div className="text-xs font-medium text-gold-light uppercase tracking-wider mb-1">
                      {country.currency}
                    </div>
                    <div className="text-xl font-serif font-medium text-ivory group-hover:text-gold-light transition-colors">
                      {country.name}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Minimal Indicator */}
      <footer className="border-t border-line pt-6 text-xs text-muted flex flex-col sm:flex-row justify-between items-center gap-4 text-start">
        <p>© {new Date().getFullYear()} Wild Hills Real Estate. All rights reserved.</p>
        <p className="text-gold-deep font-medium">Stage 2: Assets &amp; Image Pipeline Verified</p>
      </footer>
    </main>
  );
}
