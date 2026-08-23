'use client';

import React from 'react';
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

function MemberCard({ member, groupMap, lang, todayMd, staggerIndex }: {
  member: Member;
  groupMap: Map<string, Group>;
  lang: Locale;
  todayMd: string;
  staggerIndex: number;
}) {
  const group = groupMap.get(member.primaryGroupId);
  const name = lang === 'ko' ? member.name.ko.hangul : lang === 'en' ? member.name.en.romaji : member.name.ja.kanji;
  return (
    <div className="stagger-item" style={{ '--i': Math.min(staggerIndex, 12) } as React.CSSProperties}>
      <Link href={`/m/${member.id}`} className="flex min-w-0 items-center gap-3 border-t border-black/10 py-3 transition-colors hover:text-[var(--g-brand)]" data-today={member.birthDate?.slice(5) === todayMd ? 'true' : undefined}>
        <MemberAvatar glyph={member.avatar.glyph} hueShift={member.avatar.hueShift} imageUrl={member.imageUrl} groupLogoUrl={group?.logoUrl ?? null} name={name} size={42} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{name}</span>
          <span className="block truncate text-[11px] text-[var(--ink-soft)]">{member.birthDate?.slice(5).replace('-', '.')} · {group?.shortName[lang]}</span>
        </span>
      </Link>
    </div>
  );
}

export function BirthdayPanel({ members, groups, locale, groupId }: BirthdayPanelProps) {
  const t = useTranslations('birthday');
  const lang = (['ja', 'ko', 'en'].includes(locale) ? locale : 'ja') as Locale;
  const today = new Date();
  const month = today.getMonth() + 1;
  const todayMd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const allFiltered = members
    .filter((member) => !groupId || member.primaryGroupId === groupId)
    .filter((member) => Number(member.birthDate?.slice(5, 7)) === month);

  const todayMembers: Member[] = [];
  const upcomingMembers: Member[] = [];
  const pastMembers: Member[] = [];
  for (const m of allFiltered) {
    const md = (m.birthDate ?? '').slice(5);
    if (md === todayMd) todayMembers.push(m);
    else if (md > todayMd) upcomingMembers.push(m);
    else pastMembers.push(m);
  }
  upcomingMembers.sort((a, b) => (a.birthDate ?? '').slice(5).localeCompare((b.birthDate ?? '').slice(5)));
  pastMembers.sort((a, b) => (a.birthDate ?? '').slice(5).localeCompare((b.birthDate ?? '').slice(5)));

  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const total = allFiltered.length;

  return (
    <section className="editorial-panel p-5 sm:p-7">
      <p className="section-kicker">BIRTHDAY CALENDAR</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <h2 className="section-title">{t('title')}</h2>
        <span className="text-xs text-[var(--ink-soft)]">{month.toString().padStart(2, '0')} / {total}</span>
      </div>
      {total > 0 ? (
        <div className="mt-5">
          {todayMembers.length > 0 && (
            <div>
              <h3 className="birthday-section-label">{t('bucketToday')}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {todayMembers.map((member, i) => (
                  <MemberCard key={member.id} member={member} groupMap={groupMap} lang={lang} todayMd={todayMd} staggerIndex={i} />
                ))}
              </div>
            </div>
          )}
          {upcomingMembers.length > 0 && (
            <div className={todayMembers.length > 0 ? 'mt-6' : ''}>
              <h3 className="birthday-section-label">{t('bucketUpcoming')}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {upcomingMembers.map((member, i) => (
                  <MemberCard key={member.id} member={member} groupMap={groupMap} lang={lang} todayMd={todayMd} staggerIndex={todayMembers.length + i} />
                ))}
              </div>
            </div>
          )}
          {pastMembers.length > 0 && (
            <div className={(todayMembers.length > 0 || upcomingMembers.length > 0) ? 'mt-6' : ''}>
              <h3 className="birthday-section-label">{t('bucketPast')}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {pastMembers.map((member, i) => (
                  <MemberCard key={member.id} member={member} groupMap={groupMap} lang={lang} todayMd={todayMd} staggerIndex={todayMembers.length + upcomingMembers.length + i} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : <p className="mt-5 text-sm text-[var(--ink-soft)]">{t('empty')}</p>}
    </section>
  );
}
