import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getGroup, getGroups, getMembers, getLatestUpdates, getPortalData, getGroupSingles } from '@/lib/data';
import { routing } from '@/i18n/routing';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { GroupHeader } from '@/components/group/GroupHeader';
import { GroupView } from '@/components/group/GroupView';
import { GroupInsights } from '@/components/group/GroupInsights';
import { GroupDiscography } from '@/components/group/GroupDiscography';
import { GroupDataStatus } from '@/components/group/GroupDataStatus';
import { JsonLd } from '@/components/seo/JsonLd';

interface GroupPageProps {
  params: Promise<{ locale: string; groupId: string }>;
}

const BASE_URL = 'https://sakamichi-hub.vercel.app';

export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  const { locale, groupId } = await params;
  const group = getGroup(groupId);
  if (!group) return {};

  const nameJa = group.name.ja;
  const nameKo = group.name.ko;
  const nameEn = group.name.en;

  let title = '';
  let description = '';

  if (locale === 'ja') {
    title = `${nameJa} メンバー一覧・公式ブログ・SNSリンク集`;
    description = `${nameJa}の現役メンバー・卒業生一覧、公式ブログ、Instagram、X(Twitter)など公式リンクまとめ。`;
  } else if (locale === 'ko') {
    title = `${nameKo} (${nameJa}) 멤버 목록・공식 블로그・SNS 링크`;
    description = `${nameKo}(${nameJa}) 현역 및 졸업 멤버 목록, 공식 블로그, 인스타그램, SNS 링크 모음.`;
  } else {
    title = `${nameEn} (${nameJa}) Members, Official Blogs & Links`;
    description = `Complete directory of active and graduated members of ${nameEn} (${nameJa}) with official blogs and SNS links.`;
  }

  const canonicalUrl = `${BASE_URL}/${locale}/g/${group.id}`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    keywords: [
      nameJa, nameKo, nameEn,
      'メンバー', '멤버', 'Members',
      '公式ブログ', '블로그', 'Instagram', 'X', 'Twitter',
      // Group name variations
      `${nameJa} メンバー`, `${nameKo} 멤버`, `${nameEn} members`,
      `${nameJa} 卒業生`, `${nameKo} 졸업생`, `${nameEn} graduated`,
      // Category keywords
      '坂道シリーズ', '사카미치 시리즈', 'Sakamichi Series',
      'AKB48グループ', 'AKB48 그룹', 'AKB48 Group',
      'japanese idol group', '日本アイドル', '일본 아이돌 그룹',
      // Discovery
      'member profile', 'member ranking', 'member birthday',
      'official blog', 'twitter', 'instagram',
      '멤버 프로필', '멤버 랭킹', '멤버 생일',
      'アイドル プロフィール', 'ランキング', '誕生日',
    ],
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/ja/g/${group.id}`,
        ko: `${BASE_URL}/ko/g/${group.id}`,
        en: `${BASE_URL}/en/g/${group.id}`,
        'x-default': `${BASE_URL}/ja/g/${group.id}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export function generateStaticParams() {
  const groups = getGroups();
  return routing.locales.flatMap((locale) =>
    groups.map((g) => ({
      locale,
      groupId: g.id,
    })),
  );
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { locale, groupId } = await params;
  setRequestLocale(locale);

  const group = getGroup(groupId);
  if (!group) {
    notFound();
  }

  const members = getMembers({ groupId });
  const updates = getLatestUpdates();
  const portal = getPortalData();
  const singles = getGroupSingles(group.id, 12);

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: group.name.ja,
    alternateName: [group.name.ko, group.name.en],
    url: `${BASE_URL}/${locale}/g/${group.id}`,
    sameAs: [
      group.official.site,
      group.official.blogIndex,
      group.official.x,
      group.official.instagram,
      group.official.youtube,
      group.official.tiktok,
    ].filter(Boolean),
    member: members.slice(0, 30).map((m) => ({
      '@type': 'Person',
      name: m.name.ja.kanji,
      alternateName: [m.name.ko.hangul, m.name.en.romaji],
      url: `${BASE_URL}/${locale}/m/${m.id}`,
    })),
  };

  const now = new Date().toISOString();
  const venueMap = new Map(portal.venues.map((v) => [v.id, v]));
  const groupEvents = portal.events
    .filter((e) => e.groupIds.includes(group.id) && e.startsAt >= now)
    .slice(0, 20);

  const eventJsonLd =
    groupEvents.length > 0
      ? {
          '@context': 'https://schema.org',
          '@graph': groupEvents.map((e) => {
            const venue = e.venueId ? venueMap.get(e.venueId) : undefined;
            return {
              '@type': 'Event',
              name: e.title[locale as 'ja' | 'ko' | 'en'] || e.title.ja,
              startDate: e.startsAt,
              ...(e.endsAt ? { endDate: e.endsAt } : {}),
              eventStatus: 'https://schema.org/EventScheduled',
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              ...(venue
                ? {
                    location: {
                      '@type': 'Place',
                      name: venue.name[locale as 'ja' | 'ko' | 'en'] || venue.name.ja,
                      address: venue.address[locale as 'ja' | 'ko' | 'en'] || venue.address.ja,
                    },
                  }
                : {}),
              organizer: {
                '@type': 'MusicGroup',
                name: group.name.ja,
                url: group.official.site,
              },
              url: e.officialUrl,
            };
          }),
        }
      : null;

  // Task 5 — MusicRelease Schema.org for latest 5 singles
  const top5Singles = getGroupSingles(group.id, 5);
  const musicReleaseJsonLd =
    top5Singles.length > 0
      ? {
          '@context': 'https://schema.org',
          '@graph': top5Singles.map((s) => ({
            '@type': 'MusicRelease',
            name: s.title.ja,
            releaseDate: s.releaseDate,
            byArtist: { '@type': 'MusicGroup', name: group.name.ja },
          })),
        }
      : null;

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <JsonLd data={jsonLdData} />
      {eventJsonLd && <JsonLd data={eventJsonLd} />}
      {musicReleaseJsonLd && <JsonLd data={musicReleaseJsonLd} />}
      <AmbientBackground groupId={group.id} motif={group.motif} />
      <Navigation />

      <main id="main-content" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1">
        <GroupHeader group={group} locale={locale} />
        <GroupDataStatus group={group} members={members} portal={portal} singlesCount={singles.length} />
        <GroupInsights group={group} members={members} updates={updates} locale={locale} portal={portal} />
        <GroupDiscography singles={singles} group={group} locale={locale} />
        <GroupView group={group} members={members} locale={locale} />
      </main>

      <Footer />
    </div>
  );
}
