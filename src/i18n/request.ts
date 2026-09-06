import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

export default getRequestConfig(async ({ locale: rawLocale }) => {
  const locale: Locale =
    rawLocale && routing.locales.includes(rawLocale as Locale)
      ? (rawLocale as Locale)
      : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
