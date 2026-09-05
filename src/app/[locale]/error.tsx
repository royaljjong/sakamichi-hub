'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[locale] error boundary:', error);
  }, [error]);

  // Hardcoded 3-language copy (no next-intl available in error boundary per Next docs).
  // Detect locale from window.location.pathname first segment.
  const locale = typeof window !== 'undefined'
    ? (window.location.pathname.split('/')[1] || 'ja')
    : 'ja';
  const lang: 'ja' | 'ko' | 'en' =
    locale === 'ko' ? 'ko' : locale === 'en' ? 'en' : 'ja';

  const copy = {
    ja: {
      title: '一時的な問題が発生しました',
      body: 'ページの表示中に予期しないエラーが起きました。しばらくしてから再度お試しください。',
      retry: 'もう一度試す',
      home: 'ホームに戻る',
    },
    ko: {
      title: '일시적인 문제가 발생했습니다',
      body: '페이지를 표시하는 중 예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      retry: '다시 시도',
      home: '홈으로',
    },
    en: {
      title: 'A temporary issue occurred',
      body: 'An unexpected error happened while loading this page. Please try again in a moment.',
      retry: 'Try again',
      home: 'Back to home',
    },
  }[lang];

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-widest text-[color:var(--g-brand,#B27B4E)] font-semibold mb-2">
          Error
        </p>
        <h1 className="text-2xl font-bold text-[color:var(--g-ink,#3A3630)] mb-3 font-[family-name:var(--font-klee-one)]">
          {copy.title}
        </h1>
        <p className="text-sm text-[color:var(--ink-soft,#6b615a)] leading-relaxed mb-6">
          {copy.body}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl bg-[color:var(--g-brand,#B27B4E)] text-white text-sm font-semibold hover:opacity-90 transition"
          >
            {copy.retry}
          </button>
          <Link
            href={`/${lang}`}
            className="px-4 py-2 rounded-xl border border-[color:var(--g-ink,#3A3630)] text-sm font-semibold hover:bg-[color:var(--paper-deep,#f0eae0)] transition"
          >
            {copy.home}
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-[10px] text-[color:var(--ink-faint,#B5ADA2)]">
            digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
