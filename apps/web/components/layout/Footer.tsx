import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { CookieSettingsButton } from '@/components/layout/CookieSettingsButton';
import { COUNTRY_CODES } from '@/lib/countries';
import {
  buildWhatsAppHref,
  CONTACTS_ARE_SAMPLE,
  COUNTRY_CONTACTS,
  FOOTER_COUNTRY_LINKS,
} from '@/lib/site-config';

/**
 * Site footer: brand block plus one contact block per country.
 * Contact details are editable placeholders in lib/site-config.ts and addresses in messages.
 */
export function Footer() {
  const t = useTranslations('shell');
  const tc = useTranslations('common');

  return (
    <footer className="on-navy bg-navy text-ivory">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:gap-14">
          <div className="max-w-sm">
            <Image
              src="/brand/wild-hills-logo-full-reversed.svg"
              alt={t('footer.logoAlt')}
              width={190}
              height={50}
              className="h-12 w-auto"
            />
            <p className="mt-5 text-sm leading-relaxed text-ivory/80">{t('footer.about')}</p>
          </div>

          <div>
            <h2 className="sr-only">{t('footer.contactHeading')}</h2>
            <ul className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {COUNTRY_CODES.map((code) => {
                const contact = COUNTRY_CONTACTS[code];
                return (
                  <li key={code}>
                    <section aria-labelledby={`footer-${code}`}>
                      <h3
                        id={`footer-${code}`}
                        className="font-serif text-lg font-medium text-gold-light"
                      >
                        {tc(`countries.${code}`)}
                      </h3>
                      <ul className="mt-3 space-y-3 text-sm text-ivory/80">
                        <li className="flex gap-2">
                          <MapPin
                            className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                          <span>{t(`footer.addresses.${code}`)}</span>
                        </li>
                        <li className="flex gap-2">
                          <Phone
                            className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                          <a
                            href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                            dir="ltr"
                            className="text-ivory underline-offset-4 hover:underline"
                          >
                            {contact.phone}
                          </a>
                        </li>
                        <li className="flex gap-2">
                          <Mail
                            className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                          <a
                            href={`mailto:${contact.email}`}
                            dir="ltr"
                            className="break-all text-ivory underline-offset-4 hover:underline"
                          >
                            {contact.email}
                          </a>
                        </li>
                        <li>
                          <a
                            href={buildWhatsAppHref(contact.whatsapp, t('whatsapp.message'))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center text-ivory underline underline-offset-4"
                          >
                            {t('footer.whatsappLink')}
                            <span className="sr-only"> {t('footer.opensInNewTab')}</span>
                          </a>
                        </li>
                      </ul>
                      <ul className="mt-2 flex flex-wrap gap-x-5">
                        {FOOTER_COUNTRY_LINKS.map(({ key, section }) => (
                          <li key={key}>
                            <Link
                              href={`/${code}/${section}`}
                              className="inline-flex min-h-11 items-center text-sm font-medium text-gold-light underline-offset-4 hover:underline"
                            >
                              {t(`footer.links.${key}`)}
                              <span className="sr-only"> — {tc(`countries.${code}`)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ivory/20 pt-6 text-sm text-ivory/80 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
            <p className="text-xs">{t('footer.disclaimer')}</p>
            {CONTACTS_ARE_SAMPLE && (
              <p className="text-xs font-medium text-gold-light">{t('footer.sampleNote')}</p>
            )}
          </div>
          <CookieSettingsButton />
        </div>
      </div>
    </footer>
  );
}

