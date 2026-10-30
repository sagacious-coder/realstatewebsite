/**
 * Country, currency and language primitives shared by the layout shell.
 * Spec: Section 6 (routes) and Section 7 (locations, currency, language).
 */

export const COUNTRY_CODES = ['ae', 'eg', 'ge', 'tr'] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

export const CURRENCY_CODES = ['AED', 'EGP', 'GEL', 'TRY', 'USD'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

/**
 * Languages offered in the switcher. `tr` and `ka` are routable (see i18n/routing.ts)
 * but have no translated messages yet, so they are not offered to visitors.
 */
export const ENABLED_LOCALES = ['en', 'ar'] as const;
export type EnabledLocale = (typeof ENABLED_LOCALES)[number];

/** Native language names. Never translated, so each user can always find their own. */
export const LOCALE_NATIVE_NAMES: Record<EnabledLocale, string> = {
  en: 'English',
  ar: 'العربية',
};

export const COUNTRY_DEFAULT_CURRENCY: Record<CountryCode, CurrencyCode> = {
  ae: 'AED',
  eg: 'EGP',
  ge: 'GEL',
  tr: 'TRY',
};

/** Currency shown when the visitor has no country in the URL and no saved choice. */
export const FALLBACK_CURRENCY: CurrencyCode = 'USD';

/** Country subpaths from Section 6 that exist under every country. */
export const COUNTRY_SECTIONS = [
  'buy',
  'projects',
  'developers',
  'sell',
  'about',
  'contact',
] as const;
export type CountrySection = (typeof COUNTRY_SECTIONS)[number];

export const COOKIE_COUNTRY = 'wh_country';
export const COOKIE_LOCALE = 'wh_locale';
export const COOKIE_CURRENCY = 'wh_currency';
export const COOKIE_CONSENT = 'wh_consent';

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && (COUNTRY_CODES as readonly string[]).includes(value);
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && (CURRENCY_CODES as readonly string[]).includes(value);
}

export function isEnabledLocale(value: unknown): value is EnabledLocale {
  return typeof value === 'string' && (ENABLED_LOCALES as readonly string[]).includes(value);
}

export function isCountrySection(value: unknown): value is CountrySection {
  return typeof value === 'string' && (COUNTRY_SECTIONS as readonly string[]).includes(value);
}

/** Splits an app pathname (without the locale prefix) into its country and remaining segments. */
export function parseAppPath(pathname: string): { country: CountryCode | null; rest: string[] } {
  const segments = pathname.split('/').filter(Boolean);
  const [first, ...rest] = segments;
  if (isCountryCode(first)) return { country: first, rest };
  return { country: null, rest: segments };
}
