import type { CountryCode, CountrySection } from '@/lib/countries';

/**
 * Editable shell constants. Everything here is a PLACEHOLDER until the owner supplies
 * real details; the footer labels it as sample content (spec rule 6).
 */

export interface CountryContact {
  /** Display form, shown as written. */
  phone: string;
  /** Digits with country code, used for wa.me links. */
  whatsapp: string;
  email: string;
}

export const CONTACTS_ARE_SAMPLE = true;

export const COUNTRY_CONTACTS: Record<CountryCode, CountryContact> = {
  ae: { phone: '+971 4 000 0000', whatsapp: '+97140000000', email: 'uae@wildhills.example' },
  eg: { phone: '+20 2 0000 0000', whatsapp: '+20200000000', email: 'egypt@wildhills.example' },
  ge: { phone: '+995 32 000 0000', whatsapp: '+99532000000', email: 'georgia@wildhills.example' },
  tr: { phone: '+90 212 000 0000', whatsapp: '+90212000000', email: 'turkey@wildhills.example' },
};

/** WhatsApp number used where no country is selected yet (country chooser, 404). */
export const DEFAULT_WHATSAPP = COUNTRY_CONTACTS.ae.whatsapp;

export const COUNTRY_PANEL_IMAGES: Record<CountryCode, string> = {
  ae: '/images/panels/panel-uae.webp',
  eg: '/images/panels/panel-egypt.webp',
  ge: '/images/panels/panel-georgia.webp',
  tr: '/images/panels/panel-turkey.webp',
};

export type CityKey =
  | 'dubai'
  | 'abu-dhabi'
  | 'cairo'
  | 'new-cairo'
  | 'tbilisi'
  | 'batumi'
  | 'istanbul'
  | 'antalya';

/** Buy mega dropdown content (placeholder constants; Stage 7+ drives this from the API). */
export const BUY_MEGA: ReadonlyArray<{
  code: CountryCode;
  cities: ReadonlyArray<CityKey>;
}> = [
  { code: 'ae', cities: ['dubai', 'abu-dhabi'] },
  { code: 'eg', cities: ['cairo', 'new-cairo'] },
  { code: 'ge', cities: ['tbilisi', 'batumi'] },
  { code: 'tr', cities: ['istanbul', 'antalya'] },
];

/** Primary links shown next to the Buy dropdown once a country is selected. */
export const PRIMARY_LINKS: ReadonlyArray<{ key: string; section: CountrySection }> = [
  { key: 'projects', section: 'projects' },
  { key: 'developers', section: 'developers' },
  { key: 'sell', section: 'sell' },
  { key: 'contact', section: 'contact' },
];

/** Links in the full-screen mobile menu (adds About, which the desktop bar leaves to the footer). */
export const MOBILE_LINKS: ReadonlyArray<{ key: string; section: CountrySection }> = [
  { key: 'projects', section: 'projects' },
  { key: 'developers', section: 'developers' },
  { key: 'sell', section: 'sell' },
  { key: 'about', section: 'about' },
  { key: 'contact', section: 'contact' },
];

/** Footer per-country links. */
export const FOOTER_COUNTRY_LINKS: ReadonlyArray<{ key: string; section: CountrySection }> = [
  { key: 'buy', section: 'buy' },
  { key: 'projects', section: 'projects' },
  { key: 'contact', section: 'contact' },
];

export function buildWhatsAppHref(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
