import type { Single } from '@/lib/discography-schema';
import type { Group } from '@/lib/schema';

type Locale = 'ja' | 'ko' | 'en';

const COPY = {
  ja: {
    kicker: 'DISCOGRAPHY',
    title: 'シングル',
    empty: 'シングル情報がまだありません',
    single: 'シングル',
    viewOnWikipedia: 'Wikipediaで見る',
  },
  ko: {
    kicker: 'DISCOGRAPHY',
    title: '싱글',
    empty: '아직 싱글 정보가 없습니다',
    single: '싱글',
    viewOnWikipedia: 'Wikipedia에서 보기',
  },
  en: {
    kicker: 'DISCOGRAPHY',
    title: 'Singles',
    empty: 'No discography data yet',
    single: 'Single',
    viewOnWikipedia: 'View on Wikipedia',
  },
};

interface GroupDiscographyProps {
  singles: Single[];
  group: Group;
  locale: string;
}

export function GroupDiscography({ singles, group, locale }: GroupDiscographyProps) {
  const lang = (['ja', 'ko', 'en'].includes(locale) ? locale : 'ja') as Locale;
  const c = COPY[lang];

  return (
    <section className="editorial-panel p-5 sm:p-7 mb-8">
      <p className="section-kicker">{c.kicker}</p>
      <h2 className="section-title mt-2">{c.title}</h2>

      {singles.length === 0 ? (
        <p className="mt-5 text-sm text-[var(--ink-soft)]">{c.empty}</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {singles.map((single) => {
            const titleDisplay =
              (lang !== 'ja' && single.title[lang]) ? single.title[lang]! : single.title.ja;

            const card = (
              <div className="single-card group">
                {/* Cover area */}
                <div
                  className="single-card__cover"
                  style={{ backgroundColor: group.palette.wash }}
                >
                  {single.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={single.coverUrl}
                      alt={single.title.ja}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: group.palette.brand }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-8 h-8 opacity-40"
                        aria-hidden="true"
                      >
                        <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.571V21.75a.75.75 0 0 1-.75.75H7.75a.75.75 0 0 1-.75-.75V5.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 .75.75v.005l.452-.13A.75.75 0 0 1 19.952 1.651Z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="single-card__info">
                  <span className="single-card__number" style={{ color: group.palette.brand }}>
                    #{single.number}
                  </span>
                  <p className="single-card__title">{titleDisplay}</p>
                  <time className="single-card__date">{single.releaseDate}</time>
                </div>

                {/* Wikipedia hover indicator */}
                {single.wikipediaUrl && (
                  <span className="single-card__wiki-hint">
                    {c.viewOnWikipedia} ↗
                  </span>
                )}
              </div>
            );

            if (single.wikipediaUrl) {
              return (
                <a
                  key={single.id}
                  href={single.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${single.title.ja} — ${c.viewOnWikipedia}`}
                  className="block"
                >
                  {card}
                </a>
              );
            }

            return <div key={single.id}>{card}</div>;
          })}
        </div>
      )}
    </section>
  );
}
