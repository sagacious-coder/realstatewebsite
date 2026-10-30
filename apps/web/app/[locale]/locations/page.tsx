import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isCountryCode, DEFAULT_COUNTRY } from '@/lib/countries';

export default async function GlobalLocationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const savedCountry = cookieStore.get('wh_country')?.value;
  const targetCountry = isCountryCode(savedCountry) ? savedCountry : DEFAULT_COUNTRY;

  redirect(`/${locale}/${targetCountry}/locations`);
}

