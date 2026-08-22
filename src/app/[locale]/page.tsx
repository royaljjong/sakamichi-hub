import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getGroups, getMembers, getPortalData, getLatestVideos } from '@/lib/data';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { HomePortal } from '@/components/home/HomePortal';
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
      // Korean
      '사카미치 시리즈', '노기자카46 멤버', '사쿠라자카46 멤버', '히나타자카46 멤버', 'AKB48 멤버',
      '일본 아이돌', 'JPOP 아이돌', '여자아이돌', '공식 SNS', '팬사이트', '링크 모음',
      // Japanese
      '女性アイドル', 'アイドル公式リンク', '秋元康グループ', '姉妹グループ',
      // English
      'Japanese idol', 'jpop idol', 'girls idol group', 'AKB48 sister groups',
      'official SNS', 'member directory', 'fan directory', 'korean fans', 'chinese fans',
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
  const portal = getPortalData();
  const videos = getLatestVideos();

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
      <Navigation />

      <main id="main-content" className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <HomePortal groups={groups} members={allMembers} locale={locale} portal={portal} videos={videos} />
      </main>

      <Footer />
    </div>
  );
}
