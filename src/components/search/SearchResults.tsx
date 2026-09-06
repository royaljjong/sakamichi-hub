import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { findSearchMatch, type SearchIndexItem } from '@/lib/search';
import { MemberAvatar } from '@/components/member/MemberAvatar';

interface SearchResultsProps {
  results: SearchIndexItem[];
  query: string;
  locale: string;
  loading: boolean;
  hasFilters?: boolean;
}

export function SearchResults({
  results,
  query,
  locale,
  loading,
  hasFilters,
}: SearchResultsProps) {
  const t = useTranslations('search');
  const tMember = useTranslations('member');

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-(--ink-soft)">
        {t('indexing')}
      </div>
    );
  }

  if (!query.trim() && !hasFilters) {
    return null;
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {results.map((item) => {
        const isGraduated = item.status === 'graduated';
        const primaryName =
          locale === 'ko'
            ? item.hangul
            : locale === 'en'
            ? item.romaji
            : item.kanji;

        const subName =
          locale === 'ko'
            ? item.kanji
            : locale === 'en'
            ? item.kanji
            : item.kana;
        const groupName = item.groupName?.[locale as 'ja' | 'ko' | 'en'] ?? item.groupId;
        const match = findSearchMatch(item, query);

        return (
          <Link
            key={item.id}
            href={`/m/${item.id}`}
            className="group flex items-center justify-between p-3.5 rounded-2xl bg-(--white-veil) hover:bg-white/95 border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] hover:border-(--g-brand) shadow-(--shadow-soft) transition duration-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <MemberAvatar
                glyph={item.glyph}
                hueShift={item.hueShift}
                imageUrl={item.imageUrl}
                groupLogoUrl={item.groupLogoUrl ?? null}
                name={item.kanji}
                size={44}
                isGraduated={isGraduated}
                className="group-hover:scale-105"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-(--g-ink) truncate font-(family-name:--font-klee-one)">
                    {primaryName}
                  </p>
                  {isGraduated && (
                    <span className="text-[9px] px-1 py-0.2 rounded-sm bg-stone-200 text-stone-600">
                      {tMember('gradBadge')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-(--ink-soft) truncate">
                  {subName} · {groupName}
                </p>
                {match && normalizeForDisplay(match.term) !== normalizeForDisplay(primaryName) && (
                  <p className="mt-0.5 truncate text-[11px] text-(--ink-faint)">
                    {t(`match.${match.kind}`, { term: match.term })}
                  </p>
                )}
              </div>
            </div>
            <span className="text-xs text-(--ink-faint) group-hover:text-(--g-brand) group-hover:translate-x-0.5 transition shrink-0 ml-2 font-bold">
              →
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function normalizeForDisplay(value: string) {
  return value.toLocaleLowerCase().replace(/[\s\-_・·]+/g, '');
}
