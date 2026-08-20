'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import type { Group, Member } from '@/lib/schema';
import type { RecentUpdate } from './LatestUpdatesMarquee';
import { BirthdayPanel } from './BirthdayPanel';
import { RankingPanel } from './RankingPanel';
import { EventBoard } from './EventBoard';
import type { PortalDataset } from '@/lib/portal-schema';

type Locale = 'ja' | 'ko' | 'en';

interface HomePortalProps {
  groups: Group[];
  members: Member[];
  updates: RecentUpdate[];
  locale: string;
  portal: PortalDataset;
}

const COPY = {
  ja: { edition: 'JAPAN IDOL DIRECTORY', lead: '今日のアイドルを、場所とグループから。', sub: '公式プロフィール・お知らせ・ライブ情報を一つの導線で探す非公式ディレクトリ。', all: 'すべて', city: '活動拠点', groups: 'グループ', notice: '最新のお知らせ', feedNote: '現在は公式ブログ更新を掲載しています。ライブ情報は検証済みソース接続後に追加します。', open: 'グループを見る', noFeed: '選択条件に一致する更新はありません。', international: '海外' },
  ko: { edition: 'JAPAN IDOL DIRECTORY', lead: '오늘의 아이돌을, 장소와 그룹으로.', sub: '공식 프로필·공지·공연 정보를 하나의 흐름으로 찾는 비공식 디렉터리입니다.', all: '전체', city: '활동 거점', groups: '그룹', notice: '최신 공지', feedNote: '현재는 공식 블로그 갱신을 표시합니다. 공연 정보는 검증된 소스 연결 후 추가됩니다.', open: '그룹 보기', noFeed: '선택 조건에 맞는 업데이트가 없습니다.', international: '해외' },
  en: { edition: 'JAPAN IDOL DIRECTORY', lead: 'Find today’s idols by place and group.', sub: 'An unofficial directory connecting official profiles, notices and live information.', all: 'All', city: 'Base city', groups: 'Groups', notice: 'Latest notices', feedNote: 'Official blog updates are shown for now. Live data will follow after source verification.', open: 'View group', noFeed: 'No updates match this selection.', international: 'International' },
};

const CITY_KEYS = ['all', 'tokyo', 'nagoya', 'osaka', 'fukuoka', 'niigata', 'setouchi', 'international'] as const;
type CityKey = typeof CITY_KEYS[number];

const CITY_LABELS: Record<CityKey, Record<Locale, string>> = {
  all: { ja: '全国', ko: '전체', en: 'All' },
  tokyo: { ja: '東京', ko: '도쿄', en: 'Tokyo' },
  nagoya: { ja: '名古屋', ko: '나고야', en: 'Nagoya' },
  osaka: { ja: '大阪', ko: '오사카', en: 'Osaka' },
  fukuoka: { ja: '福岡', ko: '후쿠오카', en: 'Fukuoka' },
  niigata: { ja: '新潟', ko: '니가타', en: 'Niigata' },
  setouchi: { ja: '瀬戸内', ko: '세토우치', en: 'Setouchi' },
  international: { ja: '海外', ko: '해외', en: 'International' },
};

function cityFor(group: Group): CityKey {
  if (group.region === 'international') return 'international';
  const location = group.baseLocation?.ja ?? '';
  if (location.includes('東京')) return 'tokyo';
  if (location.includes('名古屋')) return 'nagoya';
  if (location.includes('大阪')) return 'osaka';
  if (location.includes('福岡')) return 'fukuoka';
  if (location.includes('新潟')) return 'niigata';
  if (location.includes('瀬戸内')) return 'setouchi';
  return 'all';
}

export function HomePortal({ groups, members, updates, locale, portal }: HomePortalProps) {
  const lang = (['ja', 'ko', 'en'].includes(locale) ? locale : 'ja') as Locale;
  const copy = COPY[lang];
  const [city, setCity] = useState<CityKey>('all');
  const [groupId, setGroupId] = useState<string>('all');

  const visibleGroups = useMemo(() => groups.filter((group) => city === 'all' || cityFor(group) === city), [city, groups]);
  const visibleUpdates = useMemo(() => updates.filter((item) => groupId === 'all' || item.groupId === groupId).slice(0, 12), [groupId, updates]);

  const selectGroup = (id: string) => {
    setGroupId(id);
    const group = groups.find((item) => item.id === id);
    document.documentElement.setAttribute('data-group', group?.id ?? 'home');
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="grid gap-8 border-b border-black/10 pb-10 pt-6 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
        <div>
          <p className="section-kicker">{copy.edition} · 2026</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-[var(--g-ink)] sm:text-6xl lg:text-7xl">{copy.lead}</h1>
        </div>
        <p className="max-w-lg text-sm leading-7 text-[var(--ink-soft)] lg:pb-2">{copy.sub}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
        <div className="editorial-panel overflow-hidden p-5 sm:p-7">
          <p className="section-kicker">01 · {copy.city}</p>
          <div className="relative mt-5 min-h-[320px] overflow-hidden bg-[#f5f4f0] p-5">
            <svg viewBox="0 0 360 300" className="absolute inset-0 h-full w-full opacity-80" aria-hidden="true">
              <path d="M278 25c18 22 17 43 1 65l-22 28-12 44-32 35-27 35-45 19-37 28-34-8 34-35 31-16 27-34 25-37 25-43 23-34 18-50Z" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-[var(--g-brand)]" />
              <path d="M87 246 48 268 25 260l35-25 28-8" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-[var(--g-brand)]" />
            </svg>
            <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CITY_KEYS.map((key) => (
                <button key={key} type="button" onClick={() => { setCity(key); setGroupId('all'); }} className={`map-label ${city === key ? 'map-label-active' : ''}`}>{CITY_LABELS[key][lang]}</button>
              ))}
            </div>
            <p className="absolute bottom-5 left-5 right-5 text-[11px] leading-5 text-[var(--ink-soft)]">Verified base locations from official group metadata. Venue-level map data is not connected yet.</p>
          </div>
        </div>

        <div className="editorial-panel p-5 sm:p-7">
          <div className="flex items-end justify-between gap-4">
            <div><p className="section-kicker">02 · {copy.groups}</p><h2 className="section-title mt-2">{CITY_LABELS[city][lang]}</h2></div>
            <span className="text-xs text-[var(--ink-soft)]">{visibleGroups.length.toString().padStart(2, '0')}</span>
          </div>
          <div className="mt-5 grid gap-px overflow-hidden border border-black/10 bg-black/10 sm:grid-cols-2">
            {visibleGroups.map((group, index) => {
              const count = members.filter((member) => member.primaryGroupId === group.id && member.status === 'active').length;
              const logo = portal.brandAssets.find((asset) => asset.groupId === group.id && asset.kind === 'logo' && asset.rightsStatus !== 'link_only');
              return (
                <button key={group.id} type="button" onClick={() => selectGroup(group.id)} className={`group-tile ${groupId === group.id ? 'group-tile-active' : ''}`}>
                  <span className="text-[10px] text-[var(--ink-soft)]">{String(index + 1).padStart(2, '0')} · {group.baseLocation?.[lang]}</span>
                  {logo && <span className="mt-4 flex aspect-[4/3] items-center justify-center bg-white p-5"><img src={logo.imageUrl} alt="" className="h-full w-full object-contain" /></span>}
                  <strong className="mt-4 block text-xl tracking-tight">{group.name[lang]}</strong>
                  <span className="mt-2 block text-xs text-[var(--ink-soft)]">{count} members</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="editorial-panel p-5 sm:p-7">
        <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="section-kicker">03 · NOTICE / OFFICIAL BLOG</p><h2 className="section-title mt-2">{copy.notice}</h2></div>
          <select value={groupId} onChange={(event) => selectGroup(event.target.value)} className="border border-black/15 bg-white px-3 py-2 text-xs">
            <option value="all">{copy.all}</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name[lang]}</option>)}
          </select>
        </div>
        <p className="mt-4 text-xs leading-6 text-[var(--ink-soft)]">{copy.feedNote}</p>
        <div className="mt-4 divide-y divide-black/10">
          {visibleUpdates.length ? visibleUpdates.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="grid gap-2 py-4 transition-colors hover:text-[var(--g-brand)] sm:grid-cols-[7rem_1fr_auto] sm:items-center">
              <time className="text-[11px] text-[var(--ink-soft)]">{item.publishedAt.slice(0, 10)}</time>
              <span className="min-w-0 truncate text-sm font-medium">{item.title}</span>
              <span className="text-[11px] text-[var(--ink-soft)]">{item.memberName[lang]} ↗</span>
            </a>
          )) : <p className="py-8 text-sm text-[var(--ink-soft)]">{copy.noFeed}</p>}
        </div>
        {groupId !== 'all' && <Link href={`/g/${groupId}`} className="mt-5 inline-block border-b border-[var(--g-brand)] pb-1 text-xs font-semibold">{copy.open} →</Link>}
      </section>

      <EventBoard portal={portal} groups={groups} locale={locale} groupId={groupId === 'all' ? undefined : groupId} />

      <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <BirthdayPanel members={members} groups={groups} locale={locale} groupId={groupId === 'all' ? undefined : groupId} />
        <RankingPanel locale={locale} rankings={portal.rankings} />
      </div>
    </div>
  );
}
