'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { Group, Member } from '@/lib/schema';
import type { PortalDataset } from '@/lib/portal-schema';
import { MemberAvatar } from '@/components/member/MemberAvatar';

type Locale = 'ja' | 'ko' | 'en';
type Family = 'sakamichi' | 'akb48g';

function Rail({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * Math.min(ref.current.clientWidth * 0.82, 720), behavior: 'smooth' });
  return <div><div className="mb-3 flex justify-end gap-2"><button type="button" onClick={() => move(-1)} aria-label={`${label} previous`} className="rail-button">←</button><button type="button" onClick={() => move(1)} aria-label={`${label} next`} className="rail-button">→</button></div><div ref={ref} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">{children}</div></div>;
}

export function HomePortal({ groups, members, locale, portal }: { groups: Group[]; members: Member[]; locale: string; portal: PortalDataset }) {
  const t = useTranslations('home');
  const tFranchise = useTranslations('franchise');
  const tMember = useTranslations('member');
  const lang = (['ja', 'ko', 'en'].includes(locale) ? locale : 'ja') as Locale;
  const [family, setFamily] = useState<Family>('sakamichi');
  const familyGroups = useMemo(() => groups.filter((group) => group.franchise === family), [groups, family]);
  const venues = new Map(portal.venues.map((venue) => [venue.id, venue]));
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const month = new Date().getMonth() + 1;
  const localized = (value: { ja: string; ko: string; en: string }) => value[lang] || value.ja;

  const committedGroup = family === 'sakamichi' ? 'nogizaka46' : 'akb48';
  const setPreview = (id: string) => document.documentElement.setAttribute('data-group', id);
  const clearPreview = () => document.documentElement.setAttribute('data-group', committedGroup);
  useEffect(() => { document.documentElement.setAttribute('data-group', committedGroup); }, [committedGroup]);

  const selectFamily = (next: Family) => { setFamily(next); };
  const eventsFor = (target: Family) => portal.events.filter((event) => event.groupIds.some((id) => groups.find((g) => g.id === id)?.franchise === target)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const birthdaysFor = (target: Family) => members.filter((member) => groups.find((g) => g.id === member.primaryGroupId)?.franchise === target && Number(member.birthDate?.slice(5, 7)) === month).sort((a, b) => (a.birthDate ?? '').slice(5).localeCompare((b.birthDate ?? '').slice(5)));

  return <div className="space-y-12 pb-8">
    <section className="border-b border-black/10 pb-10 pt-6"><p className="section-kicker">OFFICIAL IDOL DIRECTORY</p><h1 className="mt-5 max-w-5xl text-4xl font-semibold tracking-[-.045em] text-[var(--g-ink)] sm:text-6xl lg:text-7xl">{t('title')}</h1><p className="mt-5 text-sm text-[var(--ink-soft)] sm:text-base">{t('lead')}</p></section>

    <section>
      <div className="grid gap-4 sm:grid-cols-2">
        {(['sakamichi', 'akb48g'] as Family[]).map((item) => <button key={item} type="button" onClick={() => selectFamily(item)} onMouseEnter={() => setPreview(item === 'sakamichi' ? 'nogizaka46' : 'akb48')} onMouseLeave={clearPreview} className={`family-gate ${family === item ? 'family-gate-active' : ''}`}><span className="family-wordmark" aria-hidden="true"><b>{item === 'sakamichi' ? '坂道' : 'AKB48'}</b><em>{item === 'sakamichi' ? 'SERIES' : 'GROUP'}</em></span><strong>{item === 'sakamichi' ? tFranchise('sakamichiShort') : tFranchise('akb48gShort')}</strong><small>{groups.filter((g) => g.franchise === item).length} GROUPS</small></button>)}
      </div>
    </section>

    <section className="editorial-panel p-5 sm:p-7"><p className="section-kicker">01 · {t('groups')}</p><h2 className="section-title mt-2">{family === 'sakamichi' ? tFranchise('sakamichiShort') : tFranchise('akb48gShort')}</h2><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{familyGroups.map((group, i) => { const active = members.filter((m) => m.primaryGroupId === group.id && (m.status === 'active' || m.status === 'graduating')).length; return <div key={group.id} className="stagger-item" style={{ '--i': Math.min(i, 20) } as React.CSSProperties}><Link href={`/g/${group.id}`} onMouseEnter={() => setPreview(group.id)} onMouseLeave={clearPreview} className="group-tile"><span className="text-[10px] uppercase tracking-[.14em] text-[var(--ink-soft)]">{group.franchise === 'sakamichi' ? tFranchise('sakamichiShort') : tFranchise('akb48gShort')}</span><strong className="mt-5 block text-xl tracking-tight">{localized(group.name)}</strong><span className="mt-2 block text-xs text-[var(--ink-soft)]">{tMember('statusActive')} {active} · {t('memberCountLabel')} {members.filter((m) => m.primaryGroupId === group.id).length}</span></Link></div>; })}</div></section>

    {(['sakamichi', 'akb48g'] as Family[]).map((target) => { const events = eventsFor(target); return <section key={`events-${target}`} className="editorial-panel p-5 sm:p-7"><div className="flex items-end justify-between gap-4"><div><p className="section-kicker">{target === 'sakamichi' ? tFranchise('sakamichiShort') : tFranchise('akb48gShort')}</p><h2 className="section-title mt-2">{t('events')}</h2><p className="mt-2 text-[11px] text-[var(--ink-soft)]">{t('updated')} · {portal.generatedAt}</p></div><span className="count-pill">{events.length}</span></div>{events.length ? <Rail label={`${target} events`}>{events.map((event, i) => { const group = groupMap.get(event.groupIds[0] ?? ''); const venue = event.venueId ? venues.get(event.venueId) : undefined; return <div key={event.id} className="stagger-item" style={{ '--i': Math.min(i, 12) } as React.CSSProperties}><a href={event.ticketUrl ?? event.officialUrl} target="_blank" rel="noopener noreferrer" className="event-poster-card group" onMouseEnter={() => group && setPreview(group.id)} onMouseLeave={clearPreview}><div className="event-poster-media">{event.posterUrl ? <img src={event.posterUrl} alt="" className="h-full w-full object-cover" /> : <div className="event-poster-placeholder" style={{ '--event-color': group?.palette.brand } as React.CSSProperties}><span>{group ? localized(group.shortName) : ''}</span><b>LIVE</b></div>}</div><div className="p-4"><time className="text-[11px] text-[var(--ink-soft)]">{new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', weekday: 'short' }).format(new Date(event.startsAt))}</time><h3 className="mt-2 line-clamp-2 text-sm font-semibold">{localized(event.title)}</h3><p className="mt-2 truncate text-[11px] text-[var(--ink-soft)]">{venue ? localized(venue.name) : localized(group?.baseLocation ?? { ja: 'オンライン', ko: '온라인', en: 'Online' })} ↗</p></div></a></div>; })}</Rail> : <p className="mt-6 border-t border-black/10 py-8 text-sm text-[var(--ink-soft)]">{t('emptyEvent')}</p>}</section>; })}

    <section className="space-y-6">{(['sakamichi', 'akb48g'] as Family[]).map((target) => { const birthdays = birthdaysFor(target); return <div key={`birthday-${target}`} className="editorial-panel p-5 sm:p-7"><p className="section-kicker">{target === 'sakamichi' ? tFranchise('sakamichiShort') : tFranchise('akb48gShort')}</p><h2 className="section-title mt-2">{t('birthdays')}</h2>{birthdays.length ? <Rail label={`${target} birthdays`}>{birthdays.map((member, i) => { const group = groupMap.get(member.primaryGroupId); const name = lang === 'ko' ? member.name.ko.hangul : lang === 'en' ? member.name.en.romaji : member.name.ja.kanji; return <div key={member.id} className="stagger-item" style={{ '--i': Math.min(i, 12) } as React.CSSProperties}><Link href={`/m/${member.id}`} className="birthday-slide"><MemberAvatar glyph={member.avatar.glyph} hueShift={member.avatar.hueShift} imageUrl={member.imageUrl} name={name} size={72} /><span className="mt-3 block font-semibold">{name}</span><span className="mt-1 block text-[11px] text-[var(--ink-soft)]">{member.birthDate?.slice(5).replace('-', '.')} · {group?.shortName[lang]}</span></Link></div>; })}</Rail> : <p className="mt-5 text-sm text-[var(--ink-soft)]">{t('emptyBirthday')}</p>}</div>; })}</section>
  </div>;
}
