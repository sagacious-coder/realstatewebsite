'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@wild-hills/ui';
import { LocaleControlPanel } from '@/components/layout/LocaleControl';
import { BUY_MEGA, MOBILE_LINKS } from '@/lib/site-config';
import type { CountryCode } from '@/lib/countries';

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  country: CountryCode | null;
  pathname: string;
}

/**
 * Full-screen mobile menu. Built on the Radix dialog (via the shared Sheet), which provides the
 * focus trap, Esc to close, scroll lock, and focus return to the trigger.
 */
export function MobileMenu({ open, onOpenChange, country, pathname }: MobileMenuProps) {
  const t = useTranslations('shell');
  const tc = useTranslations('common');
  const close = () => onOpenChange(false);

  // Close after any navigation.
  useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  // The menu is a mobile pattern: close it if the viewport grows to the desktop layout.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (query.matches) onOpenChange(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [onOpenChange]);

  const homeHref = country ? `/${country}` : '/';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t('nav.openMenu')}
          className="site-nav-control inline-flex h-11 w-11 items-center justify-center rounded-[4px] border lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="top"
        hideCloseButton
        className="flex h-dvh w-full max-w-none flex-col overflow-y-auto border-0 bg-ivory p-0 text-navy"
      >
        <SheetTitle className="sr-only">{t('nav.menuTitle')}</SheetTitle>
        <SheetDescription className="sr-only">{t('nav.menuDescription')}</SheetDescription>

        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gold px-4 sm:px-6">
          <Link
            href={homeHref}
            onClick={close}
            aria-label={t('nav.homeLabel')}
            className="inline-flex shrink-0 items-center"
          >
            <Image
              src="/brand/wild-hills-logo-nav-light.svg"
              alt=""
              width={137}
              height={36}
              className="h-9 w-auto"
            />
          </Link>
          <SheetClose asChild>
            <button
              type="button"
              aria-label={t('nav.closeMenu')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-line text-navy"
            >
              <X className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </SheetClose>
        </div>

        <div className="flex-1 space-y-8 px-4 py-6 sm:px-6">
          <nav aria-label={t('nav.mobileLabel')} className="space-y-8">
            <section aria-labelledby="mobile-buy-heading">
              <h2
                id="mobile-buy-heading"
                className="font-sans text-sm font-semibold text-gold-deep"
              >
                {t('nav.buyMenuLabel')}
              </h2>
              <ul className="mt-2 divide-y divide-line">
                {BUY_MEGA.map(({ code, cities }) => (
                  <li key={code} className="py-3">
                    <Link
                      href={`/${code}/buy`}
                      onClick={close}
                      className="flex min-h-11 items-center font-serif text-xl font-medium text-navy"
                    >
                      {tc(`countries.${code}`)}
                    </Link>
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {cities.map((city) => (
                        <li key={city}>
                          <Link
                            href={`/${code}/buy?city=${city}`}
                            onClick={close}
                            className="inline-flex min-h-11 items-center rounded-[4px] border border-line bg-white px-3 text-sm text-navy"
                          >
                            {t(`cities.${city}`)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>

            {country && (
              <ul className="divide-y divide-line border-y border-line">
                {MOBILE_LINKS.map(({ key, section }) => {
                  const href = `/${country}/${section}`;
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <li key={key}>
                      <Link
                        href={href}
                        onClick={close}
                        aria-current={active ? 'page' : undefined}
                        className="flex min-h-12 items-center text-lg font-medium text-navy aria-[current=page]:text-gold-deep"
                      >
                        {t(`nav.${key}`)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </nav>

          <section aria-labelledby="mobile-prefs-heading">
            <h2 id="mobile-prefs-heading" className="mb-4 font-sans text-sm font-semibold text-gold-deep">
              {t('control.label')}
            </h2>
            <LocaleControlPanel onDone={close} />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

