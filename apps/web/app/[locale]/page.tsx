import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { SiteImage } from '@/components/SiteImage';
import { getFeaturedListings, type ListingSummary } from '@/lib/data';

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

  const featured = await getFeaturedListings(undefined, 4);

  return <BrandedShell locale={locale} featured={featured} />;
}

/**
 * Temporary country chooser. Stage 6 replaces it with the animated intro and 4-panel selector.
 * The navy hero band carries `data-nav-hero`, which makes the navbar transparent at the top.
 */
function BrandedShell({
  locale,
  featured,
}: {
  locale: string;
  featured: ListingSummary[];
}) {
  const t = useTranslations('common');

  const countries = [
    { code: 'ae', name: t('countries.ae'), currency: 'AED', panel: '/images/panels/panel-uae.webp' },
    { code: 'eg', name: t('countries.eg'), currency: 'EGP', panel: '/images/panels/panel-egypt.webp' },
    { code: 'ge', name: t('countries.ge'), currency: 'GEL', panel: '/images/panels/panel-georgia.webp' },
    { code: 'tr', name: t('countries.tr'), currency: 'TRY', panel: '/images/panels/panel-turkey.webp' },
  ];

  return (
    <>
      <section data-nav-hero className="on-navy bg-navy pb-16 pt-28 text-ivory md:pb-24 md:pt-44">
        <div className="container text-start">
          <div className="max-w-2xl">
            <span className="mb-3 inline-block text-xs font-semibold tracking-wider text-gold-light">
              {t('tagline')}
            </span>
            <h1 className="h1 mb-6 text-ivory">{t('shell.welcome')}</h1>
            <p className="text-lg leading-relaxed text-ivory/80 md:text-xl">
              {t('shell.description')}
            </p>
          </div>
        </div>
      </section>

      <section className="container py-12 text-start md:py-16">
        {/* Country Navigation Cards (server-rendered for crawlers and visitors) */}
        <h2 className="mb-6 font-sans text-sm font-semibold tracking-wider text-muted">
          {t('chooseCountry')}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {countries.map((country) => (
            <Link
              key={country.code}
              href={`/${country.code}`}
              className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-white text-start shadow-subtle transition-all duration-300 hover:border-gold"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-navy-2">
                <SiteImage
                  src={country.panel}
                  alt={country.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
                <div className="absolute end-3 top-3 z-10">
                  <span className="rounded bg-white/90 px-2 py-1 text-xs font-semibold tracking-wider text-navy">
                    {country.code.toUpperCase()}
                  </span>
                </div>
                <div className="absolute bottom-4 start-4 end-4 z-10">
                  <div className="mb-1 text-xs font-medium tracking-wider text-gold-light">
                    {country.currency}
                  </div>
                  <div className="font-serif text-xl font-medium text-ivory transition-colors group-hover:text-gold-light">
                    {country.name}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {featured.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 font-sans text-sm font-semibold tracking-wider text-muted">
              {locale === 'ar' ? 'مختارات مميزة عالمياً' : 'Featured Global Highlights'}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-card border border-line bg-white p-4 text-start shadow-subtle transition-all duration-300 hover:border-gold"
                >
                  <div className="relative mb-3 aspect-[16/10] w-full overflow-hidden rounded bg-navy-2">
                    <SiteImage
                      src={item.coverImage}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute end-2 top-2 z-10">
                      <span className="rounded bg-navy/80 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-gold-light uppercase">
                        {item.location.countryCode}
                      </span>
                    </div>
                  </div>
                  <div className="mb-1 text-xs font-semibold text-gold">{item.refNumber}</div>
                  <div className="font-serif text-base font-medium text-navy line-clamp-1">{item.title}</div>
                  <div className="mt-2 text-xs text-muted">
                    {item.location.city} • {item.bedrooms} {locale === 'ar' ? 'غرف' : 'Beds'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
