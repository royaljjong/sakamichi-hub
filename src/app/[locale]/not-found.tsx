'use client';

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';

// This file catches notFound() calls from nested [locale] routes
// (e.g. /ja/m/[memberId], /ja/g/[groupId], /ja/g/[groupId]/gen/[genId]).
// It renders INSIDE [locale]/layout.tsx — no <html>/<body> wrapper.
// Being a client component lets us read the active locale via useLocale().

const copy = {
  ja: {
    kicker: 'Not Found',
    title: 'ページが見つかりません',
    body: 'お探しのページは存在しないか、削除された可能性があります。',
    backHome: 'ホームに戻る',
    backSearch: 'メンバー検索',
  },
  ko: {
    kicker: 'Not Found',
    title: '페이지를 찾을 수 없습니다',
    body: '요청하신 페이지가 존재하지 않거나 삭제되었을 수 있습니다.',
    backHome: '홈으로',
    backSearch: '멤버 검색',
  },
  en: {
    kicker: 'Not Found',
    title: 'Page not found',
    body: 'The page you are looking for does not exist or has been removed.',
    backHome: 'Back to home',
    backSearch: 'Search members',
  },
} as const;

export default function LocaleNotFound() {
  const locale = useLocale();
  const lang: 'ja' | 'ko' | 'en' =
    locale === 'ko' ? 'ko' : locale === 'en' ? 'en' : 'ja';
  const t = copy[lang];

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <p className="text-xs uppercase tracking-widest text-[color:var(--g-brand,#B27B4E)] font-semibold mb-2 font-[family-name:var(--font-zen-kaku)]">
          {t.kicker}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[color:var(--g-ink,#3A3630)] mb-3 font-[family-name:var(--font-klee-one)]">
          {t.title}
        </h1>
        <p className="text-sm text-[color:var(--ink-soft,#6b615a)] leading-relaxed mb-6">
          {t.body}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-[color:var(--g-brand,#B27B4E)] text-white text-sm font-semibold hover:opacity-90 transition"
          >
            {t.backHome}
          </Link>
          <Link
            href="/search"
            className="px-4 py-2 rounded-xl border border-[color:var(--g-ink,#3A3630)] text-sm font-semibold hover:bg-[color:var(--paper-deep,#f0eae0)] transition"
          >
            {t.backSearch}
          </Link>
        </div>
      </div>
    </div>
  );
}
