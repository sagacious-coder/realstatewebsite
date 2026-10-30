import { setRequestLocale } from 'next-intl/server';
import { BrandIntro } from '@/components/intro/BrandIntro';
import { CountryChooser } from '@/components/home/CountryChooser';
import { SiteImage } from '@/components/SiteImage';
import { getFeaturedListings, type ListingSummary } from '@/lib/data';

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Prefetch global highlights for editorial depth
  const featured = await getFeaturedListings(undefined, 4);

  return (
    <>
      {/* Animated Brand Intro (full-screen overlay, skippable, plays once per session) */}
      <BrandIntro />

      {/* Interactive Four-Panel Country Chooser (Section 8.2) */}
      <CountryChooser locale={locale} />

      {/* Featured Global Highlights section below the chooser */}
      {featured.length > 0 && (
        <section className="container py-16 md:py-20 text-start">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 pb-4 border-b border-line/60">
            <div>
              <span className="text-xs font-semibold tracking-widest text-gold uppercase block mb-1">
                {locale === 'ar' ? 'مختارات عالمية' : 'Curated Portfolio'}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-navy font-medium">
                {locale === 'ar' ? 'مختارات مميزة عالمياً' : 'Featured Global Highlights'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted mt-2 sm:mt-0 font-sans">
              {locale === 'ar'
                ? 'استكشف نماذج من عقاراتنا الفاخرة المعتمدة'
                : 'Verified prime residences across all four destination markets'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item: ListingSummary) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-card border border-line bg-white p-4 text-start shadow-subtle transition-all duration-300 hover:border-gold hover:shadow-md"
              >
                <div className="relative mb-3 aspect-[16/10] w-full overflow-hidden rounded bg-navy-2">
                  <SiteImage
                    src={item.coverImage}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute end-2 top-2 z-10">
                    <span className="rounded bg-navy/85 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-gold-light uppercase backdrop-blur-sm border border-white/10">
                      {item.location.countryCode.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="mb-1 text-xs font-semibold text-gold font-mono">
                  {item.refNumber}
                </div>
                <div className="font-serif text-base font-medium text-navy line-clamp-1 group-hover:text-gold-deep transition-colors">
                  {item.title}
                </div>
                <div className="mt-2 text-xs text-muted font-sans flex items-center justify-between">
                  <span>
                    {item.location.city}
                    {item.location.area ? ` · ${item.location.area}` : ''}
                  </span>
                  <span>
                    {item.bedrooms}{' '}
                    {locale === 'ar' ? 'غرف' : item.bedrooms === 1 ? 'Bed' : 'Beds'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
