import { Inter, Lora, IBM_Plex_Sans_Arabic } from 'next/font/google';

/**
 * Typography configuration adhering strictly to WILD_HILLS_BUILD_SPEC.md Section 4.2:
 * - Headings: Lora (weights 500 and 600)
 * - Body: Inter (weights 400, 500, 600)
 * - Arabic (headings and body): IBM Plex Sans Arabic (weights 400, 500, 600)
 * - Loaded with display: 'swap' and only required weights/subsets
 */

export const fontInter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const fontLora = Lora({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-lora',
  display: 'swap',
});

export const fontIbmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
});
