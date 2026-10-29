'use client';

import React, { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@wild-hills/ui';
import { useConsent } from '@/components/providers/ConsentProvider';

/**
 * Cookie consent banner. A non-modal region (the page stays usable); both choices have equal
 * weight. It only takes keyboard focus when the visitor reopens it from the footer.
 */
export function CookieBanner() {
  const t = useTranslations('shell.cookies');
  const { bannerVisible, focusRequested, decide } = useConsent();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (bannerVisible && focusRequested) headingRef.current?.focus();
  }, [bannerVisible, focusRequested]);

  if (!bannerVisible) return null;

  return (
    <section
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-3 bottom-3 z-40 rounded-card border border-line bg-white p-5 text-navy shadow-subtle sm:inset-x-auto sm:start-4 sm:bottom-4 sm:max-w-md"
    >
      <h2
        id="cookie-banner-title"
        ref={headingRef}
        tabIndex={-1}
        className="font-serif text-lg font-medium outline-none"
      >
        {t('title')}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t('body')}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant="outline" className="min-h-11" onClick={() => decide('essential')}>
          {t('reject')}
        </Button>
        <Button variant="outline" className="min-h-11" onClick={() => decide('all')}>
          {t('accept')}
        </Button>
      </div>
    </section>
  );
}

