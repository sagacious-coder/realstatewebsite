'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useConsent } from '@/components/providers/ConsentProvider';

/** Footer control that brings the cookie banner back so a visitor can change their choice. */
export function CookieSettingsButton() {
  const t = useTranslations('shell');
  const { reopen } = useConsent();

  return (
    <button
      type="button"
      onClick={reopen}
      className="inline-flex min-h-11 items-center self-start text-sm font-medium text-gold-light underline underline-offset-4 md:self-auto"
    >
      {t('cookies.settings')}
    </button>
  );
}

