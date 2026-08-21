import { useTranslations } from 'next-intl';
import type { RankingSnapshot } from '@/lib/portal-schema';

export function RankingPanel({ locale, rankings = [] }: { locale: string; rankings?: RankingSnapshot[] }) {
  const t = useTranslations('ranking');
  const tabs = [t('tabPopularity'), t('tabFollowers'), t('tabTrend')];
  const verified = rankings.filter((item) => item.metric === 'x_followers' || item.metric === 'instagram_followers' || item.metric === 'google_trends_index');
  return (
    <section className="editorial-panel p-5 sm:p-7">
      <p className="section-kicker">RANKING · TOP 10</p>
      <h2 className="section-title mt-2">{t('title')}</h2>
      <div className="mt-5 flex gap-5 border-b border-black/10 text-xs font-semibold text-[var(--ink-soft)]">
        {tabs.map((tab, index) => <span key={tab} className={index === 0 ? 'border-b-2 border-[var(--g-brand)] pb-3 text-[var(--ink)]' : 'pb-3'}>{tab}</span>)}
      </div>
      {verified.length === 0 ? <div className="flex min-h-40 flex-col justify-center border-b border-black/10 py-8">
          <span className="text-sm font-semibold">{t('pending')}</span>
          <p className="mt-2 max-w-md text-xs leading-6 text-[var(--ink-soft)]">{t('detail')}</p>
        </div> : <ol className="divide-y divide-black/10">{verified.slice(0, 10).map((item, index) => <li key={item.id} className="grid grid-cols-[2rem_1fr_auto] gap-3 py-3 text-sm"><span>{index + 1}</span><span>{item.subjectId}</span><span>{item.value.toLocaleString()} · {item.collectedOn}</span></li>)}</ol>}
    </section>
  );
}
