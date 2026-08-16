import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { fontClassNames } from '@/app/fonts';
import '@/app/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://sakamichi-hub.vercel.app'),
  title: {
    template: '%s | 坂道シリーズ リンクハブ',
    default: '坂道シリーズ リンクハブ — 乃木坂46・櫻坂46・日向坂46 公式リンク集',
  },
  description:
    '坂道シリーズ 3グループ（乃木坂46・櫻坂46・日向坂46）の現役・卒業メンバー公式ブログ・SNSリンク集。',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} data-group="home">
      <body
        className={`antialiased min-h-screen bg-[var(--paper)] text-[var(--ink)] ${fontClassNames}`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
