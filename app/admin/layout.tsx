import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Wild Hills Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-navy text-ivory antialiased">
        {children}
      </body>
    </html>
  );
}
