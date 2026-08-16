import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getGroup, getMembers } from '@/lib/data';
import { routing } from '@/i18n/routing';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { MemberGrid } from '@/components/member/MemberGrid';
import { LineageTimeline } from '@/components/group/LineageTimeline';

interface ArchivePageProps {
  params: Promise<{ locale: string; groupId: string }>;
}

const BASE_URL = 'https://sakamichi-hub.vercel.app';

export async function generateMetadata({ params }: ArchivePageProps): Promise<Metadata> {
  const { locale, groupId } = await params;
  const isSakura = groupId === 'sakurazaka46';

  const eraName = isSakura
    ? { ja: '欅坂46', ko: '케야키자카46', en: 'Keyakizaka46' }
    : { ja: 'けやき坂46 (ひらがなけやき)', ko: '히라가나 케야키', en: 'Hiragana Keyakizaka46' };

  const name = eraName[locale as 'ja' | 'ko' | 'en'] || eraName.ja;
  const title = `${name} 時代アーカイブ | 坂道シリーズ リンクハブ`;
  const description = `${name} 時代の活動記録、所属メンバー一覧、公式リンクアーカイブ。`;

  const canonicalUrl = `${BASE_URL}/${locale}/g/${groupId}/archive`;

  return {
    title,
    description,
    keywords: [name, '欅坂46', 'けやき坂46', 'ひらがなけやき', '케야키자카46', '히라가나 케야키', 'Keyakizaka46', 'Hiragana Keyaki'],
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/ja/g/${groupId}/archive`,
        ko: `${BASE_URL}/ko/g/${groupId}/archive`,
        en: `${BASE_URL}/en/g/${groupId}/archive`,
        'x-default': `${BASE_URL}/ja/g/${groupId}/archive`,
      },
    },
  };
}

export function generateStaticParams() {
  const archiveGroups = ['sakurazaka46', 'hinatazaka46'];
  return routing.locales.flatMap((locale) =>
    archiveGroups.map((groupId) => ({
      locale,
      groupId,
    })),
  );
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { locale, groupId } = await params;
  setRequestLocale(locale);

  if (groupId !== 'sakurazaka46' && groupId !== 'hinatazaka46') {
    notFound();
  }

  const group = getGroup(groupId);
  if (!group) notFound();

  const isSakura = groupId === 'sakurazaka46';
  const archiveName = isSakura
    ? { ja: '欅坂46 時代', ko: '케야키자카46 시대', en: 'Keyakizaka46 Era' }
    : { ja: 'けやき坂46 (ひらがなけやき) 時代', ko: '히라가나 케야키 시대', en: 'Hiragana Keyakizaka46 Era' };

  const archiveDescription = isSakura
    ? {
        ja: '2015年8月21日から2020年10月12日まで活動した欅坂46時代の記録。改名を経て櫻坂46へと受け継がれました。',
        ko: '2015년 8월 21일부터 2020년 10월 12일까지 활동한 케야키자카46 시절의 기록. 개명을 거쳐 사쿠라자카46으로 이어졌습니다.',
        en: 'Records of the Keyakizaka46 era from August 21, 2015 to October 12, 2020, before rebranding to Sakurazaka46.',
      }
    : {
        ja: '2015年11月30日から2019年2月10日まで活動したけやき坂46時代の記録。日向坂46として単独デビューを果たしました。',
        ko: '2015년 11월 30일부터 2019년 2월 10일까지 활동한 히라가나 케야키 시절의 기록. 히나타자카46으로 단독 데뷔를 이루었습니다.',
        en: 'Records of the Hiragana Keyakizaka46 era from November 30, 2015 to February 10, 2019, before debuting as Hinatazaka46.',
      };

  const eraLineageId = isSakura ? 'keyakizaka46' : 'hiragana-keyaki';

  // Members who joined under keyakizaka46 / hiragana-keyaki
  const eraMembers = getMembers().filter((m) =>
    m.memberships.some((ms) => {
      const gen = group.generations.find((g) => g.id === ms.generationId);
      return gen && gen.joinedUnderLineageId === eraLineageId;
    }),
  );

  return (
    <div className="relative min-h-screen flex flex-col justify-between" data-group="keyakizaka46">
      <AmbientBackground groupId="keyakizaka46" motif="leaf" />
      <Navigation />

      <main id="main-content" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)] mb-6 font-medium">
          <Link href="/" className="hover:text-[var(--ink)] transition">
            Home
          </Link>
          <span>/</span>
          <Link href={`/g/${group.id}`} className="hover:text-[var(--ink)] transition">
            {group.name[locale as 'ja' | 'ko' | 'en'] || group.name.ja}
          </Link>
          <span>/</span>
          <span className="text-[var(--ink)]">
            {archiveName[locale as 'ja' | 'ko' | 'en'] || archiveName.ja}
          </span>
        </div>

        {/* Archive Header */}
        <div className="pb-6 mb-8 border-b border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)]">
          <span className="text-xs uppercase tracking-widest text-[#5FAE84] font-bold mb-2 block font-[family-name:var(--font-zen-kaku)]">
            Historical Archive
          </span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] mb-3">
            {archiveName[locale as 'ja' | 'ko' | 'en'] || archiveName.ja}
          </h1>
          <p className="text-sm text-[var(--ink-soft)] max-w-2xl leading-relaxed">
            {archiveDescription[locale as 'ja' | 'ko' | 'en'] || archiveDescription.ja}
          </p>

          <LineageTimeline lineage={group.lineage} locale={locale} />
        </div>

        <MemberGrid members={eraMembers} group={group} locale={locale} />
      </main>

      <Footer />
    </div>
  );
}
