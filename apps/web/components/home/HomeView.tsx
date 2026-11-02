'use client';

import React, { useState, useEffect } from 'react';
import { BrandIntroClient as BrandIntro } from '@/components/intro/BrandIntroClient';
import { CountryChooser } from '@/components/home/CountryChooser';
import { SiteImage } from '@/components/SiteImage';
import type { ListingSummary } from '@/lib/data';
import { COOKIE_INTRO_SEEN } from '@/lib/countries';
import { cn } from '@/lib/utils';

export interface HomeViewProps {
  locale: string;
  featured: ListingSummary[];
  introSeenInitial?: boolean;
}

/**
 * HomeView - FOUC-Proof Brand Intro & Country Chooser View
 *
 * Requirements & Architecture:
 * 1. Default State:
 *    - isIntroComplete defaults to false (unless server cookie explicitly proves intro was seen).
 *    - The main content stays hidden with opacity-0 and sits strictly behind the z-[100] opaque intro overlay.
 * 2. Opaque Initial Background:
 *    - Intro overlay covers viewport immediately with bg-[#101B33] and 100% solid opacity from frame 0.
 * 3. Client Verification:
 *    - Checks sessionStorage/cookie; if already seen in current session, instantly reveals content.
 * 4. Smooth Transition:
 *    - Once animation sequence completes (or on Skip), onComplete() sets isIntroComplete=true,
 *      smoothly transitioning main content via transition-opacity duration-700 opacity-100.
 */
export function HomeView({ locale, featured, introSeenInitial = false }: HomeViewProps) {
  const [isIntroComplete, setIsIntroComplete] = useState<boolean>(introSeenInitial);

  useEffect(() => {
    // 0. Check replay query parameter (?replay=1 or ?intro=1)
    const isReplay =
      typeof window !== 'undefined' &&
      (new URLSearchParams(window.location.search).get('replay') === '1' ||
        new URLSearchParams(window.location.search).get('intro') === '1');

    if (isReplay) {
      setIsIntroComplete(false);
      return;
    }

    // 1. Check client sessionStorage or cookie
    try {
      if (
        sessionStorage.getItem('wh_intro_seen') === '1' ||
        document.cookie.indexOf(`${COOKIE_INTRO_SEEN}=1`) !== -1
      ) {
        setIsIntroComplete(true);
        return;
      }
    } catch {}

    // 2. Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsIntroComplete(true);
    }
  }, []);

  return (
    <>
      {/* Animated Brand Intro overlay: Sits at z-[100] with solid #101B33 background */}
      {!isIntroComplete && (
        <BrandIntro
          initialPlaying={true}
          onComplete={() => setIsIntroComplete(true)}
        />
      )}

      {/* Main page content: Remains hidden with opacity-0 until isIntroComplete becomes true, then transitions smoothly */}
      <div
        id="home-main-content"
        className={cn(
          'transition-opacity duration-700 ease-out',
          isIntroComplete ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
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
      </div>

      {/* Inline blocking script: If returning visitor in sessionStorage, instantly reveal before first paint */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var p=new URLSearchParams(window.location.search);if(p.get('replay')==='1'||p.get('intro')==='1'){sessionStorage.removeItem('wh_intro_seen');document.cookie='${COOKIE_INTRO_SEEN}=; path=/; max-age=0';return;}if(sessionStorage.getItem('wh_intro_seen')==='1'||document.cookie.indexOf('${COOKIE_INTRO_SEEN}=1')!==-1){var el=document.getElementById('brand-intro-overlay');if(el){el.style.display='none';}var cnt=document.getElementById('home-main-content');if(cnt){cnt.style.opacity='1';cnt.classList.remove('opacity-0','pointer-events-none');cnt.classList.add('opacity-100');}}}catch(e){}})();`,
        }}
      />
    </>
  );
}

export default HomeView;
