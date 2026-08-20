import type { RankingSnapshot } from '@/lib/portal-schema';

type Locale = 'ja' | 'ko' | 'en';

const COPY = {
  ja: { eyebrow: 'RANKING · TOP 10', title: 'ランキング', tabs: ['人気', 'フォロワー', '検索トレンド'], pending: '公式データソースの検証中', detail: '推定値や合成スコアは表示しません。出典と集計日を確認できるデータだけを公開します。' },
  ko: { eyebrow: 'RANKING · TOP 10', title: '아이돌 랭킹', tabs: ['인기', '팔로워', '검색 이슈'], pending: '공식 데이터 소스 검증 중', detail: '추정값이나 합성 점수는 표시하지 않습니다. 출처와 집계일이 확인된 데이터만 공개합니다.' },
  en: { eyebrow: 'RANKING · TOP 10', title: 'Idol rankings', tabs: ['Popularity', 'Followers', 'Search trend'], pending: 'Verifying official data sources', detail: 'No estimates or opaque composite scores. Only sourced metrics with a collection date will be published.' },
};

export function RankingPanel({ locale, rankings = [] }: { locale: string; rankings?: RankingSnapshot[] }) {
  const lang = (['ja', 'ko', 'en'].includes(locale) ? locale : 'ja') as Locale;
  const copy = COPY[lang];
  const verified = rankings.filter((item) => item.metric === 'x_followers' || item.metric === 'instagram_followers' || item.metric === 'google_trends_index');
  return (
    <section className="editorial-panel p-5 sm:p-7">
      <p className="section-kicker">{copy.eyebrow}</p>
      <h2 className="section-title mt-2">{copy.title}</h2>
      <div className="mt-5 flex gap-5 border-b border-black/10 text-xs font-semibold text-[var(--ink-soft)]">
        {copy.tabs.map((tab, index) => <span key={tab} className={index === 0 ? 'border-b-2 border-[var(--g-brand)] pb-3 text-[var(--ink)]' : 'pb-3'}>{tab}</span>)}
      </div>
      {verified.length === 0 ? <div className="flex min-h-40 flex-col justify-center border-b border-black/10 py-8">
          <span className="text-sm font-semibold">{copy.pending}</span>
          <p className="mt-2 max-w-md text-xs leading-6 text-[var(--ink-soft)]">{copy.detail}</p>
        </div> : <ol className="divide-y divide-black/10">{verified.slice(0, 10).map((item, index) => <li key={item.id} className="grid grid-cols-[2rem_1fr_auto] gap-3 py-3 text-sm"><span>{index + 1}</span><span>{item.subjectId}</span><span>{item.value.toLocaleString()} · {item.collectedOn}</span></li>)}</ol>}
    </section>
  );
}
