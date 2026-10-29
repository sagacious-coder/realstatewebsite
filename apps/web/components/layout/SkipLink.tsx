import React from 'react';
import { useTranslations } from 'next-intl';

/** First focusable element on every page (spec 13: keyboard access). */
export function SkipLink() {
  const t = useTranslations('shell');

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-[4px] focus:bg-navy focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-ivory focus:outline-2 focus:outline-offset-2 focus:outline-gold"
    >
      {t('skipToContent')}
    </a>
  );
}

