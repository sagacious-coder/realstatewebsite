import { cookies } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { HomeView } from '@/components/home/HomeView';
import { getFeaturedListings } from '@/lib/data';
import { COOKIE_INTRO_SEEN } from '@/lib/countries';

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check lightweight session cookie for intro state (Option A)
  const cookieStore = await cookies();
  const introSeen = cookieStore.get(COOKIE_INTRO_SEEN)?.value === '1';

  // Prefetch global highlights for editorial depth
  const featured = await getFeaturedListings(undefined, 4);

  return (
    <HomeView
      locale={locale}
      featured={featured}
      introSeenInitial={introSeen}
    />
  );
}
