'use client';

import { useMemo, useRef, useState } from 'react';
import { Link } from '@/i18n/routing';
import type { Group, Member } from '@/lib/schema';
import type { PortalDataset } from '@/lib/portal-schema';
import { MemberAvatar } from '@/components/member/MemberAvatar';

type Locale = 'ja' | 'ko' | 'en';
type Family = 'sakamichi' | 'akb48g';

const COPY = {
  ja: { title: '坂道シリーズと48グループ', lead: 'グループから、メンバーと公式SNSへ。', saka: '坂道シリーズ', akb: 'AKB48グループ', groups: 'グループを選ぶ', events: '公演・イベント', birthdays: '今月の誕生日', emptyEvent: '確認済みの今後のイベントはありません', emptyBirthday: '今月の誕生日メンバーはいません', member: 'メンバー', active: '現役' },
  ko: { title: '사카미치와 AKB48 그룹', lead: '그룹에서 멤버, 그리고 공식 SNS까지.', saka: '사카미치', akb: 'AKB48 그룹', groups: '그룹 선택', events: '공연·이벤트', birthdays: '이달의 생일자', emptyEvent: '검증된 예정 이벤트가 없습니다', emptyBirthday: '이번 달 생일자가 없습니다', member: '멤버', active: '현재' },
  en: { title: 'Sakamichi & AKB48 Group', lead: 'From group to member to official social links.', saka: 'Sakamichi Series', akb: 'AKB48 Group', groups: 'Choose a group', events: 'Live & events', birthdays: 'Birthdays this month', emptyEvent: 'No verified upcoming events', emptyBirthday: 'No birthdays this month', member: 'Members', active: 'Active' },
};

function Rail({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * Math.min(ref.current.clientWidth * 0.82, 720), behavior: 'smooth' });
  return <div><div className="mb-3 flex justify-end gap-2"><button type="button" onClick={() => move(-1)} aria-label={`${label} previous`} className="rail-button">←</button><button type="button" onClick={() => move(1)} aria-label={`${label} next`} className="rail-button">→</button></div><div ref={ref} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">{children}</div></div>;
}

export function HomePortal({ groups, members, locale, portal }: { groups: Group[]; members: Member[]; updates: unknown[]; locale: string; portal: PortalDataset }) {
  const lang = (['ja', 'ko', 'en'].includes(locale) ? locale : 'ja') as Locale;
  const copy = COPY[lang];
  const [family, setFamily] = useState<Family>('sakamichi');
  const familyGroups = useMemo(() => groups.filter((group) => group.franchise === family), [groups, family]);
  const venues = new Map(portal.venues.map((venue) => [venue.id, venue]));
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const month = new Date().getMonth() + 1;

  const selectFamily = (next: Family) => { setFamily(next); document.documentElement.setAttribute('data-group', next === 'sakamichi' ? 'nogizaka46' : 'akb48'); };
  const eventsFor = (target: Family) => portal.events.filter((event) => event.groupIds.some((id) => groups.find((g) => g.id === id)?.franchise === target)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const birthdaysFor = (target: Family) => members.filter((member) => groups.find((g) => g.id === member.primaryGroupId)?.franchise === target && Number(member.birthDate?.slice(5, 7)) === month).sort((a, b) => (a.birthDate ?? '').slice(5).localeCompare((b.birthDate ?? '').slice(5)));

  return <div className="space-y-12 pb-8">
    <section className="border-b border-black/10 pb-10 pt-6"><p className="section-kicker">OFFICIAL IDOL DIRECTORY</p><h1 className="mt-5 max-w-5xl text-4xl font-semibold tracking-[-.045em] text-[var(--g-ink)] sm:text-6xl lg:text-7xl">{copy.title}</h1><p className="mt-5 text-sm text-[var(--ink-soft)] sm:text-base">{copy.lead}</p></section>

    <section>
      <div className="grid gap-4 sm:grid-cols-2">
        {(['sakamichi', 'akb48g'] as Family[]).map((item) => <button key={item} type="button" onClick={() => selectFamily(item)} className={`family-gate ${family === item ? 'family-gate-active' : ''}`}><span>0{item === 'sakamichi' ? '1' : '2'}</span><strong>{item === 'sakamichi' ? copy.saka : copy.akb}</strong><small>{groups.filter((g) => g.franchise === item).length} GROUPS</small></button>)}
      </div>
    </section>

    <section className="editorial-panel p-5 sm:p-7"><p className="section-kicker">01 · {copy.groups}</p><h2 className="section-title mt-2">{family === 'sakamichi' ? copy.saka : copy.akb}</h2><div className="mt-6 grid gap-px overflow-hidden border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">{familyGroups.map((group) => { const active = members.filter((m) => m.primaryGroupId === group.id && (m.status === 'active' || m.status === 'graduating')).length; return <Link key={group.id} href={`/g/${group.id}`} onMouseEnter={() => document.documentElement.setAttribute('data-group', group.id)} className="group-tile min-h-44"><span className="text-[10px] uppercase tracking-[.14em] text-[var(--ink-soft)]">{group.franchise === 'sakamichi' ? copy.saka : copy.akb}</span><strong className="mt-8 block text-2xl tracking-tight">{group.name[lang]}</strong><span className="mt-3 block text-xs text-[var(--ink-soft)]">{copy.active} {active} · {copy.member} {members.filter((m) => m.primaryGroupId === group.id).length}</span></Link>; })}</div></section>

    {(['sakamichi', 'akb48g'] as Family[]).map((target) => { const events = eventsFor(target); return <section key={`events-${target}`} className="editorial-panel p-5 sm:p-7"><div className="flex items-end justify-between"><div><p className="section-kicker">{target === 'sakamichi' ? copy.saka : copy.akb}</p><h2 className="section-title mt-2">{copy.events}</h2></div><span className="text-xs text-[var(--ink-soft)]">{events.length}</span></div>{events.length ? <Rail label={`${target} events`}>{events.map((event) => { const group = groupMap.get(event.groupIds[0] ?? ''); const venue = event.venueId ? venues.get(event.venueId) : undefined; return <a key={event.id} href={event.ticketUrl ?? event.officialUrl} target="_blank" rel="noopener noreferrer" className="event-poster-card group"><div className="event-poster-media">{event.posterUrl ? <img src={event.posterUrl} alt="" className="h-full w-full object-cover" /> : <div className="event-poster-placeholder" style={{ '--event-color': group?.palette.brand } as React.CSSProperties}><span>{group?.shortName[lang]}</span><b>LIVE</b></div>}</div><div className="p-4"><time className="text-[11px] text-[var(--ink-soft)]">{event.startsAt.slice(0, 10)}</time><h3 className="mt-2 line-clamp-2 text-sm font-semibold">{event.title[lang]}</h3><p className="mt-2 truncate text-[11px] text-[var(--ink-soft)]">{venue?.name[lang]} ↗</p></div></a>; })}</Rail> : <p className="mt-6 border-t border-black/10 py-8 text-sm text-[var(--ink-soft)]">{copy.emptyEvent}</p>}</section>; })}

    <section className="space-y-6">{(['sakamichi', 'akb48g'] as Family[]).map((target) => { const birthdays = birthdaysFor(target); return <div key={`birthday-${target}`} className="editorial-panel p-5 sm:p-7"><p className="section-kicker">{target === 'sakamichi' ? copy.saka : copy.akb}</p><h2 className="section-title mt-2">{copy.birthdays}</h2>{birthdays.length ? <Rail label={`${target} birthdays`}>{birthdays.map((member) => { const group = groupMap.get(member.primaryGroupId); const name = lang === 'ko' ? member.name.ko.hangul : lang === 'en' ? member.name.en.romaji : member.name.ja.kanji; return <Link key={member.id} href={`/m/${member.id}`} className="birthday-slide"><MemberAvatar glyph={member.avatar.glyph} hueShift={member.avatar.hueShift} imageUrl={member.imageUrl} name={name} size={72} /><span className="mt-3 block font-semibold">{name}</span><span className="mt-1 block text-[11px] text-[var(--ink-soft)]">{member.birthDate?.slice(5).replace('-', '.')} · {group?.shortName[lang]}</span></Link>; })}</Rail> : <p className="mt-5 text-sm text-[var(--ink-soft)]">{copy.emptyBirthday}</p>}</div>; })}</section>
  </div>;
}
