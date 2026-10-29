'use client';

import { useEffect } from 'react';
import './globals.css';

/** Fallback when the root of the app fails; renders its own document. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error boundary caught an error', error);
  }, [error]);

  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-ivory text-navy antialiased">
        <main className="container py-24" role="alert">
          <h1 className="h1 max-w-2xl">Something went wrong</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            An unexpected error stopped this page from loading. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex min-h-11 items-center rounded-[4px] bg-gold px-5 text-sm font-medium text-navy hover:bg-gold-deep hover:text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

