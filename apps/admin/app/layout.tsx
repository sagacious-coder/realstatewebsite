import type { Metadata } from 'next';
import './globals.css';
import { AdminShell } from '@/components/layout/AdminShell';

export const metadata: Metadata = {
  title: 'Wild Hills Admin Portal',
  description: 'Internal operations, listings management, and client CRM portal for Wild Hills Real Estate.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-sand text-navy">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}

