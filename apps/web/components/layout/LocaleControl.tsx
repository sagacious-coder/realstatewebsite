'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  COOKIE_COUNTRY,
  COUNTRY_CODES,
  COUNTRY_DEFAULT_CURRENCY,
  CURRENCY_CODES,
  ENABLED_LOCALES,
  LOCALE_NATIVE_NAMES,
  isCountryCode,
  isCountrySection,
  parseAppPath,
  type CountryCode,
  type CurrencyCode,
  type EnabledLocale,
} from '@/lib/countries';
import { writeCookie } from '@/lib/cookies';
import { intlLocaleFor } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/components/providers/CurrencyProvider';

function RadioOption({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={cn(
          'flex min-h-11 items-center gap-2 rounded-[4px] border border-line bg-white px-3 text-sm text-navy transition-colors',
          'hover:border-gold peer-checked:border-navy peer-checked:bg-navy peer-checked:text-ivory',
          'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold'
        )}
      >
        {children}
      </span>
    </label>
  );
}

/**
 * Country, language and currency pickers. Each choice takes effect immediately:
 * - country: sets `wh_country`, resets the display currency to that country's, and changes the URL
 * - language: changes the URL locale prefix (next-intl sets its own locale cookie)
 * - currency: sets `wh_currency`
 */
export function LocaleControlPanel({ onDone }: { onDone?: () => void }) {
  const t = useTranslations('shell');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const groupId = useId();
  const { country, rest } = parseAppPath(pathname);

  const currencyNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([intlLocaleFor(locale)], { type: 'currency' });
    } catch (error) {
      console.error('Intl.DisplayNames unavailable, showing currency codes only', error);
      return null;
    }
  }, [locale]);

  function selectCountry(next: CountryCode) {
    writeCookie(COOKIE_COUNTRY, next);
    setCurrency(COUNTRY_DEFAULT_CURRENCY[next]);
    // Keep the section (e.g. /buy) but drop anything country-specific such as filters or listings.
    const section = rest.length === 1 && isCountrySection(rest[0]) ? `/${rest[0]}` : '';
    router.push(`/${next}${section}`);
    onDone?.();
  }

  function selectLocale(next: EnabledLocale) {
    if (next === locale) return;
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    router.replace({ pathname, query }, { locale: next });
    onDone?.();
  }

  function selectCurrency(next: CurrencyCode) {
    setCurrency(next);
    onDone?.();
  }

  return (
    <div className="space-y-5 text-start">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-navy">{t('control.country')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {COUNTRY_CODES.map((code) => (
            <RadioOption
              key={code}
              name={`${groupId}-country`}
              value={code}
              checked={country === code}
              onChange={() => selectCountry(code)}
            >
              {t(`countryShort.${code}`)}
            </RadioOption>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-navy">{t('control.language')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {ENABLED_LOCALES.map((code) => (
            <RadioOption
              key={code}
              name={`${groupId}-language`}
              value={code}
              checked={locale === code}
              onChange={() => selectLocale(code)}
            >
              <span lang={code}>{LOCALE_NATIVE_NAMES[code]}</span>
            </RadioOption>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-navy">{t('control.currency')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {CURRENCY_CODES.map((code) => (
            <RadioOption
              key={code}
              name={`${groupId}-currency`}
              value={code}
              checked={currency === code}
              onChange={() => selectCurrency(code)}
            >
              <span className="font-semibold">{code}</span>
              <span className="truncate text-xs opacity-80">{currencyNames?.of(code)}</span>
            </RadioOption>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/** Compact "UAE · EN · AED" trigger that opens the picker in a non-modal popover. */
export function LocaleControl({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const t = useTranslations('shell');
  const locale = useLocale();
  const pathname = usePathname();
  const { currency } = useCurrency();
  const { country } = parseAppPath(pathname);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const update = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      update(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) update(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) update(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open, update]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={t('control.open')}
        onClick={() => update(!open)}
        className="site-nav-control inline-flex min-h-11 items-center gap-2 rounded-[4px] border px-3 text-sm font-medium"
      >
        <span>{country ? t(`countryShort.${country}`) : t('control.country')}</span>
        <span aria-hidden="true">·</span>
        <span lang="en" dir="ltr">
          {locale.toUpperCase()}
        </span>
        <span aria-hidden="true">·</span>
        <span dir="ltr">{currency}</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform motion-reduce:transition-none', open && 'rotate-180')}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t('control.label')}
          className="absolute end-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-card border border-line bg-ivory p-5 text-navy shadow-subtle"
        >
          <LocaleControlPanel
            onDone={() => {
              update(false);
              buttonRef.current?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}
