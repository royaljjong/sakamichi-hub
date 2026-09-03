import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getGroups, getMembers, getLatestUpdates } from '@/lib/data';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { GroupComparePicker } from '@/components/compare/GroupComparePicker';
import type { Group, Member } from '@/lib/schema';
import type { RecentUpdate } from '@/lib/updates-schema';

interface ComparePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ a?: string; b?: string; c?: string }>;
}

const BASE_URL = 'https://sakamichi-hub.vercel.app';

const DEFAULT_IDS = ['nogizaka46', 'sakurazaka46', 'hinatazaka46'];

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { locale } = await params;

  let title = 'グループ比較 | 坂道・AKB48グループ リンクハブ';
  let description =
    '乃木坂46・櫻坂46・日向坂46・AKB48グループを横断比較。メンバー数・フォロワー・最新ブログを一覧。';

  if (locale === 'ko') {
    title = '그룹 비교 | 사카미치・AKB48 그룹 링크 허브';
    description =
      '노기자카46, 사쿠라자카46, 히나타자카46, AKB48 그룹 간 멤버 수·팔로워·최신 블로그를 비교합니다.';
  } else if (locale === 'en') {
    title = 'Group Comparison | Sakamichi & AKB48 Group Link Hub';
    description =
      'Compare Nogizaka46, Sakurazaka46, Hinatazaka46, and AKB48 groups side-by-side — member counts, followers, and latest blog posts.';
  }

  return {
    metadataBase: new URL('https://sakamichi-hub.vercel.app'),
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/compare`,
      languages: {
        ja: `${BASE_URL}/ja/compare`,
        ko: `${BASE_URL}/ko/compare`,
        en: `${BASE_URL}/en/compare`,
        'x-default': `${BASE_URL}/ja/compare`,
      },
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function resolveGroupIds(
  rawA: string | undefined,
  rawB: string | undefined,
  rawC: string | undefined,
  validIds: Set<string>,
): [string, string, string] {
  const seen = new Set<string>();

  function pick(raw: string | undefined, fallback: string): string {
    const id = raw && validIds.has(raw) ? raw : fallback;
    return id;
  }

  const a = pick(rawA, DEFAULT_IDS[0] ?? 'nogizaka46');
  seen.add(a);

  const bRaw = rawB && validIds.has(rawB) ? rawB : '';
  const b = bRaw;
  if (b) seen.add(b);

  const cRaw = rawC && validIds.has(rawC) ? rawC : '';
  const c = cRaw;

  return [a, b, c];
}

type Locale = 'ja' | 'ko' | 'en';

function yearsActive(debutedOn: string): number {
  const debut = new Date(debutedOn);
  const now = new Date();
  return Math.floor((now.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function extractHandle(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:x\.com|twitter\.com|instagram\.com|youtube\.com\/@?)\/(@?[^/?#]+)/);
  if (!match || !match[1]) return null;
  return match[1].startsWith('@') ? match[1] : `@${match[1]}`;
}

interface GroupCardProps {
  group: Group;
  members: Member[];
  updates: RecentUpdate[];
  locale: Locale;
  t: Awaited<ReturnType<typeof getTranslations>>;
}

function GroupCard({ group, members, updates, locale, t }: GroupCardProps) {
  const lang = locale;
  const brand = group.palette.brand;

  const activeMembers = members.filter(
    (m) => m.primaryGroupId === group.id && (m.status === 'active' || m.status === 'graduating' || m.status === 'trainee'),
  );
  const graduates = members.filter(
    (m) => m.primaryGroupId === group.id && (m.status === 'graduated' || m.status === 'withdrawn' || m.status === 'transferred'),
  );
  const groupPosts = updates.filter((u) => u.groupId === group.id).slice(0, 3);
  const years = yearsActive(group.debutedOn);

  const xHandle = extractHandle(group.official.x);
  const igHandle = extractHandle(group.official.instagram);
  const ytHandle = extractHandle(group.official.youtube);

  return (
    <div
      className="editorial-panel p-5 sm:p-6 flex flex-col gap-5"
      style={{ borderLeft: `3px solid ${brand}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-base shrink-0"
          style={{ backgroundColor: brand }}
          aria-hidden="true"
        >
          {group.name.ja.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold text-[var(--g-ink)] truncate leading-tight font-[family-name:var(--font-klee-one)]">
            {group.name.ja}
          </p>
          {lang !== 'ja' && (
            <p className="text-xs text-[var(--ink-soft)] truncate">
              {group.name[lang]}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="divide-y divide-black/[0.06]">
        <StatRow label={t('statDebut')} value={group.debutedOn} />
        <StatRow
          label={t('statActiveSince')}
          value={`${years}${lang === 'ja' ? '年' : lang === 'ko' ? '년' : ' yrs'}`}
        />
        <StatRow label={t('statActiveMembers')} value={String(activeMembers.length)} accent />
        <StatRow label={t('statGraduates')} value={String(graduates.length)} />
        {xHandle && (
          <StatRow
            label={t('statOfficial') + ' X'}
            value={xHandle}
            href={group.official.x ?? undefined}
          />
        )}
        {igHandle && (
          <StatRow
            label={t('statOfficial') + ' IG'}
            value={igHandle}
            href={group.official.instagram ?? undefined}
          />
        )}
        {ytHandle && (
          <StatRow
            label={t('statOfficial') + ' YT'}
            value={ytHandle}
            href={group.official.youtube ?? undefined}
          />
        )}
      </div>

      {/* Latest posts */}
      {groupPosts.length > 0 && (
        <div>
          <p className="section-kicker mb-2">{t('latestPosts')}</p>
          <ul className="space-y-2">
            {groupPosts.map((post) => (
              <li key={post.id}>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-0.5 hover:text-[var(--g-brand)] transition-colors"
                >
                  <span className="text-xs text-[var(--ink-soft)]">
                    {post.publishedAt.slice(0, 10)} · {post.memberName[lang]}
                  </span>
                  <span className="text-sm font-medium line-clamp-2">{post.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  href?: string;
  accent?: boolean;
}

function StatRow({ label, value, href, accent }: StatRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-xs text-[var(--ink-soft)] shrink-0">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[var(--g-brand)] hover:underline truncate"
        >
          {value}
        </a>
      ) : (
        <span
          className={`text-sm font-semibold truncate ${accent ? 'text-[var(--g-brand)]' : 'text-[var(--g-ink)]'}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
  const { locale } = await params;
  const { a, b, c } = await searchParams;
  setRequestLocale(locale);

  const lang = (['ja', 'ko', 'en'].includes(locale) ? locale : 'ja') as Locale;
  const t = await getTranslations('compare');

  const allGroups = getGroups();
  const validIds = new Set(allGroups.map((g) => g.id));
  const [selectedA, selectedB, selectedC] = resolveGroupIds(a, b, c, validIds);

  // Build unique group list preserving order, skip empty slots
  const rawSlots = [selectedA, selectedB, selectedC].filter(Boolean);
  const seen = new Set<string>();
  const groupIds = rawSlots.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const selectedGroups = groupIds
    .map((id) => allGroups.find((g) => g.id === id))
    .filter((g): g is Group => g !== undefined);

  const allMembers = getMembers();
  const latestUpdates = getLatestUpdates();
  // Compute grid column count class
  const colCount = selectedGroups.length;
  const gridClass =
    colCount === 1
      ? 'grid grid-cols-1 gap-6'
      : colCount === 2
        ? 'grid grid-cols-1 sm:grid-cols-2 gap-6'
        : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6';

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <AmbientBackground groupId="home" motif="mixed" />
      <Navigation />

      <main
        id="main-content"
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full"
      >
        {/* Page title */}
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-[var(--g-brand)] font-semibold mb-2 block font-[family-name:var(--font-zen-kaku)]">
            Group Comparison
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] mb-3">
            {t('pageTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
            {t('pageSubtitle')}
          </p>
        </div>

        {/* Group selector */}
        <GroupComparePicker
          groups={allGroups}
          selectedA={selectedA}
          selectedB={selectedB}
          selectedC={selectedC}
          locale={locale}
        />

        {/* Comparison grid */}
        {selectedGroups.length > 0 ? (
          <div className={gridClass}>
            {selectedGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                members={allMembers}
                updates={latestUpdates}
                locale={lang}
                t={t}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-[var(--ink-soft)] py-16">{t('selectGroup')}</p>
        )}
      </main>

      <Footer />
    </div>
  );
}
