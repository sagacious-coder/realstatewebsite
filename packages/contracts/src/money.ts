import { CurrencyCode } from './enums.js';

export const MINOR_UNIT_SCALE = 100;

export function toMinorUnits(majorAmount: number): number {
  return Math.round(majorAmount * MINOR_UNIT_SCALE);
}

export function fromMinorUnits(minorAmount: number): number {
  return minorAmount / MINOR_UNIT_SCALE;
}

export function toMinorUnitsBigInt(majorAmount: number | string): bigint {
  const num = typeof majorAmount === 'string' ? parseFloat(majorAmount) : majorAmount;
  if (isNaN(num)) {
    throw new TypeError(`Cannot convert invalid number "${majorAmount}" to minor units`);
  }
  return BigInt(Math.round(num * MINOR_UNIT_SCALE));
}

export function fromMinorUnitsBigInt(minorAmount: bigint): number {
  return Number(minorAmount) / MINOR_UNIT_SCALE;
}

/**
 * Converts an amount in minor units between currencies using exchange rates relative to USD.
 * rates: Units of currency per 1 USD (e.g. { USD: 1, AED: 3.6725, EGP: 50, ... })
 */
export function convertMinorUnits(
  amountMinor: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number {
  if (from === to) return amountMinor;
  const fromRate = rates[from];
  const toRate = rates[to];

  if (!fromRate || !toRate || fromRate <= 0 || toRate <= 0) {
    throw new Error(`Invalid exchange rates provided for conversion from ${from} to ${to}`);
  }

  // Convert from currency -> USD -> to currency
  const usdMinor = amountMinor / fromRate;
  return Math.round(usdMinor * toRate);
}

/**
 * Normalizes an amount in minor units to USD minor units for cross-country filtering and sorting.
 */
export function normalizeToUsdMinor(
  amountMinor: number,
  from: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number {
  return convertMinorUnits(amountMinor, from, 'USD', rates);
}

const INTL_LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  ar: 'ar-AE',
  tr: 'tr-TR',
  ka: 'ka-GE',
};

export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode,
  locale = 'en'
): string {
  const intlLocale = INTL_LOCALE_MAP[locale] || locale;
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(fromMinorUnits(amountMinor));
}

export function formatMoneyCompact(
  amountMinor: number,
  currency: CurrencyCode,
  locale = 'en'
): string {
  const intlLocale = INTL_LOCALE_MAP[locale] || locale;
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(fromMinorUnits(amountMinor));
}

