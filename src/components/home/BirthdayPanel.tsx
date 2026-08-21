'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { Group, Member } from '@/lib/schema';
import { MemberAvatar } from '@/components/member/MemberAvatar';

type Locale = 'ja' | 'ko' | 'en';

interface BirthdayPanelProps {
  members: Member[];
  groups: Group[];
  locale: string;
  groupId?: string;
}

export function BirthdayPanel({ members, groups, locale, groupId }: BirthdayPanelProps) {
  const t = useTranslations('birthday');
  const lang = (['ja', 'ko', 'en'].includes(locale) ? locale : 'ja') as Locale;
  const today = new Date();
  const month = today.getMonth() + 1;
  const todayMd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const filtered = members
    .filter((member) => !groupId || member.primaryGroupId === groupId)
    .filter((member) => Number(member.birthDate?.slice(5, 7)) === month)
    .sort((a, b) => {
      const aMd = (a.birthDate ?? '').slice(5);
      const bMd = (b.birthDate ?? '').slice(5);
      const aBucket = aMd === todayMd ? 0 : aMd > todayMd ? 1 : 2;
      const bBucket = bMd === todayMd ? 0 : bMd > todayMd ? 1 : 2;
      if (aBucket !== bBucket) return aBucket - bBucket;
      return aMd.localeCompare(bMd);
    });
  const groupMap = new Map(groups.map((group) => [group.id, group]));

  return (
    <section className="editorial-panel p-5 sm:p-7">
      <p className="section-kicker">BIRTHDAY CALENDAR</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <h2 className="section-title">{t('title')}</h2>
        <span className="text-xs text-[var(--ink-soft)]">{month.toString().padStart(2, '0')} / {filtered.length}</span>
      </div>
      {filtered.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((member, i) => {
            const group = groupMap.get(member.primaryGroupId);
            const name = lang === 'ko' ? member.name.ko.hangul : lang === 'en' ? member.name.en.romaji : member.name.ja.kanji;
            return (
              <div key={member.id} className="stagger-item" style={{ '--i': Math.min(i, 12) } as React.CSSProperties}>
              <Link href={`/m/${member.id}`} className="flex min-w-0 items-center gap-3 border-t border-black/10 py-3 transition-colors hover:text-[var(--g-brand)]" data-today={member.birthDate?.slice(5) === todayMd ? 'true' : undefined}>
                <MemberAvatar glyph={member.avatar.glyph} hueShift={member.avatar.hueShift} imageUrl={member.imageUrl} name={name} size={42} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{name}</span>
                  <span className="block truncate text-[11px] text-[var(--ink-soft)]">{member.birthDate?.slice(5).replace('-', '.')} · {group?.shortName[lang]}</span>
                </span>
              </Link>
              </div>
            );
          })}
        </div>
      ) : <p className="mt-5 text-sm text-[var(--ink-soft)]">{t('empty')}</p>}
    </section>
  );
}
