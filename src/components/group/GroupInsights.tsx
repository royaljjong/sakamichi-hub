import type { Group, Member } from '@/lib/schema';
import type { RecentUpdate } from '@/lib/updates-schema';
import { BirthdayPanel } from '@/components/home/BirthdayPanel';
import { RankingPanel } from '@/components/home/RankingPanel';
import { EventBoard } from '@/components/home/EventBoard';
import type { PortalDataset } from '@/lib/portal-schema';

type Locale = 'ja' | 'ko' | 'en';

const COPY = {
  ja: { latest: '最新のお知らせ', note: '公式ブログ更新', empty: '更新情報がありません。' },
  ko: { latest: '그룹 최신 공지', note: '공식 블로그 갱신', empty: '업데이트가 없습니다.' },
  en: { latest: 'Latest group notices', note: 'Official blog updates', empty: 'No updates available.' },
};

interface GroupInsightsProps {
  group: Group;
  members: Member[];
  updates: RecentUpdate[];
  locale: string;
  portal: PortalDataset;
}

export function GroupInsights({ group, members, updates, locale, portal }: GroupInsightsProps) {
  const lang = (['ja', 'ko', 'en'].includes(locale) ? locale : 'ja') as Locale;
  const groupUpdates = updates.filter((item) => item.groupId === group.id).slice(0, 20);

  return (
    <div className="mb-12 space-y-6">
      <EventBoard portal={portal} groups={[group]} locale={locale} groupId={group.id} />
      <section className="editorial-panel p-5 sm:p-7">
        <p className="section-kicker">NOTICE · {COPY[lang].note}</p>
        <h2 className="section-title mt-2">{COPY[lang].latest}</h2>
        <div className="mt-5 divide-y divide-black/10 border-t border-black/10">
          {groupUpdates.length ? groupUpdates.map((item) => {
            const isGroupAccount = !item.memberId;
            return (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="grid gap-2 py-4 hover:text-[var(--g-brand)] sm:grid-cols-[7rem_1fr_auto]">
                <time className="text-[11px] text-[var(--ink-soft)]">{item.publishedAt.slice(0, 10)}</time>
                <span className="truncate text-sm font-medium">{item.title}</span>
                {isGroupAccount ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--g-brand)_12%,white)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--g-brand)] w-fit">
                    Official ↗
                  </span>
                ) : (
                  <span className="text-[11px] text-[var(--ink-soft)]">{item.memberName[lang]} ↗</span>
                )}
              </a>
            );
          }) : <p className="py-6 text-sm text-[var(--ink-soft)]">{COPY[lang].empty}</p>}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <BirthdayPanel members={members} groups={[group]} locale={locale} groupId={group.id} />
        <RankingPanel locale={locale} />
      </div>
    </div>
  );
}
