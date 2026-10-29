import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing, type Locale } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const VALID_COUNTRIES = ['ae', 'eg', 'ge', 'tr'] as const;

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if request is for admin, api, or internal static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    const response = NextResponse.next();
    if (process.env.SITE_PRIVATE === 'true') {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return response;
  }

  // Handle returning visitor redirect on /[locale] (Section 6)
  // If wh_country cookie exists, redirect to /{locale}/{country}
  // Crawlers must still see server-rendered links to all four countries
  const segments = pathname.split('/').filter(Boolean);
  const isLocaleRoot =
    segments.length === 1 && routing.locales.includes(segments[0] as Locale);

  if (isLocaleRoot) {
    const locale = segments[0];
    const countryCookie = request.cookies.get('wh_country')?.value?.toLowerCase();
    const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
    const isBot =
      /bot|googlebot|bingbot|crawler|spider|slurp|duckduckbot|facebookexternalhit|whatsapp/i.test(
        userAgent
      );

    if (
      countryCookie &&
      VALID_COUNTRIES.includes(countryCookie as (typeof VALID_COUNTRIES)[number]) &&
      !isBot
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/${countryCookie}`;
      const redirectResponse = NextResponse.redirect(url);

      if (process.env.SITE_PRIVATE === 'true') {
        redirectResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
      }
      return redirectResponse;
    }
  }

  // Execute next-intl middleware for locale negotiation and cookies
  const response = await intlMiddleware(request);

  // While SITE_PRIVATE=true, send noindex headers on every page (Section 14.3 & Stage 1)
  if (process.env.SITE_PRIVATE === 'true') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  // Match all request paths except _next, api, and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
