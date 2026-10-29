import { notFound } from 'next/navigation';

/**
 * Catch-all for unknown nested URLs (e.g. /en/ae/unknown) so they render the localized 404
 * inside the site shell instead of the shell-less global 404. Real routes take precedence.
 */
export default function UnknownRoute() {
  notFound();
}

