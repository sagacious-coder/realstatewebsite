import type { ReactNode } from 'react';

/**
 * Pass-through root layout. Each route group renders its own <html>/<body>
 * (app/[locale]/layout.tsx for the site, app/admin/layout.tsx for the admin shell).
 * Having this file lets app/[locale]/not-found.tsx render inside the locale layout,
 * so 404 pages keep the navbar, footer and RTL direction.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}

