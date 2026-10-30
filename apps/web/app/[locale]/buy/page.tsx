import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isCountryCode, DEFAULT_COUNTRY } from '@/lib/countries';

export default async function GlobalBuyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const rawSearchParams = await searchParams;
  const cookieStore = await cookies();
  const savedCountry = cookieStore.get('wh_country')?.value;
  const targetCountry = isCountryCode(savedCountry) ? savedCountry : DEFAULT_COUNTRY;

  const urlParams = new URLSearchParams();
  Object.entries(rawSearchParams).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach((val) => urlParams.append(k, val));
    } else if (v) {
      urlParams.set(k, v);
    }
  });

  const qs = urlParams.toString() ? `?${urlParams.toString()}` : '';
  redirect(`/${locale}/${targetCountry}/buy${qs}`);
}

