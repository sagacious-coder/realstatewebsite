import type { CurrencyCode } from '@/lib/countries';

/**
 * SAMPLE exchange rates, expressed as units of each currency per 1 USD.
 *
 * PLACEHOLDER (Stage 4): these are illustrative numbers, not market data.
 * Stage 7 replaces this object with cached daily rates from the API client.
 */
export const SAMPLE_RATES_PER_USD: Readonly<Record<CurrencyCode, number>> = {
  USD: 1,
  AED: 3.6725,
  EGP: 50,
  GEL: 2.7,
  TRY: 34,
  EUR: 0.92,
  GBP: 0.78,
};

/** Prices are stored in minor units (Section 7); every supported currency uses 2 decimals. */
const MINOR_UNITS_PER_MAJOR = 100;

const INTL_LOCALES: Record<string, string> = {
  en: 'en-US',
  ar: 'ar-AE',
  tr: 'tr-TR',
  ka: 'ka-GE',
};

export function intlLocaleFor(locale: string): string {
  return INTL_LOCALES[locale] ?? 'en-US';
}

/** Converts an amount in minor units between currencies, returning minor units. */
export function convertMinorUnits(
  amountMinor: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Readonly<Record<CurrencyCode, number>> = SAMPLE_RATES_PER_USD
): number {
  if (from === to) return amountMinor;
  return Math.round((amountMinor / rates[from]) * rates[to]);
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, currency: CurrencyCode): Intl.NumberFormat {
  const key = `${locale}:${currency}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlLocaleFor(locale), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/** Formats an amount in minor units of `currency` for display in the given site locale. */
export function formatMoney(amountMinor: number, currency: CurrencyCode, locale: string): string {
  return getFormatter(locale, currency).format(amountMinor / MINOR_UNITS_PER_MAJOR);
}

