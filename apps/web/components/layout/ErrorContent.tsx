'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@wild-hills/ui';
import { Link } from '@/i18n/routing';

/** Localized error body for the route error boundary. */
export function ErrorContent({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('shell.errors');

  useEffect(() => {
    console.error('Route error boundary caught an error', error);
  }, [error]);

  return (
    <section className="container py-20 text-start md:py-28" role="alert">
      <h1 className="h1 max-w-2xl">{t('errorTitle')}</h1>
      <p className="mt-5 max-w-xl text-lg text-muted">{t('errorBody')}</p>
      {error.digest && (
        <p className="mt-3 text-sm text-muted">
          {t('errorReference')} <span dir="ltr">{error.digest}</span>
        </p>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset} className="min-h-11 px-5">
          {t('retry')}
        </Button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-[4px] border border-navy px-5 text-sm font-medium text-navy hover:bg-navy hover:text-ivory"
        >
          {t('home')}
        </Link>
      </div>
    </section>
  );
}

