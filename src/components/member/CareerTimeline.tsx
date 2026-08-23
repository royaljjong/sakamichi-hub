import React from 'react';
import { getTranslations } from 'next-intl/server';
import type { Member, Group, LineageEntry } from '@/lib/schema';

interface Props {
  member: Member;
  groups: Group[];
  locale: string;
}

interface TimelineEvent {
  date: string;
  kind: 'join' | 'leave';
  groupId: string;
  lineageEntry: LineageEntry;
  generationId: string;
  isConcurrent: boolean;
  endReason?: 'graduation' | 'withdrawal' | 'transfer' | 'rename' | 'unknown' | null;
}

/** Return the lineage entry whose name was active on the given date. */
function resolveLineage(group: Group, date: string): LineageEntry {
  // Find the lineage period that contains the date
  for (const entry of group.lineage) {
    const after = date >= entry.from;
    const before = entry.to === null || date <= entry.to;
    if (after && before) return entry;
  }
  // Fallback: return the last lineage entry (schema guarantees lineage.length >= 1)
  return group.lineage[group.lineage.length - 1]!;
}

export async function CareerTimeline({ member, groups, locale }: Props) {
  const t = await getTranslations('timeline');
  const tMember = await getTranslations('member');

  const { memberships } = member;

  // Skip section if only one membership with no departure (freshly joined / no history to show)
  if (memberships.length <= 1 && !memberships[0]?.leftOn) {
    return null;
  }

  // Build events
  const events: TimelineEvent[] = [];

  for (const ms of memberships) {
    const group = groups.find((g) => g.id === ms.groupId);
    if (!group) continue;

    if (ms.joinedOn) {
      events.push({
        date: ms.joinedOn,
        kind: 'join',
        groupId: ms.groupId,
        lineageEntry: resolveLineage(group, ms.joinedOn),
        generationId: ms.generationId,
        isConcurrent: ms.isConcurrent,
      });
    }

    if (ms.leftOn) {
      events.push({
        date: ms.leftOn,
        kind: 'leave',
        groupId: ms.groupId,
        lineageEntry: resolveLineage(group, ms.leftOn),
        generationId: ms.generationId,
        isConcurrent: ms.isConcurrent,
        endReason: ms.endReason,
      });
    }
  }

  // Sort chronologically
  events.sort((a, b) => a.date.localeCompare(b.date));

  if (events.length === 0) return null;

  // Generation label lookup helper
  function genLabel(generationId: string, groupId: string): string {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return generationId;
    const gen = group.generations.find((g) => g.id === generationId);
    if (!gen) return generationId;
    const l = locale as 'ja' | 'ko' | 'en';
    return gen.label[l] ?? gen.label.ja;
  }

  // Event label
  function eventLabel(ev: TimelineEvent): string {
    if (ev.kind === 'join') return t('eventJoined');
    switch (ev.endReason) {
      case 'graduation': return t('eventGraduated');
      case 'withdrawal': return t('eventWithdrew');
      case 'transfer':   return t('eventTransferred');
      default:           return t('eventGraduated');
    }
  }

  // Current status label
  function currentStatusLabel(): string {
    const now = t('currentStatus');
    if (member.status === 'graduated') return `${now} · ${tMember('statusGraduated')}`;
    if (member.status === 'withdrawn') return `${now} · ${tMember('statusWithdrawn')}`;
    if (member.status === 'transferred') return `${now} · ${tMember('statusTransferred')}`;
    if (member.status === 'graduating') return `${now} · ${tMember('statusGraduating')}`;
    return `${now} · ${tMember('statusActive')}`;
  }

  const loc = locale as 'ja' | 'ko' | 'en';

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="pb-3 mb-6 border-b border-[color-mix(in_oklab,var(--g-ink)_10%,transparent)]">
        <p className="section-kicker mb-1">{t('sectionKicker')}</p>
        <h2 className="text-lg sm:text-xl font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)]">
          {t('sectionTitle')}
        </h2>
      </div>

      {/* Timeline card */}
      <div className="editorial-panel p-5 sm:p-7">
        <ol className="relative">
          {/* Vertical rail line */}
          <div
            aria-hidden="true"
            className="absolute left-[7px] top-2 bottom-2 w-px bg-[color-mix(in_oklab,var(--g-brand)_25%,transparent)]"
          />

          {events.map((ev, i) => (
            <li key={`${ev.date}-${ev.kind}-${ev.groupId}`} className="relative flex gap-4 pb-6 last:pb-2">
              {/* Dot */}
              <div className="relative z-10 mt-0.5 flex-shrink-0">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 ${
                    ev.kind === 'join'
                      ? 'bg-[var(--g-brand)] border-[var(--g-brand)]'
                      : 'bg-[var(--white-veil)] border-[var(--g-brand)]'
                  }`}
                  style={{ boxShadow: `0 0 0 3px color-mix(in oklab, var(--g-brand) 12%, transparent)` }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                {/* Date */}
                <time
                  dateTime={ev.date}
                  className="block text-[10px] font-mono tracking-widest text-[var(--ink-soft)] mb-1.5"
                >
                  {ev.date}
                </time>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Group name badge */}
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide text-white"
                    style={{ backgroundColor: ev.lineageEntry.color }}
                  >
                    {ev.lineageEntry.name[loc]}
                  </span>

                  {/* Generation */}
                  <span className="text-xs text-[var(--ink-soft)] font-[family-name:var(--font-zen-kaku)]">
                    {genLabel(ev.generationId, ev.groupId)}
                  </span>

                  {/* Concurrent chip */}
                  {ev.isConcurrent && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide bg-[color-mix(in_oklab,var(--g-brand)_12%,white)] text-[var(--g-ink)] border border-[color-mix(in_oklab,var(--g-brand)_30%,transparent)]">
                      {t('chipConcurrent')}
                    </span>
                  )}
                </div>

                {/* Event label */}
                <p className="mt-1 text-sm font-semibold text-[var(--g-ink)]">
                  {eventLabel(ev)}
                </p>
              </div>
            </li>
          ))}

          {/* Current status footer */}
          <li className="relative flex gap-4 pt-2">
            <div className="relative z-10 mt-0.5 flex-shrink-0">
              <div
                className="w-3.5 h-3.5 rounded-full bg-[var(--paper-deep)] border-2 border-[color-mix(in_oklab,var(--g-ink)_25%,transparent)]"
              />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs text-[var(--ink-soft)] font-[family-name:var(--font-zen-kaku)]">
                {currentStatusLabel()}
              </p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
