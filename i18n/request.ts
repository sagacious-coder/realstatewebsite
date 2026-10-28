import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate locale or use default
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  // Always load English as baseline
  const enMessages = (await import('../messages/en.json')).default;

  // If locale is 'en', return en directly
  if (locale === 'en') {
    return {
      locale,
      messages: enMessages,
    };
  }

  // Load target locale messages, falling back to English for missing keys/empty files (tr, ka)
  try {
    const targetMessages = (await import(`../messages/${locale}.json`)).default;
    return {
      locale,
      messages: {
        ...enMessages,
        ...targetMessages,
      },
    };
  } catch {
    return {
      locale,
      messages: enMessages,
    };
  }
});
