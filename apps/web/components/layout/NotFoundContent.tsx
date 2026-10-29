'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { COUNTRY_CODES } from '@/lib/countries';

/** Localized 404 body, rendered inside the locale layout (navbar and footer stay). */
export function NotFoundContent() {
  const t = useTranslations('shell.errors');
  const tc = useTranslations('common');

  return (
    <section className="container py-20 text-start md:py-28">
      <p className="text-sm font-semibold text-gold-deep">{t('notFoundCode')}</p>
      <h1 className="h1 mt-3 max-w-2xl">{t('notFoundTitle')}</h1>
      <p className="mt-5 max-w-xl text-lg text-muted">{t('notFoundBody')}</p>

      <h2 className="mt-10 font-sans text-sm font-semibold text-navy">{t('browseHeading')}</h2>
      <ul className="mt-3 flex flex-wrap gap-3">
        {COUNTRY_CODES.map((code) => (
          <li key={code}>
            <Link
              href={`/${code}`}
              className="inline-flex min-h-11 items-center rounded-[4px] border border-line bg-white px-4 text-sm font-medium text-navy hover:border-gold"
            >
              {tc(`countries.${code}`)}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-[4px] bg-gold px-5 text-sm font-medium text-navy hover:bg-gold-deep hover:text-white"
      >
        {t('home')}
      </Link>
    </section>
  );
}

