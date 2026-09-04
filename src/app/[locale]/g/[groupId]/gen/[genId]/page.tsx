import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getGroup, getGroups, getGeneration, getMembers } from '@/lib/data';
import { routing } from '@/i18n/routing';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { MemberGrid } from '@/components/member/MemberGrid';
import { GenerationChip } from '@/components/generation/GenerationChip';

interface GenerationPageProps {
  params: Promise<{ locale: string; groupId: string; genId: string }>;
}

const BASE_URL = 'https://sakamichi-hub.vercel.app';

export async function generateMetadata({ params }: GenerationPageProps): Promise<Metadata> {
  const { locale, groupId, genId } = await params;
  const group = getGroup(groupId);
  const gen = getGeneration(groupId, genId);
  if (!group || !gen) return {};

  const groupName = group.name[locale as 'ja' | 'ko' | 'en'] || group.name.ja;
  const genLabel = gen.label[locale as 'ja' | 'ko' | 'en'] || gen.label.ja;

  const title = `${groupName} ${genLabel} メンバー一覧・公式リンク | 坂道シリーズ リンクハブ`;
  const description = `${groupName} ${genLabel}のメンバー一覧、公式ブログ、Instagram、SNSリンクまとめ。`;

  const canonicalUrl = `${BASE_URL}/${locale}/g/${group.id}/gen/${gen.id}`;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    keywords: [groupName, genLabel, group.name.ja, group.name.ko, group.name.en, 'メンバー', '공식 블로그'],
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/ja/g/${group.id}/gen/${gen.id}`,
        ko: `${BASE_URL}/ko/g/${group.id}/gen/${gen.id}`,
        en: `${BASE_URL}/en/g/${group.id}/gen/${gen.id}`,
        'x-default': `${BASE_URL}/ja/g/${group.id}/gen/${gen.id}`,
      },
    },
  };
}

export function generateStaticParams() {
  const groups = getGroups();
  return routing.locales.flatMap((locale) =>
    groups.flatMap((g) =>
      g.generations.map((gen) => ({
        locale,
        groupId: g.id,
        genId: gen.id,
      })),
    ),
  );
}

export default async function GenerationPage({ params }: GenerationPageProps) {
  const { locale, groupId, genId } = await params;
  setRequestLocale(locale);

  const group = getGroup(groupId);
  const gen = getGeneration(groupId, genId);

  if (!group || !gen) {
    notFound();
  }

  const members = getMembers({ groupId, generationId: genId });
  const label = gen.label[locale as 'ja' | 'ko' | 'en'] || gen.label.ja;

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <AmbientBackground groupId={group.id} motif={group.motif} />
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
          <span className="text-[var(--ink)]">{label}</span>
        </div>

        {/* Generation Title & Quick Navigation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 mb-8 border-b border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)]">
          <div>
            <span className="text-xs uppercase tracking-widest text-[var(--g-brand)] font-semibold mb-1 block font-[family-name:var(--font-zen-kaku)]">
              {group.shortName[locale as 'ja' | 'ko' | 'en'] || group.shortName.ja}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)]">
              {label}
            </h1>
            <p className="text-xs text-[var(--ink-soft)] mt-2 font-[family-name:var(--font-zen-kaku)]">
              {gen.joinedOn && `가입일 / 加入日: ${gen.joinedOn}`} • 計 {members.length}名
            </p>
          </div>

          {/* Sibling generation chips */}
          <div className="flex flex-wrap gap-2">
            {group.generations.map((g) => (
              <GenerationChip
                key={g.id}
                generation={g}
                groupId={group.id}
                locale={locale}
                active={g.id === gen.id}
              />
            ))}
          </div>
        </div>

        <MemberGrid members={members} group={group} locale={locale} />
      </main>

      <Footer />
    </div>
  );
}
