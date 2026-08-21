import { useTranslations } from 'next-intl';
import type { PortalDataset } from '@/lib/portal-schema';
import type { Group } from '@/lib/schema';

type Locale = 'ja' | 'ko' | 'en';

interface EventBoardProps {
  portal: PortalDataset;
  groups: Group[];
  locale: string;
  groupId?: string;
}

export function EventBoard({ portal, groups, locale, groupId }: EventBoardProps) {
  const t = useTranslations('event');
  const lang = (['ja', 'ko', 'en'].includes(locale) ? locale : 'ja') as Locale;
  const venues = new Map(portal.venues.map((venue) => [venue.id, venue]));
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const events = portal.events
    .filter((event) => !groupId || event.groupIds.includes(groupId))
    .filter((event) => new Date(event.startsAt).getTime() >= today.getTime())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <section className="editorial-panel overflow-hidden p-5 sm:p-7">
      <div className="flex items-end justify-between gap-4 border-b border-black/10 pb-5">
        <div><p className="section-kicker">04 · LIVE & THEATER</p><h2 className="section-title mt-2">{t('title')}</h2></div>
        <span className="text-xs text-[var(--ink-soft)]">{events.length.toString().padStart(2, '0')}</span>
      </div>
      <div className="divide-y divide-black/10">
        {events.length ? events.map((event, i) => {
          const venue = event.venueId ? venues.get(event.venueId) : undefined;
          const group = groupMap.get(event.groupIds[0] ?? '');
          const date = new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : lang === 'en' ? 'en-US' : 'ja-JP', { month: 'short', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }).format(new Date(event.startsAt));
          return (
            <div key={event.id} className="stagger-item" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
            <article className="grid gap-4 py-5 md:grid-cols-[8rem_1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-semibold text-[var(--g-brand)]">{date}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--ink-soft)]">{event.kind === 'theater' ? t('theater') : t('concert')}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[var(--ink-soft)]">{group?.name[lang]}</p>
                <h3 className="mt-1 text-base font-semibold tracking-tight">{event.title[lang]}</h3>
                <p className="mt-2 text-xs text-[var(--ink-soft)]">{venue?.name[lang]} · {event.price?.[lang] ?? t('price')}</p>
              </div>
              <div className="flex gap-2 text-xs font-semibold">
                {venue && <a href={venue.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="border border-black/15 px-3 py-2 hover:border-[var(--g-brand)]">{t('map')} ↗</a>}
                <a href={event.ticketUrl ?? event.officialUrl} target="_blank" rel="noopener noreferrer" className="bg-[var(--g-ink)] px-3 py-2 text-white hover:bg-[var(--g-brand)]">{t('ticket')} ↗</a>
              </div>
            </article>
            </div>
          );
        }) : <p className="py-8 text-sm text-[var(--ink-soft)]">{t('empty')}</p>}
      </div>
    </section>
  );
}
