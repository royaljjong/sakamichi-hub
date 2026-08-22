import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { SearchBox } from '@/components/search/SearchBox';

interface SearchPageProps {
  params: Promise<{ locale: string }>;
}

const BASE_URL = 'https://sakamichi-hub.vercel.app';

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;

  let title = 'メンバー検索 | 坂道・AKB48グループ リンクハブ';
  let description =
    '乃木坂46・櫻坂46・日向坂46・AKB48グループ全メンバーを漢字・ひらがな・ハングル・ローマ字・初声(초성)で高速検索。';

  if (locale === 'ko') {
    title = '멤버 검색 | 사카미치・AKB48 그룹 링크 허브';
    description =
      '노기자카46, 사쿠라자카46, 히나타자카46, AKB48 그룹 전 멤버를 한글, 초성, 한자, 로마자로 실시간 검색.';
  } else if (locale === 'en') {
    title = 'Member Search | Sakamichi & AKB48 Group Link Hub';
    description =
      'Search all members of Nogizaka46, Sakurazaka46, Hinatazaka46, and AKB48 group by Romaji, Kanji, Kana, and Korean Hangul.';
  }

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/search`,
      languages: {
        ja: `${BASE_URL}/ja/search`,
        ko: `${BASE_URL}/ko/search`,
        en: `${BASE_URL}/en/search`,
        'x-default': `${BASE_URL}/ja/search`,
      },
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('search');

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <AmbientBackground groupId="home" motif="mixed" />
      <Navigation />

      <main id="main-content" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-widest text-[var(--g-brand)] font-semibold mb-2 block font-[family-name:var(--font-zen-kaku)]">
            Member Search
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] mb-3">
            {t('pageTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
            {t('pageSubtitle')}
          </p>
        </div>

        <SearchBox locale={locale} />
      </main>

      <Footer />
    </div>
  );
}
