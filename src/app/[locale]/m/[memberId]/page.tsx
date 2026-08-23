import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getMember, getMembers, getGroup, getGeneration, getSameGenerationMembers, getGroups } from '@/lib/data';
import { routing } from '@/i18n/routing';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { MemberAvatar } from '@/components/member/MemberAvatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LinkGrid } from '@/components/member/LinkGrid';
import { MemberCard } from '@/components/member/MemberCard';
import { Ruby } from '@/components/ui/Ruby';
import { JsonLd } from '@/components/seo/JsonLd';
import { CareerTimeline } from '@/components/member/CareerTimeline';

interface MemberPageProps {
  params: Promise<{ locale: string; memberId: string }>;
}

const BASE_URL = 'https://sakamichi-hub.vercel.app';

export async function generateMetadata({ params }: MemberPageProps): Promise<Metadata> {
  const { locale, memberId } = await params;
  const member = getMember(memberId);
  if (!member) return {};

  const group = getGroup(member.primaryGroupId);
  const gen = getGeneration(member.primaryGroupId, member.primaryGenerationId);

  const groupJa = group?.name.ja || '坂道シリーズ';
  const groupKo = group?.name.ko || '사카미치 시리즈';
  const groupEn = group?.name.en || 'Sakamichi Series';

  const kanji = member.name.ja.kanji;
  const kana = member.name.ja.kana;
  const hangul = member.name.ko.hangul;
  const romaji = member.name.en.romaji;

  let title = '';
  let description = '';

  if (locale === 'ja') {
    title = `${kanji} (${groupJa}) 公式リンク・ブログ・SNSまとめ`;
    description = `${groupJa} ${gen?.label.ja || ''}メンバー「${kanji}（${kana}）」の公式プロフィール、公式ブログ、Instagram、X(Twitter)など最新公式リンク集。`;
  } else if (locale === 'ko') {
    title = `${hangul} (${kanji} · ${groupKo}) 공식 링크・블로그・SNS`;
    description = `${groupKo} ${gen?.label.ko || ''} 멤버 ${hangul}(${kanji}, ${kana})의 공식 프로필, 블로그, 인스타그램, SNS 링크 모음.`;
  } else {
    title = `${romaji} (${kanji} - ${groupEn}) Official Links, Blog & SNS`;
    description = `Official links, blog, profile, Instagram, and SNS directory for ${romaji} (${kanji}) of ${groupEn}.`;
  }

  const keywords = [
    kanji,
    kana,
    hangul,
    romaji,
    groupJa,
    groupKo,
    groupEn,
    '公式ブログ',
    '공식 블로그',
    'Instagram',
    'Twitter',
    'X',
    '坂道シリーズ',
    '사카미치',
    'Sakamichi',
    ...(member.name.aliases || []),
    // Additional multilingual keywords
    'idol profile',
    'member SNS',
    '프로필',
    '멤버 정보',
    'アイドル プロフィール',
    'japanese idol',
    'jpop idol',
  ];

  const canonicalUrl = `${BASE_URL}/${locale}/m/${member.id}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/ja/m/${member.id}`,
        ko: `${BASE_URL}/ko/m/${member.id}`,
        en: `${BASE_URL}/en/m/${member.id}`,
        'x-default': `${BASE_URL}/ja/m/${member.id}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'profile',
      images: member.imageUrl ? [{ url: member.imageUrl, alt: kanji }] : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: member.imageUrl ? [member.imageUrl] : undefined,
    },
  };
}

export function generateStaticParams() {
  const members = getMembers();
  return routing.locales.flatMap((locale) =>
    members.map((m) => ({
      locale,
      memberId: m.id,
    })),
  );
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { locale, memberId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('member');

  const member = getMember(memberId);
  if (!member) {
    notFound();
  }

  const group = getGroup(member.primaryGroupId);
  const gen = getGeneration(member.primaryGroupId, member.primaryGenerationId);
  const peers = getSameGenerationMembers(
    member.id,
    member.primaryGroupId,
    member.primaryGenerationId,
  );

  const isGraduated = member.status === 'graduated';
  const genLabel = gen?.label[locale as 'ja' | 'ko' | 'en'] || gen?.label.ja || '';
  const groupName = group?.name[locale as 'ja' | 'ko' | 'en'] || group?.name.ja || '';

  // Schema.org Person JSON-LD
  const sameAsLinks = member.links.map((l) => l.url);
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: member.name.ja.kanji,
    alternateName: [
      member.name.ja.kana,
      member.name.ko.hangul,
      member.name.en.romaji,
      ...(member.name.aliases || []),
    ],
    image: member.imageUrl || undefined,
    birthDate: member.birthDate || undefined,
    memberOf: group
      ? {
          '@type': 'MusicGroup',
          name: group.name.ja,
          alternateName: [group.name.ko, group.name.en],
          url: group.official.site,
        }
      : undefined,
    sameAs: sameAsLinks,
    url: `${BASE_URL}/${locale}/m/${member.id}`,
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between" data-group={group?.id || 'home'}>
      <JsonLd data={jsonLdData} />
      <AmbientBackground groupId={group?.id || 'home'} motif={group?.motif || 'mixed'} />
      <Navigation />

      <main id="main-content" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)] mb-8 font-medium">
          <Link href="/" className="hover:text-[var(--ink)] transition">
            Home
          </Link>
          <span>/</span>
          {group && (
            <>
              <Link href={`/g/${group.id}`} className="hover:text-[var(--ink)] transition">
                {groupName}
              </Link>
              <span>/</span>
            </>
          )}
          {gen && group && (
            <>
              <Link
                href={`/g/${group.id}/gen/${gen.id}`}
                className="hover:text-[var(--ink)] transition"
              >
                {genLabel}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[var(--ink)] font-semibold">
            {member.name.ja.kanji}
          </span>
        </div>

        {/* Member Profile Header */}
        <section className="p-6 sm:p-10 rounded-[32px] bg-[var(--white-veil)] border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] shadow-[var(--shadow-lift)] backdrop-blur-md mb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <MemberAvatar
              glyph={member.avatar.glyph}
              hueShift={member.avatar.hueShift}
              imageUrl={member.imageUrl}
              groupLogoUrl={group?.logoUrl ?? null}
              name={member.name.ja.kanji}
              size={96}
              isGraduated={isGraduated}
              className="shadow-md"
            />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                <h1 className="text-2xl sm:text-4xl font-bold text-[var(--g-ink)] tracking-tight font-[family-name:var(--font-klee-one)]">
                  {locale === 'ja' ? (
                    <Ruby
                      kanji={member.name.ja.kanji}
                      kana={member.name.ja.kana}
                      locale={locale}
                    />
                  ) : locale === 'ko' ? (
                    member.name.ko.hangul
                  ) : (
                    member.name.en.romaji
                  )}
                </h1>
                <StatusBadge status={member.status} />
              </div>

              {/* Multilingual subnames */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 text-xs sm:text-sm text-[var(--ink-soft)] mt-1 font-[family-name:var(--font-zen-kaku)]">
                {locale !== 'ja' && <span>漢字: {member.name.ja.kanji}</span>}
                {locale !== 'ja' && <span>かな: {member.name.ja.kana}</span>}
                {locale !== 'ko' && <span>한글: {member.name.ko.hangul}</span>}
                {locale !== 'en' && <span>Romaji: {member.name.en.romaji}</span>}
              </div>

              {/* Metadata */}
              <div className="mt-4 pt-4 border-t border-[color-mix(in_oklab,var(--g-ink)_8%,transparent)] flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-1 text-xs text-[var(--ink-soft)] font-[family-name:var(--font-zen-kaku)]">
                <span>{t('affiliationLabel')}: <strong>{groupName}</strong></span>
                <span>{t('generationLabel')}: <strong>{genLabel}</strong></span>
                {member.birthDate && <span>{t('birthDateLabel')}: <strong>{member.birthDate}</strong></span>}
                {member.birthplace && <span>{t('birthplaceLabel')}: <strong>{member.birthplace[locale as 'ja'|'ko'|'en'] || member.birthplace.ja}</strong></span>}
                {member.bloodType && <span>{t('bloodTypeLabel')}: <strong>{member.bloodType}</strong></span>}
                {member.height && <span>{t('heightLabel')}: <strong>{member.height}cm</strong></span>}
                {member.hobbies && member.hobbies.length > 0 && <span>{t('hobbiesLabel')}: <strong>{member.hobbies.join('・')}</strong></span>}
                {member.specialties && member.specialties.length > 0 && <span>{t('specialtiesLabel')}: <strong>{member.specialties.join('・')}</strong></span>}
              </div>
            </div>
          </div>
        </section>

        {/* Career Timeline */}
        {member.memberships.length >= 1 && (
          <CareerTimeline member={member} groups={getGroups()} locale={locale} />
        )}

        {/* Links Grid - The Primary Destination */}
        <section className="mb-14">
          <div className="flex items-center justify-between pb-3 mb-6 border-b border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)]">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)]">
              {t('linksHeading')}
            </h2>
            <span className="text-xs text-[var(--ink-soft)] font-[family-name:var(--font-zen-kaku)]">
              {t('linksCount', { count: member.links.length })}
            </span>
          </div>

          <LinkGrid links={member.links} locale={locale} />
        </section>

        {/* Same Generation Peers */}
        {peers.length > 0 && (
          <section className="mb-12">
            <div className="pb-3 mb-6 border-b border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)]">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)]">
                {t('sameGeneration')} ({genLabel})
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {peers.slice(0, 8).map((peer) => (
                <MemberCard
                  key={peer.id}
                  member={peer}
                  group={group}
                  locale={locale}
                  size="sm"
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
