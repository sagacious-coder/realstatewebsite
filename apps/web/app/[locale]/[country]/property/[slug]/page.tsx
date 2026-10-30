import { redirect } from 'next/navigation';

export default async function PropertyRedirectPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; slug: string }>;
}) {
  const { locale, country, slug } = await params;
  redirect(`/${locale}/${country}/buy/${slug}`);
}

