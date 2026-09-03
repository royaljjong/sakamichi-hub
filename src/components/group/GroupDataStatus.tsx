import { useTranslations } from 'next-intl';
import { renderableLinks, type Group, type Member } from '@/lib/schema';
import type { PortalDataset } from '@/lib/portal-schema';

interface Props {
  group: Group;
  members: Member[];
  portal: PortalDataset;
  singlesCount: number;
}

export function GroupDataStatus({ group, members, portal, singlesCount }: Props) {
  const t = useTranslations('coverage');
  const total = members.length;
  const withImages = members.filter((member) => member.imageUrl).length;
  const withLinks = members.filter((member) => renderableLinks(member.links).some((link) => link.status !== 'dead')).length;
  const eventCount = portal.events.filter((event) => event.groupIds.includes(group.id)).length;
  const isCollecting = group.rosterScope === 'representative';
  const isComplete = group.rosterScope === 'complete' && total > 0 && withLinks === total;
  const status = isCollecting ? 'collecting' : isComplete ? 'complete' : 'partial';
  const percent = (value: number) => total ? Math.round((value / total) * 100) : 0;

  const facts = [
    { label: t('members'), value: String(total) },
    { label: t('officialLinks'), value: `${withLinks}/${total} · ${percent(withLinks)}%` },
    { label: t('photos'), value: `${withImages}/${total} · ${percent(withImages)}%` },
    { label: t('events'), value: String(eventCount) },
    { label: t('discography'), value: String(singlesCount) },
  ];

  return (
    <aside className="trust-panel mb-8" aria-label={t('heading')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-kicker">DATA TRUST</p>
          <h2 className="mt-1 text-base font-bold text-[var(--g-ink)]">{t('heading')}</h2>
        </div>
        <span className={`coverage-status coverage-status-${status}`}>{t(status)}</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {facts.map((fact) => (
          <div key={fact.label} className="coverage-fact">
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs leading-5 text-[var(--ink-soft)]">
        {isCollecting ? t('representativeNotice') : t('scopeNotice')}
        <span className="ml-2">· {t('checkedAt')}: {group.provenance.checkedAt}</span>
      </p>
    </aside>
  );
}
