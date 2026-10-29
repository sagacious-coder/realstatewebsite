import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { fontInter, fontLora, fontIbmPlexArabic } from '@/lib/fonts';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isPrivate = process.env.SITE_PRIVATE === 'true';

  const isArabic = locale === 'ar';
  const title = isArabic
    ? 'وايلد هيلز للعقارات | عقارات مميزة للبيع'
    : 'Wild Hills Real Estate | Premium Properties For Sale';
  const description = isArabic
    ? 'منزل يناسب نمط حياتك في مصر، الإمارات، جورجيا، وتركيا.'
    : 'Find a home that fits your life across Egypt, UAE, Georgia, and Turkey.';

  return {
    title: {
      default: title,
      template: '%s | Wild Hills Real Estate',
    },
    description,
    robots: isPrivate
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

import { ToastProvider } from '@/components/ui/Toast';
import { ConsentProvider } from '@/components/providers/ConsentProvider';
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';
import { CookieBanner } from '@/components/layout/CookieBanner';
import { FloatingWhatsApp } from '@/components/layout/FloatingWhatsApp';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { SkipLink } from '@/components/layout/SkipLink';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming locale is valid
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // Retrieve messages for the current locale
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fontInter.variable} ${fontLora.variable} ${fontIbmPlexArabic.variable}`}
    >
      <body className="min-h-screen bg-ivory text-navy antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>
            <CurrencyProvider>
              <ConsentProvider>
                <SkipLink />
                <Navbar />
                {/* Top padding clears the fixed navbar, except on pages that start with a hero. */}
                <main
                  id="main-content"
                  tabIndex={-1}
                  className="min-h-[60vh] pt-16 outline-none md:pt-20 has-[[data-nav-hero]]:pt-0"
                >
                  {children}
                </main>
                <Footer />
                <FloatingWhatsApp />
                <CookieBanner />
              </ConsentProvider>
            </CurrencyProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
