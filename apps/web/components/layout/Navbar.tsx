'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { SiteImage } from '@/components/SiteImage';
import { LocaleControl } from '@/components/layout/LocaleControl';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { parseAppPath } from '@/lib/countries';
import { BUY_MEGA, COUNTRY_PANEL_IMAGES, PRIMARY_LINKS } from '@/lib/site-config';
import { cn } from '@/lib/utils';

/** Scroll distance (px) before the bar can hide, and the dead zone that ignores jitter. */
const HIDE_AFTER = 120;
const SCROLL_DEADZONE = 6;
const MEGA_CLOSE_DELAY_MS = 180;

/**
 * Site navbar (spec 8.1).
 * - Transparent over a hero, solid ivory with a 1px gold line otherwise. The visual state is
 *   driven by CSS on `.site-nav` (see globals.css), keyed on `data-at-top` and on the page
 *   containing a `[data-nav-hero]` element, so server markup is already correct.
 * - Hides on scroll down, returns on scroll up or when anything inside receives focus.
 */
export function Navbar() {
  const t = useTranslations('shell');
  const tc = useTranslations('common');
  const pathname = usePathname();
  const { country } = parseAppPath(pathname);
  const homeHref = country ? `/${country}` : '/';

  const [atTop, setAtTop] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [controlOpen, setControlOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const locked = megaOpen || controlOpen || menuOpen;
  const lockedRef = useRef(locked);
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  const megaItemRef = useRef<HTMLLIElement>(null);
  const megaButtonRef = useRef<HTMLButtonElement>(null);
  const megaTimerRef = useRef<number | null>(null);
  const megaId = useId();

  // Scroll state: solid vs. transparent, and hide-on-scroll-down.
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = Math.max(window.scrollY, 0);
      setAtTop(y <= 8);
      const delta = y - lastY;
      if (Math.abs(delta) < SCROLL_DEADZONE) return;
      setHidden(delta > 0 && y > HIDE_AFTER && !lockedRef.current);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const clearMegaTimer = useCallback(() => {
    if (megaTimerRef.current !== null) {
      window.clearTimeout(megaTimerRef.current);
      megaTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearMegaTimer, [clearMegaTimer]);

  // Close the dropdown after navigation.
  useEffect(() => {
    setMegaOpen(false);
  }, [pathname]);

  // Dropdown dismissal: Esc (focus returns to the button), outside click, focus leaving.
  useEffect(() => {
    if (!megaOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMegaOpen(false);
      megaButtonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!megaItemRef.current?.contains(event.target as Node)) setMegaOpen(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!megaItemRef.current?.contains(event.target as Node)) setMegaOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [megaOpen]);

  const hiddenNow = hidden && !locked;

  return (
    <header
      className={cn(
        'site-nav fixed inset-x-0 top-0 z-40 transition-transform duration-300 motion-reduce:transition-none',
        hiddenNow && '-translate-y-full'
      )}
      data-at-top={atTop ? 'true' : 'false'}
      data-open={locked ? 'true' : 'false'}
      onFocusCapture={() => setHidden(false)}
    >
      <div className="container flex h-16 items-center justify-between gap-4 md:h-20">
        <Link
          href={homeHref}
          aria-label={t('nav.homeLabel')}
          className="inline-flex shrink-0 items-center"
        >
          <Image
            src="/brand/wild-hills-logo-nav-light.svg"
            alt=""
            width={137}
            height={36}
            priority
            className="site-logo-solid h-9 w-auto"
          />
          <Image
            src="/brand/wild-hills-logo-nav-reversed.svg"
            alt=""
            width={137}
            height={36}
            priority
            className="site-logo-hero h-9 w-auto"
          />
        </Link>

        <nav aria-label={t('nav.primaryLabel')} className="hidden lg:block">
          <ul className="flex items-center gap-8">
            <li
              ref={megaItemRef}
              onPointerEnter={(event) => {
                if (event.pointerType !== 'mouse') return;
                clearMegaTimer();
                setMegaOpen(true);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType !== 'mouse') return;
                clearMegaTimer();
                megaTimerRef.current = window.setTimeout(
                  () => setMegaOpen(false),
                  MEGA_CLOSE_DELAY_MS
                );
              }}
            >
              <button
                ref={megaButtonRef}
                type="button"
                aria-expanded={megaOpen}
                aria-controls={megaOpen ? megaId : undefined}
                onClick={() => {
                  clearMegaTimer();
                  setMegaOpen((open) => !open);
                }}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium"
              >
                {t('nav.buy')}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform motion-reduce:transition-none',
                    megaOpen && 'rotate-180'
                  )}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </button>

              {megaOpen && (
                <div
                  id={megaId}
                  className="absolute inset-x-0 top-full border-b border-gold bg-ivory text-navy shadow-subtle"
                >
                  <div className="container py-8">
                    <p className="mb-5 text-sm font-semibold text-gold-deep">
                      {t('nav.buyMenuLabel')}
                    </p>
                    <ul className="grid grid-cols-4 gap-6">
                      {BUY_MEGA.map(({ code, cities }) => (
                        <li
                          key={code}
                          className="overflow-hidden rounded-card border border-line bg-white"
                        >
                          <Link
                            href={`/${code}/buy`}
                            onClick={() => setMegaOpen(false)}
                            className="group block"
                          >
                            <span className="relative block aspect-[16/9] overflow-hidden bg-navy-2">
                              <SiteImage
                                src={COUNTRY_PANEL_IMAGES[code]}
                                alt=""
                                fill
                                sizes="(min-width: 1200px) 280px, 22vw"
                                className="object-cover"
                              />
                            </span>
                            <span className="block px-4 pt-3 font-serif text-lg font-medium text-navy group-hover:text-gold-deep">
                              {tc(`countries.${code}`)}
                            </span>
                            <span className="block px-4 text-sm text-muted">
                              {t('nav.browseCountry', { country: tc(`countries.${code}`) })}
                            </span>
                          </Link>
                          <ul className="flex flex-wrap gap-2 px-4 pb-4 pt-3">
                            {cities.map((city) => (
                              <li key={city}>
                                <Link
                                  href={`/${code}/buy?city=${city}`}
                                  onClick={() => setMegaOpen(false)}
                                  className="inline-flex min-h-9 items-center rounded-[4px] border border-line px-3 text-sm text-navy hover:border-gold"
                                >
                                  {t(`cities.${city}`)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>

            {country &&
              PRIMARY_LINKS.map(({ key, section }) => {
                const href = `/${country}/${section}`;
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={key}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className="nav-link-underline min-h-11 text-sm font-medium"
                    >
                      {t(`nav.${key}`)}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <LocaleControl onOpenChange={setControlOpen} />
          </div>
          <MobileMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            country={country}
            pathname={pathname}
          />
        </div>
      </div>
    </header>
  );
}

