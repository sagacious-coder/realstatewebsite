'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  COOKIE_CURRENCY,
  COUNTRY_DEFAULT_CURRENCY,
  FALLBACK_CURRENCY,
  isCountryCode,
  isCurrencyCode,
  type CurrencyCode,
} from '@/lib/countries';
import { readCookie, writeCookie } from '@/lib/cookies';
import { convertMinorUnits, formatMoney, SAMPLE_RATES_PER_USD } from '@/lib/currency';

interface CurrencyContextValue {
  /** Currency prices are displayed in. */
  currency: CurrencyCode;
  /** Persists an explicit visitor choice in the `wh_currency` cookie. */
  setCurrency: (next: CurrencyCode) => void;
  /** Active exchange rates relative to USD base. */
  rates: Readonly<Record<CurrencyCode, number>>;
  /** Converts `amountMinor` (minor units of `from`) to the display currency and formats it. */
  formatPrice: (amountMinor: number, from: CurrencyCode) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/**
 * Display currency = saved choice (cookie) > default of the country in the URL > fallback.
 * The cookie is read after mount so server and client markup match on first render.
 * Rates dynamically default to SAMPLE_RATES_PER_USD, overridable by initialRates from API client.
 */
export function CurrencyProvider({
  children,
  initialRates,
}: {
  children: React.ReactNode;
  initialRates?: Partial<Record<CurrencyCode, number>>;
}) {
  const locale = useLocale();
  const params = useParams<{ country?: string }>();
  const urlCountry = isCountryCode(params?.country) ? params.country : null;

  const [saved, setSaved] = useState<CurrencyCode | null>(null);

  const rates: Readonly<Record<CurrencyCode, number>> = useMemo(
    () => ({
      ...SAMPLE_RATES_PER_USD,
      ...(initialRates || {}),
    }),
    [initialRates]
  );

  useEffect(() => {
    const stored = readCookie(COOKIE_CURRENCY);
    if (isCurrencyCode(stored)) setSaved(stored);
  }, []);

  const currency: CurrencyCode =
    saved ?? (urlCountry ? COUNTRY_DEFAULT_CURRENCY[urlCountry] : FALLBACK_CURRENCY);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setSaved(next);
    writeCookie(COOKIE_CURRENCY, next);
  }, []);

  const formatPrice = useCallback(
    (amountMinor: number, from: CurrencyCode) =>
      formatMoney(convertMinorUnits(amountMinor, from, currency, rates), currency, locale),
    [currency, locale, rates]
  );

  const value = useMemo(
    () => ({ currency, setCurrency, rates, formatPrice }),
    [currency, setCurrency, rates, formatPrice]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used inside <CurrencyProvider>');
  return context;
}

