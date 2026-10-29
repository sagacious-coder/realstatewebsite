'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { COOKIE_CONSENT } from '@/lib/countries';
import { readCookie, writeCookie } from '@/lib/cookies';

export type ConsentChoice = 'all' | 'essential';

function isConsentChoice(value: unknown): value is ConsentChoice {
  return value === 'all' || value === 'essential';
}

interface ConsentContextValue {
  /** Saved choice, or null when the visitor has not decided. */
  choice: ConsentChoice | null;
  /** True when the banner is on screen. */
  bannerVisible: boolean;
  /** True when the banner was reopened on request and should take keyboard focus. */
  focusRequested: boolean;
  decide: (choice: ConsentChoice) => void;
  reopen: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [reopened, setReopened] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const stored = readCookie(COOKIE_CONSENT);
    if (isConsentChoice(stored)) setChoice(stored);
    setReady(true);
  }, []);

  const decide = useCallback((next: ConsentChoice) => {
    writeCookie(COOKIE_CONSENT, next, 180);
    setChoice(next);
    setReopened(false);
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (target && document.contains(target)) target.focus();
  }, []);

  const reopen = useCallback(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setReopened(true);
  }, []);

  const bannerVisible = ready && (choice === null || reopened);

  const value = useMemo(
    () => ({ choice, bannerVisible, focusRequested: reopened, decide, reopen }),
    [choice, bannerVisible, reopened, decide, reopen]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) throw new Error('useConsent must be used inside <ConsentProvider>');
  return context;
}

