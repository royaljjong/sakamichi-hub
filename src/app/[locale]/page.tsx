import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getGroups, getMembers, getLatestUpdates } from '@/lib/data';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { FranchiseExplorer } from '@/components/home/FranchiseExplorer';
import { LatestUpdatesMarquee } from '@/components/home/LatestUpdatesMarquee';
import { JsonLd } from '@/components/seo/JsonLd';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const BASE_URL = 'https://sakamichi-hub.vercel.app';

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;

  let title = '';
  let description = '';

  if (locale === 'ja') {
    title = '坂道・48グループ リンクハブ | 乃木坂・櫻坂・日向坂・AKB48グループ 公式リンク集';
    description = '乃木坂46・櫻坂46・日向坂46およびAKB48グループ全姉妹グループの公式プロフィール、公式ブログ、Instagram、Xなど最新公式リンク集。';
  } else if (locale === 'ko') {
    title = '사카미치・48그룹 링크 허브 | 노기자카・사쿠라자카・히나타자카・AKB48 그룹 공식 링크 모음';
    description = '사카미치 시리즈 및 AKB48 그룹 전 자매그룹 공식 프로필, 블로그, 인스타그램, SNS 링크 모음.';
  } else {
    title = 'Sakamichi & 48 Group Link Hub | Official Directory';
    description = 'Official directory and link hub for Sakamichi Series and AKB48 Group sister groups with official blogs, profiles, and SNS.';
  }

  const canonicalUrl = `${BASE_URL}/${locale}`;

  return {
    title,
    description,
    keywords: [
      '坂道シリーズ', '乃木坂46', '櫻坂46', '日向坂46', 'AKB48', 'SKE48', 'NMB48', 'HKT48', 'NGT48', 'STU48', 'JKT48', 'BNK48',
      '사카미치', '노기자카46', '사쿠라자카46', '히나타자카46', 'AKB48',
      'Sakamichi Series', 'AKB48 Group', 'Nogizaka46', 'Sakurazaka46', 'Hinatazaka46',
      '公式ブログ', 'Instagram', 'Twitter', 'X', 'TikTok',
    ],
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/ja`,
        ko: `${BASE_URL}/ko`,
        en: `${BASE_URL}/en`,
        'x-default': `${BASE_URL}/ja`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('common');
  const groups = getGroups();
  const allMembers = getMembers();
  const latestUpdates = getLatestUpdates();

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('siteName'),
    alternateName: ['사카미치・48그룹 링크 허브', 'Sakamichi & 48 Group Link Hub'],
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/${locale}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <JsonLd data={websiteJsonLd} />
      <AmbientBackground groupId="home" motif="mixed" />
      <Navigation showBrand={false} />

      <main id="main-content" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full space-y-10">
        {/* Centered Title */}
        <div className="text-center max-w-3xl mx-auto my-6 sm:my-10">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)]">
            {t('siteName')}
          </h1>
        </div>

        {/* Dual Hierarchy Franchise Explorer */}
        <FranchiseExplorer
          groups={groups}
          allMembers={allMembers}
          locale={locale}
        />

        {/* Latest Blog Updates Infinite Sliding Ticker */}
        <div className="pt-6">
          <LatestUpdatesMarquee initialUpdates={latestUpdates} locale={locale} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
