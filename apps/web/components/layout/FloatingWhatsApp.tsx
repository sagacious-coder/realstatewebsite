'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useConsent } from '@/components/providers/ConsentProvider';
import { isCountryCode } from '@/lib/countries';
import { buildWhatsAppHref, COUNTRY_CONTACTS, DEFAULT_WHATSAPP } from '@/lib/site-config';
import { cn } from '@/lib/utils';

/**
 * Floating WhatsApp button. Uses the number of the country in the URL, or the default number
 * on pages without a country. On narrow screens it hides while the cookie banner is showing.
 */
export function FloatingWhatsApp() {
  const t = useTranslations('shell.whatsapp');
  const params = useParams<{ country?: string }>();
  const { bannerVisible } = useConsent();

  const phone = isCountryCode(params?.country)
    ? COUNTRY_CONTACTS[params.country].whatsapp
    : DEFAULT_WHATSAPP;

  return (
    <a
      href={buildWhatsAppHref(phone, t('message'))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t('label')} ${t('opensInNewTab')}`}
      className={cn(
        'fixed bottom-4 end-4 z-30 h-12 w-12 items-center justify-center rounded-full bg-emerald text-white shadow-subtle',
        'transition-colors hover:bg-emerald-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
        bannerVisible ? 'hidden sm:inline-flex' : 'inline-flex'
      )}
    >
      <MessageCircle className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
    </a>
  );
}

