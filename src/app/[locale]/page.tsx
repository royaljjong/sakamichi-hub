import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getGroups, getMembers, getLatestUpdates } from '@/lib/data';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { GroupCard } from '@/components/group/GroupCard';
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
    title = '坂道シリーズ リンクハブ | 乃木坂46・櫻坂46・日向坂46 公式リンク集';
    description = '乃木坂46・櫻坂46・日向坂46の現役・卒業メンバー公式プロフィール、公式ブログ、Instagram、X(Twitter)など最新公式リンク集。';
  } else if (locale === 'ko') {
    title = '사카미치 시리즈 링크 허브 | 노기자카46・사쿠라자카46・히나타자카46 공식 링크 모음';
    description = '노기자카46, 사쿠라자카46, 히나타자카46 현역 및 졸업 멤버 공식 프로필, 블로그, 인스타그램, SNS 링크 모음.';
  } else {
    title = 'Sakamichi Series Link Hub | Nogizaka46, Sakurazaka46, Hinatazaka46 Directory';
    description = 'Official directory and link hub for Nogizaka46, Sakurazaka46, and Hinatazaka46 members with official blogs, profiles, and SNS.';
  }

  const canonicalUrl = `${BASE_URL}/${locale}`;

  return {
    title,
    description,
    keywords: [
      '坂道シリーズ', '乃木坂46', '櫻坂46', '日向坂46', '欅坂46', 'けやき坂46',
      '사카미치', '노기자카46', '사쿠라자카46', '히나타자카46', '케야키자카46',
      'Sakamichi Series', 'Nogizaka46', 'Sakurazaka46', 'Hinatazaka46',
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

  const groups = getGroups();
  const allMembers = getMembers();
  const latestUpdates = getLatestUpdates();

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '坂道シリーズ リンクハブ (Sakamichi Series Link Hub)',
    alternateName: ['사카미치 시리즈 링크 허브', 'Sakamichi Series Link Hub'],
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

      <main id="main-content" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full">
        {/* Centered Title */}
        <div className="text-center max-w-2xl mx-auto my-10 sm:my-16">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)]">
            坂道シリーズ リンクハブ
          </h1>
        </div>

        {/* 3 Large Group Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {groups.map((group) => {
            const groupMembers = allMembers.filter((m) =>
              m.memberships.some((ms) => ms.groupId === group.id),
            );
            return (
              <GroupCard
                key={group.id}
                group={group}
                members={groupMembers}
                locale={locale}
              />
            );
          })}
        </div>

        {/* Latest Blog Updates Infinite Sliding Ticker */}
        <LatestUpdatesMarquee updates={latestUpdates} locale={locale} />
      </main>

      <Footer />
    </div>
  );
}
