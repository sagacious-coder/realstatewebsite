import Link from 'next/link';
import './globals.css';
import { fontInter, fontLora } from '@/lib/fonts';

/**
 * Last-resort 404 for URLs outside any locale (there is no root layout, so this file renders its
 * own document). Localized 404s live in app/[locale]/not-found.tsx.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr" className={`${fontInter.variable} ${fontLora.variable}`}>
      <body className="min-h-screen bg-ivory text-navy antialiased">
        <main className="container py-24">
          <p className="text-sm font-semibold text-gold-deep">404</p>
          <h1 className="h1 mt-3 max-w-2xl">This page could not be found</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            The address may be mistyped, or the page may have moved.
          </p>
          <Link
            href="/en"
            className="mt-8 inline-flex min-h-11 items-center rounded-[4px] bg-gold px-5 text-sm font-medium text-navy hover:bg-gold-deep hover:text-white"
          >
            Go to the Wild Hills home page
          </Link>
        </main>
      </body>
    </html>
  );
}
